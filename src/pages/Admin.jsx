import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { getBookingSlotTimes } from '../utils/bookingSlots';

// Helper fungsi tanggal lokal YYYY-MM-DD
const getLocalDateString = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const GALLERY_CATEGORIES = ['Semua', 'Nailart Tangan', 'Nailart Kaki', 'Remove'];

export default function Admin({ globalSlots, setGlobalSlots }) {
  const [activeAdminTab, setActiveAdminTab] = useState('schedules');

  // STATE CUSTOM INTERACTIVE MODAL
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    variant: 'danger',
    onConfirm: null,
  });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const triggerAlert = (title, message, variant = 'info') => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message,
      confirmText: 'Selesai',
      variant,
      onConfirm: null,
    });
  };

  const triggerConfirm = ({ title, message, onConfirm, confirmText = 'Ya, Hapus', variant = 'danger' }) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText: 'Batal',
      variant,
      onConfirm,
    });
  };

  // 1. GENERATOR 7 HARI BERGULIR OTOMATIS (LOKAL WIB)
  const datesList = useMemo(() => {
    const list = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateVal = getLocalDateString(d); 

      let label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      if (i === 0) label = 'Hari Ini';
      if (i === 1) label = 'Besok';

      list.push({ label, value: dateVal, rawDate: d });
    }
    return list;
  }, []);

  const [selectedAdminDate, setSelectedAdminDate] = useState(datesList[0].value);
  const [selectedSlotForReason, setSelectedSlotForReason] = useState(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // State Modal Bulk Block
  const [isBulkBlockModalOpen, setIsBulkBlockModalOpen] = useState(false);
  const [bulkReasonInput, setBulkReasonInput] = useState('Libur Toko / Tutup Operasional');

  // 2. STATE REAL-TIME FIRESTORE
  const [bookings, setBookings] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // State Galeri / Katalog (Admin) dengan Kompresi Gambar
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Nailart Tangan',
    description: '',
  });
  const [galleryUploadedImage, setGalleryUploadedImage] = useState(null);
  const [isGalleryDragOver, setIsGalleryDragOver] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('Semua');

  // 3. LISTENERS FIRESTORE (REAL-TIME SUBSCRIPTIONS)
  useEffect(() => {
    const unsubscribeSchedules = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const slotsData = {};
      snapshot.docs.forEach((docSnap) => {
        slotsData[docSnap.id] = docSnap.data().slots;
      });
      if (setGlobalSlots) {
        setGlobalSlots((prev) => ({ ...prev, ...slotsData }));
      }
    }, (error) => console.error('Error fetching schedules:', error));

    const qBookings = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      setBookings(data);
    }, (error) => console.error('Error fetching bookings:', error));

    const qGallery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribeGallery = onSnapshot(qGallery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      setGalleryItems(data);
      setLoadingGallery(false);
    }, (error) => console.error('Error fetching gallery:', error));

    return () => {
      unsubscribeSchedules();
      unsubscribeBookings();
      unsubscribeGallery();
    };
  }, [setGlobalSlots]);

  // Map transaksi booking khusus untuk tanggal terpilih
  const bookingsMapForSelectedDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (b.date === selectedAdminDate && b.time) {
        getBookingSlotTimes(b).forEach((time) => {
          map[time] = b;
        });
      }
    });
    return map;
  }, [bookings, selectedAdminDate]);

  // Cek Jam Lampau
  const isSlotPast = (timeStr, targetDateStr) => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    if (targetDateStr < todayStr) return true;
    if (targetDateStr > todayStr) return false;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const [slotHourStr, slotMinuteStr] = timeStr.split(':');
    const slotHour = parseInt(slotHourStr, 10);
    const slotMinute = parseInt(slotMinuteStr || '0', 10);

    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && currentMinute >= slotMinute) return true;

    return false;
  };

  // Hitung Statistik Per Tanggal
  const getStatsForDate = (dateVal) => {
    const rawSlots = globalSlots && globalSlots[dateVal] 
      ? globalSlots[dateVal] 
      : DEFAULT_HOURS.map((time) => ({ time, isBlocked: false }));

    const dayBookings = bookings.filter((b) => b.date === dateVal && b.time);
    const bookedTimesSet = new Set(dayBookings.flatMap(getBookingSlotTimes));

    let bookedCount = 0;
    let blockedCount = 0;

    rawSlots.forEach((s) => {
      if (s.isBlocked) {
        blockedCount++;
      } else if (bookedTimesSet.has(s.time)) {
        bookedCount++;
      }
    });

    const total = DEFAULT_HOURS.length;
    const availableCount = Math.max(0, total - bookedCount - blockedCount);

    return { total, availableCount, bookedCount, blockedCount };
  };

  // Slot Dinamis
  const currentSlots = useMemo(() => {
    const rawSlots = globalSlots && globalSlots[selectedAdminDate] 
      ? globalSlots[selectedAdminDate] 
      : DEFAULT_HOURS.map((time) => ({ time, isBlocked: false, reason: '' }));

    return rawSlots.map((s) => {
      const clientBooking = bookingsMapForSelectedDate[s.time];
      const isPast = isSlotPast(s.time, selectedAdminDate);

      return {
        ...s,
        clientBooking: clientBooking || null,
        isPast,
      };
    });
  }, [globalSlots, selectedAdminDate, bookingsMapForSelectedDate]);

  const currentSelectedStats = useMemo(() => {
    return getStatsForDate(selectedAdminDate);
  }, [selectedAdminDate, globalSlots, bookings]);

  // 4. HANDLER SLOT JAM (FIRESTORE)
  const handleBlockSlotWithReason = async (e) => {
    e.preventDefault();
    const updatedSlotsForDate = currentSlots.map((s) =>
      s.time === selectedSlotForReason
        ? { time: s.time, isBlocked: true, reason: blockReasonInput }
        : { time: s.time, isBlocked: s.isBlocked, reason: s.reason || '' }
    );

    try {
      await setDoc(doc(db, 'schedules', selectedAdminDate), {
        slots: updatedSlotsForDate
      }, { merge: true });

      if (setGlobalSlots) {
        setGlobalSlots((prev = {}) => ({
          ...prev,
          [selectedAdminDate]: updatedSlotsForDate
        }));
      }
      triggerAlert('Slot Diblokir', `Jam ${selectedSlotForReason} berhasil diblokir.`, 'success');
    } catch (error) {
      triggerAlert('Gagal Memblokir', error.message, 'danger');
    }

    setSelectedSlotForReason(null);
    setBlockReasonInput('');
  };

  const handleUnblockSlot = async (time) => {
    const updatedSlotsForDate = currentSlots.map((s) =>
      s.time === time
        ? { time: s.time, isBlocked: false, reason: '' }
        : { time: s.time, isBlocked: s.isBlocked, reason: s.reason || '' }
    );

    try {
      await setDoc(doc(db, 'schedules', selectedAdminDate), {
        slots: updatedSlotsForDate
      }, { merge: true });

      if (setGlobalSlots) {
        setGlobalSlots((prev = {}) => ({
          ...prev,
          [selectedAdminDate]: updatedSlotsForDate
        }));
      }
      triggerAlert('Slot Dibuka', `Jam ${time} kembali dibuka untuk reservasi.`, 'success');
    } catch (error) {
      triggerAlert('Gagal Membuka Slot', error.message, 'danger');
    }
  };

  // FITUR BULK BLOCK (LIBUR TOKO)
  const handleExecuteBulkBlock = async (e) => {
    e.preventDefault();
    const updatedSlots = DEFAULT_HOURS.map((time) => ({
      time,
      isBlocked: true,
      reason: bulkReasonInput || 'Libur Toko / Tutup',
    }));

    try {
      await setDoc(doc(db, 'schedules', selectedAdminDate), {
        slots: updatedSlots
      }, { merge: true });

      if (setGlobalSlots) {
        setGlobalSlots((prev = {}) => ({
          ...prev,
          [selectedAdminDate]: updatedSlots
        }));
      }
      triggerAlert('Libur Toko Diterapkan', `Seluruh slot jam tanggal ${selectedAdminDate} berhasil diblokir.`, 'success');
    } catch (error) {
      triggerAlert('Gagal Bulk Block', error.message, 'danger');
    }

    setIsBulkBlockModalOpen(false);
  };

  const handleBulkUnblock = () => {
    triggerConfirm({
      title: 'Buka Semua Slot?',
      message: `Apakah Anda yakin ingin membuka seluruh slot jam pada tanggal ${selectedAdminDate}?`,
      confirmText: 'Ya, Buka Semua',
      variant: 'info',
      onConfirm: async () => {
        const updatedSlots = DEFAULT_HOURS.map((time) => ({
          time,
          isBlocked: false,
          reason: '',
        }));

        try {
          await setDoc(doc(db, 'schedules', selectedAdminDate), {
            slots: updatedSlots
          }, { merge: true });

          if (setGlobalSlots) {
            setGlobalSlots((prev = {}) => ({
              ...prev,
              [selectedAdminDate]: updatedSlots
            }));
          }
          triggerAlert('Berhasil', `Seluruh slot tanggal ${selectedAdminDate} telah dibuka kembali.`, 'success');
        } catch (error) {
          triggerAlert('Gagal Unblock', error.message, 'danger');
        }
      }
    });
  };

  const handleDeleteBooking = (docId) => {
    if (!docId) {
      triggerAlert('Gagal', 'ID Booking tidak ditemukan/tidak valid.', 'danger');
      return;
    }

    triggerConfirm({
      title: 'Hapus Data Booking?',
      message: 'Apakah Anda yakin ingin menghapus data booking transaksi ini dari Firestore?',
      confirmText: 'Ya, Hapus Booking',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "bookings", docId));
          setTimeout(() => {
            triggerAlert('Berhasil Hapus', 'Data booking berhasil dihapus dari sistem.', 'success');
          }, 150);
        } catch (error) {
          console.error("Gagal menghapus booking:", error);
          setTimeout(() => {
            triggerAlert('Gagal Hapus', `Error Firestore: ${error.message}`, 'danger');
          }, 150);
        }
      }
    });
  };

  // 5. HANDLER DRAG & DROP & UPLOAD GALERI / KATALOG DENGAN KOMPRESI OTOMATIS
  const handleGalleryDragOver = (e) => {
    e.preventDefault();
    setIsGalleryDragOver(true);
  };

  const handleGalleryDragLeave = () => {
    setIsGalleryDragOver(false);
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    setIsGalleryDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processGalleryFile(e.dataTransfer.files[0]);
    }
  };

  const handleGalleryFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processGalleryFile(e.target.files[0]);
    }
  };

  const processGalleryFile = (file) => {
    if (!file.type.startsWith('image/')) {
      triggerAlert('Format File Salah', 'Mohon unggah file berupa gambar (.jpg, .png)!', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setGalleryUploadedImage(compressedDataUrl);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!galleryUploadedImage) {
      triggerAlert('Foto Belum Dipilih', 'Silakan unggah foto hasil karya terlebih dahulu!', 'warning');
      return;
    }

    try {
      await addDoc(collection(db, 'gallery'), {
        title: galleryForm.title || 'Katalog Nailart',
        category: galleryForm.category,
        description: galleryForm.description,
        image: galleryUploadedImage,
        createdAt: serverTimestamp()
      });

      setGalleryForm({ title: '', category: 'Nailart Tangan', description: '' });
      setGalleryUploadedImage(null);
      triggerAlert('Berhasil Terbit', 'Katalog baru berhasil dipublikasikan ke Galeri!', 'success');
    } catch (error) {
      triggerAlert('Gagal Menyimpan', error.message, 'danger');
    }
  };

  const handleDeleteGalleryItem = (docId) => {
    triggerConfirm({
      title: 'Hapus Foto Galeri?',
      message: 'Apakah Anda yakin ingin menghapus foto katalog ini dari sistem?',
      confirmText: 'Ya, Hapus Foto',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "gallery", docId));
          setTimeout(() => {
            triggerAlert('Berhasil Hapus', 'Foto katalog telah dihapus dari galeri.', 'success');
          }, 150);
        } catch (error) {
          setTimeout(() => {
            triggerAlert('Gagal Hapus', `Error Firestore: ${error.message}`, 'danger');
          }, 150);
        }
      }
    });
  };

  const filteredGalleryItems = useMemo(() => {
    return galleryItems.filter((item) => {
      if (galleryFilter === 'Semua') return true;
      return item.category === galleryFilter;
    });
  }, [galleryItems, galleryFilter]);

  return (
    <div className="min-h-screen bg-brand-creamy/40 py-8 px-4 text-brand-dark">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Tabs (Tab Ulasan Dihapus) */}
        <div className="flex flex-wrap gap-2 border-b border-brand-rose pb-4">
          <button
            onClick={() => setActiveAdminTab('schedules')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'schedules' 
                ? 'bg-brand-dark text-brand-creamy shadow-sm' 
                : 'bg-white text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
            }`}
          >
            Kelola Jam & Realtime Jadwal
          </button>
          <button
            onClick={() => setActiveAdminTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'history' 
                ? 'bg-brand-dark text-brand-creamy shadow-sm' 
                : 'bg-white text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
            }`}
          >
            History Pembayaran
          </button>
          <button
            onClick={() => setActiveAdminTab('gallery')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'gallery' 
                ? 'bg-brand-dark text-brand-creamy shadow-sm' 
                : 'bg-white text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
            }`}
          >
            Kelola Galeri & Katalog
          </button>
        </div>

        {/* TAB 1: Kelola Slot Jam Real-Time */}
        {activeAdminTab === 'schedules' && (
          <div className="space-y-4">
            
            {/* Filter Tanggal & Indikator Badge Per Hari */}
            <div className="bg-white p-4 rounded-2xl border border-brand-rose shadow-sm space-y-2">
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                Pilih Tanggal Operasional (7 Hari Bergulir):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {datesList.map((d) => {
                  const stats = getStatsForDate(d.value);
                  const isSelected = selectedAdminDate === d.value;

                  return (
                    <button
                      key={d.value}
                      onClick={() => setSelectedAdminDate(d.value)}
                      className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-between space-y-1 ${
                        isSelected
                          ? 'bg-brand-dark text-brand-creamy border-brand-dark shadow-sm'
                          : 'bg-brand-creamy/20 text-brand-dark border-brand-rose hover:bg-brand-rose/30'
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        isSelected 
                          ? 'bg-brand-creamy text-brand-dark' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {stats.availableCount} Kosong
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Banner Ringkasan Ringkas KPI Per Hari & Tombol Bulk Block */}
            <div className="bg-white p-4 rounded-2xl border border-brand-rose shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <span className="text-emerald-700 block text-[10px] uppercase">Slot Tersedia</span>
                  <span className="text-emerald-800 text-base">{currentSelectedStats.availableCount} / {currentSelectedStats.total}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                  <span className="text-blue-700 block text-[10px] uppercase">Booked Client</span>
                  <span className="text-blue-900 text-base">{currentSelectedStats.bookedCount}</span>
                </div>
                <div className="bg-brand-ruby/10 border border-brand-ruby/30 px-3 py-1.5 rounded-xl">
                  <span className="text-brand-ruby block text-[10px] uppercase">Diblokir / Libur</span>
                  <span className="text-brand-ruby text-base">{currentSelectedStats.blockedCount}</span>
                </div>
              </div>

              {/* Action Bulk Block / Unblock */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBulkBlockModalOpen(true)}
                  className="px-3.5 py-2 bg-brand-ruby hover:bg-brand-ruby/90 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                >
                  🔒 Blokir Semua (Libur Toko)
                </button>
                <button
                  onClick={handleBulkUnblock}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-brand-dark rounded-xl text-xs font-bold transition-all border border-slate-300"
                >
                  🔓 Buka Semua
                </button>
              </div>
            </div>

            {/* Grid Jam Operasional & Status Booking Client */}
            <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-brand-rose/30 pb-3">
                <h3 className="font-bold text-brand-dark text-sm">
                  Kelola Slot Jam Tanggal: <span className="underline text-brand-ruby">{selectedAdminDate}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Buka</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Booked</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-ruby"></span> Blocked</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Lewat</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {currentSlots.map((slot) => {
                  const isClientBooked = Boolean(slot.clientBooking);
                  const clientName = slot.clientBooking?.customerName || slot.clientBooking?.name || slot.clientBooking?.clientName;
                  const serviceName = slot.clientBooking?.serviceName || slot.clientBooking?.service || slot.clientBooking?.treatment;

                  return (
                    <div 
                      key={slot.time} 
                      className={`border p-3 rounded-xl flex flex-col justify-between space-y-2 transition-all ${
                        slot.isPast
                          ? 'bg-gray-100 border-gray-300 opacity-60'
                          : slot.isBlocked 
                          ? 'bg-brand-ruby/10 border-brand-ruby' 
                          : isClientBooked
                          ? 'bg-blue-50 border-blue-400'
                          : 'bg-white border-brand-rose'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-bold text-sm text-brand-dark">{slot.time}</p>
                        
                        {/* Status Label */}
                        <div className="text-[10px] font-semibold mt-1 space-y-0.5">
                          {slot.isPast ? (
                            <span className="text-gray-500 font-bold block">⏱️ Lewat</span>
                          ) : slot.isBlocked ? (
                            <span className="text-brand-ruby font-bold block truncate" title={slot.reason}>
                              🔒 {slot.reason || 'Blocked Admin'}
                            </span>
                          ) : isClientBooked ? (
                            <div className="bg-blue-100 text-blue-900 p-1.5 rounded-lg border border-blue-200 mt-1 text-left">
                              <p className="font-bold truncate text-[10px]" title={clientName}>
                                👤 {clientName}
                              </p>
                              <p className="text-[9px] text-blue-700 truncate" title={serviceName}>
                                💅 {serviceName}
                              </p>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-bold block">✅ Buka</span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {slot.isPast ? (
                          <button
                            disabled
                            className="w-full py-1.5 bg-gray-200 text-gray-500 rounded-lg text-[10px] font-bold cursor-not-allowed"
                          >
                            Tutup
                          </button>
                        ) : slot.isBlocked ? (
                          <button
                            onClick={() => handleUnblockSlot(slot.time)}
                            className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                          >
                            Buka
                          </button>
                        ) : isClientBooked ? (
                          <button
                            onClick={() => setActiveAdminTab('history')}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                          >
                            Detail WA
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedSlotForReason(slot.time)}
                            className="w-full py-1.5 bg-brand-ruby hover:bg-brand-ruby/90 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Input Alasan Single Block */}
            {selectedSlotForReason && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                <form onSubmit={handleBlockSlotWithReason} className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 border border-brand-rose shadow-2xl">
                  <h4 className="font-bold text-sm text-brand-dark">
                    Alasan Block Jam {selectedSlotForReason} ({selectedAdminDate})
                  </h4>
                  <input
                    type="text" 
                    required 
                    placeholder="Contoh: Istirahat / Urgent / Pemeliharaan" 
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    className="w-full p-3 border border-brand-rose rounded-xl text-xs focus:outline-none focus:border-brand-dark bg-brand-creamy/20 text-brand-dark"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button" 
                      onClick={() => setSelectedSlotForReason(null)}
                      className="flex-1 py-2.5 bg-brand-rose/40 text-brand-dark text-xs rounded-xl font-bold hover:bg-brand-rose transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-brand-ruby text-white text-xs rounded-xl font-bold hover:bg-brand-ruby/90 shadow-sm transition-colors"
                    >
                      Simpan Block
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal Bulk Block (Libur Toko) */}
            {isBulkBlockModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                <form onSubmit={handleExecuteBulkBlock} className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 border border-brand-rose shadow-2xl">
                  <div className="text-center space-y-1">
                    <span className="text-3xl">🔒</span>
                    <h4 className="font-bold text-sm text-brand-dark">
                      Blokir Semua Jam (Libur Toko)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Seluruh slot jam pada tanggal <strong>{selectedAdminDate}</strong> akan ditutup.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1">Alasan Penutupan *</label>
                    <input
                      type="text" 
                      required 
                      placeholder="Contoh: Libur Toko / Hari Raya / Renovasi" 
                      value={bulkReasonInput}
                      onChange={(e) => setBulkReasonInput(e.target.value)}
                      className="w-full p-3 border border-brand-rose rounded-xl text-xs focus:outline-none focus:border-brand-dark bg-brand-creamy/20 text-brand-dark"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button" 
                      onClick={() => setIsBulkBlockModalOpen(false)}
                      className="flex-1 py-2.5 bg-brand-rose/40 text-brand-dark text-xs rounded-xl font-bold hover:bg-brand-rose transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-brand-ruby text-white text-xs rounded-xl font-bold hover:bg-brand-ruby/90 shadow-sm transition-colors"
                    >
                      Blokir Semua Slot
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: History Pembayaran Real-time */}
        {activeAdminTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
            <div className="border-b border-brand-rose/30 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-brand-dark text-sm">
                  Riwayat Transaksi Booking (Real-time Firestore)
                </h3>
                <p className="text-[11px] text-brand-dark/70">
                  Daftar lengkap reservasi dan status pembayaran DP pelanggan.
                </p>
              </div>
              <span className="bg-brand-rose/30 text-brand-dark text-xs font-bold px-3 py-1 rounded-xl">
                Total: {bookings.length} Transaksi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-dark border-collapse">
                <thead className="bg-brand-rose/30 text-brand-dark font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Pelanggan & Kontak</th>
                    <th className="p-3.5">Jadwal Treatment</th>
                    <th className="p-3.5">Layanan Dipilih</th>
                    <th className="p-3.5">Status Pembayaran</th>
                    <th className="p-3.5 rounded-r-xl text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-rose/20">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-brand-dark/60 italic font-semibold">
                        Belum ada riwayat transaksi booking yang terekam.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((item, index) => {
                      const name = item.customerName || item.name || item.clientName || 'Pelanggan';
                      const wa = item.customerWa || item.phone || '-';
                      const service = item.serviceName || item.service || item.treatment || '-';
                      const timeSlot = item.time ? `${item.time} WIB` : '-';
                      const dateSlot = item.date || '';
                      
                      const orderTime = item.createdAt && typeof item.createdAt.toDate === 'function'
                        ? item.createdAt.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) 
                        : 'Waktu tidak terekam';

                      const serviceList = typeof service === 'string' 
                        ? service.split(',').map(s => s.trim()) 
                        : [service];

                      return (
                        <tr key={item.id || index} className="hover:bg-brand-creamy/30 transition-colors">
                          <td className="p-3.5 align-top">
                            <p className="font-bold text-brand-dark text-sm">{name}</p>
                            <p className="text-[11px] text-brand-dark/80 font-medium mt-0.5">
                              📞: <span className="font-bold">{wa}</span>
                            </p>
                            <p className="text-[11px] text-brand-dark/80 font-medium mt-0.5">
                              👥: <span className="font-bold">{item.personCount || 1} orang</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Dipesan: {orderTime}
                            </p>
                          </td>

                          <td className="p-3.5 align-top font-semibold">
                            <div className="bg-brand-creamy/50 border border-brand-rose/40 px-2.5 py-1.5 rounded-xl w-fit space-y-0.5">
                              <p className="text-brand-dark text-xs font-bold"> {dateSlot || 'Tanggal tidak diatur'}</p>
                              <p className="text-brand-ruby text-[11px] font-extrabold"> {timeSlot}</p>
                            </div>
                          </td>

                          <td className="p-3.5 align-top">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {serviceList.map((srv, idx) => (
                                <span key={idx} className="bg-brand-rose/20 text-brand-dark border border-brand-rose/40 px-2 py-1 rounded-lg text-[10px] font-semibold">
                                  💅 {srv}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="p-3.5 align-top">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-[11px] font-extrabold shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                              {item.status || 'DP Paid (Confirmed)'}
                            </span>
                          </td>

                          <td className="p-3.5 align-top text-center">
                            <button 
                              onClick={() => handleDeleteBooking(item.id)}
                              className="bg-brand-ruby hover:bg-brand-ruby/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                              title="Hapus data booking ini"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Kelola Galeri & Katalog Hasil Karya */}
        {activeAdminTab === 'gallery' && (
          <div className="space-y-6">
            
            {/* Form Upload Galeri / Katalog */}
            <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
              <h3 className="font-bold text-brand-dark text-sm border-b border-brand-rose/40 pb-2">
                📸 Upload Katalog / Hasil Karya Baru (Galeri Portfolio)
              </h3>

              <form onSubmit={handleUploadGallery} className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1 text-brand-dark">Judul / Nama Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Gelish Nude Elegant"
                      value={galleryForm.title}
                      onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      className="w-full p-3 border border-brand-rose rounded-xl focus:outline-none focus:border-brand-dark bg-brand-creamy/20 text-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-brand-dark">Kategori Galeri *</label>
                    <select
                      value={galleryForm.category}
                      onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                      className="w-full p-3 border border-brand-rose rounded-xl focus:outline-none focus:border-brand-dark bg-white text-brand-dark"
                    >
                      <option value="Nailart Tangan">Nailart Tangan</option>
                      <option value="Nailart Kaki">Nailart Kaki</option>
                      <option value="Remove">Remove</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-brand-dark">Deskripsi Singkat</label>
                    <textarea
                      placeholder="Detail warna, jenis gel, atau catatan tambahan..."
                      value={galleryForm.description}
                      onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                      className="w-full p-3 border border-brand-rose rounded-xl h-20 focus:outline-none focus:border-brand-dark bg-brand-creamy/20 text-brand-dark"
                    />
                  </div>
                </div>

                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="block font-bold mb-1 text-brand-dark">Foto Hasil Karya *</label>
                    <div
                      onDragOver={handleGalleryDragOver}
                      onDragLeave={handleGalleryDragLeave}
                      onDrop={handleGalleryDrop}
                      onClick={() => document.getElementById('gallery-admin-file-upload').click()}
                      className={`border-2 border-dashed border-brand-rose p-4 text-center rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isGalleryDragOver ? 'bg-brand-rose/60' : 'bg-brand-rose/20 hover:bg-brand-rose/40'
                      }`}
                    >
                      <input
                        id="gallery-admin-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryFileSelect}
                        className="hidden"
                      />

                      {galleryUploadedImage ? (
                        <div className="space-y-1">
                          <img src={galleryUploadedImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-brand-rose mx-auto" />
                          <p className="text-[10px] text-brand-dark font-bold">✓ Foto siap diunggah (Terkompres)</p>
                        </div>
                      ) : (
                        <>
                          <span className="text-xl mb-1">🖼️</span>
                          <p className="text-brand-dark font-bold text-xs">Tarik & lepas foto di sini</p>
                          <p className="text-brand-dark/70 text-[10px]">atau klik untuk memilih file</p>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-brand-dark hover:bg-brand-dark/90 text-brand-creamy font-bold rounded-xl text-xs shadow-md transition-all"
                  >
                    Publikasikan ke Galeri
                  </button>
                </div>
              </form>
            </div>

            {/* List Item Galeri Terbit */}
            <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-brand-rose/40 pb-3">
                <h3 className="font-bold text-brand-dark text-sm">
                  ✨ Kelola Item Galeri ({filteredGalleryItems.length})
                </h3>

                {/* Filter Kategori Galeri */}
                <div className="flex flex-wrap gap-1.5">
                  {GALLERY_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setGalleryFilter(cat)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        galleryFilter === cat
                          ? 'bg-brand-dark text-brand-creamy shadow-xs'
                          : 'bg-brand-creamy/20 text-brand-dark border border-brand-rose/60 hover:bg-brand-rose/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {loadingGallery ? (
                <p className="text-xs text-brand-dark/60 italic font-bold">Memuat data galeri Firestore...</p>
              ) : filteredGalleryItems.length === 0 ? (
                <p className="text-xs text-brand-dark/60 italic">Belum ada foto katalog dalam kategori ini.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGalleryItems.map((item) => (
                    <div key={item.id} className="border border-brand-rose/60 rounded-2xl overflow-hidden bg-brand-creamy/10 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
                      <div>
                        <div className="relative h-44 overflow-hidden bg-brand-rose/20">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover" 
                          />
                          <span className="absolute top-2 right-2 bg-brand-dark text-brand-creamy text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            {item.category}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-1">
                          <h4 className="font-bold text-brand-dark text-xs truncate">{item.title}</h4>
                          {item.description && (
                            <p className="text-[11px] text-brand-dark/80 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 pt-0 flex justify-between items-center border-t border-brand-rose/20 mt-2">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {item.createdAt && typeof item.createdAt.toDate === 'function' 
                            ? item.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Baru saja'}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteGalleryItem(item.id)}
                          className="px-3 py-1 bg-brand-ruby hover:bg-brand-ruby/90 text-white rounded-xl text-[10px] font-bold transition-colors shadow-xs"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* CUSTOM INTERACTIVE MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-brand-rose shadow-2xl text-center space-y-4">
            
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-inner bg-brand-creamy/50">
              {modal.variant === 'danger' && '⚠️'}
              {modal.variant === 'success' && '🎉'}
              {modal.variant === 'warning' && '💡'}
              {modal.variant === 'info' && 'ℹ️'}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-brand-dark">{modal.title}</h3>
              <p className="text-xs text-brand-dark/80 leading-relaxed">{modal.message}</p>
            </div>

            <div className="flex gap-2 pt-2">
              {modal.type === 'confirm' && (
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold text-xs rounded-xl transition-colors"
                >
                  {modal.cancelText}
                </button>
              )}
              
              <button
                onClick={async () => {
                  const callback = modal.onConfirm;
                  closeModal();
                  if (callback) {
                    await callback();
                  }
                }}
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-sm transition-all ${
                  modal.variant === 'danger' ? 'bg-brand-ruby hover:bg-brand-ruby/90' :
                  modal.variant === 'success' ? 'bg-emerald-700 hover:bg-emerald-800' :
                  'bg-brand-dark hover:bg-brand-dark/90'
                }`}
              >
                {modal.confirmText}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}