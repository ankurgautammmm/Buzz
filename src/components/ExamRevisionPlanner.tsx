import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ArrowRight, 
  Flame, 
  TrendingUp, 
  RotateCcw, 
  Layers, 
  Award,
  ChevronRight,
  Filter,
  Download,
  Share2
} from 'lucide-react';
import { UserProfile } from '../types';
import { NCERT_SYLLABUS } from '../data/ncertSyllabus';

interface ExamRevisionPlannerProps {
  user: UserProfile | null;
  activeClass: string;
  onGoToStudio?: (cmd: string) => void;
  onRequireAuth: () => void;
}

interface ExamTargetInfo {
  id: string;
  name: string;
  targetDate: string; // ISO date string
  description: string;
  totalChapters: number;
  pattern: string;
}

const EXAM_TARGETS: Record<string, ExamTargetInfo> = {
  'cbse-10': {
    id: 'cbse-10',
    name: 'CBSE Class 10 Board Examinations 2026',
    targetDate: '2026-02-15T09:00:00Z',
    description: 'National Board Examination covering Science, Mathematics, and Social Science.',
    totalChapters: 30,
    pattern: 'Subjective + Competency MCQs (80 Marks Theory)',
  },
  'cbse-12': {
    id: 'cbse-12',
    name: 'CBSE Class 12 Board Examinations 2026',
    targetDate: '2026-02-20T09:00:00Z',
    description: 'National Senior Secondary Board Examinations across Physics, Chemistry, Biology, and Math.',
    totalChapters: 45,
    pattern: 'Derivations, Numericals, Assertion-Reason (70 Marks Theory)',
  },
  'neet-ug': {
    id: 'neet-ug',
    name: 'NEET UG 2026 Medical Entrance',
    targetDate: '2026-05-03T14:00:00Z',
    description: 'National Eligibility cum Entrance Test for MBBS/BDS admissions across India.',
    totalChapters: 79,
    pattern: '180 MCQs (+4 / -1 Negative Marking, 720 Marks)',
  },
  'jee-main': {
    id: 'jee-main',
    name: 'JEE Main 2026 Engineering Entrance',
    targetDate: '2026-04-05T09:00:00Z',
    description: 'Joint Entrance Examination for NITs, IIITs, and qualifying for JEE Advanced.',
    totalChapters: 68,
    pattern: '90 Questions (MCQs + Numerical Value Type, 300 Marks)',
  },
};

