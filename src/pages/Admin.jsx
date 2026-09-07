import React, { useState, useMemo } from 'react';

const DEFAULT_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function Admin({ globalSlots, setGlobalSlots }) {
  const [activeAdminTab, setActiveAdminTab] = useState('schedules');

  // Generator 7 Hari Bergulir Otomatis
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

      list.push({ label, value: dateVal, rawDate: d });
    }
    return list;
  }, []);

  const [selectedAdminDate, setSelectedAdminDate] = useState(datesList[0].value);
  const [selectedSlotForReason, setSelectedSlotForReason] = useState(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // STATE ULASAN (CRUD)
  const [reviews, setReviews] = useState([
    {
      id: 1,
      clientName: 'Siti Rahma',
      treatment: 'Basic Manicure + Gel Polish',
      reviewText: 'Pengerjaannya rapi banget, kuku kelihatan makin cantik dan gampang dikonsultasikan!',
    },
    {
      id: 2,
      clientName: 'Clarissa',
      treatment: 'Custom Nail Art (3D Design)',
      reviewText: 'Sesuai persis sama gambar contoh yang aku kirim di WhatsApp. Recommended!',
    }
  ]);

  const [reviewForm, setReviewForm] = useState({
    id: null,
    clientName: '',
    treatment: 'Basic Manicure + Gel Polish',
    reviewText: '',
  });

  const [editingId, setEditingId] = useState(null);

  // Slot dinamis terikat pada tanggal terpilih
  const currentSlots = useMemo(() => {
    if (globalSlots && globalSlots[selectedAdminDate]) {
      return globalSlots[selectedAdminDate];
    }
    return DEFAULT_HOURS.map((time) => ({
      time,
      isBlocked: false,
      reason: '',
      slotsLeft: 2,
      status: 'available'
    }));
  }, [globalSlots, selectedAdminDate]);

  // Block slot spesifik
  const handleBlockSlotWithReason = (e) => {
    e.preventDefault();
    const updatedSlotsForDate = currentSlots.map((s) =>
      s.time === selectedSlotForReason
        ? { ...s, isBlocked: true, reason: blockReasonInput }
        : s
    );

    if (setGlobalSlots) {
      setGlobalSlots((prev = {}) => ({
        ...prev,
        [selectedAdminDate]: updatedSlotsForDate
      }));
    }

    setSelectedSlotForReason(null);
    setBlockReasonInput('');
  };

  // Unblock slot spesifik
  const handleUnblockSlot = (time) => {
    const updatedSlotsForDate = currentSlots.map((s) =>
      s.time === time
        ? { ...s, isBlocked: false, reason: '' }
        : s
    );

    if (setGlobalSlots) {
      setGlobalSlots((prev = {}) => ({
        ...prev,
        [selectedAdminDate]: updatedSlotsForDate
      }));
    }
  };

  // HANDLER ULASAN (TAMBAH / EDIT / HAPUS)
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewForm.clientName.trim() || !reviewForm.reviewText.trim()) {
      alert('Nama pelanggan dan ulasan tidak boleh kosong!');
      return;
    }

    if (editingId) {
      // Modus Update
      setReviews((prev) =>
        prev.map((item) => (item.id === editingId ? { ...reviewForm, id: editingId } : item))
      );
      setEditingId(null);
    } else {
      // Modus Tambah Baru
      const newReview = {
        ...reviewForm,
        id: Date.now(),
      };
      setReviews([newReview, ...reviews]);
    }

    setReviewForm({ id: null, clientName: '', treatment: 'Basic Manicure + Gel Polish', reviewText: '' });
  };

  const handleEditReview = (item) => {
    setEditingId(item.id);
    setReviewForm(item);
  };

  const handleDeleteReview = (id) => {
    if (window.confirm('Yakin ingin menghapus ulasan ini?')) {
      setReviews((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setReviewForm({ id: null, clientName: '', treatment: 'Basic Manicure + Gel Polish', reviewText: '' });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setReviewForm({ id: null, clientName: '', treatment: 'Basic Manicure + Gel Polish', reviewText: '' });
  };

  return (
    <div className="min-h-screen bg-brand-creamy/40 py-8 px-4 text-brand-dark">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-brand-rose pb-4">
          <button
            onClick={() => setActiveAdminTab('schedules')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'schedules' 
                ? 'bg-brand-dark text-brand-creamy shadow-sm' 
                : 'bg-white text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
            }`}
          >
            📅 Kelola Jam & Alasan
          </button>
          <button
            onClick={() => setActiveAdminTab('upload-review')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'upload-review' 
                ? 'bg-brand-dark text-brand-creamy shadow-sm' 
                : 'bg-white text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
            }`}
          >
            ✨ Kelola Ulasan & Foto
          </button>
          <button
            onClick={() => setActiveAdminTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'history' 
                ? 'bg-brand-dark text-brand-creamy shadow-sm' 
                : 'bg-white text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
            }`}
          >
            📋 History Pembayaran
          </button>
        </div>

        {/* TAB 1: Kelola Slot Jam */}
        {activeAdminTab === 'schedules' && (
          <div className="space-y-4">
            
            {/* Filter Tanggal */}
            <div className="bg-white p-4 rounded-2xl border border-brand-rose shadow-sm space-y-2">
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                Pilih Tanggal Operasional (7 Hari Bergulir):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {datesList.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedAdminDate(d.value)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      selectedAdminDate === d.value
                        ? 'bg-brand-dark text-brand-creamy border-brand-dark shadow-sm'
                        : 'bg-brand-creamy/20 text-brand-dark border-brand-rose hover:bg-brand-rose/30'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Jam Operasional */}
            <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-brand-rose/30 pb-3">
                <h3 className="font-bold text-brand-dark text-sm">
                  Kelola Slot Jam Tanggal: <span className="underline text-brand-ruby">{selectedAdminDate}</span>
                </h3>
                <span className="text-[11px] text-gray-500 font-semibold">Jam Operasional 08:00 - 21:00 WIB</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {currentSlots.map((slot) => (
                  <div 
                    key={slot.time} 
                    className={`border p-3 rounded-xl flex flex-col justify-between space-y-2 text-center transition-all ${
                      slot.isBlocked 
                        ? 'bg-brand-ruby/10 border-brand-ruby' 
                        : 'bg-white border-brand-rose'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-brand-dark">{slot.time}</p>
                      <p className="text-[10px] font-semibold mt-1">
                        {slot.isBlocked ? (
                          <span className="text-brand-ruby font-bold">🔒 {slot.reason || 'Terisi / Libur'}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">✅ Buka</span>
                        )}
                      </p>
                    </div>

                    {slot.isBlocked ? (
                      <button
                        onClick={() => handleUnblockSlot(slot.time)}
                        className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-sm"
                      >
                        Buka
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedSlotForReason(slot.time)}
                        className="w-full py-1.5 bg-brand-ruby hover:bg-brand-ruby/90 text-white rounded-lg text-[10px] font-bold shadow-sm"
                      >
                        Block
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Input Alasan Block */}
            {selectedSlotForReason && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <form onSubmit={handleBlockSlotWithReason} className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4 border border-brand-rose shadow-2xl">
                  <h4 className="font-bold text-sm text-brand-dark">
                    Alasan Block Jam {selectedSlotForReason} ({selectedAdminDate})
                  </h4>
                  <input
                    type="text" 
                    required 
                    placeholder="Contoh: Istirahat / Full Booked / Urgent" 
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    className="w-full p-3 border border-brand-rose rounded-xl text-xs focus:outline-none focus:border-brand-dark bg-brand-creamy/20 text-brand-dark"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button" 
                      onClick={() => setSelectedSlotForReason(null)}
                      className="flex-1 py-2.5 bg-brand-rose/40 text-brand-dark text-xs rounded-xl font-bold hover:bg-brand-rose"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-brand-ruby text-white text-xs rounded-xl font-bold hover:bg-brand-ruby/90 shadow-sm"
                    >
                      Simpan Block
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Kelola & Edit / Hapus Ulasan */}
        {activeAdminTab === 'upload-review' && (
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Form Upload / Edit Ulasan */}
            <form onSubmit={handleSubmitReview} className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4 h-fit">
              <div className="flex justify-between items-center border-b border-brand-rose/40 pb-2">
                <h3 className="font-bold text-brand-dark text-sm">
                  {editingId ? '✏️ Edit Ulasan Pelanggan' : '✨ Form Upload Hasil & Ulasan'}
                </h3>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="text-[10px] text-brand-ruby underline font-bold">
                    Batal Edit
                  </button>
                )}
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-brand-dark">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Client"
                    value={reviewForm.clientName}
                    onChange={(e) => setReviewForm({ ...reviewForm, clientName: e.target.value })}
                    className="w-full p-3 border border-brand-rose rounded-xl focus:outline-none focus:border-brand-dark bg-brand-creamy/20 text-brand-dark"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-brand-dark">Jenis Treatment</label>
                  <select
                    value={reviewForm.treatment}
                    onChange={(e) => setReviewForm({ ...reviewForm, treatment: e.target.value })}
                    className="w-full p-3 border border-brand-rose rounded-xl focus:outline-none focus:border-brand-dark bg-white text-brand-dark"
                  >
                    <option>Basic Manicure + Gel Polish</option>
                    <option>Custom Nail Art (Soft Design)</option>
                    <option>Custom Nail Art (3D Design)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-brand-dark">Upload Foto Hasil (Drag & Drop)</label>
                  <div className="border-2 border-dashed border-brand-rose bg-brand-rose/20 p-6 text-center rounded-xl hover:bg-brand-rose/40 transition-colors cursor-pointer flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">📸</span>
                    <p className="text-brand-dark font-bold">Tarik & lepas foto di sini</p>
                    <p className="text-brand-dark/70 text-[10px] mt-0.5">atau klik untuk memilih file (.jpg, .png)</p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-brand-dark">Testimoni / Ulasan & Deskripsi</label>
                  <textarea
                    required
                    placeholder="Tuliskan ulasan pelanggan di sini..."
                    value={reviewForm.reviewText}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                    className="w-full p-3 border border-brand-rose rounded-xl h-24 focus:outline-none focus:border-brand-dark bg-brand-creamy/20 text-brand-dark"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-dark hover:bg-brand-dark/90 text-brand-creamy font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  {editingId ? 'Simpan Perubahan Ulasan' : 'Publish ke Halaman Ulasan'}
                </button>
              </div>
            </form>

            {/* Daftar Ulasan Terbit (Dapat Di-edit / Di-hapus) */}
            <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
              <h3 className="font-bold text-brand-dark text-sm border-b border-brand-rose/40 pb-2">
                📋 Daftar Ulasan Diterbitkan ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p className="text-xs text-brand-dark/60 italic">Belum ada ulasan yang diupload.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 border border-brand-rose/50 rounded-xl bg-brand-creamy/10 flex justify-between items-start gap-3">
                      <div className="space-y-1 text-xs flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-brand-dark">{rev.clientName}</h4>
                          <span className="text-[9px] bg-brand-rose/40 font-bold px-2 py-0.5 rounded-md text-brand-dark">
                            {rev.treatment}
                          </span>
                        </div>
                        <p className="text-brand-dark/80 italic text-[11px]">"{rev.reviewText}"</p>
                      </div>

                      {/* Tombol Aksi Edit & Hapus */}
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEditReview(rev)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-2.5 py-1 bg-brand-ruby hover:bg-brand-ruby/90 text-white rounded-lg text-[10px] font-bold transition-colors"
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

        {/* TAB 3: History Pembayaran */}
        {activeAdminTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-3">
            <h3 className="font-bold text-brand-dark text-sm">Riwayat Transaksi (DP Rp 50.000 via QRIS Duitku)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-dark">
                <thead className="bg-brand-rose text-brand-dark font-bold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Nama & WA & IG</th>
                    <th className="p-3">Tanggal & Jam</th>
                    <th className="p-3">Layanan</th>
                    <th className="p-3 rounded-r-xl">Status DP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-rose/30">
                  <tr>
                    <td className="p-3 font-bold">
                      Amanda <br/>
                      <span className="text-[10px] text-brand-dark/70 font-normal">087827562925 | @amanda</span>
                    </td>
                    <td className="p-3 font-semibold">14:00 WIB</td>
                    <td className="p-3 font-semibold">Custom Soft Design</td>
                    <td className="p-3 text-emerald-700 font-extrabold">DP PAID (Rp 50.000 - DuitKu)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}