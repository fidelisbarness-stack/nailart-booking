import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { amount, name, email, orderId } = req.body;

    // 1. Ambil Kunci Rahasia dari Environment Variables Vercel
    const merchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;
    const isPassportProduction = process.env.DUITKU_IS_PRODUCTION === 'true';

    // Endpoint DuitKu (Sandbox vs Production)
    const duitkuUrl = isPassportProduction
      ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
      : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';

    const merchantOrderId = orderId || `ORDER-${Date.now()}`;
    const paymentAmount = Number(amount);

    // 2. Buat Signature MD5 sesuai syarat DuitKu: md5(merchantcode + merchantOrderId + paymentAmount + apiKey)
    const signatureSource = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`;
    const signature = crypto.createHash('md5').update(signatureSource).digest('hex');

    // 3. Payload Request ke DuitKu
    const payload = {
      merchantcode: merchantCode,
      paymentAmount: paymentAmount,
      paymentMethod: 'SP', // Kode "SP" / "DQ" khusus untuk QRIS
      merchantOrderId: merchantOrderId,
      productDetails: 'Pembayaran Treatment / Layanan',
      customerVaName: name || 'Pelanggan Galeri',
      email: email || 'customer@gmail.com',
      callbackUrl: `${process.env.APP_URL}/api/duitku-callback`,
      returnUrl: `${process.env.APP_URL}/?status=success`,
      signature: signature,
      expiryPeriod: 15 // QRIS berlaku selama 15 menit
    };

    // 4. Kirim Request ke API DuitKu
    const response = await fetch(duitkuUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.statusCode === '00') {
      // Sukses membuat QRIS
      return res.status(200).json({
        success: true,
        merchantOrderId: merchantOrderId,
        paymentUrl: data.paymentUrl, // URL Halaman QRIS DuitKu
        qrString: data.qrString || null,
        reference: data.reference
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data.statusMessage || 'Gagal membuat QRIS DuitKu'
      });
    }
  } catch (error) {
    console.error('Error Create QRIS:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}