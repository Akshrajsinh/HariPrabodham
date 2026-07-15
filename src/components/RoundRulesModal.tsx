import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ScrollText } from 'lucide-react';
import { roundRules } from '../data/roundRules';
import type { RoundKey } from '../types';

interface RoundRulesModalProps {
  round: RoundKey;
  onStart: () => void;
  onClose: () => void;
}

export default function RoundRulesModal({ round, onStart, onClose }: RoundRulesModalProps) {
  const ruleSet = roundRules[round];
  if (!ruleSet) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-3xl p-8 w-full max-w-lg temple-arch-top bg-arch-gradient"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
              <ScrollText size={16} />
              Rules
            </div>
            <button onClick={onClose} className="text-cream/60 hover:text-cream">
              <X size={22} />
            </button>
          </div>

          <h2 className="font-display text-3xl text-gradient-saffron font-bold mb-1">{ruleSet.title}</h2>
          <p className="text-cream/50 text-sm font-body mb-6">{ruleSet.subtitle}</p>

          <ul className="space-y-3 mb-8">
            {ruleSet.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-saffron-500/20 text-marigold font-score text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-body text-cream/85 leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onStart}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            <Play size={20} fill="currentColor" /> Start {ruleSet.title}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
