export const createDuitkuTransaction = async (bookingData) => {
  try {
    const response = await fetch('/api/create-qris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking: bookingData }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Server returned an invalid response (HTTP ${response.status})`);
    }

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