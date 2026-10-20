import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  Smartphone,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  Cloud,
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
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">
            <strong className="text-white">RUN CyberPass</strong> is the official lecture attendance platform engineered exclusively for <span className="text-emerald-400 font-semibold">Cybersecurity students</span> at Redeemer's University (RUN), Ede.
          </p>
          <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Anti-Proxy Security Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Traditional paper sign-in sheets and shared static codes are susceptible to proxy signing. RUN CyberPass combines rotating projector PINs and single-device hardware binding to guarantee authentic student presence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-white/[0.06]">
              <span className="text-slate-500 block font-mono">FACULTY</span>
              <span className="text-white font-semibold">Computing & Digital Tech</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-white/[0.06]">
              <span className="text-slate-500 block font-mono">CAMPUS</span>
              <span className="text-white font-semibold">Ede Main Campus</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Anti-Proxy Device Lock',
      subtitle: 'Single Device per Student Policy',
      icon: Lock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">
            Each student must check in using their own personal smartphone. Anti-proxy hardware locking prevents signing in for multiple coursemates.
          </p>
          <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Device Binding</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When you record attendance with your JAMB registration number, your device fingerprint is locked to your identity for that lecture session.
            </p>
          </div>
          <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 flex items-start gap-2.5 text-amber-200 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Zero Proxy Tolerance:</strong> Attempting to sign in for a coursemate using the same phone is automatically detected and blocked by the security shield.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Rolling PINs & Passcode Security',
      subtitle: '60-Second Rotation Window',
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>1-Minute Rotating Passcodes</span>
            </div>
            <p className="text-[11px] text-slate-400">
              The 4-digit PIN displayed on the lecture hall screen rotates every 60 seconds. Coursemates cannot forward codes across messaging apps because they expire rapidly.
            </p>
          </div>
          <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Grace Period Protection</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To prevent issues if a passcode rotates right as you tap submit, the system accepts the immediately preceding passcode for a short grace window.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Install as a PWA Mobile App',
      subtitle: 'Instant Access on Android & iPhone',
      icon: Smartphone,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">
            RUN CyberPass is a Progressive Web App. You do not need to download an APK — simply add it to your home screen!
          </p>
          <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PWA Mobile Advantages:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Full-screen native view without browser search bars</li>
              <li>Instant 1-tap launch from your phone home screen</li>
              <li>Reliable lecture hall check-ins and pass verification</li>
              <li>Offline state indicators and ledger cache</li>
            </ul>
          </div>
          <div className="pt-1">
            <PWAInstallButton variant="banner" className="w-full" />
          </div>
        </div>
      ),
    },
    {
      title: 'Centralized Cloud Database',
      subtitle: 'Multi-Device Real-Time Sync with Firebase Firestore',
      icon: Cloud,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      content: (
        <div className="space-y-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">
            All student rosters, active lecture sessions, verified attendance records, and in-hall passes are stored centrally in <strong className="text-white">Google Cloud Firestore</strong>.
          </p>
          <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Multi-Device Synchronization:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li><strong>Cross-Device:</strong> When a Course Rep starts a lecture, all devices update instantly in real time.</li>
              <li><strong>Offline Persistence:</strong> If lecture theatre internet connectivity fluctuates, check-ins are cached locally and automatically sync.</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[activeStep];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#111827] border border-white/[0.1] shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0E1420] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${current.bgColor} ${current.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight truncate">{current.title}</h2>
              <p className="text-xs text-slate-400 truncate">{current.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-5 gap-1.5 p-2.5 bg-[#0B0F17] border-b border-white/[0.06]">
          {steps.map((st, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === activeStep
                  ? 'bg-emerald-400'
                  : i < activeStep
                  ? 'bg-emerald-600/50'
                  : 'bg-white/10'
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
        <div className="p-4 border-t border-white/[0.08] bg-[#0E1420] flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Step {activeStep + 1} of {steps.length}
          </div>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-3.5 py-2 bg-[#0B0F17] hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Back
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev + 1)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
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
