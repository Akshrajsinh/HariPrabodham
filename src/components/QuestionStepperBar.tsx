import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { sfx } from '../utils/sound';
import type { CompletedQuestions } from '../types';

interface QuestionStepperBarProps {
  round: keyof CompletedQuestions;
  currentIndex: number;
  totalQuestions: number;
  onSelectIndex: (index: number) => void;
  questionIds?: string[];
}

export default function QuestionStepperBar({
  round,
  currentIndex,
  totalQuestions,
  onSelectIndex,
  questionIds = [],
}: QuestionStepperBarProps) {
  const completedQuestions = useGameStore((s) => s.completedQuestions[round] || []);
  const toggleQuestionCompleted = useGameStore((s) => s.toggleQuestionCompleted);

  if (totalQuestions === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-1.5 my-1">
      <div className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-black/40 via-white/[0.06] to-black/40 border border-amber-400/25 px-4 py-2 rounded-2xl glass-gold shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              sfx.navigate();
              onSelectIndex(currentIndex - 1);
            }
          }}
          disabled={currentIndex === 0}
          className="btn-ghost p-2 rounded-xl disabled:opacity-20 hover:bg-white/10 text-amber-200 transition-colors"
          title="Previous Question"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Stepper Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const qId = questionIds[idx] || `q-${idx}`;
            const isCompleted = completedQuestions.includes(qId);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={idx}
                onClick={() => {
                  sfx.click();
                  onSelectIndex(idx);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  sfx.click();
                  toggleQuestionCompleted(round, qId);
                }}
                className={`relative px-3.5 py-1.5 rounded-xl font-score text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-amber-400 via-saffron-500 to-amber-500 text-slate-950 shadow-[0_0_25px_rgba(255,167,51,0.8)] border border-amber-200 scale-105 z-10 font-extrabold'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30'
                    : 'bg-white/5 text-cream/70 hover:text-cream hover:bg-white/15 border border-white/10'
                }`}
                title={`Question ${idx + 1} ${isCompleted ? '(Completed ✓)' : ''} - Right-click to toggle checkmark`}
              >
                <span>Q{idx + 1}</span>
                {isCompleted && <Check size={14} className="text-emerald-400 font-extrabold stroke-[3]" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (currentIndex < totalQuestions - 1) {
              sfx.navigate();
              onSelectIndex(currentIndex + 1);
            }
          }}
          disabled={currentIndex === totalQuestions - 1}
          className="btn-ghost p-2 rounded-xl disabled:opacity-20 hover:bg-white/10 text-amber-200 transition-colors"
          title="Next Question"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-score text-cream/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] inline-block" /> Completed:{' '}
          <strong className="text-emerald-300 font-bold">{completedQuestions.length}</strong> / {totalQuestions}
        </span>
        <span className="text-amber-400/40">·</span>
        <span className="text-cream/50">Right-click any Q pill to toggle checkmark</span>
      </div>
    </div>
  );
}
