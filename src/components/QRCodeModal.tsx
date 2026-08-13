import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, Smartphone, Wifi } from 'lucide-react';
import { generateQRCodeSVG } from '../utils/qrcode';
import { buzzerChannel } from '../utils/buzzerChannel';

interface QRCodeModalProps {
  onClose: () => void;
}

export default function QRCodeModal({ onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const roomId = buzzerChannel.getRoom();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const buzzerUrl = `${currentOrigin}${currentPath}?mode=buzzer&room=${encodeURIComponent(roomId)}`;

  // Classic Black & White QR Code (Pure Black #000000 on Crisp White #FFFFFF)
  const qrSvgDataUri = useMemo(() => {
    const svg = generateQRCodeSVG(buzzerUrl, 260, '#000000', '#FFFFFF');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [buzzerUrl]);

  // Fallback API QR code (Black & White)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    buzzerUrl
  )}&color=000000&bg=FFFFFF`;

  const [useApiFallback, setUseApiFallback] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(buzzerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative text-center text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            Scan QR Code
          </h2>
          <p className="text-neutral-400 text-xs mb-4">
            Scan with any smartphone camera to open the mobile buzzer
          </p>

          {/* Room Code */}
          <div className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3.5 py-1 rounded-full text-xs font-mono text-neutral-300 mb-4">
            <Wifi size={13} className="text-neutral-400" />
            <span>Room Code: <strong className="text-white uppercase">{roomId}</strong></span>
          </div>

          {/* Simple Black & White QR Code Box */}
          <div className="mx-auto w-60 h-60 bg-white border border-neutral-300 rounded-xl p-3 shadow-md flex items-center justify-center mb-5">
            <img
              src={useApiFallback ? qrApiUrl : qrSvgDataUri}
              alt="QR Code"
              className="w-full h-full object-contain"
              onError={() => setUseApiFallback(true)}
            />
          </div>

          {/* Simple 3 Steps */}
          <div className="grid grid-cols-3 gap-2 mb-5 text-center">
            <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">Step 1</span>
              <span className="text-xs text-white font-medium block">Scan QR</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">Step 2</span>
              <span className="text-xs text-white font-medium block">Select Team</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">Step 3</span>
              <span className="text-xs text-white font-medium block">Hit Buzzer</span>
            </div>
          </div>

          {/* URL & Controls */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 pl-3">
              <span className="text-xs text-neutral-400 truncate font-mono flex-1 text-left">{buzzerUrl}</span>
              <button
                onClick={copyUrl}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 border border-neutral-700 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <a
              href={buzzerUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-white hover:bg-neutral-200 text-black font-bold flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl transition-colors"
            >
              <Smartphone size={16} /> Open Buzzer in New Tab <ExternalLink size={14} />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
