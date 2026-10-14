import React, { useState, useEffect, useRef } from 'react';
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
  Send,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { UserProfile } from '../types';

interface VideoScene {
  sceneNumber: number;
  timestamp: string;
  durationSeconds: number;
  visualDescription: string;
  onScreenText: string;
  narrationText: string;
  visualType: string;
  diagramSvgDescription?: string;
}

interface VideoScriptData {
  title: string;
  topic: string;
  classGrade: string;
  subject: string;
  template: 'shorts_vertical' | 'landscape_16_9';
  language: string;
  targetDurationSeconds: number;
  intro: {
    durationSeconds: number;
    narration: string;
    visualCue: string;
    bgMusicCue: string;
  };
  scenes: VideoScene[];
  outro: {
    durationSeconds: number;
    narration: string;
    callToAction: string;
    questionForComments: string;
    bgMusicCue: string;
  };
  quizQuestion?: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  };
}

interface EducationalVideoStudioProps {
  user: UserProfile | null;
  activeClass: string;
  onRequireAuth: () => void;
}

export const EducationalVideoStudio: React.FC<EducationalVideoStudioProps> = ({
  user,
  activeClass,
  onRequireAuth,
}) => {
  const [topicInput, setTopicInput] = useState('Photosynthesis & Chloroplast');
  const [selectedClass, setSelectedClass] = useState(activeClass || 'Class 10');
  const [selectedSubject, setSelectedSubject] = useState('Science');
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish');
  const [selectedTemplate, setSelectedTemplate] = useState<'shorts_vertical' | 'landscape_16_9'>('shorts_vertical');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoData, setVideoData] = useState<VideoScriptData | null>(null);

  // Playback & Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0); // in seconds
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1); // -1 = intro, >=0 = scene index, 999 = outro
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.1); // Slightly brisk for Shorts
  const [copiedScript, setCopiedScript] = useState(false);

  // Web Audio Synth for Piano Intro/Outro chords
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackTimerRef = useRef<any>(null);

  // Play subtle piano chord (C major / G major arpeggio with soft decay)
  const playSubtlePianoTune = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Elegant high piano notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; // Smooth mellow piano chime
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 1.3);
      });
    } catch (_) {
      // Audio autoplay policy handled silently
    }
  };

  // Speak Narration
  const speakText = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    
    // Choose appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('en-IN') || v.name.includes('India')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateScript = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput,
          classGrade: selectedClass,
          subject: selectedSubject,
          language: selectedLanguage,
          template: selectedTemplate,
          durationMinutes: selectedTemplate === 'shorts_vertical' ? 1 : 2,
        }),
      });

      const data = await response.json();
      if (data.success && data.script) {
        setVideoData(data.script);
        setCurrentPlaybackTime(0);
        setCurrentSceneIndex(-1);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Video generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Playback Loop
  useEffect(() => {
    if (!isPlaying || !videoData) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    const totalSeconds = videoData.targetDurationSeconds || 60;

    playbackTimerRef.current = setInterval(() => {
      setCurrentPlaybackTime(prev => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          setIsPlaying(false);
          window.speechSynthesis?.cancel();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, videoData]);

  // Handle Scene Transitions based on Current Time
  useEffect(() => {
    if (!videoData || !isPlaying) return;

    const introDuration = videoData.intro.durationSeconds;
    const outroDuration = videoData.outro.durationSeconds;
    const totalDuration = videoData.targetDurationSeconds;

    if (currentPlaybackTime <= introDuration) {
      if (currentSceneIndex !== -1) {
        setCurrentSceneIndex(-1);
        playSubtlePianoTune();
        speakText(videoData.intro.narration);
      }
    } else if (currentPlaybackTime >= totalDuration - outroDuration) {
      if (currentSceneIndex !== 999) {
        setCurrentSceneIndex(999);
        playSubtlePianoTune();
        speakText(videoData.outro.narration);
      }
    } else {
      // Teaching section: calculate which scene is active
      const teachingDuration = totalDuration - introDuration - outroDuration;
      const teachingProgress = currentPlaybackTime - introDuration;
      const sceneCount = videoData.scenes.length;
      const sceneSlot = teachingDuration / sceneCount;
      const targetSceneIdx = Math.min(sceneCount - 1, Math.floor(teachingProgress / sceneSlot));

      if (currentSceneIndex !== targetSceneIdx && targetSceneIdx >= 0) {
        setCurrentSceneIndex(targetSceneIdx);
        // Clean speech with zero background music for maximum pedagogical clarity
        speakText(videoData.scenes[targetSceneIdx].narrationText);
      }
    }
  }, [currentPlaybackTime, isPlaying, videoData]);

  const togglePlay = () => {
    if (!videoData) return;
    if (!isPlaying) {
      setIsPlaying(true);
      if (currentPlaybackTime === 0) {
        playSubtlePianoTune();
        speakText(videoData.intro.narration);
      }
    } else {
      setIsPlaying(false);
      window.speechSynthesis?.cancel();
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPlaybackTime(0);
    setCurrentSceneIndex(-1);
    window.speechSynthesis?.cancel();
  };

  const handleCopyScript = () => {
    if (!videoData) return;
    let fullScript = `Buzzing Brain Video Production Script: ${videoData.title}\n`;
    fullScript += `Target: ${videoData.classGrade} | ${videoData.subject} | Language: ${videoData.language}\n\n`;
    fullScript += `[INTRO (0:00 - 0:0${videoData.intro.durationSeconds})]\n`;
    fullScript += `Visual: ${videoData.intro.visualCue}\n`;
    fullScript += `Music: ${videoData.intro.bgMusicCue}\n`;
    fullScript += `Narration: ${videoData.intro.narration}\n\n`;
    videoData.scenes.forEach(s => {
      fullScript += `[SCENE ${s.sceneNumber} (${s.timestamp})]\n`;
      fullScript += `Visual: ${s.visualDescription}\n`;
      fullScript += `On-Screen Text: ${s.onScreenText}\n`;
      fullScript += `Narration: ${s.narrationText}\n\n`;
    });
    fullScript += `[OUTRO]\n`;
    fullScript += `Visual: Logo + Subscription Call to Action\n`;
    fullScript += `Narration: ${videoData.outro.narration}\n`;
    fullScript += `Comment Challenge: ${videoData.outro.questionForComments}\n`;

    navigator.clipboard.writeText(fullScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold mb-3">
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>AI Educational Video Studio &bull; YouTube Shorts Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Educational Video Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Convert any NCERT curriculum topic into a synchronized, timed educational teaching video. Features the official <strong>Buzzing Brain Branded Shorts Template</strong> with piano intro/outro chords, animated diagrams, and student comment hooks!
          </p>
        </div>

        {videoData && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyScript}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? 'Copied Script' : 'Copy Script'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Configuration Controls */}
      <div className="p-6 rounded-3xl astra-card border border-white/10 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Topic / Chapter</label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Photosynthesis, Ohm's Law..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class / Grade</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-rose-400"
            >
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-rose-400"
            >
              <option value="Science">Science</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-rose-400"
            >
              <option value="Hinglish">Hinglish (Most Engaging)</option>
              <option value="English">English (Lucid)</option>
              <option value="Hindi">Hindi (सरल हिंदी)</option>
            </select>
          </div>
        </div>

        {/* Template Selector & Generate Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Template Format:</span>
            <button
              onClick={() => setSelectedTemplate('shorts_vertical')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTemplate === 'shorts_vertical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Buzzing Brain Shorts (9:16 Vertical &bull; 60s)</span>
            </button>
            <button
              onClick={() => setSelectedTemplate('landscape_16_9')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTemplate === 'landscape_16_9'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Video (16:9 Landscape &bull; 2 min)</span>
            </button>
          </div>

          <button
            onClick={handleGenerateScript}
            disabled={isGenerating || !topicInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Synthesizing Production Scenes...' : 'Generate Teaching Video'}</span>
          </button>
        </div>
      </div>

      {/* Studio Stage: Live Player Preview & Storyboard */}
      {videoData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Video Player (Shorts 9:16 or Landscape) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] bg-black border-2 border-slate-800 rounded-[38px] p-3 shadow-2xl relative overflow-hidden">
              {/* Outer Phone Bezel Details */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
              </div>

              {/* Inner Screen Display */}
              <div className="w-full aspect-[9/16] bg-slate-950 rounded-[28px] overflow-hidden relative flex flex-col justify-between p-5 border border-white/10 select-none">
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-slate-950 pointer-events-none"></div>

                {/* Top Overlay: Buzzing Brain Watermark Logo */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/BuzzingBrain_Video_Watermark_150x150.png"
                      alt="Buzzing Brain"
                      className="w-8 h-8 rounded-full border border-amber-400 object-cover shadow-lg"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div>
                      <span className="font-extrabold text-xs text-white tracking-tight block">Buzzing Brain</span>
                      <span className="text-[9px] text-amber-300 font-mono">@BrainBuzz2702</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-white">
                    {Math.floor(currentPlaybackTime / 60)}:{(currentPlaybackTime % 60).toString().padStart(2, '0')} / 1:00
                  </span>
                </div>

                {/* Center Content: Dynamic Visual Rendering based on current scene */}
                <div className="relative z-10 my-auto text-center space-y-4 px-2">
                  {currentSceneIndex === -1 ? (
                    // Intro Scene Card
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-amber-400/30 shadow-xl animate-pulse">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                        Buzzing Brain Shorts
                      </div>
                      <h3 className="text-xl font-black text-white leading-tight">
                        {videoData.topic}
                      </h3>
                      <div className="text-[10px] text-amber-300 font-mono flex items-center justify-center gap-1">
                        <Music className="w-3 h-3" />
                        <span>Piano Intro Chimes Playing...</span>
                      </div>
                    </div>
                  ) : currentSceneIndex === 999 ? (
                    // Outro Scene Card
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto shadow-rose-500/30 shadow-xl">
                        <MessageSquare className="w-7 h-7 text-rose-400" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                        COMMENT YOUR ANSWER!
                      </span>
                      <h4 className="text-sm font-bold text-white px-2">
                        {videoData.outro.questionForComments}
                      </h4>
                      <div className="pt-2">
                        <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white text-slate-950 shadow-md">
                          Subscribe &bull; Free Education
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Active Teaching Scene Card
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-[9px] uppercase tracking-wider border border-white/10">
                        Scene {currentSceneIndex + 1} / {videoData.scenes.length}
                      </div>

                      <div className="text-lg font-black text-amber-300 leading-tight">
                        {videoData.scenes[currentSceneIndex]?.onScreenText}
                      </div>

                      {/* Schematic Graphic / Concept Visual Box */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-left space-y-1.5 shadow-xl">
                        <div className="text-[10px] font-mono text-purple-300 font-bold uppercase">
                          Visual Cue:
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {videoData.scenes[currentSceneIndex]?.visualDescription}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 italic font-mono">
                        Pure voice explanation &bull; Zero background music
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Overlay: Real-time Caption Subtitles */}
                <div className="relative z-10 space-y-2">
                  <div className="p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-left shadow-lg">
                    <span className="text-[9px] text-amber-400 font-mono block mb-0.5">Captions:</span>
                    <p className="text-[11px] text-white font-medium line-clamp-3 leading-snug">
                      {currentSceneIndex === -1
                        ? videoData.intro.narration
                        : currentSceneIndex === 999
                        ? videoData.outro.narration
                        : videoData.scenes[currentSceneIndex]?.narrationText}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{ width: `${(currentPlaybackTime / videoData.targetDurationSeconds) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls Below Screen */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={togglePlay}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>{isPlaying ? 'Pause Video' : 'Play Simulation'}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                title="Restart Video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2.5 rounded-full border transition-colors cursor-pointer ${
                  audioEnabled ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-white/5 text-slate-500 border-white/5'
                }`}
                title="Toggle Narration Voice"
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right Column: Scene-by-Scene Timed Storyboard & Regeneration */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white">Timed Production Storyboard</h3>
                <span className="text-xs text-slate-400">Total duration: {videoData.targetDurationSeconds}s &bull; Format: {videoData.template}</span>
              </div>
            </div>

            {/* Intro Scene Row */}
            <div className={`p-4 rounded-2xl border transition-all ${
              currentSceneIndex === -1 && isPlaying
                ? 'bg-amber-400/10 border-amber-400/50 shadow-md'
                : 'bg-white/5 border-white/5'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-amber-400 font-bold">0:00 - 0:0{videoData.intro.durationSeconds} &bull; INTRO</span>
                <span className="text-slate-400">Piano Tune Active</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans mb-1">
                <strong>Narration:</strong> "{videoData.intro.narration}"
              </p>
              <span className="text-[11px] text-slate-400 italic block">
                Visual: {videoData.intro.visualCue}
              </span>
            </div>

            {/* Main Teaching Scenes */}
            <div className="space-y-3">
              {videoData.scenes.map((scene, idx) => {
                const isActive = currentSceneIndex === idx && isPlaying;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-purple-500/15 border-purple-500/50 shadow-lg scale-[1.01]'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="font-bold text-purple-300">
                        SCENE {scene.sceneNumber} ({scene.timestamp})
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400">
                        {scene.visualType}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="font-semibold text-amber-300">On-Screen Text: </span>
                        <span className="text-white font-bold">{scene.onScreenText}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">Narration Script: </span>
                        <span className="text-slate-200">"{scene.narrationText}"</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">Visual Cue: </span>
                        <span className="text-slate-300 italic">{scene.visualDescription}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Outro Scene Row */}
            <div className={`p-4 rounded-2xl border transition-all ${
              currentSceneIndex === 999 && isPlaying
                ? 'bg-rose-500/15 border-rose-500/50 shadow-md'
                : 'bg-white/5 border-white/5'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-rose-400 font-bold">OUTRO &bull; COMMENT ENGAGEMENT</span>
                <span className="text-slate-400">Piano Resolution Active</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans mb-1">
                <strong>Narration:</strong> "{videoData.outro.narration}"
              </p>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-amber-300 font-medium mt-2">
                <strong>Comment Question for Audience:</strong> {videoData.outro.questionForComments}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
