import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { createDuitkuTransaction } from '../services/duitku';
import { getBookingSlotTimes } from '../utils/bookingSlots';

import removeImg from '../assets/remove.jpeg'; 
import nailartTanganImg from '../assets/NailTangan.jpeg'; 
import nailartKakiImg from '../assets/NailKaki.jpeg';

const DEFAULT_HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

// Helper fungsi tanggal lokal YYYY-MM-DD
const getLocalDateString = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// DATA MASTER TREATMENT
const TREATMENT_CATEGORIES = [
  {
    categoryId: 'nailart-tangan',
    categoryName: '1. Nailart Tangan',
    prefix: 'Nailart Tangan',
    description: 'Perawatan dan pewarnaan kuku tangan dengan pilihan Kuku Asli atau Extension.',
    image: nailartTanganImg,
    types: [
      {
        typeId: 'kuku-asli',
        typeName: 'Kuku Asli',
        options: [
          { id: 'nat-asli-polos', name: 'Polos' },
          { id: 'nat-asli-desain', name: 'Desain' }
        ]
      },
      {
        typeId: 'extension',
        typeName: 'Extension',
        options: [
          { id: 'nat-ext-polos', name: 'Polos' },
          { id: 'nat-ext-desain', name: 'Desain' }
        ]
      }
    ]
  },
  {
    categoryId: 'nailart-kaki',
    categoryName: '2. Nailart Kaki',
    prefix: 'Nailart Kaki',
    description: 'Perawatan dan pewarnaan kuku kaki dengan pilihan Kuku Asli atau Extension.',
    image: nailartKakiImg,
    types: [
      {
        typeId: 'kuku-asli',
        typeName: 'Kuku Asli',
        options: [
          { id: 'nak-asli-polos', name: 'Polos' },
          { id: 'nak-asli-desain', name: 'Desain' }
        ]
      },
      {
        typeId: 'extension',
        typeName: 'Extension',
        options: [
          { id: 'nak-ext-polos', name: 'Polos' },
          { id: 'nak-ext-desain', name: 'Desain' }
        ]
      }
    ]
  },
  {
    categoryId: 'hanya-remove',
    categoryName: '3. Hanya Remove (Tanpa Nailart)',
    prefix: 'Remove',
    description: 'Pembersihan dan pelepasan kutek/extension secara rapi dan aman.',
    image: removeImg,
    items: [
      { id: 'rem-tangan', name: 'Tangan' },
      { id: 'rem-kaki', name: 'Kaki' },
    ]
  }
];

