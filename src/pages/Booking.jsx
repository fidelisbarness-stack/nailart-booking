import React, { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { createDuitkuTransaction } from '../services/duitku';

const DEFAULT_HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function Booking({ bookings = [], setBookings, globalSlots, setGlobalSlots }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  const services = [
    { id: 1, name: 'Gel Polish Single Color', price: 120000, duration: '60 Menit' },
    { id: 2, name: 'Nail Art Custom Full Set', price: 250000, duration: '90 Menit' },
    { id: 3, name: 'Spa Manicure & Extension', price: 300000, duration: '120 Menit' },
  ];

  const DP_AMOUNT = 50000;

  const [customerName, setCustomerName] = useState('');
  const [customerWa, setCustomerWa] = useState('');
  const [customerIg, setCustomerIg] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(datesList[0].value);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(services[0]);
  const [lastBookingId, setLastBookingId] = useState('');

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(value)) {
      setCustomerName(value);
    }
  };

  const handleWaChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomerWa(value);
    }
  };

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

  const handleNextStep = (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Nama Lengkap wajib diisi (hanya huruf)!');
      return;
    }
    if (!customerWa.trim()) {
      alert('Nomor WhatsApp wajib diisi (hanya angka)!');
      return;
    }

    setStep(2);
  };

  const handleSelectTime = (slot) => {
    if (slot.status === 'full' || slot.isBlocked) return;
    setSelectedTime(slot.time);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!selectedTime) {
      alert('Silakan pilih jam kedatangan!');
      return;
    }

    setLoading(true);

    try {
      const generatedId = `TIX-DP-${Math.floor(100000 + Math.random() * 900000)}`;
      const remainingPay = Math.max(0, selectedService.price - DP_AMOUNT);
      const formattedIg = customerIg ? (customerIg.startsWith('@') ? customerIg : `@${customerIg}`) : '-';

      const newBooking = {
        id: generatedId,
        customerName,
        customerWa,
        customerIg: formattedIg,
        serviceName: selectedService.name,
        totalPrice: selectedService.price,
        dpPaid: DP_AMOUNT,
        remainingPayment: remainingPay,
        date: selectedDate,
        time: selectedTime,
        status: 'DP Paid (Confirmed)', 
        paymentMethod: 'QRIS (Duitku)',
      };

      const duitkuRes = await createDuitkuTransaction(newBooking);
console.log('Duitku Response:', duitkuRes);
      if (duitkuRes && duitkuRes.statusCode === '00') {
        window.checkout.process(duitkuRes.reference, {
          successEvent: async function(result) {
            newBooking.createdAt = serverTimestamp();
            await addDoc(collection(db, 'bookings'), newBooking);

            if (setGlobalSlots) {
              setGlobalSlots((prev) => {
                const updated = (prev[selectedDate] || activeSlots).map((slot) => {
                  if (slot.time === selectedTime) {
                    const nextLeft = Math.max(0, (slot.slotsLeft ?? 1) - 1);
                    return { ...slot, slotsLeft: nextLeft, status: nextLeft === 0 ? 'full' : 'available' };
                  }
                  return slot;
                });
                return { ...prev, [selectedDate]: updated };
              });
            }

            setLastBookingId(generatedId);
            setStep(3);
            setLoading(false);

            const WA_NUMBER = '6287827562925'; 
            const waText = `Halo Admin Vinail's!\nSaya baru saja MENYELESAIKAN pembayaran DP Rp 50.000 via QRIS.\n\n*ID Booking:* ${generatedId}\n*Nama:* ${customerName}\n*Jadwal:* ${selectedDate} (Jam ${selectedTime})\n*Layanan:* ${selectedService.name}\n*Sisa Pelunasan di Studio:* Rp ${remainingPay.toLocaleString('id-ID')}\n\nMohon konfirmasi jadwalnya ya kak, terima kasih!`;

            window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`, '_blank');
          },
          pendingEvent: function(result) {
            alert('Pembayaran masih diproses.');
            setLoading(false);
          },
          errorEvent: function(result) {
            alert('Terjadi kesalahan pada sistem pembayaran.');
            setLoading(false);
          },
          closeEvent: function(result) {
            alert('Anda membatalkan pembayaran. Data booking belum disimpan.');
            setLoading(false); 
          }
        });

      } else {
        alert(`Gagal membuat link Duitku: ${duitkuRes?.statusMessage}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan jaringan.');
      setLoading(false);
    }
  };

  const remainingBalance = Math.max(0, selectedService.price - DP_AMOUNT);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      
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
                onChange={handleNameChange}
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
                onChange={handleWaChange}
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

      {step === 2 && (
        <form onSubmit={handleSubmitBooking} className="space-y-6">
          <div className="bg-[#FFF9F6] p-4 rounded-2xl border border-[#F5C6CB] flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Pemesan</p>
              <p className="font-extrabold text-sm text-[#550B18]">
                {customerName} ({customerWa}{customerIg ? ` | ${customerIg.startsWith('@') ? customerIg : `@${customerIg}`}` : ''})
              </p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs text-[#550B18] underline font-bold">
              Ubah Data
            </button>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#F5C6CB] shadow-md space-y-6">
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">
                1. Pilih Tanggal 
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

            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">
                4. Metode Pembayaran Wajib
              </label>
              <div className="p-4 rounded-2xl border border-[#550B18] bg-[#FFF9F6] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h5 className="font-extrabold text-xs text-[#550B18]">QRIS Duitku</h5>
                    <p className="text-[10px] text-gray-500">GoPay, ShopeePay, BCA, Mandiri, dll.</p>
                  </div>
                </div>
                <span className="text-[10px] bg-[#550B18] text-white px-2 py-1 rounded-lg font-bold">
                  DP Only
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Harga ({selectedService.name})</span>
                <span>Rp {selectedService.price.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[#550B18] font-bold">
                <span>DP Wajib Dibayarkan Sekarang (QRIS)</span>
                <span>Rp {DP_AMOUNT.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Sisa Pelunasan di Studio</span>
                <span>Rp {remainingBalance.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(1)}
              className="w-1/3 py-4 rounded-2xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 bg-[#550B18] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#3d0711] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses Duitku...</span>
              ) : (
                <span>Bayar DP Rp 50.000 via QRIS</span>
              )}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="bg-white rounded-3xl border border-[#F5C6CB] shadow-xl overflow-hidden space-y-6">
          <div className="bg-[#550B18] text-white p-6 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-black">MEMPROSES PEMBAYARAN</h2>
            <p className="text-xs text-[#F5C6CB]">Kode Booking: <strong>{lastBookingId}</strong></p>
          </div>

          <div className="p-6 space-y-4 text-xs text-center">
            <div className="bg-green-50 text-green-800 p-4 rounded-2xl border border-green-200 font-semibold">
              <p>Halaman pembayaran Duitku dan WhatsApp telah dibuka.</p>
              <p className="text-[11px] mt-1 text-green-700">Jika WhatsApp tidak terbuka otomatis, silakan konfirmasi manual ke Admin.</p>
            </div>

            <div className="text-left bg-[#FFF9F6] p-4 rounded-2xl space-y-2 border border-[#F5C6CB]">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama:</span>
                <span className="font-bold text-[#550B18]">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">WA & IG:</span>
                <span className="font-bold text-[#550B18]">{customerWa} {customerIg ? `| ${customerIg.startsWith('@') ? customerIg : `@${customerIg}`}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal & Jam:</span>
                <span className="font-bold text-[#550B18]">{selectedDate} @ {selectedTime} WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tagihan DP:</span>
                <span className="font-black text-[#550B18]">Rp {DP_AMOUNT.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
            <button
              onClick={() => {
                setStep(1);
                setCustomerName('');
                setCustomerWa('');
                setCustomerIg('');
                setSelectedTime(null);
              }}
              className="bg-[#550B18] text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-[#3d0711] transition-all"
            >
              Selesai / Booking Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}