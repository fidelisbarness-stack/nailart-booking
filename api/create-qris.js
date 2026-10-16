import crypto from 'crypto';
import { FieldValue, firestore } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let pendingBookingRef;
  try {
    const { booking } = req.body || {};
    const amount = Number(booking?.dpPaid);
    const merchantOrderId = booking?.id;

    const merchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;
    const appUrl = process.env.APP_URL?.replace(/\/+$/, '');
    const isPassportProduction = process.env.DUITKU_IS_PRODUCTION === 'true';

    if (!merchantCode || !apiKey || !appUrl) {
      throw new Error('Missing Duitku or APP_URL environment configuration');
    }
    if (
      !booking ||
      typeof merchantOrderId !== 'string' ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(merchantOrderId) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      typeof booking.customerName !== 'string' ||
      typeof booking.customerWa !== 'string' ||
      typeof booking.date !== 'string' ||
      typeof booking.time !== 'string' ||
      typeof booking.serviceName !== 'string' ||
      !Array.isArray(booking.slotTimes) ||
      !Array.isArray(booking.services) ||
      !Number.isInteger(booking.personCount) ||
      booking.personCount < 1
    ) {
      return res.status(400).json({ success: false, message: 'Data booking tidak lengkap atau tidak valid' });
    }

    const mainTreatmentCount = booking.services.filter((service) =>
      ['nailart-tangan', 'nailart-kaki'].includes(service.categoryId) &&
      !String(service.id).includes('remove')
    ).length;
    const expectedAmount = Math.max(1, mainTreatmentCount) * 50000;
    if (amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: 'Nominal DP tidak sesuai dengan treatment booking' });
    }

    const db = firestore();
    pendingBookingRef = db.collection('pendingBookings').doc(merchantOrderId);
    const pendingBooking = {
      id: merchantOrderId,
      customerName: booking.customerName,
      customerWa: booking.customerWa,
      personCount: booking.personCount,
      serviceName: booking.serviceName,
      services: booking.services,
      dpPaid: amount,
      date: booking.date,
      time: booking.time,
      slotTimes: booking.slotTimes,
      status: 'Menunggu Pembayaran',
      paymentStatus: 'PENDING',
      paymentMethod: 'QRIS (Duitku)',
      createdAt: FieldValue.serverTimestamp(),
    };
    await pendingBookingRef.create(pendingBooking);

    const duitkuUrl = isPassportProduction
      ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
      : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';

    const signatureSource = `${merchantCode}${merchantOrderId}${amount}${apiKey}`;
    const signature = crypto.createHash('md5').update(signatureSource).digest('hex');

    const payload = {
      merchantCode,
      paymentAmount: amount,
      paymentMethod: 'SP',
      merchantOrderId,
      productDetails: `DP Booking - ${booking.serviceName}`.slice(0, 255),
      customerVaName: booking.customerName.slice(0, 20),
      email: 'customer@gmail.com',
      phoneNumber: booking.customerWa,
      callbackUrl: `${appUrl}/api/duitku-callback`,
      returnUrl: `${appUrl}/?status=success`,
      signature,
      expiryPeriod: 15,
    };

    const response = await fetch(duitkuUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Duitku returned an invalid response (HTTP ${response.status})`);
    }

    if (response.ok && data.statusCode === '00') {
      if (data.reference) {
        const bookingRef = db.collection('bookings').doc(merchantOrderId);
        await db.runTransaction(async (transaction) => {
          const [pendingSnapshot, bookingSnapshot] = await Promise.all([
            transaction.get(pendingBookingRef),
            transaction.get(bookingRef),
          ]);
          if (pendingSnapshot.exists && !bookingSnapshot.exists) {
            transaction.set(pendingBookingRef, { duitkuReference: data.reference }, { merge: true });
          }
        });
      }
      return res.status(200).json({
        success: true,
        statusCode: '00',
        merchantOrderId,
        paymentUrl: data.paymentUrl,
        qrString: data.qrString || null,
        reference: data.reference,
        statusMessage: data.statusMessage || 'Berhasil membuat QRIS DuitKu'
      });
    }

    await pendingBookingRef.delete();
    return res.status(400).json({
      success: false,
      statusCode: data.statusCode || '99',
      statusMessage: data.statusMessage || 'Gagal membuat QRIS DuitKu',
      message: data.statusMessage || 'Gagal membuat QRIS DuitKu'
    });
  } catch (error) {
    console.error('Error Create QRIS:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}