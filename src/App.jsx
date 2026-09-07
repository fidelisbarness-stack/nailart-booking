import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import UlasanGaleri from './pages/Ulasan';
import AboutUs from './pages/AboutUs';
import Admin from './pages/Admin';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Data Booking (Global State)
  const [bookings, setBookings] = useState([
    {
      id: 'BOOK-101',
      customerName: 'Siti Rahma',
      customerWa: '081234567890',
      serviceName: 'Gel Polish Single Color',
      servicePrice: 120000,
      date: '2026-03-10',
      time: '11:00',
      status: 'Confirmed',
      paymentMethod: 'Duitku QRIS'
    },
    {
      id: 'BOOK-102',
      customerName: 'Anisa Putri',
      customerWa: '089876543210',
      serviceName: 'Nail Art Custom Full Set',
      servicePrice: 250000,
      date: '2026-03-10',
      time: '14:00',
      status: 'Confirmed',
      paymentMethod: 'Transfer Bank'
    }
  ]);

  // Data Slot Jam Operasional (Global State)
  const [globalSlots, setGlobalSlots] = useState([
    { time: '08:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '09:00', slotsLeft: 0, status: 'full', isBlocked: false, reason: '' },
    { time: '10:00', slotsLeft: 0, status: 'full', isBlocked: false, reason: '' },
    { time: '11:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '12:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '13:00', slotsLeft: 0, status: 'full', isBlocked: false, reason: '' },
    { time: '14:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '15:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '16:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '17:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '18:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '19:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '20:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
    { time: '21:00', slotsLeft: 1, status: 'available', isBlocked: false, reason: '' },
  ]);

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setIsAdmin(true);
      setShowAdminModal(false);
      setPinError('');
      setActivePage('admin');
    } else {
      setPinError('PIN Admin Salah! (Petunjuk: 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F6] font-sans flex flex-col text-[#550B18]">
      {/* Banner Admin Active */}
      {isAdmin && (
        <div className="bg-[#550B18] text-[#FFF9F6] text-center text-xs py-2 px-4 font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <span>👑 MODE ADMIN / OWNER AKTIF</span>
          <span className="text-[#F5C6CB]">•</span>
          <button 
            onClick={() => setActivePage('admin')}
            className="bg-white text-[#550B18] hover:bg-gray-200 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold transition-colors"
          >
            Panel Admin
          </button>
          <button 
            onClick={() => { setIsAdmin(false); setActivePage('booking'); }}
            className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold transition-colors"
          >
            Keluar Mode
          </button>
        </div>
      )}

      {/* Navbar Component */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isAdmin={isAdmin}
        onOpenAdminModal={() => setShowAdminModal(true)}
      />

      {/* Routing Halaman */}
      <main className="flex-1">
        {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
        {activePage === 'booking' && (
          <Booking 
            bookings={bookings} 
            setBookings={setBookings} 
            globalSlots={globalSlots}
            setGlobalSlots={setGlobalSlots}
          />
        )}
        {activePage === 'reviews' && <UlasanGaleri isAdmin={isAdmin} />}
        {activePage === 'about' && <AboutUs />}
        {activePage === 'admin' && isAdmin && (
          <Admin 
            bookings={bookings}
            setBookings={setBookings}
            globalSlots={globalSlots} 
            setGlobalSlots={setGlobalSlots} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#550B18] text-[#FFF9F6] py-8 text-center text-sm mt-12">
        <p className="font-semibold">© 2026 Nail Art Studio. All Rights Reserved.</p>
        <p className="text-xs text-[#F5C6CB] mt-1">Presisi & Kecantikan di Setiap Sentuhan Jemari Anda.</p>
      </footer>

      {/* Modal Autentikasi Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#F5C6CB]">
            <h3 className="text-xl font-black text-[#550B18] mb-2">Masuk Mode Admin</h3>
            <p className="text-xs text-gray-600 mb-4">Masukkan 4 Digit PIN Keamanan Admin.</p>
            
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input 
                type="password" 
                maxLength="4"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="****"
                className="w-full text-center text-2xl tracking-widest py-3 border border-[#F5C6CB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#550B18]"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-600 text-center font-bold">{pinError}</p>}
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#550B18] text-white font-bold hover:bg-[#3d0711] transition-all text-sm"
                >
                  Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}