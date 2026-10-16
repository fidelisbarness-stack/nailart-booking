import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function UlasanGaleri({ selectedCategory, setSelectedCategory }) {
  // STATE GALERI (Hanya untuk Read/View)
  const [galleryItems, setGalleryItems] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // MENGGUNAKAN PROPS DARI APP.JSX SANGAT INTEGRATED WITH DASHBOARD
  const activeFilter = selectedCategory || 'Semua';
  const handleFilterChange = (category) => {
    if (setSelectedCategory) {
      setSelectedCategory(category);
    }
  };

  const CATEGORIES = ['Semua', 'Nailart Tangan', 'Nailart Kaki', 'Remove'];

  // AMBIL DATA GALERI REAL-TIME DARI FIRESTORE
  useEffect(() => {
    const qGallery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qGallery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      setGalleryItems(data);
      setLoadingGallery(false);
    }, (error) => {
      console.error('Error fetching gallery:', error);
      setLoadingGallery(false);
    });

    return () => unsubscribe();
  }, []);

  // FILTERING ITEM GALERI
  const filteredItems = galleryItems.filter((item) => {
    if (activeFilter === 'Semua') return true;
    return item.category === activeFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTER BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-brand-rose shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">Galeri & Katalog Hasil Karya</h2>
          <p className="text-xs text-brand-dark/70">Jelajahi portofolio hasil pengerjaan nailart tangan, kaki, dan remove.</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === cat
                  ? 'bg-brand-dark text-brand-creamy shadow-sm'
                  : 'bg-brand-creamy/30 text-brand-dark border border-brand-rose hover:bg-brand-rose/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID KATALOG GALERI (Tampilan User - Tanpa Tombol Hapus) */}
      <div className="bg-white p-6 rounded-3xl border border-brand-rose shadow-sm space-y-4">
        <h3 className="font-bold text-brand-dark text-sm border-b border-brand-rose/40 pb-2">
          ✨ Koleksi Galeri ({filteredItems.length})
        </h3>

        {loadingGallery ? (
          <p className="text-xs text-brand-dark/60 italic text-center py-8">Memuat galeri katalog...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-xs text-brand-dark/60 italic text-center py-8">Belum ada foto dalam kategori ini.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="border border-brand-rose/60 rounded-2xl overflow-hidden bg-brand-creamy/10 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
                <div>
                  <div className="relative h-48 overflow-hidden bg-brand-rose/20">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                    />
                    <span className="absolute top-2 right-2 bg-brand-dark text-brand-creamy text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-bold text-brand-dark text-sm">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-brand-dark/80 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">
                    {item.createdAt && typeof item.createdAt.toDate === 'function' 
                      ? item.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Baru saja'}
                  </span>
                  {/* Tombol Hapus Dihilangkan dari sini */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}