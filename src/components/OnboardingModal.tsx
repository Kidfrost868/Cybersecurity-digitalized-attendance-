import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Smartphone,
  X,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCheckIn?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateToCheckIn,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem('run_cyberpass_onboarding_seen', 'true');
    } catch {
      // ignore
    }
    onClose();
    if (onNavigateToCheckIn) onNavigateToCheckIn();
  };

  const steps = [
    {
      title: 'Welcome to RUN CyberPass',
      subtitle: "Redeemer's University · Department of Cybersecurity",
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">
            <strong className="text-white">RUN CyberPass</strong> is the official lecture attendance verification platform engineered exclusively for <span className="text-emerald-400 font-semibold">Cybersecurity students</span> at Redeemer's University (RUN), Ede.
          </p>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Anti-Proxy Security Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Traditional paper sign-in sheets and shared codes are susceptible to proxy signing. RUN CyberPass combines 60-meter dynamic GPS verification, rotating projector PINs, and single-device hardware binding to guarantee authentic attendance records.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-mono">FACULTY</span>
              <span className="text-white font-semibold">Computing & Digital Technology</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-mono">CAMPUS</span>
              <span className="text-white font-semibold">Ede Main Campus, Osun</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Dynamic GPS Geofencing (60m)',
      subtitle: 'Physical Presence Enforcement',
      icon: MapPin,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">
            When the Course Rep initiates a lecture session, their device coordinates define the lecture hall center.
          </p>
          <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Mandatory Browser Location</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When you submit attendance, your browser calculates your exact distance from the hall using the mathematical Haversine formula.
            </p>
          </div>
          <div className="p-3 bg-red-950/30 rounded-xl border border-red-500/30 flex items-start gap-2.5 text-red-200 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>
              <strong>Strict 60-Meter Threshold:</strong> Submissions from dormitories, cafes, or off-campus locations (&gt; 60m) are automatically rejected and logged into the security audit ledger.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Rolling PINs & Device Locking',
      subtitle: 'Zero-Proxy Anti-Tamper Safeguards',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>1-Minute Rotating Passcodes</span>
            </div>
            <p className="text-[11px] text-slate-400">
              The 4-digit PIN displayed on the lecture hall screen rotates every 60 seconds. Coursemates cannot forward codes across WhatsApp or Telegram because they expire almost immediately.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Single-Device Cryptographic Locking</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Each student must use their own smartphone. Once your phone verifies your JAMB number, it is cryptographically locked for that lecture session. Attempting to sign in for a friend using the same device triggers an immediate security alert.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Install as a PWA Mobile App',
      subtitle: 'Instant Access on Android & iPhone',
      icon: Smartphone,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10 border-violet-500/30',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">
            RUN CyberPass is a progressive web app. You do not need to download a heavy file from app stores — simply add it to your home screen!
          </p>
          <div className="p-3 bg-violet-950/30 rounded-xl border border-violet-500/30 space-y-2">
            <div className="flex items-center gap-2 text-violet-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
              <span>Benefits of the PWA Version:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
              <li>Full-screen native experience without browser search bars</li>
              <li>Instant 1-tap launch from your phone home screen</li>
              <li>Faster GPS sensor polling for reliable hall check-ins</li>
              <li>Offline session status indicator and ledger cache</li>
            </ul>
          </div>
          <div className="pt-1">
            <PWAInstallButton variant="banner" className="w-full" />
          </div>
        </div>
      ),
    },
  ];

  const current = steps[activeStep];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${current.bgColor} ${current.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{current.title}</h2>
              <p className="text-xs text-slate-400">{current.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/90 border-b border-slate-800/80">
          {steps.map((st, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === activeStep
                  ? 'bg-emerald-400'
                  : i < activeStep
                  ? 'bg-emerald-600/60'
                  : 'bg-slate-800'
              }`}
              title={st.title}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {current.content}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-mono">
            Step {activeStep + 1} of {steps.length}
          </div>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Back
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev + 1)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
