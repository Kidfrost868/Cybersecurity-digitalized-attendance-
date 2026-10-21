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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
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
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-[0.98]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          } ${className}`}
          title="Install RUN CyberPass onto your device"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      ) : (
        <button
          onClick={handleAction}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.98] ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Install RUN CyberPass App</span>
        </button>
      )}

      {/* Installation Guide Modal (for iOS or fallback desktop/android) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Install RUN CyberPass</h3>
                <p className="text-xs text-slate-500">Redeemer's University Cybersecurity Department</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Install RUN CyberPass directly to your mobile home screen for fast lecture attendance, single-device verification, and offline access.
            </p>

            {isIOS ? (
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                <div className="font-semibold text-blue-700 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>How to install on iPhone & iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>
                    Tap the <strong className="text-slate-900">Share</strong> button (box with upward arrow) in Safari.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>Scroll down and tap <strong className="text-slate-900">"Add to Home Screen"</strong></span>
                    <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline mt-0.5" />
                  </li>
                  <li>
                    Tap <strong className="text-slate-900">"Add"</strong> in the top right.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                <div className="font-semibold text-blue-700 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>How to install on Android (Chrome / Edge / Samsung Internet):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>
                    Tap the <strong className="text-slate-900">Three Dots menu (⋮)</strong> in your browser toolbar.
                  </li>
                  <li>
                    Tap <strong className="text-slate-900">"Install app"</strong> or <strong className="text-slate-900">"Add to Home screen"</strong>.
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
                    className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
                  >
                    Trigger Native Install Prompt
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs text-slate-700 transition-colors cursor-pointer"
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
