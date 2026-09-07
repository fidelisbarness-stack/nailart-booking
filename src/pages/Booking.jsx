import React, { useState, useMemo } from 'react';

const DEFAULT_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function Booking({ bookings = [], setBookings, globalSlots, setGlobalSlots }) {
  const [step, setStep] = useState(1);

  // FX: Generate 7 Hari Bergulir Otomatis dari Hari Ini
  const datesList = useMemo(() => {
    const list = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dateVal = d.toISOString().split('T')[0];

      let label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      if (i === 0) label = 'Hari Ini';
      if (i === 1) label = 'Besok';

      list.push({ label, value: dateVal });
    }
    return list;
  }, []);

  // Data Pilihan Layanan
  const services = [
    { id: 1, name: 'Gel Polish Single Color', price: 120000, duration: '60 Menit' },
    { id: 2, name: 'Nail Art Custom Full Set', price: 250000, duration: '90 Menit' },
    { id: 3, name: 'Spa Manicure & Extension', price: 300000, duration: '120 Menit' },
  ];

  const DP_AMOUNT = 50000;

  // State Form
  const [customerName, setCustomerName] = useState('');
  const [customerWa, setCustomerWa] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(datesList[0].value);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(services[0]);
  
  const [lastBookingId, setLastBookingId] = useState('');

  // Ambil slot sesuai tanggal yang dipilih
  const activeSlots = useMemo(() => {
    if (globalSlots && globalSlots[selectedDate]) {
      return globalSlots[selectedDate];
    }
    return DEFAULT_HOURS.map((t) => ({
      time: t,
      status: 'available',
      slotsLeft: 2,
      isBlocked: false,
      reason: ''
    }));
  }, [globalSlots, selectedDate]);

  // Validasi Step 1 -> Step 2
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerWa.trim()) {
      alert('Silakan isi Nama Lengkap dan Nomor WhatsApp terlebih dahulu!');
      return;
    }
    setStep(2);
  };

  const handleSelectTime = (slot) => {
    if (slot.status === 'full' || slot.isBlocked) return;
    setSelectedTime(slot.time);
  };

  // Submit Final Booking
  const handleSubmitBooking = (e) => {
    e.preventDefault();

    if (!selectedTime) {
      alert('Silakan pilih jam kedatangan!');
      return;
    }

    const generatedId = `TIX-DP-${Math.floor(100000 + Math.random() * 900000)}`;
    const remainingPay = Math.max(0, selectedService.price - DP_AMOUNT);

    const newBooking = {
      id: generatedId,
      customerName,
      customerWa,
      serviceName: selectedService.name,
      totalPrice: selectedService.price,
      dpPaid: DP_AMOUNT,
      remainingPayment: remainingPay,
      date: selectedDate,
      time: selectedTime,
      status: 'DP Paid (Confirmed)',
      paymentMethod: 'QRIS (Duitku)',
    };

    if (setBookings) {
      setBookings([newBooking, ...bookings]);
    }

    // Kurangi ketersediaan slot jam pada tanggal yang dipilih
    if (setGlobalSlots) {
      setGlobalSlots((prevSlots = {}) => {
        const currentSlotsForDate = prevSlots[selectedDate] || activeSlots;
        const updatedSlotsForDate = currentSlotsForDate.map((slot) => {
          if (slot.time === selectedTime) {
            const nextLeft = Math.max(0, (slot.slotsLeft ?? 1) - 1);
            return {
              ...slot,
              slotsLeft: nextLeft,
              status: nextLeft === 0 ? 'full' : 'available',
            };
          }
          return slot;
        });

        return {
          ...prevSlots,
          [selectedDate]: updatedSlotsForDate,
        };
      });
    }

    setLastBookingId(generatedId);
    setStep(3);
  };

  const remainingBalance = Math.max(0, selectedService.price - DP_AMOUNT);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Indicator Stepper */}
      {step !== 3 && (
        <div className="bg-white p-4 rounded-3xl border border-[#F5C6CB] shadow-sm flex items-center justify-between text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#550B18]' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${step >= 1 ? 'bg-[#550B18]' : 'bg-gray-300'}`}>
              1
            </span>
            <span>Data Pemesan</span>
          </div>
          <div className="h-0.5 flex-1 mx-4 bg-gray-200">
            <div className={`h-0.5 transition-all duration-300 ${step === 2 ? 'bg-[#550B18]' : 'bg-transparent'}`}></div>
          </div>
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#550B18]' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${step === 2 ? 'bg-[#550B18]' : 'bg-gray-300'}`}>
              2
            </span>
            <span>Jadwal & DP QRIS</span>
          </div>
        </div>
      )}

      {/* STEP 1: FORM BIODATA */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="bg-white p-6 md:p-8 rounded-3xl border border-[#F5C6CB] shadow-md space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-[#550B18]">Langkah 1: Isi Biodata</h2>
            <p className="text-xs text-gray-500 mt-1">Masukkan data diri untuk konfirmasi reservasi via WhatsApp.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">Nama Lengkap</label>
              <input
                type="text"
                required
                placeholder="Contoh: Anisa Maharani"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#550B18]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">Nomor WhatsApp</label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={customerWa}
                onChange={(e) => setCustomerWa(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#550B18]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#550B18] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#3d0711] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Pilih Jadwal & Layanan</span>
            <span>→</span>
          </button>
        </form>
      )}

      {/* STEP 2: PILIH TANGGAL, JAM, LAYANAN, & DP */}
      {step === 2 && (
        <form onSubmit={handleSubmitBooking} className="space-y-6">
          <div className="bg-[#FFF9F6] p-4 rounded-2xl border border-[#F5C6CB] flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Pemesan</p>
              <p className="font-extrabold text-sm text-[#550B18]">{customerName} ({customerWa})</p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs text-[#550B18] underline font-bold">
              Ubah Data
            </button>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#F5C6CB] shadow-md space-y-6">
            {/* A. Pilih Tanggal (7 Hari Bergulir) */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">
                1. Pilih Tanggal (7 Hari Ke Depan)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {datesList.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.value);
                      setSelectedTime(null);
                    }}
                    className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all ${
                      selectedDate === d.value
                        ? 'bg-[#550B18] text-white border-[#550B18] shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#F5C6CB]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* B. Pilih Jam Operasional (08:00 - 21:00) */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">
                2. Pilih Jam Operasional (08:00 - 21:00)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {activeSlots.map((slot, idx) => {
                  const isSelected = selectedTime === slot.time;
                  const isUnavailable = slot.status === 'full' || slot.isBlocked;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => handleSelectTime(slot)}
                      className={`py-2.5 px-2 rounded-2xl border text-center transition-all ${
                        isUnavailable
                          ? 'bg-rose-500 text-white border-rose-500 cursor-not-allowed opacity-80'
                          : isSelected
                          ? 'bg-[#550B18] text-white border-[#550B18] shadow-md scale-105'
                          : 'bg-white text-[#550B18] border-[#F5C6CB] hover:border-[#550B18]'
                      }`}
                    >
                      <span className="text-xs font-extrabold block">{slot.time}</span>
                      <span className="text-[9px] block">
                        {slot.isBlocked ? (slot.reason ? slot.reason : 'Tutup') : slot.status === 'full' ? 'Penuh' : 'Tersedia'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* C. Pilih Jenis Perawatan */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">
                3. Pilih Jenis Perawatan
              </label>
              <div className="space-y-2">
                {services.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                      selectedService.id === s.id
                        ? 'border-[#550B18] bg-[#FFF9F6] ring-2 ring-[#550B18]/20'
                        : 'border-gray-200 hover:border-[#F5C6CB]'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-sm text-[#550B18]">{s.name}</h4>
                      <p className="text-xs text-gray-500">Durasi: {s.duration}</p>
                    </div>
                    <span className="font-black text-sm text-[#550B18]">
                      Rp {s.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* D. Metode Pembayaran & Rincian DP */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">
                4. Metode Pembayaran Wajib
              </label>
              <div className="p-4 rounded-2xl border border-[#550B18] bg-[#FFF9F6] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h5 className="font-extrabold text-xs text-[#550B18]">QRIS Instant (via Duitku)</h5>
                    <p className="text-[10px] text-gray-500">GoPay, ShopeePay, BCA, Mandiri, dll.</p>
                  </div>
                </div>
                <span className="text-[10px] bg-[#550B18] text-white px-2 py-1 rounded-lg font-bold">
                  DP Only
                </span>
              </div>
            </div>

            {/* Ringkasan Biaya */}
            <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Harga Layanan ({selectedService.name})</span>
                <span>Rp {selectedService.price.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[#550B18] font-bold">
                <span>DP Wajib Dibatarkan Sekarang (QRIS)</span>
                <span>Rp {DP_AMOUNT.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Sisa Pelunasan di Studio (Cash/EDC)</span>
                <span>Rp {remainingBalance.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-4 rounded-2xl border border-gray-300 font-bold text-sm text-gray-700"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="w-2/3 bg-[#550B18] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#3d0711] transition-all shadow-lg"
            >
              Bayar DP Rp 50.000 via QRIS
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: E-TIKET & PROSES BAYAR */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-[#F5C6CB] shadow-xl overflow-hidden space-y-6">
          <div className="bg-[#550B18] text-white p-6 text-center space-y-2">
            <div className="text-4xl">QRIS</div>
            <h2 className="text-xl font-black">BAYAR DP RESERVASI</h2>
            <p className="text-xs text-[#F5C6CB]">Kode Booking: <strong>{lastBookingId}</strong></p>
          </div>

          <div className="p-6 space-y-4 text-xs text-center">
            <div className="bg-gray-100 p-6 rounded-2xl max-w-xs mx-auto border-2 border-dashed border-gray-300">
              <div className="w-48 h-48 bg-white mx-auto flex items-center justify-center rounded-xl border">
                <span className="text-gray-400 font-bold text-center p-2">
                  [ SIMULASI QRIS DUITKU ]<br/>
                  Scan untuk Bayar Rp 50.000
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-3">
                Integrasi Gateway Duitku dapat memuat QR Code otomatis lewat API Response.
              </p>
            </div>

            <div className="text-left bg-[#FFF9F6] p-4 rounded-2xl space-y-2 border border-[#F5C6CB]">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama:</span>
                <span className="font-bold text-[#550B18]">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal & Jam:</span>
                <span className="font-bold text-[#550B18]">{selectedDate} @ {selectedTime} WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tagihan DP:</span>
                <span className="font-black text-[#550B18]">Rp {DP_AMOUNT.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sisa Bayar di Studio:</span>
                <span className="font-bold text-gray-700">Rp {remainingBalance.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
            <button
              onClick={() => {
                setStep(1);
                setCustomerName('');
                setCustomerWa('');
                setSelectedTime(null);
              }}
              className="bg-[#550B18] text-white px-6 py-3 rounded-2xl font-bold text-xs"
            >
              Selesai / Booking Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}