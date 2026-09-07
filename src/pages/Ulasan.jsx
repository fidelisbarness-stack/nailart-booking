import React, { useState } from 'react';

export default function UlasanGaleri({ isAdmin = true }) {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Anisa Rahma',
      service: 'Custom Soft Gel Art',
      rating: 5,
      comment: 'Hasilnya rapi banget dan tahan lama! Pengerjaan teliti dan mbak nail artist-nya ramah banget.',
      date: '28 Agu 2026',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 2,
      name: 'Clarissa Putri',
      service: 'Cat-Eye Chrome Effect',
      rating: 5,
      comment: 'Suka banget sama efek cat-eye nya, persis sama foto referensi yang aku kasih dari Pinterest.',
      date: '15 Agu 2026',
      image: null
    }
  ]);

  // Form State untuk Tambah Baru
  const [newReview, setNewReview] = useState({ name: '', service: '', rating: 5, comment: '' });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // State untuk Edit Ulasan (Modal)
  const [editingReview, setEditingReview] = useState(null);
  const [editUploadedImage, setEditUploadedImage] = useState(null);

  // DRAG & DROP HANDLERS (TAMBAH BARU)
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], setUploadedImage);
    }
  };

  const handleFileSelect = (e, setImageState) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], setImageState);
    }
  };

  const processFile = (file, setImageState) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon unggah file berupa gambar!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setImageState(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 1. TAMBAH ULASAN BARU
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    const newEntry = {
      id: Date.now(),
      name: newReview.name,
      service: newReview.service || 'Custom Treatment',
      rating: Number(newReview.rating),
      comment: newReview.comment,
      date: 'Hari ini',
      image: uploadedImage
    };

    setReviews([newEntry, ...reviews]);
    setNewReview({ name: '', service: '', rating: 5, comment: '' });
    setUploadedImage(null);
  };

  // 2. HAPUS ULASAN
  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus ulasan ini?')) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (editingReview && editingReview.id === id) {
        setEditingReview(null);
      }
    }
  };

  // 3. MULAI EDIT ULASAN
  const handleStartEdit = (rev) => {
    setEditingReview({ ...rev });
    setEditUploadedImage(rev.image);
  };

  // 4. SIMPAN HASIL EDIT ULASAN
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingReview.name || !editingReview.comment) {
      alert('Nama dan ulasan tidak boleh kosong!');
      return;
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === editingReview.id
          ? {
              ...editingReview,
              rating: Number(editingReview.rating),
              image: editUploadedImage
            }
          : r
      )
    );

    setEditingReview(null);
    setEditUploadedImage(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F6] py-10 px-4 text-[#550B18]">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F5C6CB] text-[#550B18] text-[10px] font-extrabold uppercase tracking-wider">
            TESTIMONI & GALERI
          </span>
          <h1 className="text-3xl font-extrabold text-[#550B18]">Apa Kata Pelanggan Kami?</h1>
          <p className="text-xs text-[#550B18]/70">Lihat hasil karya dan ulasan jujur dari pelanggan studio kami.</p>
        </div>

        {/* LIST ULASAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-6 rounded-3xl border border-[#F5C6CB] shadow-sm space-y-3 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-[#550B18] text-sm">{rev.name}</h3>
                    <p className="text-[11px] text-[#8B0000] font-semibold">{rev.service}</p>
                  </div>
                  <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-xs">
                    ★ {rev.rating}.0
                  </span>
                </div>
                <p className="text-xs text-[#550B18]/80 italic">"{rev.comment}"</p>
                {rev.image && (
                  <img src={rev.image} alt="Ulasan" className="w-full h-44 object-cover rounded-2xl border border-[#F5C6CB]" />
                )}
              </div>

              <div className="pt-3 border-t border-[#F5C6CB]/40 flex justify-between items-center text-[11px] text-[#550B18]/50">
                <span>{rev.date}</span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(rev)}
                      className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FORM TAMBAH ULASAN */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F5C6CB] shadow-sm max-w-2xl mx-auto space-y-5">
          <h2 className="text-lg font-extrabold text-[#550B18] text-center">Tulis Ulasan & Kirim Foto</h2>

          <form onSubmit={handleAddReview} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#550B18] mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama kamu"
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F5C6CB]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#550B18] mb-1">Layanan</label>
                <input
                  type="text"
                  placeholder="Contoh: Custom Gel Art"
                  value={newReview.service}
                  onChange={(e) => setNewReview({ ...newReview, service: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F5C6CB]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#550B18] mb-1">Rating</label>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F5C6CB] bg-white font-medium"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (Sangat Puas)</option>
                <option value={4}>⭐⭐⭐⭐ (Puas)</option>
                <option value={3}>⭐⭐⭐ (Cukup)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#550B18] mb-1">Ulasan *</label>
              <textarea
                rows={3}
                required
                placeholder="Ceritakan pengalamanmu..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F5C6CB]"
              />
            </div>

            {/* DRAG & DROP ZONE AREA */}
            <div>
              <label className="block font-bold text-[#550B18] mb-1">Foto Hasil Nail Art (Opsional)</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                  isDragOver ? 'border-[#550B18] bg-[#F5C6CB]/30' : 'border-[#F5C6CB] bg-[#FFF9F6]'
                }`}
                onClick={() => document.getElementById('file-upload-input').click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, setUploadedImage)}
                  className="hidden"
                />

                {uploadedImage ? (
                  <div className="space-y-2">
                    <img src={uploadedImage} alt="Preview" className="w-32 h-32 object-cover rounded-xl mx-auto border border-[#F5C6CB]" />
                    <p className="text-[11px] text-[#550B18] font-bold">✓ Foto berhasil diunggah! Klik/Drop lagi untuk mengganti.</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-[#550B18]/70">
                    <p className="text-xl">📸</p>
                    <p className="font-bold text-xs">Tarik & Lepas Foto di Sini</p>
                    <p className="text-[10px] text-[#550B18]/50">atau klik untuk memilih gambar dari perangkat</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#550B18] hover:bg-[#3D0711] text-white font-extrabold rounded-2xl shadow-md text-xs"
            >
              Kirim Ulasan ✨
            </button>
          </form>
        </div>

      </div>

      {/* MODAL EDIT ULASAN (KHUSUS ADMIN) */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl border border-[#F5C6CB] shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#F5C6CB]/50 pb-3">
              <h3 className="font-extrabold text-sm text-[#550B18]">✏️ Edit Ulasan Pelanggan</h3>
              <button
                onClick={() => setEditingReview(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#550B18] mb-1">Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  value={editingReview.name}
                  onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#F5C6CB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#550B18] mb-1">Layanan</label>
                <input
                  type="text"
                  value={editingReview.service}
                  onChange={(e) => setEditingReview({ ...editingReview, service: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#F5C6CB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#550B18] mb-1">Rating</label>
                <select
                  value={editingReview.rating}
                  onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-[#F5C6CB] bg-white font-medium"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5.0)</option>
                  <option value={4}>⭐⭐⭐⭐ (4.0)</option>
                  <option value={3}>⭐⭐⭐ (3.0)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#550B18] mb-1">Ulasan / Komentar</label>
                <textarea
                  rows={3}
                  required
                  value={editingReview.comment}
                  onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#F5C6CB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#550B18] mb-1">Foto Ulasan</label>
                {editUploadedImage ? (
                  <div className="space-y-2 text-center">
                    <img src={editUploadedImage} alt="Preview Edit" className="w-28 h-28 object-cover rounded-xl mx-auto border border-[#F5C6CB]" />
                    <button
                      type="button"
                      onClick={() => setEditUploadedImage(null)}
                      className="text-[10px] text-red-600 font-bold underline"
                    >
                      Hapus Foto Ini
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, setEditUploadedImage)}
                    className="w-full text-xs"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#550B18] text-white font-bold rounded-xl hover:bg-[#3D0711]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}