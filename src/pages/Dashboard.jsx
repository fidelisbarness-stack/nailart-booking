import React from 'react';

export default function Dashboard({ setActivePage }) {
  const features = [
    {
      icon: '✨',
      title: 'UNGGULAN 1',
      desc: 'DESKRIPSI UNGGULAN 1'
    },
    {
      icon: '✨',
      title: 'UNGGULAN 2',
      desc: 'DESKRIPSI UNGGULAN 2'
    },
    {
      icon: '✨',
      title: 'UNGGULAN 3',
      desc: 'DESKRIPSI UNGGULAN 3'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-creamy/30 py-10 px-4 text-brand-dark">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HERO SECTION - DARK ELEGANT CARD */}
        <div className="relative bg-brand-dark text-brand-creamy rounded-3xl p-8 sm:p-12 shadow-xl border border-brand-dark/20 overflow-hidden text-center space-y-6">
          {/* Background Subtle Accent */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-ruby/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-rose/20 rounded-full blur-3xl pointer-events-none"></div>

          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-ruby/80 text-brand-rose text-[11px] font-bold tracking-wider uppercase border border-brand-rose/20">
            PREMIUM NAIL STUDIO
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-2xl mx-auto">
            Cantikkan Kuku Impianmu <span className="text-brand-rose italic font-serif">Hari Ini</span>
          </h1>

          <p className="text-brand-creamy/80 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Layanan Nail Art profesional dengan pilihan desain tak terbatas, bahan higienis, dan pengerjaan detail oleh spesialis berpengalaman.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setActivePage('booking')}
              className="px-8 py-3.5 bg-brand-rose hover:bg-brand-creamy text-brand-dark font-extrabold rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm inline-flex items-center gap-2"
            >
              Pesan Slot Sekarang →
            </button>
          </div>
        </div>

        {/* UNGGULAN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm hover:shadow-md transition-shadow space-y-3 text-center"
            >
              <div className="w-12 h-12 bg-brand-rose/40 text-brand-dark rounded-2xl flex items-center justify-center mx-auto text-xl shadow-inner">
                {item.icon}
              </div>
              <h3 className="font-extrabold text-brand-dark text-sm">{item.title}</h3>
              <p className="text-brand-dark/70 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}