import { useState, useEffect } from 'react';
// Perbaikan 1: Gunakan path relative '../assets/'
import logoImg from '../assets/logoImg.jpeg'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const getJakartaDateString = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

// Sub-komponen Indikator Jam dan Status Studio
function StudioStatus({ isOpenStudio, currentTime }) {
  return (
    <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
      <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-1 ${
        isOpenStudio ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOpenStudio ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
        {isOpenStudio ? 'Studio Buka' : 'Studio Tutup'}
      </span>

      <span className="hidden min-[400px]:inline-block bg-[#FFF9F6] border border-[#F5C6CB] text-[#550B18] px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold">
        {currentTime || '00:00:00'} WIB
      </span>
    </div>
  );
}

export default function Navbar({ activePage, setActivePage, isAdmin, onOpenAdminModal }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState(() => getJakartaDateString(new Date()));
  const [currentMinuteOfDay, setCurrentMinuteOfDay] = useState(0);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const isWithinOperatingHours = currentMinuteOfDay >= 9 * 60 && currentMinuteOfDay < 21 * 60;
  const isOpenStudio = isScheduleOpen && isWithinOperatingHours;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const jakartaTimeParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(now);
      const timeParts = Object.fromEntries(jakartaTimeParts.map(({ type, value }) => [type, value]));
      setCurrentTime(`${timeParts.hour}:${timeParts.minute}:${timeParts.second}`);
      setCurrentMinuteOfDay(Number(timeParts.hour) * 60 + Number(timeParts.minute));
      setCurrentDate(getJakartaDateString(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'schedules', currentDate), (snapshot) => {
      if (!snapshot.exists()) {
        setIsScheduleOpen(true);
        return;
      }

      const slots = snapshot.data().slots;
      if (!Array.isArray(slots)) {
        console.error(`Invalid schedule slots for ${currentDate}`);
        return;
      }

      setIsScheduleOpen(slots.length === 0 || slots.some((slot) => !slot.isBlocked));
    }, (error) => {
      console.error('Error fetching studio schedule:', error);
    });

    return () => unsubscribe();
  }, [currentDate]);

  const navLinks = [
    { name: 'Beranda', id: 'dashboard' },
    { name: 'Booking Online', id: 'booking' },
    { name: 'Galeri & Katalog', id: 'reviews' },
    { name: 'Tentang Kami', id: 'about' },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F5C6CB] w-full shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        
        {/* LOGO & DESKRIPSI BRAND */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
          {/* Perbaikan 2: Disamakan menjadi src={logoImg} */}
          <img 
            src={logoImg} 
            alt="Vinail's Logo" 
            className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-[#F5C6CB] shadow-sm"
          />
          <span className="text-xl md:text-2xl font-black tracking-wider text-[#550B18]">
            VINAIL'S<span className="text-rose-400">.</span>
          </span>

          {/* Indikator Jam dan Status Studio */}
          <StudioStatus isOpenStudio={isOpenStudio} currentTime={currentTime} />
        </div>

        {/* DESKTOP MENU LINKS */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`text-xs font-extrabold transition-all hover:text-[#550B18] ${
                activePage === link.id
                  ? 'text-[#550B18] border-b-2 border-[#550B18] pb-1'
                  : 'text-gray-500'
              }`}
            >
              {link.name}
            </button>
          ))}
          
          {!isAdmin ? (
            <button
              onClick={onOpenAdminModal}
              className="text-[11px] font-bold text-gray-400 hover:text-[#550B18] transition-colors ml-2"
            >
              Login Admin
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('admin')}
              className={`text-xs font-black px-3 py-1 rounded-full ${
                activePage === 'admin' ? 'bg-[#550B18] text-white' : 'bg-[#FFF9F6] text-[#550B18] border border-[#F5C6CB]'
              }`}
            >
              Panel Admin
            </button>
          )}
        </nav>

        {/* HAMBURGER BUTTON (HP) */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#550B18] hover:bg-[#FFF9F6] focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#F5C6CB] px-4 pt-2 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
                activePage === link.id
                  ? 'bg-[#550B18] text-white'
                  : 'text-gray-700 hover:bg-[#FFF9F6]'
              }`}
            >
              {link.name}
            </button>
          ))}
          <div className="pt-2 border-t border-gray-100 flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-gray-400">09:00 - 21:00 WIB</span>
            {!isAdmin ? (
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenAdminModal(); }}
                className="text-[11px] font-bold text-[#550B18] underline"
              >
                Login Admin
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('admin')}
                className="text-[11px] font-bold text-[#550B18] underline"
              >
                Panel Admin
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}