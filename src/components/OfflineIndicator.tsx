import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-[#111827] border border-amber-500/40 px-4 py-2.5 text-xs text-amber-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200 max-w-[calc(100vw-2rem)]">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="truncate">Offline Mode — Check-ins will synchronize when reconnected.</span>
    </div>
  );
};
