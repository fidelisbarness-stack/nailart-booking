import React from 'react';
import nailTanganImg from '../assets/NailTangan.jpeg';
import nailKakiImg from '../assets/NailKaki.jpeg';
import removeImg from '../assets/remove.jpeg';

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

        {/* CARD LAYANAN */}
        <section className="space-y-5">
          <div className="text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-ruby uppercase">
              Layanan Pilihan
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-dark">
              Pilih Layanan Nail Art
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                name: 'Nail Art Tangan',
                category: 'Nailart Tangan',
                image: nailTanganImg,
              },
              {
                name: 'Nail Art Kaki',
                category: 'Nailart Kaki',
                image: nailKakiImg,
              },
              {
                name: 'Removing',
                category: 'Remove',
                image: removeImg,
              },
            ].map((service) => (
              <button
                key={service.category}
                type="button"
                onClick={() => handleCategoryClick(service.category)}
                className="group text-left bg-white rounded-3xl border border-brand-rose/40 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none"
              >
                <div className="relative h-56 w-full overflow-hidden bg-brand-rose/20">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute bottom-4 right-4 text-white text-xs font-bold bg-brand-dark/80 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    Lihat Galeri →
                  </span>
                </div>

                <div className="p-5 flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ruby">
                      Layanan
                    </span>
                    <h3 className="mt-1 font-bold text-brand-dark text-base group-hover:text-brand-ruby transition-colors">
                      {service.name}
                    </h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-brand-dark/60">Mulai dari</p>
                    <p className="font-extrabold text-brand-ruby">Rp 50.000</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}