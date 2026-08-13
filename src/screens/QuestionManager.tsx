import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, Plus, Trash2, Save, PencilLine, Music4, ImageIcon, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import type { Team, ImageQuestion, MCQQuestion, BhajanTrack, WheelTopic, QuestionBank } from '../types';
import { sfx } from '../utils/sound';
import { compressImageToDataUrl } from '../utils/image';

const emptyPicture = (): ImageQuestion => ({
  id: `img-${Date.now()}`,
  image: '',
  question: '',
  correctAnswer: '',
  points: 15,
});

const emptyMCQ = (): MCQQuestion => ({
  id: `q-${Date.now()}`,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  category: '',
  difficulty: 'medium',
  points: 10,
});

const emptyBhajan = (): BhajanTrack => ({
  id: `b-${Date.now()}`,
  audioUrl: '',
  bhajanName: '',
  singer: '',
  hint: '',
  points: 15,
});

const emptyTopic = (): WheelTopic => ({
  id: `t-${Date.now()}`,
  label: '',
  isArrivalTopic: false,
  color: '#FF6B1A',
});

function parseCsvToQuestions(text: string) {
  // Expected columns: question,optionA,optionB,optionC,optionD,correctIndex,explanation,category,difficulty,points
  const lines = text.trim().split(/\r?\n/);
  const [, ...rows] = lines; // skip header
  return rows
    .filter((r) => r.trim().length > 0)
    .map((row, i) => {
      const cols = row.split(',').map((c) => c.trim());
      return {
        id: `import-${Date.now()}-${i}`,
        question: cols[0] ?? '',
        options: [cols[1] ?? '', cols[2] ?? '', cols[3] ?? '', cols[4] ?? ''] as [string, string, string, string],
        correctIndex: (Number(cols[5]) || 0) as 0 | 1 | 2 | 3,
        explanation: cols[6] ?? '',
        category: cols[7] ?? '',
        difficulty: (cols[8] as any) ?? 'medium',
        points: Number(cols[9]) || 10,
      };
    });
}

