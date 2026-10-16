import React, { useState, useEffect } from 'react';

export default function StudioStatus() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  // Studio buka jam 08:00 - 21:00
  const isOpen = hours >= 8 && hours < 21;

  const timeString = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-center gap-2">
      {/* Badge Status */}
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          isOpen
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : 'bg-rose-100 text-[#550B18] border border-[#F5C6CB]'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
          }`}
        ></span>
        {isOpen ? 'STUDIO BUKA' : 'STUDIO TUTUP'}
      </span>

      {/* Jam Digital */}
      <div className="bg-amber-50 text-[#550B18] border border-amber-200 px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1">
        <span>🕒</span>
        <span>{timeString} WIB</span>
      </div>
    </div>
  );
}