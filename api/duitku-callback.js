import crypto from 'crypto';
import { FieldValue, firestore } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { merchantCode, amount, merchantOrderId, signature, resultCode, reference } = req.body || {};
    const configuredMerchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;

    if (!configuredMerchantCode || !apiKey) {
      throw new Error('Missing Duitku callback environment configuration');
    }
    if (
      merchantCode !== configuredMerchantCode ||
      typeof amount !== 'string' ||
      typeof merchantOrderId !== 'string' ||
      typeof signature !== 'string' ||
      typeof resultCode !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid callback data' });
    }

    const calcSignatureSource = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
    const calcSignature = crypto.createHash('md5').update(calcSignatureSource).digest('hex');

    if (signature !== calcSignature) {
      console.error('Callback Signature Mismatch!');
      return res.status(400).json({ message: 'Invalid Signature' });
    }

    const paymentAmount = Number(amount);
    if (!Number.isSafeInteger(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const db = firestore();
    const pendingRef = db.collection('pendingBookings').doc(merchantOrderId);
    const bookingRef = db.collection('bookings').doc(merchantOrderId);

    await db.runTransaction(async (transaction) => {
      const [pendingSnapshot, bookingSnapshot] = await Promise.all([
        transaction.get(pendingRef),
        transaction.get(bookingRef),
      ]);

      if (bookingSnapshot.exists && bookingSnapshot.data().paymentStatus === 'PAID') {
        if (bookingSnapshot.data().dpPaid !== paymentAmount) {
          throw new Error('Callback amount does not match the completed booking');
        }
        return;
      }

      if (!pendingSnapshot.exists) {
        if (resultCode !== '00') return;
        throw new Error('Pending booking not found for Duitku callback');
      }

      const pendingBooking = pendingSnapshot.data();
      if (pendingBooking.dpPaid !== paymentAmount) {
        throw new Error('Callback amount does not match the pending booking');
      }

      if (resultCode === '00') {
        transaction.set(bookingRef, {
          ...pendingBooking,
          status: 'DP Paid (Confirmed)',
          paymentStatus: 'PAID',
          duitkuReference: reference || pendingBooking.duitkuReference || null,
          paidAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.delete(pendingRef);
    });

    return res.status(200).json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Error Callback:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}