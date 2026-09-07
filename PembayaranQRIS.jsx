import React, { useState } from 'react';

export default function PembayaranQRIS({ amount = 50000, customerName = 'Pelanggan' }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Panggil API Backend Vercel yang dibuat di Langkah 1
      const response = await fetch('/api/create-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          name: customerName,
          email: 'pelanggan@gmail.com',
          orderId: `BOOKING-${Date.now()}`
        })
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Arahkan pelanggan ke halaman pembayaran QRIS DuitKu
        window.location.href = data.paymentUrl;
      } else {
        alert('Gagal memuat QRIS: ' + (data.message || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('Gagal memproses pembayaran:', error);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-[#F5C6CB] text-center space-y-3">
      <h3 className="font-bold text-[#550B18]">Pembayaran Instan via QRIS</h3>
      <p className="text-xs text-gray-600">Total Tagihan: <span className="font-extrabold text-[#8B0000]">Rp {amount.toLocaleString('id-ID')}</span></p>
      
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-3 bg-[#550B18] hover:bg-[#3D0711] text-white font-extrabold rounded-xl text-xs transition-all disabled:opacity-50"
      >
        {loading ? 'Menyiapkan QRIS...' : '📱 Bayar Sekarang via QRIS'}
      </button>
      
      <p className="text-[10px] text-gray-400">Bisa di-scan via GoPay, OVO, Dana, ShopeePay, BCA, dll.</p>
    </div>
  );
}