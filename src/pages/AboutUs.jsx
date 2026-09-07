import React, { useState } from 'react';

export default function AboutUs() {
  const WA_NUMBER = '6287827562925';

  // State template pesan aktif
  const [selectedTemplate, setSelectedTemplate] = useState('general');

  const templates = {
    general: "Halo Kak! Sapaan hangat dari saya. Mau bertanya dong mengenai studio dan layanan Nail Art di Vinail's, mohon bantuannya ya kak! ✨",
    pricelist: "Halo Kak! Boleh minta informasi pricelist lengkap untuk perawatan kuku dan custom nail art di Vinail's? Terima kasih!",
    consult: "Halo Kak! Saya mau konsultasi desain Nail Art custom nih, mohon bantuannya ya kak! 💅"
  };

  const getWaUrl = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  return (
    <div className="min-h-screen bg-brand-creamy/30 py-10 px-4 text-brand-dark">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* TENTANG KAMI */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-brand-rose shadow-sm text-center max-w-3xl mx-auto space-y-5">
          <span className="inline-block px-3.5 py-1 rounded-full bg-brand-rose text-brand-dark text-[10px] font-extrabold tracking-wider uppercase">
            TENTANG KAMI
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">NailArt Studio</h2>

          <p className="text-brand-dark/80 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            Kami menghadirkan layanan perawatan kuku dan <span className="font-bold text-brand-ruby">custom nail art premium</span> dengan standar higienis tinggi. Didukung oleh <i>nail artist</i> berpengalaman untuk memberikan keindahan maksimal pada kukumu.
          </p>

          {/* TEMPLATE CHAT SELECTION */}
          <div className="pt-2 space-y-3">
            <p className="text-[11px] font-bold text-brand-dark/70 uppercase tracking-wider">
              Pilih Topik Chat WhatsApp:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <button
                onClick={() => setSelectedTemplate('general')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  selectedTemplate === 'general'
                    ? 'bg-brand-dark text-brand-creamy shadow-sm'
                    : 'bg-brand-creamy/40 text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
                }`}
              >
                👋 Pertanyaan Umum / Sapaan
              </button>
              <button
                onClick={() => setSelectedTemplate('pricelist')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  selectedTemplate === 'pricelist'
                    ? 'bg-brand-dark text-brand-creamy shadow-sm'
                    : 'bg-brand-creamy/40 text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
                }`}
              >
                💎 Tanya Pricelist
              </button>
              <button
                onClick={() => setSelectedTemplate('consult')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  selectedTemplate === 'consult'
                    ? 'bg-brand-dark text-brand-creamy shadow-sm'
                    : 'bg-brand-creamy/40 text-brand-dark border border-brand-rose hover:bg-brand-rose/40'
                }`}
              >
                💅 Konsul Desain
              </button>
            </div>
          </div>

          {/* SOCIAL BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={getWaUrl(templates[selectedTemplate])}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5"
            >
              <span>💬</span> Chat WhatsApp Admin
            </a>
            <a
              href="https://www.instagram.com/nailartsolobaru/"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-brand-dark hover:bg-brand-dark/90 text-brand-creamy rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5"
            >
              <span>📸</span> Follow Instagram
            </a>
          </div>
        </div>

        {/* JAM OPERASIONAL & LOKASI STUDIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* Jam Operasional */}
          <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-rose pb-3">
              <span className="text-lg">⏰</span>
              <h3 className="font-extrabold text-brand-dark text-sm">Jam Operasional</h3>
            </div>

            <div className="space-y-3 text-xs text-brand-dark">
              <div className="flex justify-between items-center py-1 border-b border-brand-rose/20">
                <span className="font-medium text-brand-dark/70">Senin – Jumat</span>
                <span className="font-bold text-brand-dark">10:00 – 20:00 WIB</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-brand-rose/20">
                <span className="font-medium text-brand-dark/70">Sabtu – Minggu</span>
                <span className="font-bold text-brand-dark">09:00 – 21:00 WIB</span>
              </div>
              <div className="flex justify-between items-center py-1 text-brand-ruby font-bold">
                <span>Hari Libur Nasional</span>
                <span>Sesuai Pengumuman</span>
              </div>
            </div>
          </div>

          {/* Lokasi Studio */}
          <div className="bg-white p-6 rounded-2xl border border-brand-rose shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-rose pb-3">
              <span className="text-lg">📍</span>
              <h3 className="font-extrabold text-brand-dark text-sm">Lokasi Studio</h3>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-brand-dark">VINAIL'S NAILART SOLO BARU</p>
              <div className="w-full h-40 rounded-xl overflow-hidden border border-brand-rose/60">
                <iframe
                  title="Studio Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3954.75033744199!2d110.8094965!3d-7.6021262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a17005d27b6ab%3A0x32debbc0fb200c3d!2sVINAIL'S%20NAILART%20SOLO%20BARU!5e0!3m2!1sid!2sid!4v1788272292384!5m2!1sid!2sid"
                  className="w-full h-full border-0"
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}