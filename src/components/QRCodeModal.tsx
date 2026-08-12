import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, QrCode, Smartphone } from 'lucide-react';
import GlassCard from './GlassCard';

interface QRCodeModalProps {
  onClose: () => void;
}

export default function QRCodeModal({ onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const buzzerUrl = `${currentOrigin}${currentPath}?mode=buzzer`;

  // Fallback to QR server API for guaranteed crisp SVG rendering
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    buzzerUrl
  )}&color=FF6B1A&bg=120A05`;

  const copyUrl = () => {
    navigator.clipboard.writeText(buzzerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md"
        >
          <GlassCard arch glow="saffron" className="p-7 relative text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-cream/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs font-score uppercase tracking-widest text-marigold mb-3">
              <QrCode size={18} />
              Round 3 · Team Buzzer Connect
            </div>

            <h2 className="font-display text-2xl text-cream font-bold mb-2">Scan to Join Buzzer</h2>
            <p className="text-cream/60 text-xs mb-6">
              Scan this QR code with any smartphone camera or open the link below to turn your phone into a live buzzer!
            </p>

            {/* QR Code Container */}
            <div className="mx-auto w-64 h-64 bg-night/80 border-2 border-saffron-500/50 rounded-3xl p-3 shadow-glow flex flex-col items-center justify-center mb-6">
              <img
                src={qrApiUrl}
                alt="Scan to open team buzzer"
                className="w-full h-full object-contain rounded-2xl"
                onError={(e) => {
                  // Fallback rendering if API offline
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Steps Guide */}
            <div className="grid grid-cols-3 gap-2 mb-6 text-left">
              <div className="glass p-2.5 rounded-xl text-center">
                <span className="font-score text-saffron-400 font-bold text-xs block">STEP 1</span>
                <span className="text-[11px] text-cream/70 leading-tight">Scan QR code</span>
              </div>
              <div className="glass p-2.5 rounded-xl text-center">
                <span className="font-score text-saffron-400 font-bold text-xs block">STEP 2</span>
                <span className="text-[11px] text-cream/70 leading-tight">Select Team Name</span>
              </div>
              <div className="glass p-2.5 rounded-xl text-center">
                <span className="font-score text-saffron-400 font-bold text-xs block">STEP 3</span>
                <span className="text-[11px] text-cream/70 leading-tight">Hit BUZZER!</span>
              </div>
            </div>

            {/* Link & Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-2 pl-3">
                <span className="text-xs text-cream/60 truncate font-mono flex-1">{buzzerUrl}</span>
                <button
                  onClick={copyUrl}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <a
                href={buzzerUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2.5"
              >
                <Smartphone size={16} /> Open Buzzer in New Window <ExternalLink size={14} />
              </a>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
