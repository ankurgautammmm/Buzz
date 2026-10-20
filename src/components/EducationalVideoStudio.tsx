import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Video, 
  Download, 
  Volume2, 
  VolumeX, 
  Clock, 
  MessageSquare, 
  RefreshCw, 
  Share2, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  Sliders, 
  Smartphone, 
  Monitor, 
  Music, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  Eye,
  Maximize2,
  Atom,
  HelpCircle,
  Film,
  Zap,
  Bookmark,
  Award
} from 'lucide-react';
import { UserProfile } from '../types';
import { logger } from '../services/logger';

interface SceneData {
  sceneNumber: number;
  timestamp?: string;
  durationSeconds: number;
  onScreenText: string;
  narrationText: string;
  visualConcept: string;
  visualDescription: string;
  badgeLabel?: string;
  accentColor?: string;
}

interface ShortsScriptData {
  title: string;
  topic: string;
  classGrade: string;
  subject: string;
  targetAudience: string;
  template: 'shorts_vertical' | 'landscape_16_9';
  language: string;
  voiceStyle: string;
  visualStyle: string;
  captionStyle: string;
  bgMusicStyle: string;
  targetDurationSeconds: number;
  actualDurationSeconds?: number;
  intro: {
    durationSeconds: number;
    narration: string;
    hookText: string;
    visualCue: string;
  };
  scenes: SceneData[];
  outro: {
    durationSeconds: number;
    narration: string;
    callToAction: string;
    questionForComments: string;
  };
  quizQuestion?: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  };
}

interface ShortsJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  message: string;
  scriptData?: ShortsScriptData;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

interface EducationalVideoStudioProps {
  user: UserProfile | null;
  activeClass: string;
  onRequireAuth: () => void;
}

// 8 Curated High-Yield NCERT Curriculum Quick Presets
const TOPIC_PRESETS = [
  {
    title: 'Human Heart & Blood Circulation',
    classGrade: 'Class 10',
    subject: 'Biology',
    desc: '4 Chambers, valves & double circulation path',
    concept: 'heart_circulation',
    icon: '❤️'
  },
  {
    title: "Snell's Law & Refraction of Light",
    classGrade: 'Class 10',
    subject: 'Physics',
    desc: 'Bending of light ray across air-glass interface',
    concept: 'refraction_optics',
    icon: '🔦'
  },
  {
    title: 'Photosynthesis & Chloroplast Mechanism',
    classGrade: 'Class 10',
    subject: 'Biology',
    desc: 'Light-dependent thylakoid reactions & glucose equation',
    concept: 'cell_chloroplast',
    icon: '🍃'
  },
  {
    title: "Ohm's Law & Circuit Resistance (V = I·R)",
    classGrade: 'Class 10',
    subject: 'Physics',
    desc: 'Potential difference, current flow & Ohm plot',
    concept: 'electric_circuit',
    icon: '⚡'
  },
  {
    title: 'Acid-Base Titration & pH Scale Curve',
    classGrade: 'Class 11',
    subject: 'Chemistry',
    desc: 'Equivalence point, indicator color change & [H+]',
    concept: 'chemical_titration',
    icon: '🧪'
  },
  {
    title: 'Quadratic Parabola & Nature of Roots',
    classGrade: 'Class 10',
    subject: 'Mathematics',
    desc: 'Discriminant D, vertex formula & real axis intercepts',
    concept: 'parabola_graph',
    icon: '📐'
  },
  {
    title: 'DNA Double Helix & Base Pairing',
    classGrade: 'Class 12',
    subject: 'Biology',
    desc: 'Watson-Crick antiparallel strands & H-bonds',
    concept: 'dna_helix',
    icon: '🧬'
  },
  {
    title: 'Simple Harmonic Oscillator & Gravity',
    classGrade: 'Class 11',
    subject: 'Physics',
    desc: 'Pendulum period T = 2π√(L/g) on Earth vs Moon',
    concept: 'pendulum_shm',
    icon: '⏱️'
  }
];

