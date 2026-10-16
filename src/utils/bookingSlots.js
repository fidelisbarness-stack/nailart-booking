export const getBookingSlotTimes = (booking) => {
  if (Array.isArray(booking?.slotTimes) && booking.slotTimes.length > 0) {
    return [...new Set(booking.slotTimes.filter((time) => /^\d{2}:\d{2}$/.test(time)))];
  }

  return [...new Set(booking?.time?.match(/\b\d{2}:\d{2}\b/g) || [])];
};