export default function QuestionManager({ onClose }: { onClose: () => void }) {
  const { bank, setBank, teams, setTeams, eventName, subtitle, setEventMeta } = useGameStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<
    'pictures' | 'questions' | 'bhajans' | 'wheel' | 'teams' | 'import' | 'event'
  >('pictures');
  const [localTeams, setLocalTeams] = useState<Team[]>(teams);
  const [localName, setLocalName] = useState(eventName);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [importMsg, setImportMsg] = useState('');

  // Drag & drop state
  const [draggedOptionIdx, setDraggedOptionIdx] = useState<number | null>(null);
  const [draggedBankItem, setDraggedBankItem] = useState<{ round: keyof QuestionBank; index: number } | null>(null);

  // Reorder MCQ draft options and automatically update correctIndex to match the moved option!
  const moveMcqOption = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= 4 || toIndex >= 4) return;
    const correctVal = mcqDraft.options[mcqDraft.correctIndex];
    const newOptions = [...mcqDraft.options] as [string, string, string, string];
    const [moved] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, moved);

    // Determine new correct index
    let newCorrectIndex = newOptions.indexOf(correctVal);
    if (newCorrectIndex === -1 || correctVal.trim() === '') {
      if (mcqDraft.correctIndex === fromIndex) {
        newCorrectIndex = toIndex;
      } else if (fromIndex < mcqDraft.correctIndex && toIndex >= mcqDraft.correctIndex) {
        newCorrectIndex = mcqDraft.correctIndex - 1;
      } else if (fromIndex > mcqDraft.correctIndex && toIndex <= mcqDraft.correctIndex) {
        newCorrectIndex = mcqDraft.correctIndex + 1;
      } else {
        newCorrectIndex = mcqDraft.correctIndex;
      }
    }

    setMcqDraft({
      ...mcqDraft,
      options: newOptions,
      correctIndex: Math.max(0, Math.min(3, newCorrectIndex)) as 0 | 1 | 2 | 3,
    });
    sfx.click();
  };

  // Reorder items in Question Bank list
  const moveBankItem = (roundKey: keyof QuestionBank, fromIndex: number, toIndex: number) => {
    const list = [...bank[roundKey]];
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    setBank({ ...bank, [roundKey]: list as any });
    sfx.click();
  };

  // Dynamic "type your own" forms
  const [pictureDraft, setPictureDraft] = useState<ImageQuestion>(emptyPicture());
  const pictureFileRef = useRef<HTMLInputElement>(null);
  const [editingPictureId, setEditingPictureId] = useState<string | null>(null);

  const [mcqDraft, setMcqDraft] = useState<MCQQuestion>(emptyMCQ());
  const [editingMcqId, setEditingMcqId] = useState<string | null>(null);

  const [bhajanDraft, setBhajanDraft] = useState<BhajanTrack>(emptyBhajan());
  const bhajanFileRef = useRef<HTMLInputElement>(null);
  const [editingBhajanId, setEditingBhajanId] = useState<string | null>(null);

  const [topicDraft, setTopicDraft] = useState<WheelTopic>(emptyTopic());
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  const savePicture = () => {
    if (!pictureDraft.image || !pictureDraft.question.trim() || !pictureDraft.correctAnswer.trim()) {
      sfx.wrong();
      setImportMsg('Please upload an image, and fill in the question and correct answer.');
      return;
    }
    try {
      if (editingPictureId) {
        setBank({ ...bank, round1: bank.round1.map((p) => (p.id === editingPictureId ? pictureDraft : p)) });
      } else {
        setBank({ ...bank, round1: [...bank.round1, pictureDraft] });
      }
      sfx.correct();
      setPictureDraft(emptyPicture());
      setEditingPictureId(null);
    } catch {
      sfx.wrong();
      setImportMsg(
        'Could not save that question — the browser may be out of storage space. Try removing an older question or using a smaller image.'
      );
    }
  };

  const editPicture = (p: ImageQuestion) => {
    setPictureDraft(p);
    setEditingPictureId(p.id);
  };

  const deletePicture = (id: string) => {
    setBank({ ...bank, round1: bank.round1.filter((p) => p.id !== id) });
    if (editingPictureId === id) {
      setPictureDraft(emptyPicture());
      setEditingPictureId(null);
    }
  };

  const saveMcq = () => {
    if (!mcqDraft.question.trim() || mcqDraft.options.some((o) => !o.trim())) {
      sfx.wrong();
      setImportMsg('Please fill in the question and all four options.');
      return;
    }
    if (editingMcqId) {
      setBank({ ...bank, round2: bank.round2.map((q) => (q.id === editingMcqId ? mcqDraft : q)) });
    } else {
      setBank({ ...bank, round2: [...bank.round2, mcqDraft] });
    }
    sfx.correct();
    setMcqDraft(emptyMCQ());
    setEditingMcqId(null);
  };

  const editMcq = (q: MCQQuestion) => {
    setMcqDraft(q);
    setEditingMcqId(q.id);
  };

  const deleteMcq = (id: string) => {
    setBank({ ...bank, round2: bank.round2.filter((q) => q.id !== id) });
    if (editingMcqId === id) {
      setMcqDraft(emptyMCQ());
      setEditingMcqId(null);
    }
  };

  const saveBhajan = () => {
    if (!bhajanDraft.bhajanName.trim()) {
      sfx.wrong();
      setImportMsg('Please enter the bhajan name.');
      return;
    }
    if (editingBhajanId) {
      setBank({ ...bank, round3: bank.round3.map((b) => (b.id === editingBhajanId ? bhajanDraft : b)) });
    } else {
      setBank({ ...bank, round3: [...bank.round3, bhajanDraft] });
    }
    sfx.correct();
    setBhajanDraft(emptyBhajan());
    setEditingBhajanId(null);
  };

  const editBhajan = (b: BhajanTrack) => {
    setBhajanDraft(b);
    setEditingBhajanId(b.id);
  };

  const deleteBhajan = (id: string) => {
    setBank({ ...bank, round3: bank.round3.filter((b) => b.id !== id) });
    if (editingBhajanId === id) {
      setBhajanDraft(emptyBhajan());
      setEditingBhajanId(null);
    }
  };

  const saveTopic = () => {
    if (!topicDraft.label.trim()) {
      sfx.wrong();
      setImportMsg('Please enter a topic label.');
      return;
    }
    if (editingTopicId) {
      setBank({ ...bank, round4: bank.round4.map((t) => (t.id === editingTopicId ? topicDraft : t)) });
    } else {
      setBank({ ...bank, round4: [...bank.round4, topicDraft] });
    }
    sfx.correct();
    setTopicDraft(emptyTopic());
    setEditingTopicId(null);
  };

  const editTopic = (t: WheelTopic) => {
    setTopicDraft(t);
    setEditingTopicId(t.id);
  };

  const deleteTopic = (id: string) => {
    setBank({ ...bank, round4: bank.round4.filter((t) => t.id !== id) });
    if (editingTopicId === id) {
      setTopicDraft(emptyTopic());
      setEditingTopicId(null);
    }
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        setBank({ ...bank, ...parsed });
        setImportMsg(`Imported ${Object.keys(parsed).length} section(s) from JSON.`);
      } else {
        const questions = parseCsvToQuestions(text);
        setBank({ ...bank, round2: questions });
        setImportMsg(`Imported ${questions.length} Round 2 (MCQ) questions from CSV.`);
      }
      sfx.correct();
    } catch (err) {
      setImportMsg('Could not parse that file. Check the format and try again.');
      sfx.wrong();
    }
  };

  const downloadTemplate = () => {
    const csv =
      'question,optionA,optionB,optionC,optionD,correctIndex,explanation,category,difficulty,points\n' +
      'Who wrote the Ramayana?,Ved Vyasa,Valmiki,Tulsidas,Kalidasa,1,Valmiki is the traditional author,Scriptures,medium,15\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gyan-challenge-questions-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveTeams = () => {
    setTeams(localTeams);
    sfx.correct();
  };

  const saveEvent = () => {
    setEventMeta(localName, localSubtitle);
    sfx.correct();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-gradient-saffron">Manage Event Data</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['pictures', 'questions', 'bhajans', 'wheel', 'teams', 'import', 'event'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-score capitalize transition-colors ${
                tab === t ? 'bg-saffron-500/90 text-white' : 'glass text-cream/60 hover:text-cream'
              }`}
            >
              {t === 'import'
                ? 'Bulk Import'
                : t === 'pictures'
                ? 'Round 1 · Pictures'
                : t === 'questions'
                ? 'Round 2 · MCQ'
                : t === 'bhajans'
                ? 'Round 3 · Bhajans'
                : t === 'wheel'
                ? 'Round 4 · Wheel'
                : t}
            </button>
          ))}
        </div>
        {importMsg && (tab === 'pictures' || tab === 'questions' || tab === 'bhajans' || tab === 'wheel') && (
          <p className="text-sm text-kumkum mb-4 text-center">{importMsg}</p>
        )}

        {tab === 'pictures' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
                {editingPictureId ? 'Edit picture question' : 'Upload an image and write the question'}
              </p>
              <input
                ref={pictureFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const compressed = await compressImageToDataUrl(file);
                    setPictureDraft((prev) => ({ ...prev, image: compressed }));
                  } catch {
                    setImportMsg('Could not process that image — try a different file.');
                    sfx.wrong();
                  }
                }}
              />
              {pictureDraft.image ? (
                <div className="relative">
                  <img
                    src={pictureDraft.image}
                    alt="Question"
                    className="w-full max-h-48 object-contain rounded-2xl bg-black/20"
                  />
                  <button
                    type="button"
                    onClick={() => setPictureDraft((prev) => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-kumkum text-white rounded-full p-1.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => pictureFileRef.current?.click()}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-white/15"
                >
                  <Upload size={16} /> Upload Image
                </button>
              )}
              <textarea
                value={pictureDraft.question}
                onChange={(e) => setPictureDraft({ ...pictureDraft, question: e.target.value })}
                placeholder="Question text (e.g. What does this image depict?)"
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={pictureDraft.correctAnswer}
                  onChange={(e) => setPictureDraft({ ...pictureDraft, correctAnswer: e.target.value })}
                  placeholder="Correct answer"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
                <input
                  type="number"
                  value={pictureDraft.points}
                  onChange={(e) => setPictureDraft({ ...pictureDraft, points: Number(e.target.value) })}
                  placeholder="Points"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={savePicture} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus size={16} /> {editingPictureId ? 'Save Changes' : 'Add Picture Question'}
                </button>
                {editingPictureId && (
                  <button
                    onClick={() => {
                      setPictureDraft(emptyPicture());
                      setEditingPictureId(null);
                    }}
                    className="btn-secondary px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-score uppercase tracking-wide text-cream/40 mb-2">
                {bank.round1.length} picture question{bank.round1.length === 1 ? '' : 's'} in Round 1
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
                {bank.round1.map((p, i) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(i));
                      setDraggedBankItem({ round: 'round1', index: i });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedBankItem && draggedBankItem.round === 'round1') {
                        moveBankItem('round1', draggedBankItem.index, i);
                      }
                      setDraggedBankItem(null);
                    }}
                    className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-saffron-400/40 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <GripVertical size={16} className="text-cream/30 hover:text-saffron-400 shrink-0" />
                    <span className="text-xs text-cream/40 font-score w-5 shrink-0">{i + 1}.</span>
                    {p.image ? (
                      <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <ImageIcon size={16} className="text-cream/30 shrink-0" />
                    )}
                    <span className="flex-1 text-sm text-cream/80 truncate">{p.question || '(untitled)'}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveBankItem('round1', i, i - 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={i === bank.round1.length - 1}
                        onClick={() => moveBankItem('round1', i, i + 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button onClick={() => editPicture(p)} className="text-cream/40 hover:text-marigold p-1.5">
                      <PencilLine size={15} />
                    </button>
                    <button onClick={() => deletePicture(p.id)} className="text-cream/40 hover:text-kumkum p-1.5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'questions' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
                {editingMcqId ? 'Edit question' : 'Type a new question'}
              </p>
              <textarea
                value={mcqDraft.question}
                onChange={(e) => setMcqDraft({ ...mcqDraft, question: e.target.value })}
                placeholder="Question text…"
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-cream/50 mb-1">
                  <span>Options (Drag handles or use arrows to reorder)</span>
                  <span className="text-emerald font-semibold">Correct Answer Index syncs automatically</span>
                </div>
                {mcqDraft.options.map((opt, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(i));
                      setDraggedOptionIdx(i);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedOptionIdx !== null) {
                        moveMcqOption(draggedOptionIdx, i);
                      }
                      setDraggedOptionIdx(null);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      mcqDraft.correctIndex === i
                        ? 'bg-emerald/10 border-emerald/40'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <GripVertical size={16} className="text-cream/30 hover:text-saffron-400 cursor-grab active:cursor-grabbing shrink-0" />
                    <button
                      type="button"
                      onClick={() => setMcqDraft({ ...mcqDraft, correctIndex: i as 0 | 1 | 2 | 3 })}
                      title="Mark as correct answer"
                      className={`h-8 w-8 shrink-0 rounded-full font-score text-xs font-bold flex items-center justify-center transition-colors ${
                        mcqDraft.correctIndex === i ? 'bg-emerald text-white shadow-glow' : 'bg-white/10 text-cream/50 hover:bg-white/20'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => {
                        const next = [...mcqDraft.options] as [string, string, string, string];
                        next[i] = e.target.value;
                        setMcqDraft({ ...mcqDraft, options: next });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveMcqOption(i, i - 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Option Up"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={i === 3}
                        onClick={() => moveMcqOption(i, i + 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Option Down"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-cream/40">Tap a letter button (A-D) to mark the correct answer (currently {String.fromCharCode(65 + mcqDraft.correctIndex)}). Dragging options updates the correct index automatically.</p>
              <textarea
                value={mcqDraft.explanation}
                onChange={(e) => setMcqDraft({ ...mcqDraft, explanation: e.target.value })}
                placeholder="Explanation (optional)"
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={mcqDraft.category}
                  onChange={(e) => setMcqDraft({ ...mcqDraft, category: e.target.value })}
                  placeholder="Category"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
                <select
                  value={mcqDraft.difficulty}
                  onChange={(e) => setMcqDraft({ ...mcqDraft, difficulty: e.target.value as any })}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <input
                  type="number"
                  value={mcqDraft.points}
                  onChange={(e) => setMcqDraft({ ...mcqDraft, points: Number(e.target.value) })}
                  placeholder="Points"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveMcq} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus size={16} /> {editingMcqId ? 'Save Changes' : 'Add Question'}
                </button>
                {editingMcqId && (
                  <button
                    onClick={() => {
                      setMcqDraft(emptyMCQ());
                      setEditingMcqId(null);
                    }}
                    className="btn-secondary px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-score uppercase tracking-wide text-cream/40 mb-2">
                {bank.round2.length} question{bank.round2.length === 1 ? '' : 's'} in Round 2
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
                {bank.round2.map((q, i) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(i));
                      setDraggedBankItem({ round: 'round2', index: i });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedBankItem && draggedBankItem.round === 'round2') {
                        moveBankItem('round2', draggedBankItem.index, i);
                      }
                      setDraggedBankItem(null);
                    }}
                    className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-saffron-400/40 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <GripVertical size={16} className="text-cream/30 hover:text-saffron-400 shrink-0" />
                    <span className="text-xs text-cream/40 font-score w-5 shrink-0">{i + 1}.</span>
                    <span className="flex-1 text-sm text-cream/80 truncate">{q.question || '(untitled)'}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveBankItem('round2', i, i - 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={i === bank.round2.length - 1}
                        onClick={() => moveBankItem('round2', i, i + 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button onClick={() => editMcq(q)} className="text-cream/40 hover:text-marigold p-1.5">
                      <PencilLine size={15} />
                    </button>
                    <button onClick={() => deleteMcq(q.id)} className="text-cream/40 hover:text-kumkum p-1.5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'bhajans' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
                {editingBhajanId ? 'Edit bhajan' : 'Type a new bhajan'}
              </p>
              <input
                value={bhajanDraft.bhajanName}
                onChange={(e) => setBhajanDraft({ ...bhajanDraft, bhajanName: e.target.value })}
                placeholder="Bhajan name"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={bhajanDraft.singer}
                  onChange={(e) => setBhajanDraft({ ...bhajanDraft, singer: e.target.value })}
                  placeholder="Singer (optional)"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
                <input
                  type="number"
                  value={bhajanDraft.points}
                  onChange={(e) => setBhajanDraft({ ...bhajanDraft, points: Number(e.target.value) })}
                  placeholder="Points"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
              </div>
              <input
                value={bhajanDraft.hint}
                onChange={(e) => setBhajanDraft({ ...bhajanDraft, hint: e.target.value })}
                placeholder="Hint shown before reveal (optional)"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
              />
              <input
                value={bhajanDraft.audioUrl}
                onChange={(e) => setBhajanDraft({ ...bhajanDraft, audioUrl: e.target.value })}
                placeholder="Audio URL (optional)"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  ref={bhajanFileRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 8 * 1024 * 1024) {
                      setImportMsg(
                        'That\'s a fairly large audio file. It will still be saved, but for a snappier experience consider trimming clips to ~20-30s.'
                      );
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setBhajanDraft((prev) => ({ ...prev, audioUrl: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => bhajanFileRef.current?.click()}
                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                >
                  <Upload size={15} /> Upload Audio File
                </button>
                {bhajanDraft.audioUrl && (
                  <span className="text-xs text-emerald flex items-center gap-1">
                    <Music4 size={13} /> attached
                  </span>
                )}
                {bhajanDraft.audioUrl && (
                  <button
                    type="button"
                    onClick={() => setBhajanDraft((prev) => ({ ...prev, audioUrl: '' }))}
                    className="text-cream/40 hover:text-kumkum text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
              {bhajanDraft.audioUrl && (
                <audio controls src={bhajanDraft.audioUrl} className="w-full h-10 rounded-xl" />
              )}
              <p className="text-[11px] text-cream/35">
                Pre-load all 12 tunes here before the event, the same way you build the Round 1 picture
                bank — each track (name, singer, hint, points, and its audio file) is saved with the event
                and stays available next time you open this browser.
              </p>
              <div className="flex gap-2">
                <button onClick={saveBhajan} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus size={16} /> {editingBhajanId ? 'Save Changes' : 'Add Bhajan'}
                </button>
                {editingBhajanId && (
                  <button
                    onClick={() => {
                      setBhajanDraft(emptyBhajan());
                      setEditingBhajanId(null);
                    }}
                    className="btn-secondary px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-score uppercase tracking-wide text-cream/40 mb-2">
                {bank.round3.length} bhajan{bank.round3.length === 1 ? '' : 's'} in Round 3
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
                {bank.round3.map((b, i) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(i));
                      setDraggedBankItem({ round: 'round3', index: i });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedBankItem && draggedBankItem.round === 'round3') {
                        moveBankItem('round3', draggedBankItem.index, i);
                      }
                      setDraggedBankItem(null);
                    }}
                    className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-saffron-400/40 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <GripVertical size={16} className="text-cream/30 hover:text-saffron-400 shrink-0" />
                    <span className="text-xs text-cream/40 font-score w-5 shrink-0">{i + 1}.</span>
                    <span className="flex-1 text-sm text-cream/80 truncate">{b.bhajanName || '(untitled)'}</span>
                    {b.audioUrl && <Music4 size={13} className="text-emerald shrink-0" />}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveBankItem('round3', i, i - 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={i === bank.round3.length - 1}
                        onClick={() => moveBankItem('round3', i, i + 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button onClick={() => editBhajan(b)} className="text-cream/40 hover:text-marigold p-1.5">
                      <PencilLine size={15} />
                    </button>
                    <button onClick={() => deleteBhajan(b.id)} className="text-cream/40 hover:text-kumkum p-1.5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'wheel' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
                {editingTopicId ? 'Edit topic' : 'Type a new wheel topic'}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={topicDraft.color}
                  onChange={(e) => setTopicDraft({ ...topicDraft, color: e.target.value })}
                  className="h-10 w-10 rounded-lg bg-transparent cursor-pointer shrink-0"
                />
                <input
                  value={topicDraft.label}
                  onChange={(e) => setTopicDraft({ ...topicDraft, label: e.target.value })}
                  placeholder="Topic label"
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-cream/60">
                <input
                  type="checkbox"
                  checked={!!topicDraft.isArrivalTopic}
                  onChange={(e) => setTopicDraft({ ...topicDraft, isArrivalTopic: e.target.checked })}
                  className="accent-saffron-500"
                />
                This is the special "Arrival Topic" (2-minute impromptu prompt)
              </label>
              <div className="flex gap-2">
                <button onClick={saveTopic} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus size={16} /> {editingTopicId ? 'Save Changes' : 'Add Topic'}
                </button>
                {editingTopicId && (
                  <button
                    onClick={() => {
                      setTopicDraft(emptyTopic());
                      setEditingTopicId(null);
                    }}
                    className="btn-secondary px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-score uppercase tracking-wide text-cream/40 mb-2">
                {bank.round4.length} topic{bank.round4.length === 1 ? '' : 's'} on the wheel
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
                {bank.round4.map((t, i) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(i));
                      setDraggedBankItem({ round: 'round4', index: i });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedBankItem && draggedBankItem.round === 'round4') {
                        moveBankItem('round4', draggedBankItem.index, i);
                      }
                      setDraggedBankItem(null);
                    }}
                    className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-saffron-400/40 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <GripVertical size={16} className="text-cream/30 hover:text-saffron-400 shrink-0" />
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
                    />
                    <span className="flex-1 text-sm text-cream/80 truncate">
                      {t.label || '(untitled)'} {t.isArrivalTopic && <em className="text-marigold/70">· arrival</em>}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveBankItem('round4', i, i - 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={i === bank.round4.length - 1}
                        onClick={() => moveBankItem('round4', i, i + 1)}
                        className="text-cream/30 hover:text-cream disabled:opacity-20 p-1 rounded"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button onClick={() => editTopic(t)} className="text-cream/40 hover:text-marigold p-1.5">
                      <PencilLine size={15} />
                    </button>
                    <button onClick={() => deleteTopic(t.id)} className="text-cream/40 hover:text-kumkum p-1.5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'teams' && (
          <div className="space-y-3">
            {localTeams.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <input
                  type="color"
                  value={t.color}
                  onChange={(e) => {
                    const next = [...localTeams];
                    next[i] = { ...t, color: e.target.value };
                    setLocalTeams(next);
                  }}
                  className="h-10 w-10 rounded-lg bg-transparent cursor-pointer"
                />
                <input
                  value={t.name}
                  onChange={(e) => {
                    const next = [...localTeams];
                    next[i] = { ...t, name: e.target.value };
                    setLocalTeams(next);
                  }}
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
                />
                <button
                  onClick={() => setLocalTeams(localTeams.filter((x) => x.id !== t.id))}
                  className="text-cream/40 hover:text-kumkum p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setLocalTeams([
                  ...localTeams,
                  {
                    id: `team-${Date.now()}`,
                    name: `Team ${localTeams.length + 1}`,
                    color: '#FF6B1A',
                    totalScore: 0,
                    roundScores: { round1: 0, round2: 0, round3: 0, round4: 0 },
                  },
                ])
              }
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} /> Add Team
            </button>
            <button onClick={saveTeams} className="btn-primary w-full flex items-center justify-center gap-2">
              <Save size={18} /> Save Teams
            </button>
          </div>
        )}

        {tab === 'import' && (
          <div className="space-y-4">
            <p className="text-sm text-cream/60">
              Import Round 2 (MCQ) questions from a CSV (exported from Excel) or a full question bank JSON.
              Existing questions for imported sections will be replaced.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Choose File (.json / .csv)
            </button>
            <button
              onClick={downloadTemplate}
              className="btn-ghost w-full flex items-center justify-center gap-2 py-2"
            >
              <Download size={16} /> Download CSV Template
            </button>
            {importMsg && <p className="text-sm text-marigold text-center">{importMsg}</p>}
            <div className="brass-divider" />
            <p className="text-xs text-cream/40">
              Currently loaded: {bank.round1.length} picture questions · {bank.round2.length} MCQ questions ·{' '}
              {bank.round3.length} bhajans · {bank.round4.length} wheel topics
            </p>
          </div>
        )}

        {tab === 'event' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-cream/50 font-score uppercase tracking-wide">Event Name</label>
              <input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-cream/50 font-score uppercase tracking-wide">Subtitle</label>
              <input
                value={localSubtitle}
                onChange={(e) => setLocalSubtitle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
              />
            </div>
            <button onClick={saveEvent} className="btn-primary w-full flex items-center justify-center gap-2">
              <Save size={18} /> Save Event Info
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