export const EducationalVideoStudio: React.FC<EducationalVideoStudioProps> = ({
  user,
  activeClass,
  onRequireAuth,
}) => {
  // Input Configuration States
  const [topicInput, setTopicInput] = useState('Human Heart & Blood Circulation');
  const [selectedClass, setSelectedClass] = useState(activeClass || 'Class 10');
  const [selectedSubject, setSelectedSubject] = useState('Biology');
  const [targetAudience, setTargetAudience] = useState('CBSE Board 2026');
  const [selectedDuration, setSelectedDuration] = useState<number>(45); // 15, 30, 45, 60, 90
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish');
  const [selectedVoice, setSelectedVoice] = useState('Kore'); // Kore, Puck, Fenrir, Zephyr
  const [selectedVisualStyle, setSelectedVisualStyle] = useState('Scientific Animation');
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState('Karaoke High-Contrast');
  const [selectedBgMusic, setSelectedBgMusic] = useState('Subtle Piano Intro/Outro');
  const [selectedTemplate, setSelectedTemplate] = useState<'shorts_vertical' | 'landscape_16_9'>('shorts_vertical');
  const [customCallToAction, setCustomCallToAction] = useState('');

  // Active Job & Rendering Pipeline States
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ShortsJobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentShorts, setRecentShorts] = useState<ShortsJobStatus[]>([]);

  // Video Player States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'storyboard' | 'gallery'>('player');

  // Load Recent Shorts on mount
  useEffect(() => {
    fetchRecentShorts();
  }, []);

  const fetchRecentShorts = async () => {
    try {
      const res = await fetch('/api/shorts/recent');
      const data = await res.json();
      if (data.success && Array.isArray(data.shorts)) {
        setRecentShorts(data.shorts);
      }
    } catch (err) {
      logger.error('EducationalVideoStudio', 'Failed to load recent shorts', err);
    }
  };

  // Poll Job Status when a job is active
  useEffect(() => {
    if (!currentJobId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/shorts/status/${currentJobId}`);
        if (!res.ok) return;
        const data: ShortsJobStatus = await res.json();
        if (!isMounted) return;

        setJobStatus(data);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setIsSubmitting(false);
          if (data.status === 'completed') {
            fetchRecentShorts();
          }
        }
      } catch (err) {
        logger.error('EducationalVideoStudio', 'Error polling job status', err);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentJobId]);

  // Handle Preset Topic Selection
  const handleSelectPreset = (preset: typeof TOPIC_PRESETS[0]) => {
    setTopicInput(preset.title);
    setSelectedClass(preset.classGrade);
    setSelectedSubject(preset.subject);
  };

  // Submit Generation Pipeline
  const handleStartGeneration = async () => {
    if (!topicInput.trim()) return;

    setIsSubmitting(true);
    setJobStatus({
      jobId: 'init',
      status: 'pending',
      stage: 'queued',
      progress: 5,
      message: 'Initializing background video rendering worker...',
    });

    try {
      const response = await fetch('/api/shorts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          classGrade: selectedClass,
          subject: selectedSubject,
          targetAudience,
          durationSeconds: selectedDuration,
          language: selectedLanguage,
          voiceStyle: selectedVoice,
          visualStyle: selectedVisualStyle,
          captionStyle: selectedCaptionStyle,
          bgMusicStyle: selectedBgMusic,
          template: selectedTemplate,
          callToAction: customCallToAction.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.jobId) {
        setCurrentJobId(data.jobId);
      } else {
        throw new Error(data.error || 'Failed to start shorts pipeline');
      }
    } catch (err: any) {
      logger.error('EducationalVideoStudio', 'Video generation error', err);
      setIsSubmitting(false);
      setJobStatus({
        jobId: 'err',
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: err.message || 'Generation failed. Please try again.',
        error: err.message,
      });
    }
  };

  // Video Element Handlers
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration);
    videoRef.current.playbackRate = playbackSpeed;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleDownloadMp4 = () => {
    if (!jobStatus?.videoUrl) return;
    const a = document.createElement('a');
    a.href = jobStatus.videoUrl;
    const safeTopic = (jobStatus.scriptData?.topic || topicInput).replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `BuzzingBrain_Short_${safeTopic}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    if (!jobStatus?.videoUrl) return;
    const fullUrl = `${window.location.origin}${jobStatus.videoUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyScript = () => {
    if (!jobStatus?.scriptData) return;
    const s = jobStatus.scriptData;
    let full = `BUZZING BRAIN SHORTS SCRIPT: ${s.title}\n`;
    full += `Topic: ${s.topic} | ${s.classGrade} ${s.subject} | Language: ${s.language}\n`;
    full += `Target Audience: ${s.targetAudience} | Duration: ~${s.actualDurationSeconds || s.targetDurationSeconds}s\n\n`;
    full += `[INTRO (0:00 - 0:0${s.intro.durationSeconds})]\n`;
    full += `Hook Text: ${s.intro.hookText}\n`;
    full += `Visual: ${s.intro.visualCue}\n`;
    full += `Narration: ${s.intro.narration}\n\n`;
    s.scenes.forEach(sc => {
      full += `[SCENE ${sc.sceneNumber}]\n`;
      full += `On-Screen Text: ${sc.onScreenText}\n`;
      full += `Visual: ${sc.visualDescription}\n`;
      full += `Narration: ${sc.narrationText}\n\n`;
    });
    full += `[OUTRO]\n`;
    full += `Narration: ${s.outro.narration}\n`;
    full += `Comment Challenge: ${s.outro.questionForComments}\n`;
    full += `Call To Action: ${s.outro.callToAction}\n`;

    navigator.clipboard.writeText(full);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Identify active scene for timeline highlights
  const activeSceneIndex = useMemo(() => {
    if (!jobStatus?.scriptData?.scenes || currentTime === 0) return 0;
    const introDur = jobStatus.scriptData.intro.durationSeconds || 4;
    if (currentTime < introDur) return 0;
    
    let accumulated = introDur;
    for (let i = 0; i < jobStatus.scriptData.scenes.length; i++) {
      accumulated += (jobStatus.scriptData.scenes[i].durationSeconds || 10);
      if (currentTime <= accumulated) return i + 1;
    }
    return jobStatus.scriptData.scenes.length + 1; // Outro
  }, [currentTime, jobStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold mb-3">
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span>AI Shorts Studio &bull; Real MP4 Video Rendering Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Educational Shorts Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Generate <strong>real, high-resolution vertical MP4 videos</strong> with synchronized AI narration, scientific vector animations, board exam secret tips, and comment challenge quizzes. Formatted for YouTube Shorts, Reels, and mobile learners.
          </p>
        </div>

        {/* Global Action Pills */}
        <div className="flex items-center gap-2">
          {jobStatus?.videoUrl && (
            <button
              onClick={handleDownloadMp4}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download MP4</span>
            </button>
          )}

          {jobStatus?.scriptData && (
            <button
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK PRESETS CAROUSEL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
          <span>⚡ 1-Click NCERT Syllabus Presets</span>
          <span className="text-amber-400">Classes 9–12 Prescribed</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TOPIC_PRESETS.slice(0, 4).map((p) => (
            <button
              key={p.title}
              onClick={() => handleSelectPreset(p)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group ${
                topicInput === p.title
                  ? 'bg-rose-500/15 border-rose-500/50 shadow-md scale-[1.01]'
                  : 'bg-slate-950/70 border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{p.icon}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold">
                  {p.classGrade}
                </span>
              </div>
              <div className="font-bold text-xs text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                {p.title}
              </div>
              <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                {p.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* WORKFLOW CONFIGURATION CARD */}
      <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Video Configuration &amp; Directing Parameters</h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            FFmpeg H.264 &bull; 9:16 Vertical
          </span>
        </div>

        {/* Row 1: Topic, Class, Subject, Audience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Video Topic / Core NCERT Question <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Human Heart & Blood Circulation, Snell's Law..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class / Standard</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              <option value="Science">Science (General)</option>
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              <option value="CBSE Board 2026">CBSE Board Exam 2026</option>
              <option value="NEET UG Aspirants">NEET UG Medical Aspirants</option>
              <option value="JEE Main Candidates">JEE Main Engineering</option>
              <option value="Conceptual Foundation">Conceptual Foundation</option>
            </select>
          </div>
        </div>

        {/* Row 2: Duration, Language, Voice Persona, Visual Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pt-2">
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Duration: <span className="text-amber-400 font-bold">{selectedDuration} Seconds</span>
            </label>
            <div className="flex gap-1.5">
              {[15, 30, 45, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDuration(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDuration === d
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              <option value="Hinglish">Hinglish (Most Engaging for Indian Students)</option>
              <option value="English">English (Lucid Academic)</option>
              <option value="Hindi">Hindi (सरल शुद्ध हिंदी)</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Voice Persona (Gemini TTS)</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              <option value="Kore">Kore &bull; Friendly &amp; Crisp Female (Recommended)</option>
              <option value="Puck">Puck &bull; Dynamic &amp; High-Energy Male</option>
              <option value="Fenrir">Fenrir &bull; Deep Authoritative Teacher</option>
              <option value="Zephyr">Zephyr &bull; Soft &amp; Lucid Explainer</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Visual Scene Style</label>
            <select
              value={selectedVisualStyle}
              onChange={(e) => setSelectedVisualStyle(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            >
              <option value="Scientific Animation">Scientific Vector Animation</option>
              <option value="3D Demonstration">3D Demonstration &amp; Models</option>
              <option value="Animated Diagrams">Labeled Schematic Diagrams</option>
              <option value="Board Exam Topper">Topper Secret &amp; Pitfall Comparison</option>
            </select>
          </div>
        </div>

        {/* Row 3: Format Selector, BGM & Launch Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Aspect Ratio:</span>
            <button
              type="button"
              onClick={() => setSelectedTemplate('shorts_vertical')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTemplate === 'shorts_vertical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 Vertical (Shorts &bull; Reels)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplate('landscape_16_9')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTemplate === 'landscape_16_9'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9 Landscape (YouTube Player)</span>
            </button>
          </div>

          <button
            onClick={handleStartGeneration}
            disabled={isSubmitting || !topicInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:brightness-110 text-white font-extrabold text-sm transition-all shadow-xl shadow-rose-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{isSubmitting ? 'Rendering Video...' : 'Generate & Render Real Short'}</span>
          </button>
        </div>
      </div>

      {/* LIVE RENDERING PROGRESS MONITOR */}
      {isSubmitting && jobStatus && (
        <div className="p-6 rounded-3xl bg-slate-950 border border-amber-400/30 space-y-4 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 animate-pulse">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  Rendering Educational Short &bull; Stage: <span className="text-amber-400 uppercase font-mono">{jobStatus.stage.replace('_', ' ')}</span>
                </h4>
                <p className="text-xs text-slate-400">{jobStatus.message}</p>
              </div>
            </div>
            <span className="text-xl font-mono font-black text-amber-400">{jobStatus.progress}%</span>
          </div>

          {/* Animated Multi-Segment Progress Track */}
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 transition-all duration-500 rounded-full"
              style={{ width: `${jobStatus.progress}%` }}
            />
          </div>

          {/* Step Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 text-[11px] font-mono">
            <div className={`p-2 rounded-xl text-center border ${jobStatus.progress >= 20 ? 'bg-amber-400/10 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/5 text-slate-500'}`}>
              1. Script
            </div>
            <div className={`p-2 rounded-xl text-center border ${jobStatus.progress >= 40 ? 'bg-amber-400/10 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/5 text-slate-500'}`}>
              2. TTS Audio
            </div>
            <div className={`p-2 rounded-xl text-center border ${jobStatus.progress >= 60 ? 'bg-amber-400/10 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/5 text-slate-500'}`}>
              3. Visuals
            </div>
            <div className={`p-2 rounded-xl text-center border ${jobStatus.progress >= 80 ? 'bg-amber-400/10 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/5 text-slate-500'}`}>
              4. FFmpeg
            </div>
            <div className={`p-2 rounded-xl text-center border ${jobStatus.progress >= 95 ? 'bg-amber-400/10 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/5 text-slate-500'}`}>
              5. Validate
            </div>
            <div className={`p-2 rounded-xl text-center border ${jobStatus.progress >= 100 ? 'bg-emerald-400/10 border-emerald-400/40 text-emerald-300' : 'bg-white/5 border-white/5 text-slate-500'}`}>
              6. Ready!
            </div>
          </div>
        </div>
      )}

      {/* FAILED JOB ALERT */}
      {jobStatus?.status === 'failed' && (
        <div className="p-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block text-sm text-white font-bold">Rendering Pipeline Notice</strong>
              <span>{jobStatus.error || jobStatus.message}</span>
            </div>
          </div>
          <button
            onClick={handleStartGeneration}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold cursor-pointer"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* STUDIO STAGE: REAL VIDEO PLAYER & TIMED STORYBOARD */}
      {jobStatus?.videoUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
          {/* LEFT COLUMN: REAL NATIVE HTML5 9:16 VIDEO PLAYER */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Phone Bezel Casing */}
            <div className="w-full max-w-[360px] bg-black border-4 border-slate-800 rounded-[48px] p-3 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
              {/* Speaker Notch */}
              <div className="w-28 h-5 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800 mr-2"></div>
                <div className="w-12 h-1.5 rounded-full bg-slate-800"></div>
              </div>

              {/* Inner Video Container */}
              <div className="w-full aspect-[9/16] bg-slate-950 rounded-[36px] overflow-hidden relative flex flex-col justify-between border border-white/10 group">
                <video
                  ref={videoRef}
                  src={jobStatus.videoUrl}
                  poster={jobStatus.thumbnailUrl}
                  playsInline
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={handleTogglePlay}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Overlaid Header */}
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <img
                      src="/BuzzingBrain_Video_Watermark_150x150.png"
                      alt="Buzzing Brain"
                      className="w-8 h-8 rounded-full border border-amber-400 object-cover shadow-lg"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div>
                      <span className="font-extrabold text-xs text-white tracking-tight drop-shadow-md">Buzzing Brain</span>
                      <span className="text-[9px] text-amber-300 font-mono block drop-shadow-md">@BrainBuzz2702</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/70 border border-white/10 text-white backdrop-blur-md">
                    {formatSeconds(currentTime)} / {formatSeconds(videoDuration || jobStatus.duration || 45)}
                  </span>
                </div>

                {/* Large Center Play Overlay (Visible when paused) */}
                {!isPlaying && (
                  <button
                    onClick={handleTogglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all cursor-pointer z-20"
                  >
                    <Play className="w-8 h-8 fill-white ml-1 text-white" />
                  </button>
                )}

                {/* Overlaid Bottom Controls */}
                <div className="absolute bottom-3 left-3 right-3 z-20 space-y-2 p-2.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10">
                  {/* Scrubber Seek Track */}
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || jobStatus.duration || 45}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTogglePlay}
                        className="p-1 text-white hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      <button
                        onClick={handleToggleMute}
                        className="p-1 text-white hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="text-[11px] font-mono text-slate-300">
                        {formatSeconds(currentTime)}
                      </span>
                    </div>

                    {/* Speed Selector Pills */}
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      {[1.0, 1.25, 1.5].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          className={`px-1.5 py-0.5 rounded ${playbackSpeed === s ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Actions Bar Below Player */}
            <div className="w-full max-w-[360px] flex items-center justify-between gap-2 mt-4">
              <button
                onClick={handleDownloadMp4}
                className="flex-1 py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save MP4</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Copy Video Playback URL"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={handleStartGeneration}
                className="py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Regenerate this Short"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rerender</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: SCENE TIMELINE & EDUCATIONAL STORYBOARD */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Official Production Storyboard
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {jobStatus.scriptData?.title || `Buzzing Brain Shorts: ${topicInput}`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 rounded-xl bg-black border border-white/10 text-slate-300 font-bold">
                    ⏱️ {jobStatus.duration || jobStatus.scriptData?.actualDurationSeconds || 45}s Duration
                  </span>
                </div>
              </div>

              {/* Intro Hook Scene Card */}
              {jobStatus.scriptData?.intro && (
                <div 
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = 0;
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeSceneIndex === 0
                      ? 'bg-amber-400/10 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Intro Opening Hook (0:00 - 0:0{jobStatus.scriptData.intro.durationSeconds})</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-slate-300">
                      {jobStatus.scriptData.intro.durationSeconds}s
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white mb-1">
                    "{jobStatus.scriptData.intro.hookText}"
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {jobStatus.scriptData.intro.narration}
                  </p>
                </div>
              )}

              {/* Main Teaching Scenes List */}
              <div className="space-y-3">
                {jobStatus.scriptData?.scenes.map((scene, idx) => {
                  const isActive = activeSceneIndex === idx + 1;
                  return (
                    <div
                      key={scene.sceneNumber || idx}
                      onClick={() => {
                        // Estimate timestamp jump
                        const introDur = jobStatus.scriptData?.intro.durationSeconds || 4;
                        let jumpTime = introDur;
                        for (let k = 0; k < idx; k++) {
                          jumpTime += (jobStatus.scriptData?.scenes[k].durationSeconds || 10);
                        }
                        if (videoRef.current) videoRef.current.currentTime = jumpTime;
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-500/15 border-rose-400 shadow-lg ring-1 ring-rose-400/40'
                          : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                          <Atom className="w-3.5 h-3.5" />
                          <span>Scene {idx + 1}: {scene.badgeLabel || 'Scientific Concept'}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-slate-300">
                          {scene.durationSeconds}s
                        </span>
                      </div>

                      <div className="font-extrabold text-sm text-amber-300 mb-1">
                        {scene.onScreenText}
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed mb-2 font-sans">
                        {scene.narrationText}
                      </p>

                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
                        <span className="text-purple-400 font-mono font-bold shrink-0">Visual:</span>
                        <span>{scene.visualDescription}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Outro & Challenge Question Card */}
              {jobStatus.scriptData?.outro && (
                <div 
                  onClick={() => {
                    const dur = videoDuration || jobStatus.duration || 45;
                    const outroDur = jobStatus.scriptData?.outro.durationSeconds || 5;
                    if (videoRef.current) videoRef.current.currentTime = Math.max(0, dur - outroDur);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeSceneIndex > (jobStatus.scriptData?.scenes.length || 0)
                      ? 'bg-pink-500/15 border-pink-400 shadow-lg'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-pink-400 uppercase flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Outro &bull; Comment Challenge &amp; CTA</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-slate-300">
                      {jobStatus.scriptData.outro.durationSeconds}s
                    </span>
                  </div>

                  <div className="font-bold text-sm text-white mb-1">
                    "{jobStatus.scriptData.outro.questionForComments}"
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {jobStatus.scriptData.outro.narration}
                  </p>
                </div>
              )}

              {/* Quiz Answer Reveal Box */}
              {jobStatus.scriptData?.quizQuestion && (
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Video Comment Challenge Quiz &amp; Answer Key</span>
                  </div>
                  <p className="text-white font-medium">{jobStatus.scriptData.quizQuestion.question}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {jobStatus.scriptData.quizQuestion.options.map((opt, i) => (
                      <div key={i} className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300">
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-emerald-300 font-mono pt-1">
                    Correct: <strong>{jobStatus.scriptData.quizQuestion.answer}</strong> &bull; {jobStatus.scriptData.quizQuestion.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECENT SHORTS GALLERY */}
      {recentShorts.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-rose-400" />
              <h3 className="text-base font-bold text-white">Recently Generated Educational Shorts</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Library Storage Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentShorts.map((short) => (
              <div
                key={short.jobId}
                className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-xl hover:border-rose-400/50 transition-all flex flex-col justify-between group"
              >
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  {short.thumbnailUrl ? (
                    <img
                      src={short.thumbnailUrl}
                      alt={short.scriptData?.title || 'Educational Short'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 text-amber-300 font-bold border border-white/10">
                      {short.scriptData?.classGrade || 'Class 10'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/80 text-white font-bold">
                      ⏱️ {short.duration || 45}s
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setJobStatus(short);
                      setCurrentJobId(short.jobId);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-rose-500/80 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                  >
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </button>
                </div>

                <div className="p-3.5 space-y-2">
                  <h4 className="font-bold text-xs text-white line-clamp-1">
                    {short.scriptData?.topic || 'Educational Short'}
                  </h4>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {short.scriptData?.subject || 'Science'}
                    </span>
                    {short.videoUrl && (
                      <a
                        href={short.videoUrl}
                        download
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>MP4</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
