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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      content: (
        <div className="space-y-3.5 text-xs text-slate-600">
          <p className="leading-relaxed">
            <strong className="text-slate-900">RUN CyberPass</strong> is the official lecture attendance platform engineered exclusively for <span className="text-blue-600 font-semibold">Cybersecurity students</span> at Redeemer's University (RUN), Ede.
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Anti-Proxy Security Architecture</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Traditional paper sign-in sheets and shared static codes are susceptible to proxy signing. RUN CyberPass combines rotating projector PINs and single-device hardware binding to guarantee authentic student presence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-mono">FACULTY</span>
              <span className="text-slate-900 font-semibold">Computing & Digital Tech</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-mono">CAMPUS</span>
              <span className="text-slate-900 font-semibold">Ede Main Campus</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Anti-Proxy Device Lock',
      subtitle: 'Single Device per Student Policy',
      icon: Lock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      content: (
        <div className="space-y-3.5 text-xs text-slate-600">
          <p className="leading-relaxed">
            Each student must check in using their own personal smartphone. Anti-proxy hardware locking prevents signing in for multiple coursemates.
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Device Binding</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              When you record attendance with your JAMB registration number, your device fingerprint is locked to your identity for that lecture session.
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-amber-800 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      content: (
        <div className="space-y-3.5 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>1-Minute Rotating Passcodes</span>
            </div>
            <p className="text-[11px] text-slate-600">
              The 4-digit PIN displayed on the lecture hall screen rotates every 60 seconds. Coursemates cannot forward codes across messaging apps because they expire rapidly.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Grace Period Protection</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      content: (
        <div className="space-y-3.5 text-xs text-slate-600">
          <p className="leading-relaxed">
            RUN CyberPass is a Progressive Web App. You do not need to download an APK — simply add it to your home screen!
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>PWA Mobile Advantages:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      content: (
        <div className="space-y-3.5 text-xs text-slate-600">
          <p className="leading-relaxed">
            All student rosters, active lecture sessions, verified attendance records, and in-hall passes are stored centrally in <strong className="text-slate-900">Google Cloud Firestore</strong>.
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Multi-Device Synchronization:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${current.bgColor} ${current.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">{current.title}</h2>
              <p className="text-xs text-slate-500 truncate">{current.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-5 gap-1.5 p-2.5 bg-slate-50 border-b border-slate-200">
          {steps.map((st, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === activeStep
                  ? 'bg-blue-600'
                  : i < activeStep
                  ? 'bg-blue-300'
                  : 'bg-slate-200'
              }`}
              title={st.title}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {current.content}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Step {activeStep + 1} of {steps.length}
          </div>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Back
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
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
