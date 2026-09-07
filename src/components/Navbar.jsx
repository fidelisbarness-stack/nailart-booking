import React from 'react';

export default function Navbar({ activePage, setActivePage, isAdmin, onOpenAdminModal }) {
  const navItems = [
    { id: 'dashboard', label: 'Beranda' },
    { id: 'booking', label: 'Booking Online' },
    { id: 'reviews', label: 'Galeri & Ulasan' },
    { id: 'about', label: 'Tentang Kami' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#F5C6CB] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          onClick={() => setActivePage('dashboard')}
          className="cursor-pointer flex items-center gap-2"
        >
          <span className="text-2xl font-black tracking-wider text-[#550B18]">NAIL ART<span className="text-rose-400">.</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`text-sm font-bold transition-colors ${
                activePage === item.id 
                  ? 'text-[#550B18] border-b-2 border-[#550B18] pb-1' 
                  : 'text-gray-600 hover:text-[#550B18]'
              }`}
            >
              {item.label}
            </button>
          ))}

          {isAdmin ? (
            <button
              onClick={() => setActivePage('admin')}
              className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${
                activePage === 'admin'
                  ? 'bg-[#550B18] text-white'
                  : 'bg-[#F5C6CB] text-[#550B18] hover:bg-[#550B18] hover:text-white'
              }`}
            >
              Dashboard Admin
            </button>
          ) : (
            <button
              onClick={onOpenAdminModal}
              className="text-xs text-gray-400 hover:text-[#550B18] underline ml-2"
            >
              Login Admin
            </button>
          )}
        </nav>

        {/* Mobile Navigation Dropdown/Buttons */}
        <div className="flex md:hidden gap-2">
          <button 
            onClick={() => setActivePage('booking')}
            className="bg-[#550B18] text-white text-xs px-3 py-1.5 rounded-xl font-bold"
          >
            Booking
          </button>
        </div>
      </div>
    </header>
  );
}