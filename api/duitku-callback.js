import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // DuitKu mengirimkan data via Form-Urlencoded
    const { merchantCode, amount, merchantOrderId, signature, resultCode } = req.body;
    const apiKey = process.env.DUITKU_API_KEY;

    // 1. Validasi Signature Callback DuitKu: md5(merchantCode + amount + merchantOrderId + apiKey)
    const calcSignatureSource = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
    const calcSignature = crypto.createHash('md5').update(calcSignatureSource).digest('hex');

    if (signature !== calcSignature) {
      console.error('Callback Signature Mismatch!');
      return res.status(400).json({ message: 'Invalid Signature' });
    }

    // 2. Cek apakah status pembayaran sukses (resultCode "00")
    if (resultCode === '00') {
      console.log(`✅ TRANSAKSI LUNAS: ${merchantOrderId} sejumlah Rp ${amount}`);
      
      // DI SINI KAMU BISA UPDATE STATUS DI FIRESTORE DATABASE BILA DIPERLUKAN
      // (Misal mengubah status pesanan dari "PENDING" menjadi "PAID")
    } else {
      console.log(`❌ TRANSAKSI GAGAL/EXPIRED: ${merchantOrderId}`);
    }

    // Wajib memberikan respon HTTP 200 ke DuitKu
    return res.status(200).json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Error Callback:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}