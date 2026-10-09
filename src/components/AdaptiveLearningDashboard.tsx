import React, { useState } from 'react';
import { 
  Flame, 
  Clock, 
  Award, 
  CheckCircle2, 
  Calendar, 
  RotateCcw, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  ArrowRight, 
  Sparkles, 
  Target, 
  Star, 
  ShieldCheck, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';

interface AdaptiveDashboardProps {
  user: UserProfile | null;
  activeClass: string;
  onGoToStudio: (cmd?: string) => void;
  onGoToTests: () => void;
  onGoToCourses: () => void;
  onRequireAuth: () => void;
}

export const AdaptiveLearningDashboard: React.FC<AdaptiveDashboardProps> = ({
  user,
  activeClass,
  onGoToStudio,
  onGoToTests,
  onGoToCourses,
  onRequireAuth,
}) => {
  // Simulated gamified metrics backed by user profile with encouraging defaults
  const streakDays = user?.streakDays || 5;
  const userXp = user?.xp || 840;
  const studyHours = 14.5;
  const completedLessons = 18;
  const averageQuizScore = 86;

  // Subject Strengths and Weaknesses
  const subjectProgress = [
    { subject: 'Physics', progress: 78, status: 'Strong in Laws of Motion, Practice Ray Optics', color: 'bg-purple-500' },
    { subject: 'Chemistry', progress: 85, status: 'Mastered Periodic Table, Review Redox Reactions', color: 'bg-emerald-500' },
    { subject: 'Biology', progress: 92, status: 'Exceptional in Life Processes and Genetics', color: 'bg-cyan-500' },
    { subject: 'Mathematics', progress: 70, status: 'Solid in Quadratic Equations, Strengthen Trigonometry', color: 'bg-amber-500' },
  ];

  // Spaced Repetition Revision Schedule (Forgetting Curve Optimization)
  const [spacedTopics, setSpacedTopics] = useState([
    { id: '1', title: 'Ohm\'s Law & V-I Graph', subject: 'Physics', due: 'Today (Day 3)', urgent: true },
    { id: '2', title: 'Chemical Reactions & Balancing', subject: 'Chemistry', due: 'Today (Day 7)', urgent: true },
    { id: '3', title: 'Quadratic Formula Derivation', subject: 'Mathematics', due: 'Tomorrow (Day 14)', urgent: false },
    { id: '4', title: 'Nephron & Human Excretion', subject: 'Biology', due: 'In 3 days (Day 30)', urgent: false },
  ]);

  // Badges Earned
  const badges = [
    { title: 'NCERT Explorer', desc: 'Synthesized 5+ complete chapter notes', icon: '🌟', unlocked: true },
    { title: 'Consistency Star', desc: 'Maintained a 5-day daily learning streak', icon: '🔥', unlocked: true },
    { title: 'Numerical Ninja', desc: 'Scored 100% in a chapter practice test', icon: '🎯', unlocked: true },
    { title: 'Formula Master', desc: 'Mastered 20+ physics and chemistry formulas', icon: '⚡', unlocked: false },
  ];

  const handleCompleteTopic = (id: string) => {
    setSpacedTopics(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl astra-card border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Personalized Learning Engine &bull; {activeClass}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.displayName || 'Scholar'}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            You are making steady progress toward your 2026–27 board examinations. Here is your daily roadmap and targeted revision plan.
          </p>
        </div>

        {/* Action button */}
        <div className="relative z-10 flex flex-wrap gap-3">
          <button
            onClick={() => onGoToCourses()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <span>Generate New Course</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gamified Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-2xl astra-card border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{streakDays} Days</div>
            <div className="text-[11px] text-slate-400 font-medium">Active Learning Streak</div>
          </div>
        </div>

        {/* XP Points */}
        <div className="p-5 rounded-2xl astra-card border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{userXp} XP</div>
            <div className="text-[11px] text-slate-400 font-medium">Scholar Knowledge Points</div>
          </div>
        </div>

        {/* Study Hours */}
        <div className="p-5 rounded-2xl astra-card border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{studyHours} hrs</div>
            <div className="text-[11px] text-slate-400 font-medium">Focused Study Time</div>
          </div>
        </div>

        {/* Avg Quiz Score */}
        <div className="p-5 rounded-2xl astra-card border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{averageQuizScore}%</div>
            <div className="text-[11px] text-slate-400 font-medium">Chapter Test Average</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Spaced Repetition + Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Spaced Repetition Revision Scheduler */}
        <div className="lg:col-span-6 p-6 rounded-3xl astra-card border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Spaced Repetition Schedule</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Scientifically timed reviews (Day 1, 3, 7, 14, 30) to halt the forgetting curve.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {spacedTopics.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div>All due revision sessions completed for today!</div>
              </div>
            ) : (
              spacedTopics.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    item.urgent
                      ? 'bg-amber-400/10 border-amber-400/30'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {item.subject}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-300 font-medium block">
                      Due: {item.due}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onGoToStudio(`/handwriting subject:${item.subject} chapter:"${item.title}"`)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleCompleteTopic(item.id)}
                      className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors cursor-pointer"
                      title="Mark Reviewed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Subject Mastery & Weakness Detection */}
        <div className="lg:col-span-6 p-6 rounded-3xl astra-card border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Subject Mastery &amp; Recommendation</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic difficulty adjustment based on chapter test accuracy.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {subjectProgress.map((sp, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{sp.subject}</span>
                  <span className="font-mono font-bold text-amber-400">{sp.progress}% Mastery</span>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className={`${sp.color} h-full rounded-full transition-all duration-500`} style={{ width: `${sp.progress}%` }}></div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  <strong className="text-slate-300">Target: </strong>{sp.status}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onGoToTests()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Attempt Weak Topic Practice Test</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gamified Achievements & Badges */}
      <div className="p-6 rounded-3xl astra-card border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Earned Badges &amp; Milestones</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                b.unlocked
                  ? 'bg-amber-400/10 border-amber-400/30 text-white'
                  : 'bg-white/5 border-white/5 opacity-50 text-slate-400'
              }`}
            >
              <div className="text-2xl">{b.icon}</div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">{b.title}</div>
                <div className="text-[11px] text-slate-400 leading-snug">{b.desc}</div>
                <span className="text-[10px] font-mono text-amber-400 block pt-1">
                  {b.unlocked ? 'Unlocked ✓' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
