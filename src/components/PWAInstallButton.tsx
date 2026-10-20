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

  if (isInstalled) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isInstallable
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-[0.98]'
              : 'bg-[#111827] hover:bg-slate-800 text-slate-300 border border-white/10'
          } ${className}`}
          title="Install RUN CyberPass onto your device"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      ) : (
        <button
          onClick={handleAction}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-[0.98] ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Install RUN CyberPass App</span>
        </button>
      )}

      {/* Installation Guide Modal (for iOS or fallback desktop/android) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/[0.1] p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install RUN CyberPass</h3>
                <p className="text-xs text-slate-400">Redeemer's University Cybersecurity Department</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Install RUN CyberPass directly to your mobile home screen for fast lecture attendance, single-device verification, and offline access.
            </p>

            {isIOS ? (
              <div className="space-y-3 bg-[#0B0F17] border border-white/[0.06] rounded-xl p-4 text-xs">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>How to install on iPhone & iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    Tap the <strong className="text-white">Share</strong> button (box with upward arrow) in Safari.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline mt-0.5" />
                  </li>
                  <li>
                    Tap <strong className="text-white">"Add"</strong> in the top right.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-[#0B0F17] border border-white/[0.06] rounded-xl p-4 text-xs">
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
                    Confirm the prompt. RUN CyberPass will install like a native app!
                  </li>
                </ol>
                {isInstallable && (
                  <button
                    onClick={async () => {
                      await install();
                      setShowModal(false);
                    }}
                    className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                  >
                    Trigger Native Install Prompt
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-slate-800 border border-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
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