export default function Booking({ globalSlots, setGlobalSlots }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookedTimes, setBookedTimes] = useState([]); 
  const [adminScheduleSlots, setAdminScheduleSlots] = useState([]);

  // Accordion Category State
  const [expandedCatIdx, setExpandedCatIdx] = useState({});
  const [openTypeState, setOpenTypeState] = useState({});

  // STATE CUSTOM MODAL
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (message, title = 'Pemberitahuan', type = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Kalkulasi tanggal dinamis (7 Hari Ke Depan)
  const datesList = useMemo(() => {
    const list = [];
    const today = new Date();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateVal = getLocalDateString(d);

      let dayLabel = days[d.getDay()];
      if (i === 0) dayLabel = 'Hari Ini';
      if (i === 1) dayLabel = 'Besok';

      list.push({
        fullDate: dateVal,
        dayName: dayLabel,
        dayNumber: d.getDate(),
        monthName: months[d.getMonth()],
      });
    }
    return list;
  }, []);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerWa, setCustomerWa] = useState('');
  const [personCount, setPersonCount] = useState('1');
  const personCountNumber = Number.parseInt(personCount, 10);
  const validPersonCount = Number.isInteger(personCountNumber) && personCountNumber > 0
    ? personCountNumber
    : 1;
  
  const [selectedDate, setSelectedDate] = useState(datesList[0].fullDate);
  const [selectedTimes, setSelectedTimes] = useState([]);
  
  // STATE SELEKSI TREATMENT
  const [selectedServices, setSelectedServices] = useState([]);
  const [lastBookingId, setLastBookingId] = useState('');

  // HITUNG HANYA TREATMENT UTAMA (Nailart Tangan & Nailart Kaki)
  const mainNailartCount = useMemo(() => {
    // Memastikan hanya menghitung opsi desain/polos dari kategori nailart tangan & kaki
    return selectedServices.filter(s => 
      (s.categoryId === 'nailart-tangan' || s.categoryId === 'nailart-kaki') && 
      !s.id.includes('remove')
    ).length;
  }, [selectedServices]);

  // DP Dinamis: Rp 50.000 per treatment utama
  const DP_AMOUNT = Math.max(1, mainNailartCount) * 50000;

  // Cek apakah butuh 2 slot waktu beruntun (jika pilih Tangan DAN Kaki)
  const needsTwoSlots = mainNailartCount >= 2;

  // Helper untuk mendapatkan indeks jam berikutnya
  const getNextHourSlot = (timeStr) => {
    const idx = DEFAULT_HOURS.indexOf(timeStr);
    if (idx !== -1 && idx < DEFAULT_HOURS.length - 1) {
      return DEFAULT_HOURS[idx + 1];
    }
    return null;
  };

  const handleSelectNailartOption = (cat, typeObj, optionItem, personIndex) => {
    const formattedItem = {
      id: optionItem.id,
      personIndex,
      categoryId: cat.categoryId,
      typeId: typeObj.typeId,
      typeName: typeObj.typeName,
      optionName: optionItem.name,
      fullName: `${cat.prefix} - ${typeObj.typeName} (${optionItem.name})`
    };

    const otherServices = selectedServices.filter(
      (s) => s.personIndex !== personIndex || s.categoryId !== cat.categoryId || s.id.includes('remove')
    );
    const isAlreadySelected = selectedServices.some(
      (s) => s.personIndex === personIndex && s.id === optionItem.id
    );

    if (isAlreadySelected) {
      setSelectedServices(otherServices);
    } else {
      setSelectedServices([...otherServices, formattedItem]);
    }

    setSelectedTimes([]);
  };

  const handleToggleRemove = (cat, item, personIndex) => {
    const isAlreadySelected = selectedServices.some(
      (s) => s.personIndex === personIndex && s.id === item.id
    );

    const formattedItem = {
      ...item,
      personIndex,
      categoryId: cat.categoryId,
      fullName: `${cat.prefix} (${item.name})`
    };

    if (cat.categoryId === 'hanya-remove') {
      if (isAlreadySelected) {
        setSelectedServices(selectedServices.filter(
          (s) => !(s.personIndex === personIndex && s.categoryId === 'hanya-remove' && s.id === item.id)
        ));
      } else {
        setSelectedServices([...selectedServices, formattedItem]);
      }
    } else {
      if (isAlreadySelected) {
        setSelectedServices(selectedServices.filter(
          (s) => !(s.personIndex === personIndex && s.id === item.id)
        ));
      } else {
        setSelectedServices([...selectedServices, formattedItem]);
      }
    }

    setSelectedTimes([]);
  };

  // Real-time listener booking
  useEffect(() => {
    if (!selectedDate) return;

    const q = query(
      collection(db, 'bookings'),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const times = snapshot.docs.flatMap((docSnap) => getBookingSlotTimes(docSnap.data()));
      setBookedTimes(times);
    }, (error) => {
      console.error("Error fetching booked slots:", error);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  // Real-time listener slot admin
  useEffect(() => {
    if (!selectedDate) return;

    const unsubSchedule = onSnapshot(doc(db, 'schedules', selectedDate), (docSnap) => {
      if (docSnap.exists()) {
        setAdminScheduleSlots(docSnap.data().slots || []);
      } else {
        setAdminScheduleSlots([]);
      }
    }, (error) => {
      console.error("Error fetching admin schedule:", error);
    });

    return () => unsubSchedule();
  }, [selectedDate]);

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

  // Slot aktif & Cut-off
  const activeSlots = useMemo(() => {
    const now = new Date();
    const todayFormatted = getLocalDateString(now);

    const isTodaySelected = selectedDate === todayFormatted;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const effectiveAdminSlots = (globalSlots && globalSlots[selectedDate]) 
      ? globalSlots[selectedDate] 
      : adminScheduleSlots;

    return DEFAULT_HOURS.map((t) => {
      const isAlreadyBooked = bookedTimes.includes(t);
      
      let isPastCutoff = false;
      if (isTodaySelected) {
        const [slotHour, slotMinute] = t.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + (slotMinute || 0);
        const cutoffMinutes = slotTotalMinutes - 60; 

        if (currentTotalMinutes > cutoffMinutes) {
          isPastCutoff = true;
        }
      }

      const customSlot = effectiveAdminSlots.find((s) => s.time === t);
      const isAdminBlocked = customSlot ? customSlot.isBlocked : false;
      const adminReason = customSlot ? customSlot.reason : '';

      let isNextSlotUnavailable = false;
      let nextTime = null;
      if (needsTwoSlots && selectedTimes.length === 0) {
        nextTime = getNextHourSlot(t);
        if (!nextTime) {
          isNextSlotUnavailable = true;
        } else {
          const isNextBooked = bookedTimes.includes(nextTime);
          const nextCustomSlot = effectiveAdminSlots.find((s) => s.time === nextTime);
          const isNextAdminBlocked = nextCustomSlot ? nextCustomSlot.isBlocked : false;
          
          let isNextPastCutoff = false;
          if (isTodaySelected) {
            const [nextHour, nextMin] = nextTime.split(':').map(Number);
            const nextTotalMin = nextHour * 60 + (nextMin || 0);
            if (currentTotalMinutes > (nextTotalMin - 60)) {
              isNextPastCutoff = true;
            }
          }

          if (isNextBooked || isNextAdminBlocked || isNextPastCutoff) {
            isNextSlotUnavailable = true;
          }
        }
      }

      const isUnavailable = isAlreadyBooked || isPastCutoff || isAdminBlocked || isNextSlotUnavailable;

      let statusReason = 'Tersedia';
      if (isAlreadyBooked || (needsTwoSlots && selectedTimes.length === 0 && bookedTimes.includes(nextTime))) {
        statusReason = 'Booked';
      } else if (isAdminBlocked || (needsTwoSlots && selectedTimes.length === 0 && effectiveAdminSlots.find(s => s.time === nextTime)?.isBlocked)) {
        statusReason = adminReason || 'Libur / Tutup';
      } else if (isPastCutoff || isNextSlotUnavailable) {
        statusReason = needsTwoSlots && selectedTimes.length === 0 && isNextSlotUnavailable ? 'Kurang 2 Jam' : 'Lewat';
      }

      return {
        time: t,
        status: isUnavailable ? 'full' : 'available',
        slotsLeft: isUnavailable ? 0 : 1,
        isBlocked: isUnavailable,
        reason: statusReason
      };
    });
  }, [globalSlots, adminScheduleSlots, selectedDate, bookedTimes, needsTwoSlots, selectedTimes.length]);

  const handleNextStep = (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showAlert('Nama Lengkap wajib diisi terlebih dahulu!', 'Perhatian', 'warning');
      return;
    }
    if (!customerWa.trim()) {
      showAlert('Nomor WhatsApp wajib diisi terlebih dahulu!', 'Perhatian', 'warning');
      return;
    }
    if (!/^[1-9]\d*$/.test(personCount)) {
      showAlert('Jumlah orang minimal 1.', 'Perhatian', 'warning');
      return;
    }

    setStep(2);
  };

  const handleSelectTime = (slot) => {
    const selectedIndex = selectedTimes.indexOf(slot.time);
    const minimumSlots = needsTwoSlots ? 2 : 1;

    if (selectedIndex !== -1) {
      if (selectedTimes.length <= minimumSlots) {
        setSelectedTimes([]);
      } else if (selectedIndex === 0) {
        setSelectedTimes(selectedTimes.slice(1));
      } else if (selectedIndex === selectedTimes.length - 1) {
        setSelectedTimes(selectedTimes.slice(0, -1));
      } else {
        showAlert('Jam yang dipilih harus berurutan. Hapus pilihan dari ujung rangkaian jam.', 'Pilihan Jam', 'warning');
      }
      return;
    }

    if (slot.status === 'full' || slot.isBlocked) return;

    if (selectedTimes.length === 0) {
      const nextTime = needsTwoSlots ? getNextHourSlot(slot.time) : null;
      setSelectedTimes(nextTime ? [slot.time, nextTime] : [slot.time]);
      return;
    }

    const selectedStartIndex = DEFAULT_HOURS.indexOf(selectedTimes[0]);
    const selectedEndIndex = DEFAULT_HOURS.indexOf(selectedTimes[selectedTimes.length - 1]);
    const slotIndex = DEFAULT_HOURS.indexOf(slot.time);

    if (slotIndex === selectedStartIndex - 1 || slotIndex === selectedEndIndex + 1) {
      setSelectedTimes([...selectedTimes, slot.time].sort(
        (a, b) => DEFAULT_HOURS.indexOf(a) - DEFAULT_HOURS.indexOf(b)
      ));
      return;
    }

    showAlert('Pilih jam yang bersebelahan untuk menambah durasi treatment.', 'Jam Harus Berurutan', 'warning');
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    const minimumSlots = needsTwoSlots ? 2 : 1;
    if (selectedTimes.length < minimumSlots) {
      showAlert('Silakan pilih jam kedatangan Anda terlebih dahulu.', 'Jam Belum Dipilih', 'warning');
      return;
    }

    const selectedSlotIndexes = selectedTimes.map((time) => DEFAULT_HOURS.indexOf(time));
    const hasConsecutiveSlots = selectedSlotIndexes.every(
      (index, position) => position === 0 || index === selectedSlotIndexes[position - 1] + 1
    );
    const unavailableSelectedSlot = selectedTimes.some((time) => {
      const slot = activeSlots.find((activeSlot) => activeSlot.time === time);
      return !slot || slot.status === 'full' || slot.isBlocked;
    });

    if (!hasConsecutiveSlots || unavailableSelectedSlot) {
      setSelectedTimes([]);
      showAlert('Pilihan jam sudah tidak tersedia atau tidak berurutan. Silakan pilih kembali.', 'Jadwal Berubah', 'warning');
      return;
    }

    const peopleWithoutTreatment = Array.from({ length: validPersonCount }, (_, personIndex) => personIndex)
      .filter((personIndex) => !selectedServices.some((service) => service.personIndex === personIndex));

    if (peopleWithoutTreatment.length > 0) {
      showAlert(
        `Silakan pilih minimal 1 jenis treatment untuk Orang ${peopleWithoutTreatment.map((index) => index + 1).join(', Orang ')}.`,
        'Treatment Belum Lengkap',
        'warning'
      );
      return;
    }

    setLoading(true);

    try {
      const generatedId = `TIX-DP-${Math.floor(100000 + Math.random() * 900000)}`;
      const serviceNamesFormatted = selectedServices
        .map((service) => `Orang ${service.personIndex + 1}: ${service.fullName}`)
        .join(', ');

      const bookedTimeDisplay = `${selectedTimes.join(' & ')} WIB${selectedTimes.length > 1 ? ` (${selectedTimes.length} Slot)` : ''}`;

      const newBooking = {
        id: generatedId,
        customerName,
        customerWa,
        personCount: validPersonCount,
        serviceName: serviceNamesFormatted,
        services: selectedServices,
        dpPaid: DP_AMOUNT,
        date: selectedDate,
        time: bookedTimeDisplay,
        slotTimes: selectedTimes,
        status: 'DP Paid (Confirmed)', 
        paymentMethod: 'QRIS (Duitku)',
      };

      const duitkuRes = await createDuitkuTransaction({
        ...newBooking,
        dpPaid: DP_AMOUNT 
      });

      if (duitkuRes && duitkuRes.statusCode === '00') {
        window.checkout.process(duitkuRes.reference, {
          successEvent: function() {
            setLastBookingId(generatedId);
            setStep(3);
            setLoading(false);

            const WA_NUMBER = '6287827562925'; 
            const waText = `Halo Admin Vinail's!\nSaya baru saja MENYELESAIKAN pembayaran DP Rp ${DP_AMOUNT.toLocaleString('id-ID')} via QRIS.\n\n*ID Booking:* ${generatedId}\n*Nama:* ${customerName}\n*Jumlah Orang:* ${validPersonCount}\n*Jadwal:* ${selectedDate} (Jam ${bookedTimeDisplay})\n*Layanan:* ${serviceNamesFormatted}\n\nMohon konfirmasi jadwalnya ya kak, terima kasih!`;

            window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`, '_blank');
          },
          pendingEvent: function(result) {
            showAlert('Status pembayaran Anda masih menunggu diproses.', 'Info Pembayaran', 'info');
            setLoading(false);
          },
          errorEvent: function(result) {
            showAlert('Terjadi kesalahan pada transaksi pembayaran.', 'Pembayaran Gagal', 'error');
            setLoading(false);
          },
          closeEvent: function(result) {
            showAlert('Anda membatalkan halaman pembayaran. Data booking belum tersimpan.', 'Pembayaran Dibatalkan', 'warning');
            setLoading(false); 
          }
        });

      } else {
        showAlert(`Gagal terhubung ke gateway: ${duitkuRes?.statusMessage || 'Terjadi kesalahan'}`, 'Gagal Duitku', 'error');
        setLoading(false);
      }
    } catch (error) {
      showAlert('Terjadi kesalahan koneksi atau server.', 'Kesalahan Jaringan', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-6 space-y-6 relative">
      
      {/* STEPPER HEADER */}
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

      {/* STEP 1: FORM ISIAN USER */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="bg-white p-6 md:p-8 rounded-3xl border border-[#F5C6CB] shadow-md space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-[#550B18]">Langkah 1: Isi Biodata</h2>
            <p className="text-xs text-gray-500 mt-1">Masukkan data diri untuk konfirmasi reservasi via WhatsApp.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">Nama Lengkap *</label>
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
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">Nomor WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={customerWa}
                onChange={handleWaChange}
                className="w-full p-3.5 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#550B18]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">Jumlah Orang *</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Kurangi jumlah orang"
                  disabled={validPersonCount <= 1}
                  onClick={() => {
                    const nextCount = Math.max(1, validPersonCount - 1);
                    setPersonCount(String(nextCount));
                    setSelectedServices((services) => services.filter((service) => service.personIndex < nextCount));
                    setSelectedTimes([]);
                  }}
                  className="w-12 h-12 rounded-xl border border-gray-300 text-lg font-bold text-[#550B18] disabled:opacity-40"
                >
                  −
                </button>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  aria-label="Jumlah orang"
                  value={personCount}
                  onChange={(e) => {
                    const nextValue = e.target.value.replace(/\D/g, '');
                    setPersonCount(nextValue);
                    if (/^[1-9]\d*$/.test(nextValue)) {
                      const nextCount = Number.parseInt(nextValue, 10);
                      setSelectedServices((services) => services.filter((service) => service.personIndex < nextCount));
                      setSelectedTimes([]);
                    }
                  }}
                  className="min-w-0 flex-1 p-3.5 border border-gray-300 rounded-2xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#550B18]"
                />
                <button
                  type="button"
                  aria-label="Tambah jumlah orang"
                  onClick={() => {
                    const nextCount = validPersonCount + 1;
                    setPersonCount(String(nextCount));
                    setSelectedTimes([]);
                  }}
                  className="w-12 h-12 rounded-xl border border-gray-300 text-lg font-bold text-[#550B18]"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Treatment akan dipilih terpisah untuk setiap orang.</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#550B18] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#3d0711] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Lanjut Pilih Jadwal & Treatment</span>
            <span>→</span>
          </button>
        </form>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <form onSubmit={handleSubmitBooking} className="flex flex-col space-y-6">
          
          {/* HEADER BIODATA COMPACT */}
          <div className="order-1 bg-[#FFF9F6] p-4 rounded-2xl border border-[#F5C6CB] flex justify-between items-center shadow-xs">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Pemesan</p>
              <p className="font-extrabold text-xs sm:text-sm text-[#550B18]">
                {customerName} ({customerWa}) · {validPersonCount} orang
              </p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs text-[#550B18] underline font-bold hover:opacity-80">
              Ubah Data
            </button>
          </div>

          {/* 3. PILIH TREATMENT */}
          <div className="order-4 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-extrabold uppercase text-gray-700">
                3. Pilih Jenis Treatment untuk {validPersonCount} Orang *
              </label>
              <span className="text-[10px] text-[#550B18] bg-[#FFF9F6] px-2 py-0.5 rounded-md font-bold border border-[#F5C6CB]">
                {needsTwoSlots ? '⚡ Minimal 2 slot berurutan' : 'Pilih Nailart Tangan / Kaki / Remove'}
              </span>
            </div>

            <div className="space-y-4">
              {Array.from({ length: validPersonCount }, (_, personIndex) => (
                <section key={personIndex} className="space-y-3 rounded-2xl border border-[#F5C6CB] p-3">
                  <h3 className="text-sm font-black text-[#550B18]">Treatment Orang {personIndex + 1}</h3>
                  <div className="space-y-3">
              {TREATMENT_CATEGORIES.map((cat, catIdx) => {
                const isExpanded = expandedCatIdx[personIndex] === undefined
                  ? catIdx === 0
                  : expandedCatIdx[personIndex] === catIdx;
                const isRemoveCategory = cat.categoryId === 'hanya-remove';

                return (
                  <div 
                    key={cat.categoryId} 
                    className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all duration-300"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedCatIdx((prev) => ({
                        ...prev,
                        [personIndex]: isExpanded ? null : catIdx
                      }))}
                      className="w-full p-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 pr-2">
                        <img
                          src={cat.image}
                          alt={cat.categoryName}
                          className="w-12 h-12 rounded-xl object-cover shadow-xs flex-shrink-0 border border-gray-100"
                        />
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                            {cat.categoryName}
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-gray-400 p-1">
                        <svg
                          className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100 bg-gray-50/50">
                        {isRemoveCategory ? (
                          cat.items.map((item) => {
                            const isSelected = selectedServices.some(
                              (s) => s.personIndex === personIndex && s.id === item.id
                            );
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleToggleRemove(cat, item, personIndex)}
                                className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#FFF9F6] border border-[#F5C6CB] shadow-xs'
                                    : 'bg-white border border-gray-100 hover:border-gray-200'
                                }`}
                              >
                                <div>
                                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                                    Remove {item.name}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleRemove(cat, item, personIndex);
                                  }}
                                  className={`w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-lg transition-all ${
                                    isSelected
                                      ? 'bg-[#550B18] text-white shadow-xs'
                                      : 'bg-gray-100 text-gray-600 hover:bg-[#550B18] hover:text-white'
                                  }`}
                                >
                                  {isSelected ? (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="space-y-3 py-1">
                            <div className="bg-white p-3 rounded-xl border border-dashed border-[#F5C6CB] flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-[#550B18] block">Ingin tambah Remove?</span>
                                <span className="text-[10px] text-gray-400">Pembersihan kuku lama sebelum pengerjaan.</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const removeId = cat.categoryId === 'nailart-tangan' ? 'nat-remove' : 'nak-remove';
                                  const removeObj = { id: removeId, name: 'Remove' };
                                  handleToggleRemove(cat, removeObj, personIndex);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  selectedServices.some((s) => s.personIndex === personIndex && s.id === (cat.categoryId === 'nailart-tangan' ? 'nat-remove' : 'nak-remove'))
                                    ? 'bg-[#550B18] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-[#F5C6CB]'
                                }`}
                              >
                                {selectedServices.some((s) => s.personIndex === personIndex && s.id === (cat.categoryId === 'nailart-tangan' ? 'nat-remove' : 'nak-remove')) ? '✓ Remove Dipilih' : '+ Pilih Remove'}
                              </button>
                            </div>

                            {cat.types.map((typeObj) => {
                              const typeStateKey = `${personIndex}:${cat.categoryId}`;
                              const isOpenSubDropdown = openTypeState[typeStateKey] === typeObj.typeId;
                              const hasSelectedOption = typeObj.options.some((opt) => 
                                selectedServices.some((s) => s.personIndex === personIndex && s.id === opt.id)
                              );

                              return (
                                <div key={typeObj.typeId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenTypeState(prev => ({
                                        ...prev,
                                        [typeStateKey]: isOpenSubDropdown ? null : typeObj.typeId
                                      }));
                                    }}
                                    className={`w-full p-3 flex items-center justify-between text-left transition-colors ${
                                      hasSelectedOption ? 'bg-[#FFF9F6] border-l-4 border-l-[#550B18]' : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-gray-800">{typeObj.typeName}</span>
                                      {hasSelectedOption && (
                                        <span className="text-[10px] bg-[#550B18] text-white px-2 py-0.5 rounded-full font-bold">
                                          Dipilih
                                        </span>
                                      )}
                                    </div>
                                    <svg
                                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpenSubDropdown ? 'rotate-180' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>

                                  {isOpenSubDropdown && (
                                    <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-2">
                                      {typeObj.options.map((optionItem) => {
                                        const isOptionSelected = selectedServices.some(
                                          (s) => s.personIndex === personIndex && s.id === optionItem.id
                                        );

                                        return (
                                          <button
                                            key={optionItem.id}
                                            type="button"
                                            onClick={() => handleSelectNailartOption(cat, typeObj, optionItem, personIndex)}
                                            className={`p-2.5 rounded-lg text-center font-bold text-xs transition-all border ${
                                              isOptionSelected
                                                ? 'bg-[#550B18] text-white border-[#550B18] shadow-xs'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#550B18]'
                                            }`}
                                          >
                                            {optionItem.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* 1. PILIH TANGGAL */}
          <div className="order-2 space-y-2">
            <label className="block text-xs font-extrabold uppercase text-gray-700">
              1. Pilih Tanggal Kedatangan *
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {datesList.map((item) => {
                const isSelected = selectedDate === item.fullDate;
                return (
                  <button
                    key={item.fullDate}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.fullDate);
                      setSelectedTimes([]);
                    }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-2xl transition-all relative ${
                      isSelected
                        ? 'bg-[#550B18] text-white shadow-md scale-105 font-bold'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {isSelected && (
                      <span className="text-[9px] uppercase tracking-wider bg-white/20 px-2 rounded-full mb-0.5 font-bold">
                        {item.monthName}
                      </span>
                    )}
                    <span className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                      {item.dayName}
                    </span>
                    <span className={`text-lg font-extrabold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {item.dayNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. PILIH JAM OPERASIONAL (DENGAN DUAL-SLOT HIGHLIGHT) */}
          <div className="order-3 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-extrabold uppercase text-gray-700">
                2. Pilih Jam Kedatangan (09:00 - 21:00) *
              </label>
              {needsTwoSlots && (
                <span className="text-[10px] text-brand-ruby font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  ⚠️ Minimal 2 slot berurutan
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              {selectedTimes.length > 0
                ? `${selectedTimes.length} slot dipilih. Pilih jam di sebelah rangkaian untuk menambah durasi.`
                : 'Pilih jam mulai. Untuk menambah durasi, pilih jam yang bersebelahan.'}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {activeSlots.map((slot, idx) => {
                const selectedIndex = selectedTimes.indexOf(slot.time);
                const isSelected = selectedIndex !== -1;

                const isUnavailable = slot.status === 'full' || slot.isBlocked;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isUnavailable && !isSelected}
                    onClick={() => handleSelectTime(slot)}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition-all ${
                      isUnavailable && !isSelected
                        ? 'bg-rose-500 text-white border-rose-500 cursor-not-allowed opacity-80'
                        : isSelected
                        ? 'bg-[#550B18] text-white border-[#550B18] shadow-md scale-105'
                        : 'bg-white text-[#550B18] border-[#F5C6CB] hover:border-[#550B18]'
                    }`}
                  >
                    <span className="text-xs font-extrabold block">{slot.time}</span>
                    <span className="text-[9px] block font-semibold">
                      {isSelected ? (selectedIndex === 0 ? 'Mulai' : 'Durasi') : slot.reason}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RINGKASAN TREATMENT DIPILIH */}
          <div className="order-5 bg-[#FFF9F6] p-4 rounded-2xl border border-[#F5C6CB] space-y-3">
            <div className="flex justify-between items-center border-b border-[#F5C6CB]/60 pb-2">
              <h4 className="font-extrabold text-xs text-[#550B18] uppercase tracking-wide flex items-center gap-1.5">
                <span></span> Treatment yang Dipilih
              </h4>
              <span className="text-[10px] font-bold bg-[#550B18] text-white px-2 py-0.5 rounded-full">
                {selectedServices.length} Item
              </span>
            </div>

            {selectedServices.length === 0 ? (
              <p className="text-xs text-rose-500 italic py-1 text-center">
                Belum ada treatment yang dipilih. Silakan pilih layanan di atas.
              </p>
            ) : (
              <ul className="space-y-1.5 py-1">
                {selectedServices.map((srv, index) => (
                  <li key={`${srv.personIndex}-${srv.id}-${index}`} className="flex justify-between items-center text-xs font-bold text-[#550B18]">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#550B18]"></span>
                      Orang {srv.personIndex + 1}: {srv.fullName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 4. PEMBAYARAN DP */}
          <div className="order-6 bg-white p-5 rounded-3xl border border-[#F5C6CB] shadow-md space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-gray-700 mb-2">
                4. Pembayaran DP
              </label>
              <div className="p-3.5 rounded-2xl border border-[#550B18] bg-[#FFF9F6] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h5 className="font-extrabold text-xs text-[#550B18]">QRIS Duitku</h5>
                    <p className="text-[10px] text-gray-500">GoPay, ShopeePay, BCA, Mandiri, QRIS All Bank</p>
                  </div>
                </div>
                <span className="text-[10px] bg-[#550B18] text-white px-2.5 py-1 rounded-lg font-bold">
                  {mainNailartCount > 1 ? `DP ${mainNailartCount} Treatment` : 'DP Wajib'}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center text-xs">
              <div>
                <span className="font-extrabold text-gray-700 block">Total DP Dibayarkan Sekarang</span>
                {mainNailartCount > 1 && (
                  <span className="text-[10px] text-gray-500">(Rp 50.000 × {mainNailartCount} Treatment Utama)</span>
                )}
              </div>
              <span className="text-base font-black text-[#550B18]">
                Rp {DP_AMOUNT.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* TOMBOL SUBMIT */}
          <div className="order-7 flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(1)}
              className="w-1/3 py-4 rounded-2xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 bg-[#550B18] text-white py-4 rounded-2xl font-black text-xs sm:text-sm hover:bg-[#3d0711] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses Duitku...</span>
              ) : (
                <span>Bayar DP Rp {DP_AMOUNT.toLocaleString('id-ID')} via QRIS</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SUKSES */}
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
                <span className="text-gray-500">Nomor WA:</span>
                <span className="font-bold text-[#550B18]">{customerWa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah Orang:</span>
                <span className="font-bold text-[#550B18]">{validPersonCount} orang</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal & Jam:</span>
                <span className="font-bold text-[#550B18]">
                  {selectedDate} @ {selectedTimes.join(' & ')} WIB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Treatment:</span>
                <span className="font-bold text-[#550B18] text-right">
                  {selectedServices.map((s) => `Orang ${s.personIndex + 1}: ${s.fullName}`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DP Dibayar:</span>
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
                setPersonCount('1');
                setSelectedTimes([]);
                setSelectedServices([]);
                setExpandedCatIdx({});
                setOpenTypeState({});
              }}
              className="bg-[#550B18] text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-[#3d0711] transition-all"
            >
              Selesai / Booking Baru
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM POPUP MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#F5C6CB] p-6 max-w-sm w-full shadow-2xl text-center space-y-4 transform transition-all">
            <div className="w-12 h-12 bg-[#FFF9F6] border border-[#F5C6CB] rounded-full flex items-center justify-center mx-auto text-xl">
              {modal.type === 'error' ? '⚠️' : modal.type === 'warning' ? '🔔' : 'ℹ️'}
            </div>
            <div>
              <h3 className="font-black text-lg text-[#550B18]">{modal.title}</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{modal.message}</p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-full bg-[#550B18] text-white py-3.5 rounded-2xl font-bold text-xs hover:bg-[#3d0711] transition-all shadow-md active:scale-95"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}

    </div>
  );
}