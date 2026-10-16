export const createDuitkuTransaction = async (bookingData) => {
  try {
    const response = await fetch('/api/create-qris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: bookingData.dpPaid,
        name: bookingData.customerName,
        email: 'customer@gmail.com',
        phoneNumber: bookingData.customerWa,
        orderId: bookingData.id,
        productDetails: `DP Booking - ${bookingData.serviceName}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: data.statusCode || '99',
        statusMessage: data.message || data.statusMessage || `Request Duitku gagal (HTTP ${response.status})`,
      };
    }

    return {
      ...data,
      statusCode: data.statusCode || (data.success ? '00' : '99'),
      statusMessage: data.statusMessage || data.message,
    };
  } catch (error) {
    console.error('Error createDuitkuTransaction:', error);
    return {
      statusCode: '99',
      statusMessage: error.message || 'Terjadi kesalahan sistem'
    };
  }
};