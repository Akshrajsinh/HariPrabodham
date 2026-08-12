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
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-2 my-2">
      <div className="w-full flex items-center justify-between gap-2 bg-black/30 border border-white/10 px-4 py-2 rounded-2xl glass shadow-md">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              sfx.navigate();
              onSelectIndex(currentIndex - 1);
            }
          }}
          disabled={currentIndex === 0}
          className="btn-ghost p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/10 text-cream/70"
          title="Previous Question"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Stepper Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-2">
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
                className={`relative px-3 py-1 rounded-xl font-score text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-glow border border-saffron-300 scale-105 z-10'
                    : isCompleted
                    ? 'bg-emerald/20 text-emerald border border-emerald/40 hover:bg-emerald/30'
                    : 'bg-white/5 text-cream/60 hover:text-cream hover:bg-white/10 border border-white/5'
                }`}
                title={`Question ${idx + 1} ${isCompleted ? '(Completed ✓)' : ''} - Right-click to toggle checkmark`}
              >
                <span>Q{idx + 1}</span>
                {isCompleted && <Check size={13} className="text-emerald font-bold" />}
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
          className="btn-ghost p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/10 text-cream/70"
          title="Next Question"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-score text-cream/50">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald inline-block" /> Completed: {completedQuestions.length} /{' '}
          {totalQuestions}
        </span>
        <span>·</span>
        <span>Right-click any Q pill to toggle checkmark manually</span>
      </div>
    </div>
  );
}
