import { useState } from 'react';
import { Settings, Save, ArrowLeft, RotateCcw, Download, Upload, Users, HelpCircle, Trophy, Sparkles, Check } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import QuestionManager from './QuestionManager';
import SwaminarayanTilakIcon from '../components/SwaminarayanTilakIcon';
import { sfx } from '../utils/sound';

export default function SettingsView() {
  const {
    eventName,
    subtitle,
    teams,
    bank,
    setEventMeta,
    setTeams,
    setBank,
    goToRound,
    resetGame,
  } = useGameStore();

  const [localName, setLocalName] = useState(eventName);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [saved, setSaved] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [localTeams, setLocalTeams] = useState(teams);

  const handleSaveMeta = () => {
    setEventMeta(localName, localSubtitle);
    setTeams(localTeams);
    sfx.correct();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportJSON = () => {
    const data = { eventName, subtitle, teams, bank };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gyan-quiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sfx.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.bank) setBank(json.bank);
        if (json.teams) setTeams(json.teams);
        if (json.eventName) setLocalName(json.eventName);
        if (json.subtitle) setLocalSubtitle(json.subtitle);
        if (json.eventName) setEventMeta(json.eventName, json.subtitle || '');
        sfx.correct();
        alert('Data successfully imported!');
      } catch {
        sfx.wrong();
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 sm:p-6 max-w-5xl mx-auto my-auto gap-6">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between gap-4 border-b border-amber-400/30 pb-4">
        <button
          onClick={() => {
            sfx.navigate();
            goToRound('dashboard');
          }}
          className="btn-secondary flex items-center gap-2 text-xs sm:text-sm font-extrabold px-5 py-2.5 border-2 border-white/30 hover:border-amber-300"
        >
          <ArrowLeft size={18} /> Home Dashboard
        </button>

        <div className="flex items-center gap-3 text-sm sm:text-base font-score text-amber-300 font-extrabold uppercase tracking-widest">
          <SwaminarayanTilakIcon size={28} />
          <span>મેનેજ ડેટા અને સેટિંગ્સ (Settings & Data)</span>
        </div>

        <button
          onClick={handleSaveMeta}
          className="btn-primary flex items-center gap-2 text-xs sm:text-sm font-extrabold px-6 py-2.5 shadow-[0_0_25px_rgba(255,107,26,0.8)]"
        >
          {saved ? <Check size={18} /> : <Save size={18} />}
          {saved ? 'Saved!' : 'Save All'}
        </button>
      </div>

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Section 1: Event Info Settings */}
        <GlassCard arch glow="saffron" className="p-6 border-2 border-amber-400/40 space-y-4">
          <div className="flex items-center gap-2 text-amber-300 font-score font-extrabold text-sm uppercase tracking-wider">
            <Sparkles size={18} className="text-amber-400 fill-amber-400" />
            <span>ઇવેન્ટ સેટિંગ્સ (Event Info)</span>
          </div>

          <div>
            <label className="text-xs font-score text-cream/70 block mb-1 font-bold">Event Title</label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-amber-400/40 px-3.5 py-2 text-white font-score focus:border-amber-300 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-score text-cream/70 block mb-1 font-bold">Event Subtitle</label>
            <input
              type="text"
              value={localSubtitle}
              onChange={(e) => setLocalSubtitle(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-amber-400/40 px-3.5 py-2 text-white font-score focus:border-amber-300 outline-none"
            />
          </div>
        </GlassCard>

        {/* Section 2: Question Bank Manager Launcher */}
        <GlassCard arch glow="saffron" className="p-6 border-2 border-amber-400/40 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 font-score font-extrabold text-sm uppercase tracking-wider mb-2">
              <HelpCircle size={18} className="text-amber-400" />
              <span>પ્રશ્ન પત્રક બોક્સ (Question Bank)</span>
            </div>
            <p className="text-xs text-cream/70 font-body leading-relaxed">
              Add, edit, or remove questions for Round 1 (Pictures), Round 2 (MCQ), Round 3 (Bhajans), and Round 4 (Topics).
            </p>
          </div>

          <button
            onClick={() => setShowManager(true)}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3 font-extrabold shadow-[0_0_30px_rgba(255,107,26,0.8)]"
          >
            <Settings size={18} /> Open Question Bank Editor
          </button>
        </GlassCard>

        {/* Section 3: Team Names & Scores Editor */}
        <GlassCard arch glow="saffron" className="p-6 border-2 border-amber-400/40 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-amber-400/20 pb-3">
            <div className="flex items-center gap-2 text-amber-300 font-score font-extrabold text-sm uppercase tracking-wider">
              <Users size={18} className="text-amber-400" />
              <span>ટીમ નામ અને સ્કોર બોક્સ (Teams & Scores)</span>
            </div>
            <span className="text-xs text-amber-200/70 font-score font-bold">{localTeams.length} Teams Registered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {localTeams.map((t, idx) => (
              <div key={t.id} className="bg-black/50 border border-amber-400/30 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ background: t.color }} />
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => {
                      const updated = [...localTeams];
                      updated[idx].name = e.target.value;
                      setLocalTeams(updated);
                    }}
                    className="w-full bg-transparent border-b border-white/20 text-white font-score font-extrabold text-sm focus:border-amber-400 outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-score text-cream/60 font-bold">Total Points:</span>
                  <input
                    type="number"
                    value={t.totalScore}
                    onChange={(e) => {
                      const updated = [...localTeams];
                      updated[idx].totalScore = Number(e.target.value);
                      setLocalTeams(updated);
                    }}
                    className="w-20 bg-black/60 border border-amber-400/40 rounded-lg text-center text-amber-300 font-score font-extrabold text-sm focus:border-amber-300 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Section 4: Data Import / Export Backup */}
        <GlassCard arch glow="saffron" className="p-6 border-2 border-amber-400/40 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-amber-300 font-score font-extrabold text-sm uppercase tracking-wider">
            <Trophy size={18} className="text-amber-400" />
            <span>બેકઅપ અને રીસેટ વિકલ્પો (Data Backup & Reset)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <button
              onClick={handleExportJSON}
              className="btn-secondary flex items-center justify-center gap-2 text-xs py-3 border-2 border-amber-400/40 font-extrabold"
            >
              <Download size={16} /> Export Backup (JSON)
            </button>

            <label className="btn-secondary flex items-center justify-center gap-2 text-xs py-3 border-2 border-amber-400/40 font-extrabold cursor-pointer">
              <Upload size={16} /> Import Backup (JSON)
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset the entire event? All team scores and progress will be cleared.')) {
                  resetGame();
                  sfx.click();
                  alert('Event reset successfully!');
                }
              }}
              className="btn-secondary flex items-center justify-center gap-2 text-xs py-3 border-2 border-red-500/50 text-red-300 hover:bg-red-900/30 font-extrabold"
            >
              <RotateCcw size={16} /> Reset All Event Scores
            </button>
          </div>
        </GlassCard>
      </div>

      {showManager && <QuestionManager onClose={() => setShowManager(false)} />}
    </div>
  );
}
