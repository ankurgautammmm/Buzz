import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  Lock, 
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  Check, 
  Bookmark, 
  AlertCircle,
  Zap,
  Sliders,
  CheckSquare,
  Trophy,
  TrendingUp,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { CHAPTER_TESTS_CATALOG, ChapterTest, PracticeQuestion } from '../data/chapterTests';
import { UserProfile } from '../types';

interface TestSectionProps {
  user: UserProfile | null;
  onRequireAuth: () => void;
  activeClass: string;
  onGoToStudio?: (cmd: string) => void;
}

export const TestSection: React.FC<TestSectionProps> = ({
  user,
  onRequireAuth,
  activeClass,
  onGoToStudio,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(activeClass || 'Class 11');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [activeTest, setActiveTest] = useState<ChapterTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);

  // Phase 4: CBT vs OMR Mode & Exam Pattern
  const [viewMode, setViewMode] = useState<'cbt' | 'omr'>('cbt');
  const [examPattern, setExamPattern] = useState<'cbse' | 'neet' | 'jee'>('cbse');

  // Phase 4: Dynamic AI Test Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiClass, setAiClass] = useState(activeClass || 'Class 10');
  const [aiSubject, setAiSubject] = useState('Science');
  const [aiPattern, setAiPattern] = useState<'cbse' | 'neet' | 'jee'>('cbse');
  const [aiDifficulty, setAiDifficulty] = useState<'medium' | 'hard' | 'board_level'>('board_level');
  const [aiCount, setAiCount] = useState<number>(10);
  const [isGeneratingAiTest, setIsGeneratingAiTest] = useState(false);
  const [aiTestError, setAiTestError] = useState<string | null>(null);

  // Live Timer Countdown
  useEffect(() => {
    if (!timerActive || testSubmitted || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          setTestSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, testSubmitted, timeRemaining]);

  // Available catalog tests filtered by class & subject
  const filteredTests = CHAPTER_TESTS_CATALOG.filter((t) => {
    const classMatch = selectedClassFilter === 'All' || t.classGrade === selectedClassFilter;
    const subjectMatch = selectedSubjectFilter === 'All' || t.subject.toLowerCase() === selectedSubjectFilter.toLowerCase();
    return classMatch && subjectMatch;
  });

  const startTest = (test: ChapterTest, pattern: 'cbse' | 'neet' | 'jee' = 'cbse') => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setActiveTest(test);
    setExamPattern(pattern);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    setTestSubmitted(false);
    setTimeRemaining(test.durationMinutes * 60);
    setTimerActive(true);
    setViewMode('cbt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (testSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleToggleMarkForReview = (questionId: string) => {
    if (testSubmitted) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleClearAnswer = (questionId: string) => {
    if (testSubmitted) return;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleSubmitTest = () => {
    setTimerActive(false);
    setTestSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetTest = () => {
    setActiveTest(null);
    setUserAnswers({});
    setMarkedForReview({});
    setTestSubmitted(false);
  };

  // Phase 4: Dynamic AI Mock Test Generator
  const handleGenerateAiTest = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    const topicTarget = aiTopic.trim() || 'Light – Reflection and Refraction';
    setIsGeneratingAiTest(true);
    setAiTestError(null);

    try {
      const response = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classGrade: aiClass,
          subject: aiSubject,
          chapter: topicTarget,
          difficulty: aiDifficulty,
          count: aiCount,
          questionTypes: ['mcq'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mock test questions');
      }

      const data = await response.json();
      const rawQuestions: any[] = data.questions || [];

      if (!rawQuestions || rawQuestions.length === 0) {
        throw new Error('No questions received from AI paper setter');
      }

      // Convert to ChapterTest format
      const isNegativeMarking = aiPattern === 'neet' || aiPattern === 'jee';
      const markPerQ = isNegativeMarking ? 4 : 1;

      const formattedQuestions: PracticeQuestion[] = rawQuestions.map((q, idx) => {
        // Resolve correct answer index if it's text
        let correctIdx = 0;
        if (typeof q.correctAnswer === 'number') {
          correctIdx = q.correctAnswer;
        } else if (Array.isArray(q.options)) {
          const match = q.options.findIndex((opt: string) => 
            opt.toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim() ||
            opt.toLowerCase().includes(String(q.correctAnswer).toLowerCase())
          );
          if (match !== -1) correctIdx = match;
        }

        const fallbackOptions = ['Option A', 'Option B', 'Option C', 'Option D'];

        return {
          id: q.id || `q_ai_${idx + 1}`,
          question: q.question,
          type: 'mcq',
          options: (Array.isArray(q.options) && q.options.length >= 2) ? q.options : fallbackOptions,
          correctAnswer: correctIdx,
          explanation: q.explanation || 'Verified NCERT theoretical solution.',
          marks: markPerQ,
          difficulty: aiDifficulty,
          topic: topicTarget,
          boardYear: `${aiPattern.toUpperCase()} AI Simulator (2026)`,
        };
      });

      const newTest: ChapterTest = {
        id: `ai_test_${Date.now()}`,
        title: `AI Mock Test: ${topicTarget} (${aiPattern.toUpperCase()})`,
        classGrade: aiClass,
        subject: aiSubject,
        chapter: topicTarget,
        difficulty: aiDifficulty === 'board_level' ? 'Board Standard' : (aiDifficulty === 'hard' ? 'Exemplar High' : 'Conceptual Foundation'),
        durationMinutes: Math.max(5, Math.round(formattedQuestions.length * 2)),
        totalMarks: formattedQuestions.length * markPerQ,
        questions: formattedQuestions,
      };

      setShowAiModal(false);
      startTest(newTest, aiPattern);
    } catch (err: any) {
      console.error('AI Test Generation Error:', err);
      setAiTestError(err.message || 'Could not synthesize test. Please try again.');
    } finally {
      setIsGeneratingAiTest(false);
    }
  };

  // Score calculation with NEET / JEE negative marking
  const calculateScore = () => {
    if (!activeTest) return { score: 0, maxScore: 0, correctCount: 0, wrongCount: 0, unattemptedCount: 0, predictedRank: 0, percentile: '0' };
    
    const isNegativeMarking = examPattern === 'neet' || examPattern === 'jee';
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    activeTest.questions.forEach((q) => {
      const qMarks = q.marks || (isNegativeMarking ? 4 : 1);
      maxScore += qMarks;
      const ans = userAnswers[q.id];

      if (ans === undefined) {
        unattemptedCount++;
      } else if (ans === q.correctAnswer) {
        score += qMarks;
        correctCount++;
      } else {
        wrongCount++;
        if (isNegativeMarking) {
          score -= 1; // -1 Negative marking for NEET / JEE
        }
      }
    });

    const ratio = maxScore > 0 ? Math.max(0, score) / maxScore : 0;
    const predictedRank = Math.max(1, Math.round(35000 * (1 - ratio) + 14));
    const percentile = (Math.min(99.9, Math.max(12, ratio * 100 * 0.98 + 1.8))).toFixed(1);

    return { 
      score, 
      maxScore, 
      correctCount, 
      wrongCount, 
      unattemptedCount, 
      predictedRank, 
      percentile 
    };
  };

  // Format MM:SS for countdown timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. ACTIVE EXAMINATION INTERFACE (Dark Luxury CBT & OMR Arena)
  if (activeTest) {
    const q = activeTest.questions[currentQuestionIndex];
    const isAnswered = userAnswers[q.id] !== undefined;
    const isMarked = !!markedForReview[q.id];
    const scoreStats = testSubmitted ? calculateScore() : null;

    return (
      <div className="w-full max-w-6xl mx-auto py-8 space-y-8 text-slate-100">
        {/* Top Assessment HUD */}
        <div className="rounded-2xl bg-[#070a14] border border-white/[0.08] p-6 shadow-2xl flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 text-xs font-mono font-semibold">
              <span className="text-amber-400">{activeTest.classGrade} &bull; {activeTest.subject}</span>
              <span className="text-slate-600">/</span>
              <span className="text-violet-400 uppercase font-bold">{examPattern} Pattern</span>
              <span className="text-slate-600">/</span>
              <span className="text-emerald-400">{activeTest.difficulty}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {activeTest.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: CBT vs OMR */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setViewMode('cbt')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cbt'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CBT Mode
              </button>
              <button
                onClick={() => setViewMode('omr')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'omr'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>OMR Sheet</span>
              </button>
            </div>

            {!testSubmitted && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-bold transition-all ${
                timeRemaining <= 300 
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse' 
                  : 'bg-slate-900 border-white/10 text-amber-300'
              }`}>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{formatTimer(timeRemaining)}</span>
              </div>
            )}

            <button
              onClick={handleResetTest}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              Exit Arena
            </button>
          </div>
        </div>

        {/* Post-Submission Scorecard & Analytical Breakdown */}
        {testSubmitted && scoreStats && (
          <div className="rounded-3xl bg-[#070a14] border border-amber-400/30 p-8 md:p-12 text-center space-y-8 animate-in fade-in shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>+100 XP Awarded for Exam Practice!</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                All India Mock Assessment Scorecard
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Verified against 2026–27 marking criteria for <strong className="text-white">{activeTest.chapter}</strong>.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/[0.06] space-y-1">
                <div className="text-xs text-slate-400 font-mono">Net Score</div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono">
                  {scoreStats.score} / {scoreStats.maxScore}
                </div>
                {examPattern !== 'cbse' && (
                  <div className="text-[10px] text-slate-500 font-mono">+4 / -1 applied</div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/[0.06] space-y-1">
                <div className="text-xs text-slate-400 font-mono">Predicted AIR Rank</div>
                <div className="text-2xl font-extrabold text-violet-400 font-mono">
                  #{scoreStats.predictedRank}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">out of 35k aspirants</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/[0.06] space-y-1">
                <div className="text-xs text-slate-400 font-mono">Estimated Percentile</div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {scoreStats.percentile}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Top bracket</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/[0.06] space-y-1">
                <div className="text-xs text-slate-400 font-mono">Correct / Wrong</div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  <span className="text-emerald-400">{scoreStats.correctCount}</span> / <span className="text-rose-400">{scoreStats.wrongCount}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{scoreStats.unattemptedCount} skipped</div>
              </div>
            </div>

            {/* Post-Test Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              {onGoToStudio && (
                <button
                  onClick={() => {
                    const cmd = `/handwriting class:${activeTest.classGrade.replace('Class ', '')} subject:${activeTest.subject} chapter:${activeTest.chapter} style:gel-pen paper:ruled ink:royal-blue thinking:high`;
                    onGoToStudio(cmd);
                  }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all shadow-xl hover:shadow-amber-400/20 active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Review Chapter in Handwritten Notes Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  setUserAnswers({});
                  setMarkedForReview({});
                  setTestSubmitted(false);
                  setCurrentQuestionIndex(0);
                  setTimeRemaining(activeTest.durationMinutes * 60);
                  setTimerActive(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Retake Examination</span>
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Split Examination Arena (CBT or OMR Mode) */}
        {viewMode === 'cbt' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (Question Card) */}
            <div className="lg:col-span-8 rounded-2xl bg-[#070a14] border border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Question Header & Kicker */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300 font-bold">
                    Question {currentQuestionIndex + 1} of {activeTest.questions.length}
                  </span>

                  {q.boardYear && (
                    <span className="text-xs font-sans text-amber-400/90 font-medium">
                      {q.boardYear}
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Weightage: <strong className="text-amber-400 font-bold">+{q.marks} Marks</strong>
                  {examPattern !== 'cbse' && <span className="text-rose-400"> (-1 for incorrect)</span>}
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-medium text-white whitespace-pre-line leading-relaxed">
                  {q.question}
                </h2>
              </div>

              {/* Options List */}
              {q.type === 'mcq' && q.options && (
                <div className="space-y-3 pt-2">
                  {q.options.map((optionText, optIndex) => {
                    const isSelected = userAnswers[q.id] === optIndex;
                    const isCorrect = testSubmitted && q.correctAnswer === optIndex;
                    const isWrongSelected = testSubmitted && isSelected && q.correctAnswer !== optIndex;

                    let borderClass = 'border-white/[0.08] bg-slate-900/40 hover:bg-slate-900 hover:border-white/20 text-slate-200';
                    let badgeClass = 'bg-slate-800 text-slate-400';

                    if (isSelected && !testSubmitted) {
                      borderClass = 'border-amber-400 bg-amber-400/10 text-white shadow-sm ring-1 ring-amber-400/50';
                      badgeClass = 'bg-amber-400 text-slate-950 font-bold';
                    } else if (testSubmitted) {
                      if (isCorrect) {
                        borderClass = 'border-emerald-500 bg-emerald-500/15 text-emerald-100';
                        badgeClass = 'bg-emerald-500 text-white font-bold';
                      } else if (isWrongSelected) {
                        borderClass = 'border-rose-500 bg-rose-500/15 text-rose-100';
                        badgeClass = 'bg-rose-500 text-white font-bold';
                      }
                    }

                    const optionLetters = ['A', 'B', 'C', 'D'];

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        disabled={testSubmitted}
                        onClick={() => handleSelectOption(q.id, optIndex)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${borderClass}`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 transition-colors ${badgeClass}`}>
                          {optionLetters[optIndex]}
                        </span>
                        <span className="text-sm font-medium leading-relaxed pt-0.5">
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Explanation Card (Revealed after submission) */}
              {testSubmitted && (
                <div className="p-5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>NCERT Verified Explanation</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              )}

              {/* In-Test Navigation Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {!testSubmitted && isAnswered && (
                    <button
                      type="button"
                      onClick={() => handleClearAnswer(q.id)}
                      className="px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Clear Choice
                    </button>
                  )}

                  {!testSubmitted && (
                    <button
                      type="button"
                      onClick={() => handleToggleMarkForReview(q.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isMarked 
                          ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' 
                          : 'bg-slate-900 hover:bg-slate-800 border-white/10 text-slate-400'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                    </button>
                  )}
                </div>

                <div>
                  {currentQuestionIndex < activeTest.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      <span>Save &amp; Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    !testSubmitted && (
                      <button
                        type="button"
                        onClick={handleSubmitTest}
                        className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Examination</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (Question Palette Grid) */}
            <div className="lg:col-span-4 rounded-2xl bg-[#070a14] border border-white/[0.08] p-6 space-y-6 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Question Palette
                </h3>
                <p className="text-xs text-slate-400">
                  Click any question number to navigate instantly.
                </p>
              </div>

              {/* Questions Grid */}
              <div className="grid grid-cols-5 gap-2.5">
                {activeTest.questions.map((ques, idx) => {
                  const answered = userAnswers[ques.id] !== undefined;
                  const marked = !!markedForReview[ques.id];
                  const isCurrent = idx === currentQuestionIndex;

                  let btnStyle = 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/20';

                  if (isCurrent) {
                    btnStyle = 'ring-2 ring-amber-400 text-white font-bold bg-amber-400/20 border-amber-400/40';
                  } else if (marked) {
                    btnStyle = 'bg-violet-500/20 text-violet-300 border-violet-500/40 font-bold';
                  } else if (answered) {
                    btnStyle = 'bg-amber-400 text-slate-950 font-bold';
                  }

                  return (
                    <button
                      key={ques.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-10 rounded-xl text-xs font-mono transition-all border cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Palette Status Legend */}
              <div className="space-y-2 pt-4 border-t border-white/[0.08] text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-400"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-violet-500/30 border border-violet-500/60"></span>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-white/10"></span>
                  <span>Unattempted</span>
                </div>
              </div>

              {!testSubmitted && (
                <div className="pt-2">
                  <button
                    onClick={handleSubmitTest}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-400/30 transition-all cursor-pointer"
                  >
                    Finalize &amp; Submit Test
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* OMR BUBBLE SHEET VIEW (Realistic Pen & Paper Optical Mark Matrix) */
          <div className="rounded-2xl bg-[#070a14] border border-white/[0.08] p-6 sm:p-10 space-y-8 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  <span>Optical Mark Recognition (OMR) Answer Sheet</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click circles (A, B, C, D) to bubble your answers just like real board or NEET/JEE offline examination.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Bubble Fill: <strong className="text-amber-400">{Object.keys(userAnswers).length}</strong> of {activeTest.questions.length} Answered
              </div>
            </div>

            {/* OMR Questions Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTest.questions.map((ques, idx) => {
                const currentAns = userAnswers[ques.id];
                const optionLetters = ['A', 'B', 'C', 'D'];

                return (
                  <div
                    key={ques.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                        Q{idx + 1}
                      </span>
                      <div className="text-xs text-white max-w-xs truncate">
                        {ques.question}
                      </div>
                    </div>

                    {/* 4 OMR Bubbles */}
                    <div className="flex items-center gap-2">
                      {optionLetters.map((letter, optIdx) => {
                        const isFilled = currentAns === optIdx;
                        const isCorrect = testSubmitted && ques.correctAnswer === optIdx;
                        const isWrongFilled = testSubmitted && isFilled && ques.correctAnswer !== optIdx;

                        let bubbleStyle = 'border-slate-600 text-slate-400 hover:border-amber-400 hover:text-white bg-slate-950';

                        if (isFilled && !testSubmitted) {
                          bubbleStyle = 'bg-amber-400 border-amber-400 text-slate-950 font-black shadow-md scale-105';
                        } else if (testSubmitted) {
                          if (isCorrect) {
                            bubbleStyle = 'bg-emerald-500 border-emerald-500 text-white font-black';
                          } else if (isWrongFilled) {
                            bubbleStyle = 'bg-rose-500 border-rose-500 text-white font-black';
                          }
                        }

                        return (
                          <button
                            key={letter}
                            disabled={testSubmitted}
                            onClick={() => handleSelectOption(ques.id, optIdx)}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono font-bold transition-all cursor-pointer disabled:cursor-default ${bubbleStyle}`}
                            title={`Option ${letter}`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {!testSubmitted && (
              <div className="pt-6 border-t border-white/[0.08] flex justify-end">
                <button
                  onClick={handleSubmitTest}
                  className="px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all shadow-xl active:scale-95 cursor-pointer"
                >
                  Submit OMR Sheet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. TEST CATALOG & SELECTION ARENA (Dark Luxury Portal)
  return (
    <div className="w-full max-w-6xl mx-auto py-8 space-y-12 text-slate-100">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#060913] border border-white/[0.08] p-8 md:p-12 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4 text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>National Examination Suite &amp; AI Simulator</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              NCERT Chapter Tests &amp; Mock Arena
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Authentic multiple-choice and competency problems with official CBSE, NEET, and JEE scoring patterns. Practice in standard computer-based mode or realistic physical OMR bubble sheets.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  if (!user) {
                    onRequireAuth();
                    return;
                  }
                  setShowAiModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Custom AI Mock Test</span>
              </button>

              {!user && (
                <button
                  onClick={onRequireAuth}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-white/10 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Log in for Full Catalog</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 hidden lg:block">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=80"
                alt="Student taking exam with paper and timer"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Class and Subject Filters: Clean Segmented Controls */}
      <div className="space-y-4">
        {/* Class Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {['All', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClassFilter(cls)}
              className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedClassFilter === cls
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {['All', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Science'].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubjectFilter(subj)}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs ${
                selectedSubjectFilter === subj
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold'
                  : 'bg-transparent text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Test Catalog Cards: Consistent Symmetrical Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="rounded-2xl bg-[#070a14] border border-white/[0.08] hover:border-amber-400/30 p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-semibold">
                  {test.classGrade} &bull; {test.subject}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {test.durationMinutes} mins
                </span>
              </div>

              <div>
                <h2 className="font-bold text-white text-lg group-hover:text-amber-300 transition-colors leading-snug">
                  {test.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chapter: <strong className="text-slate-200">{test.chapter}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/[0.06]">
                <span>{test.questions.length} Questions</span>
                <span>&bull;</span>
                <span>{test.totalMarks} Marks</span>
                <span>&bull;</span>
                <span className="text-violet-400">{test.difficulty}</span>
              </div>
            </div>

            {/* Exactly One CTA Button per Test Card */}
            <div>
              <button
                onClick={() => startTest(test, 'cbse')}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
              >
                <span>Begin Examination</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. AI Mock Test Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-[#0a0f24] border border-amber-400/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI National Examination Paper Setter</span>
              </div>
              <h3 className="text-xl font-bold text-white">Generate Custom AI Mock Test</h3>
              <p className="text-xs text-slate-400">
                Generate custom examination questions matching exact national marking schemes.
              </p>
            </div>

            {aiTestError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {aiTestError}
              </div>
            )}

            <div className="space-y-4 text-xs font-semibold">
              {/* Topic / Chapter Input */}
              <div className="space-y-1.5">
                <label className="text-slate-300">Chapter / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Life Processes, Light, Laws of Motion, Chemical Bonding..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Class & Subject */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300">Target Class</label>
                  <select
                    value={aiClass}
                    onChange={(e) => setAiClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300">Subject</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Science">Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              </div>

              {/* Pattern & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300">Exam Pattern</label>
                  <select
                    value={aiPattern}
                    onChange={(e: any) => setAiPattern(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="cbse">CBSE Board (Standard)</option>
                    <option value="neet">NEET UG (+4 / -1)</option>
                    <option value="jee">JEE Main (+4 / -1)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300">Question Count</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={5}>5 Questions (Express Quick Test)</option>
                    <option value={10}>10 Questions (Standard CBSE / NEET)</option>
                    <option value={15}>15 Questions (Full Mock)</option>
                    <option value={20}>20 Questions (Extended Exam)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled={isGeneratingAiTest}
                onClick={handleGenerateAiTest}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                {isGeneratingAiTest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing Exam Paper with AI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Generate &amp; Start Test Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