export const ExamRevisionPlanner: React.FC<ExamRevisionPlannerProps> = ({
  user,
  activeClass,
  onGoToStudio,
  onRequireAuth,
}) => {
  // Target Exam Selection
  const defaultTarget = activeClass === 'Class 12' 
    ? 'cbse-12' 
    : (activeClass === 'Class 10' ? 'cbse-10' : 'neet-ug');
  const [selectedExamKey, setSelectedExamKey] = useState<string>(defaultTarget);
  const targetInfo = EXAM_TARGETS[selectedExamKey] || EXAM_TARGETS['cbse-10'];

  // Countdown State
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Chapter Completion Tracking in LocalStorage
  const [completedChapters, setCompletedChapters] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('bb_completed_chapters');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active Subject Tab for Syllabus Matrix
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [selectedDailySlot, setSelectedDailySlot] = useState<number>(0);

  // Live Timer Countdown Effect
  useEffect(() => {
    const updateCountdown = () => {
      const targetTime = new Date(targetInfo.targetDate).getTime();
      const now = new Date().getTime();
      const difference = Math.max(0, targetTime - now);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetInfo]);

  // Toggle chapter completion
  const toggleChapter = (chapterKey: string) => {
    setCompletedChapters((prev) => {
      const updated = { ...prev, [chapterKey]: !prev[chapterKey] };
      try {
        localStorage.setItem('bb_completed_chapters', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Extract chapters from NCERT syllabus for this class
  const classSyllabus = (NCERT_SYLLABUS as any)[activeClass] || (NCERT_SYLLABUS as any)['Class 10'];
  const subjectsList = Object.keys(classSyllabus.subjects || {});

  // Collect all chapters across subjects
  const allChaptersList: {
    key: string;
    chapterName: string;
    subject: string;
    unit: string;
    keyTopics: string[];
  }[] = [];

  subjectsList.forEach((subj) => {
    if (activeSubject !== 'All' && subj !== activeSubject) return;
    const chapters: any[] = classSyllabus.subjects[subj] || [];
    chapters.forEach((ch: any) => {
      allChaptersList.push({
        key: `${activeClass}_${subj}_${ch.name}`,
        chapterName: ch.name,
        subject: subj,
        unit: ch.unit,
        keyTopics: ch.keyTopics || [],
      });
    });
  });

  const completedCount = allChaptersList.filter((ch) => completedChapters[ch.key]).length;
  const progressPercent = allChaptersList.length > 0 
    ? Math.round((completedCount / allChaptersList.length) * 100) 
    : 0;

  // Daily Study Routine Slots
  const DAILY_SLOTS = [
    {
      slotName: 'Morning Foundation (06:00 - 07:30)',
      focus: 'Theory & Core Concepts',
      tip: 'High brain receptivity: read theory, highlight keywords, and memorize definitions.',
      actionCmd: `/handwriting class:${activeClass.replace('Class ', '')} subject:Science chapter:"Life Processes" style:gel-pen`,
      recommendedDuration: '90 Minutes',
      badge: 'Concept Mastery',
    },
    {
      slotName: 'Afternoon Numerical Drill (14:30 - 16:00)',
      focus: 'Derivations & Mathematics',
      tip: 'Active problem solving: practice formula substitution and step-by-step board numericals.',
      actionCmd: `/handwriting class:${activeClass.replace('Class ', '')} subject:Physics chapter:"Laws of Motion" --formulas`,
      recommendedDuration: '90 Minutes',
      badge: 'Formula Drills',
    },
    {
      slotName: 'Evening Recall & Testing (19:30 - 20:30)',
      focus: 'Active Recall & Mock Quiz',
      tip: 'Test retention without notes. Solve 5 timed MCQs and review common board exam traps.',
      actionCmd: `/handwriting class:${activeClass.replace('Class ', '')} subject:Chemistry chapter:"Chemical Bonding" --short`,
      recommendedDuration: '60 Minutes',
      badge: 'Spaced Recall',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 space-y-10 text-slate-100">
      {/* 1. Header with Target Exam Selector & Countdown */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0a0f24] via-[#060914] to-[#04060d] border border-amber-400/20 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Top Row: Tag & Exam Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>National Examination Command Center</span>
            </div>

            {/* Exam Target Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">Exam Target:</span>
              <select
                value={selectedExamKey}
                onChange={(e) => setSelectedExamKey(e.target.value)}
                className="bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {Object.entries(EXAM_TARGETS).map(([k, info]) => (
                  <option key={k} value={k}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam Title & Overview */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {targetInfo.name}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              {targetInfo.description} &bull; <strong className="text-amber-300 font-semibold">{targetInfo.pattern}</strong>
            </p>
          </div>

          {/* Countdown Clock Digit Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1 shadow-lg">
              <div className="text-3xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
                {timeLeft.days}
              </div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Days Remaining</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1 shadow-lg">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Hours</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1 shadow-lg">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Minutes</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1 shadow-lg">
              <div className="text-3xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight animate-pulse">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Seconds</div>
            </div>
          </div>

          {/* Overall Syllabus Progress Bar */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Syllabus Mastery Progress ({activeClass})
              </span>
              <span className="text-amber-400 font-bold">{progressPercent}% Completed ({completedCount} / {allChaptersList.length} Chapters)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three-Slot Dynamic Daily Routine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Topper Daily Revision Routine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured time-blocking optimized for retention and maximum board evaluation marks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DAILY_SLOTS.map((slot, idx) => (
            <div
              key={slot.slotName}
              onClick={() => setSelectedDailySlot(idx)}
              className={`rounded-2xl p-6 border transition-all cursor-pointer space-y-4 flex flex-col justify-between ${
                selectedDailySlot === idx
                  ? 'bg-[#0b1026] border-amber-400/50 shadow-xl'
                  : 'bg-[#070a14] border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-amber-400/10 text-amber-300 font-semibold">
                    {slot.badge}
                  </span>
                  <span className="text-slate-400">{slot.recommendedDuration}</span>
                </div>

                <h3 className="text-base font-bold text-white">{slot.slotName}</h3>
                <div className="text-xs text-amber-400/90 font-medium">{slot.focus}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{slot.tip}</p>
              </div>

              {onGoToStudio && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToStudio(slot.actionCmd);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Launch Study Notes for Slot</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. NCERT Syllabus Checklist Matrix */}
      <div className="space-y-6 rounded-2xl bg-[#070a14] border border-white/[0.08] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Syllabus Chapter Tracker &amp; Quick Notes Launcher</span>
            </h2>
            <p className="text-xs text-slate-400">
              Check off completed chapters. Click "Study Notes" to synthesize handwritten notebook pages instantly.
            </p>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            {['All', ...subjectsList].map((subj) => (
              <button
                key={subj}
                onClick={() => setActiveSubject(subj)}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeSubject === subj
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allChaptersList.map((ch, index) => {
            const isCompleted = !!completedChapters[ch.key];
            const studyCommand = `/handwriting class:${activeClass.replace('Class ', '')} subject:${ch.subject} chapter:"${ch.chapterName}" style:gel-pen paper:ruled ink:royal-blue thinking:high`;

            return (
              <div
                key={ch.key}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  isCompleted
                    ? 'bg-emerald-950/10 border-emerald-500/30'
                    : 'bg-slate-900/50 border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleChapter(ch.key)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-white/20 hover:border-amber-400 bg-slate-900 text-transparent'
                    }`}
                    title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-amber-400 font-semibold">{ch.subject}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-slate-400 truncate">{ch.unit}</span>
                    </div>

                    <h4 className={`text-sm font-semibold truncate ${isCompleted ? 'text-slate-300 line-through' : 'text-white'}`}>
                      {ch.chapterName}
                    </h4>

                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {ch.keyTopics.slice(0, 3).join(', ')}
                    </div>
                  </div>
                </div>

                {onGoToStudio && (
                  <button
                    onClick={() => onGoToStudio(studyCommand)}
                    className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 font-semibold text-xs border border-amber-400/30 transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 active:scale-95"
                    title="Generate authentic handwritten study notes"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Study Notes</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
