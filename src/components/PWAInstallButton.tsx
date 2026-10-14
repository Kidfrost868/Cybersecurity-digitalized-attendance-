import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'modal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If running in standalone mode (already installed), hide or show installed badge
  if (isInstalled) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>App Installed on Device</span>
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'nav' ? (
        <button
          onClick={handleAction}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isInstallable
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-500/50'
          } ${className}`}
          title="Install RUN CyberPass onto your Android or iPhone device"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      ) : (
        <button
          onClick={handleAction}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Download / Install RUN CyberPass PWA</span>
        </button>
      )}

      {/* Installation Guide Modal (for iOS or fallback desktop/android) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install RUN CyberPass</h3>
                <p className="text-xs text-slate-400">Redeemer's University Cybersecurity Department</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Install RUN CyberPass directly to your mobile home screen for lightning-fast lecture attendance, automatic GPS geofencing, and offline access.
            </p>

            {isIOS ? (
              <div className="space-y-3 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>How to install on iPhone & iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    Tap the <strong className="text-white">Share</strong> button (box with upward arrow) at the bottom or top of Safari.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline mt-0.5" />
                  </li>
                  <li>
                    Tap <strong className="text-white">"Add"</strong> in the top right. RUN CyberPass icon will appear on your home screen!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span>How to install on Android (Chrome / Edge / Samsung Internet):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    Tap the <strong className="text-white">Three Dots menu (⋮)</strong> in your browser toolbar.
                  </li>
                  <li>
                    Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Confirm the prompt. RUN CyberPass will install like a native app on your phone!
                  </li>
                </ol>
                {isInstallable && (
                  <button
                    onClick={async () => {
                      await install();
                      setShowModal(false);
                    }}
                    className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition"
                  >
                    Click Here to Trigger Native Android Install
                  </button>
                )}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
