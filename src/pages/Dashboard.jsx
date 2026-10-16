import React from 'react';
import nailTanganImg from '../assets/NailTangan.jpeg';

export default function Dashboard({ setActivePage, setSelectedCategory }) {
  const handleCategoryClick = (categoryName) => {
    if (setSelectedCategory) {
      setSelectedCategory(categoryName);
    }
    if (setActivePage) {
      setActivePage('reviews'); // Pindah langsung ke tab Galeri & Katalog
    }
  };

  return (
    <div className="min-h-screen bg-brand-creamy/30 py-10 px-4 text-brand-dark">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HERO SECTION */}
        <div className="relative bg-brand-dark text-brand-creamy rounded-3xl p-8 sm:p-12 shadow-xl border border-brand-dark/20 overflow-hidden text-center space-y-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-ruby/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-rose/20 rounded-full blur-3xl pointer-events-none"></div>

          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-ruby/80 text-brand-rose text-[11px] font-bold tracking-wider uppercase border border-brand-rose/20">
            HOME BASE STUDIO
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-2xl mx-auto">
            Good Nail's 
            <span className="block text-brand-rose italic font-serif">Good Mood</span>
          </h1>
          
          <p className="text-brand-creamy/80 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Layanan Nail Art profesional dengan pilihan desain tak terbatas, bahan higienis, dan pengerjaan detail oleh spesialis berpengalaman.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setActivePage('booking')}
              className="px-8 py-3.5 bg-brand-rose hover:bg-brand-creamy text-brand-dark font-extrabold rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm inline-flex items-center gap-2"
            >
              Reservasi →
            </button>
          </div>
        </div>

        {/* ELEGANT CENTERED CARD (UKURAN SEDANG YANG PAS & PROPORSIONAL) */}
        <div className="flex justify-center">
          <button 
            onClick={() => handleCategoryClick('Nailart Tangan')}
            className="group text-left bg-white rounded-3xl border border-brand-rose/40 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none flex flex-col justify-between w-full max-w-md"
          >
            {/* Image Section */}
            <div className="relative h-60 w-full overflow-hidden bg-brand-rose/20">
              <img
                src={nailTanganImg}
                alt="Nailart Tangan"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Icon & Label */}
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brand-dark px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2">
                <span>💅</span>
                <span>Galeri & Katalog</span>
              </span>

              {/* Hover Text */}
              <span className="absolute bottom-4 right-4 text-white text-xs font-bold bg-brand-dark/80 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-md">
                Buka Katalog <span className="text-brand-rose">→</span>
              </span>
            </div>

            {/* Text Section */}
            <div className="p-6 space-y-2">
              <h3 className="font-bold text-brand-dark text-lg group-hover:text-brand-ruby transition-colors">
                Galeri & Katalog
              </h3>

            </div>
          </button>
        </div>

      </div>
    </div>
  );
}