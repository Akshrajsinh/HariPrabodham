import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, Smartphone, Wifi, RefreshCw } from 'lucide-react';
import { generateQRCodeSVG } from '../utils/qrcode';
import { buzzerChannel } from '../utils/buzzerChannel';

interface QRCodeModalProps {
  onClose: () => void;
}

export default function QRCodeModal({ onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [roomId, setRoomId] = useState<string>(() => buzzerChannel.getRoom());
  const [qrEngine, setQrEngine] = useState<'local' | 'api1' | 'api2'>('local');

  const handleGenerateNewCode = () => {
    const newCode = buzzerChannel.createNewRoomCode();
    setRoomId(newCode);
  };

  // Compute canonical URL that works everywhere (GitHub Pages, Vercel, Netlify, subpaths)
  const buzzerUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    let path = window.location.pathname.replace(/\/index\.html$/i, '');
    if (!path.endsWith('/')) path += '/';
    return `${origin}${path}?mode=buzzer&room=${encodeURIComponent(roomId)}`;
  }, [roomId]);

  // 1. High-Performance Standard Local SVG QR Code
  const qrSvgDataUri = useMemo(() => {
    if (!buzzerUrl) return '';
    const svg = generateQRCodeSVG(buzzerUrl, 280, '#000000', '#FFFFFF');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [buzzerUrl]);

  // 2. Fallback APIs
  const qrApi1Url = `https://quickchart.io/qr?text=${encodeURIComponent(buzzerUrl)}&size=280&margin=1`;
  const qrApi2Url = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(buzzerUrl)}&color=000000&bg=FFFFFF`;

  const currentQrSrc =
    qrEngine === 'local'
      ? qrSvgDataUri
      : qrEngine === 'api1'
      ? qrApi1Url
      : qrApi2Url;

  const copyUrl = () => {
    navigator.clipboard.writeText(buzzerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format 6 digit room code with space in middle: e.g. 482 910
  const formattedCode = roomId.length === 6 ? `${roomId.slice(0, 3)} ${roomId.slice(3)}` : roomId;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-neutral-950 border border-saffron-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(255,107,26,0.3)] relative text-center text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            ⚡ Join Live Buzzer Room
          </h2>
          <p className="text-neutral-400 text-xs mb-4">
            Players can scan the QR code or type the 6-digit code at join page
          </p>

          {/* Prominent 6-Digit Room Code Card */}
          <div className="bg-gradient-to-r from-saffron-950/90 via-neutral-900 to-saffron-950/90 border-2 border-saffron-500/60 rounded-2xl p-4 mb-4 shadow-lg flex flex-col items-center justify-center gap-1.5 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-score uppercase text-saffron-300 font-extrabold tracking-widest">
              <Wifi size={14} className="text-emerald-400 animate-pulse" />
              6-DIGIT ROOM CODE
            </div>

            {/* Giant Digit Boxes */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-1">
              {roomId.split('').map((digit, idx) => (
                <div
                  key={idx}
                  className="w-10 h-12 sm:w-11 sm:h-13 bg-black/80 border-2 border-saffron-400/80 rounded-xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-saffron-400 shadow-md"
                >
                  {digit}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={copyCode}
                className="text-xs bg-saffron-500/20 hover:bg-saffron-500/30 text-saffron-300 px-3 py-1 rounded-lg font-mono flex items-center gap-1 border border-saffron-500/30 transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                Copy Code: {formattedCode}
              </button>

              <button
                onClick={handleGenerateNewCode}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-neutral-700 transition-colors"
                title="Generate New 6-Digit Room Code"
              >
                <RefreshCw size={12} /> New Code
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="mx-auto w-56 h-56 bg-white border-2 border-saffron-400/80 rounded-2xl p-3 shadow-[0_0_30px_rgba(255,184,0,0.25)] flex items-center justify-center mb-3 relative group">
            <img
              src={currentQrSrc}
              alt="Live Team Buzzer QR Code"
              className="w-full h-full object-contain rounded-lg"
              onError={() => {
                if (qrEngine === 'local') setQrEngine('api1');
                else if (qrEngine === 'api1') setQrEngine('api2');
              }}
            />
          </div>

          {/* 3-Step Player Guide */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
              <span className="text-[10px] font-bold text-saffron-400 block uppercase">Step 1</span>
              <span className="text-xs text-white font-medium block">Scan or Enter</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
              <span className="text-[10px] font-bold text-saffron-400 block uppercase">Step 2</span>
              <span className="text-xs text-white font-medium block">Select Team</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
              <span className="text-[10px] font-bold text-saffron-400 block uppercase">Step 3</span>
              <span className="text-xs text-white font-medium block">Hit Buzzer!</span>
            </div>
          </div>

          {/* URL & Link Sharing */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 pl-3">
              <span className="text-xs text-neutral-300 truncate font-mono flex-1 text-left select-all">
                {buzzerUrl}
              </span>
              <button
                onClick={copyUrl}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 border border-neutral-700 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>

            <a
              href={buzzerUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-gradient-to-r from-saffron-500 via-marigold to-saffron-400 hover:from-saffron-400 hover:to-marigold text-slate-950 font-bold flex items-center justify-center gap-2 text-xs py-3 rounded-xl transition-all shadow-md"
            >
              <Smartphone size={16} /> Open Buzzer Join Page <ExternalLink size={14} />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
