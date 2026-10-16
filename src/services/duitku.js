import CryptoJS from 'crypto-js';

const DUITKU_MERCHANT_CODE = import.meta.env.VITE_DUITKU_MERCHANT_CODE;
const DUITKU_API_KEY = import.meta.env.VITE_DUITKU_API_KEY;
const DUITKU_SANDBOX_URL = '/api-duitku/webapi/api/merchant/v2/inquiry';

export const createDuitkuTransaction = async (bookingData) => {
  try {
    const merchantOrderId = bookingData.id;
    const DP_AMOUNT = 50000;

    // Generate Signature MD5
    const rawSignature = `${DUITKU_MERCHANT_CODE}${merchantOrderId}${DP_AMOUNT}${DUITKU_API_KEY}`;
    const signature = CryptoJS.MD5(rawSignature).toString();

    const payload = {
      merchantCode: DUITKU_MERCHANT_CODE,
      paymentAmount: DP_AMOUNT,
      paymentMethod: 'SP', // SP = QRIS / ShopeePay
      merchantOrderId: merchantOrderId,
      productDetails: `DP Booking - ${bookingData.serviceName}`,
      customerVaName: bookingData.customerName,
      email: 'customer@gmail.com',
      phoneNumber: bookingData.customerWa,
      callbackUrl: 'https://reservasivinails.vercel.app/',
      returnUrl: 'https://reservasivinails.vercel.app/',
      signature: signature,
      expiryPeriod: 60
    };

    const response = await fetch(DUITKU_SANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error('Error createDuitkuTransaction:', error);
    return {
      statusCode: '99',
      statusMessage: error.message || 'Terjadi kesalahan sistem'
    };
  }
};