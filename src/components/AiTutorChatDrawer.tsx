import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  BookOpen, 
  Flame, 
  Loader2,
  Minimize2,
  Maximize2,
  Trash2,
  Copy,
  Check,
  Languages,
  Lightbulb,
  Play,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  HelpCircle,
  FileText,
  BrainCircuit,
  Award
} from 'lucide-react';
import { ChatMessage, NoteContentPayload } from '../types';
import { AIMessageRenderer } from './AIMessageRenderer';

interface AiTutorChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote?: NoteContentPayload | null;
  onApplyCommand?: (command: string) => void;
  initialGrade?: string;
  onOpenImageSolver?: () => void;
}

type TutorLanguage = 'hinglish' | 'english' | 'hindi' | 'auto';
type ExplainMode = 'simple_analogy' | 'exam_ready' | 'mnemonic' | 'step_by_step';

export const AiTutorChatDrawer: React.FC<AiTutorChatDrawerProps> = ({
  isOpen,
  onClose,
  activeNote,
  onApplyCommand,
  initialGrade = 'Class 10',
  onOpenImageSolver,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<TutorLanguage>('hinglish');
  const [explainMode, setExplainMode] = useState<ExplainMode>('simple_analogy');
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice AI States
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const getWelcomeText = (lang: TutorLanguage) => {
    switch (lang) {
      case 'hindi':
        return `नमस्ते! मैं हूँ आपका **बज़िंग ब्रेन एआई ट्यूटर 2.0** 🎓\n\nकक्षा 9 से 12 के किसी भी कठिन टॉपिक (Physics, Chemistry, Maths, Biology) को सरल हिंदी और रोज़मर्रा के उदाहरणों के साथ समझिए।\n\nसूत्र, परीक्षा प्रश्न, माइंड मैप या आवाज़ से पूछने के लिए नीचे दिए गए बटनों का उपयोग करें!`;
      case 'english':
        return `Hello scholar! I'm your **Buzzing Brain AI Tutor 2.0** 🎓\n\nAsk me anything from your Class 9–12 NCERT curriculum. I explain tough concepts with crystal-clear plain language, daily-life analogies, and step-by-step LaTeX formulas!\n\nYou can also speak with 🎤 mic or listen with 🔊 voice!`;
      default:
        return `Namaste dost! Main hoon aapka **Buzzing Brain AI Tutor 2.0** 🎓\n\nClass 9 se 12 ke kisi bhi tough concept ko bilkul simple Hinglish mein cricket, kitchen, aur daily life ke examples ke saath samjhiye!\n\nKoi bhi doubt ho, bina jhijhak pucho ya niche diye gaye quick options tap karo!`;
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: getWelcomeText('hinglish'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Voice Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        speechRecognitionRef.current = recognition;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedLanguage]);

  if (!isOpen) return null;

  const toggleVoiceRecognition = () => {
    if (!speechRecognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use text input.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 'en-IN';
        speechRecognitionRef.current.start();
      } catch (_) {
        setIsListening(false);
      }
    }
  };

  const toggleTextToSpeech = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown and math symbols for clean spoken audio
    const cleanSpeech = text
      .replace(/[*_#`$]/g, '')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\times/g, 'times')
      .replace(/\\Delta/g, 'change in ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = selectedLanguage === 'hindi' 
      ? voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'))
      : voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string, promptAction?: string) => {
    const userText = (textToSend || inputPrompt).trim();
    if (!userText || isLoading) return;

    setInputPrompt('');

    const newMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, newMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map(m => ({ role: m.role, text: m.text })),
          contextNote: activeNote || undefined,
          language: selectedLanguage,
          explainMode,
          classGrade: activeNote?.classGrade || initialGrade,
          promptAction,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat error: ${response.statusText}`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        text: data.reply || "I've reviewed your question. Let me know how else I can assist!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...nextHistory, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: selectedLanguage === 'hindi'
          ? "सर्वर से जुड़ने में समस्या हुई। कृपया इंटरनेट जांचें और पुनः प्रयास करें।"
          : "Connection issue encountered. Please check your network and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...nextHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
    setMessages([
      {
        id: `reset_${Date.now()}`,
        role: 'model',
        text: getWelcomeText(selectedLanguage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 14 Specialized Pedagogical Actions
  const pedagogicalActions = [
    { label: "Explain Simply", prompt: "Explain this concept in ridiculously simple words without any difficult jargon." },
    { label: "Explain Like I'm 5", prompt: "Explain this like I'm a 5-year-old using a fun toy or story analogy." },
    { label: "NCERT Explanation", prompt: "Give me the official NCERT syllabus definition, key keywords, and textbook diagram explanation." },
    { label: "Exam Answer", prompt: "Write a high-scoring 3-mark and 5-mark model answer formatted with step-by-step points." },
    { label: "Step-by-Step Solution", prompt: "Break down the complete derivation or calculation with every mathematical step." },
    { label: "Real-Life Example", prompt: "Give me 2 vivid Indian daily life examples (cricket, kitchen, bicycle, etc.) to understand this intuitively." },
    { label: "Quiz Me", prompt: "Ask me a tricky CBSE board question on this topic to test my understanding." },
    { label: "Check My Answer", prompt: "How should I structure my answer in exams to avoid losing half-marks in board evaluation?" },
    { label: "Create Mnemonic", prompt: "Create a catchy, funny memory mnemonic to remember this list/formula forever." },
    { label: "Summarize", prompt: "Give me a 3-bullet revision summary of this entire concept." },
    { label: "Make Revision Notes", prompt: "Synthesize crisp, one-page revision flashcard notes for this topic." },
    { label: "Create Mind Map", prompt: "Construct a hierarchical conceptual mind map tree for this chapter." },
    { label: "Find My Mistake", prompt: "What are the most frequent blunders and sign convention mistakes students make here?" },
    { label: "Generate Practice Questions", prompt: "Generate 3 high-yield NCERT Exemplar practice questions with hints." },
  ];

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-4 ${
        isMaximized 
          ? 'w-[96vw] md:w-[780px] h-[88vh] max-h-[850px]' 
          : 'w-full max-w-md h-[620px]'
      }`}
    >
      {/* Header */}
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-amber-500 border border-purple-400/40 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <span>AI Tutor 2.0</span>
              <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700/60 font-semibold tracking-wide">
                Voice • LaTeX • Math
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeNote ? `Context: ${activeNote.chapter}` : `${initialGrade} &bull; Free Education for All`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenImageSolver && (
            <button
              onClick={onOpenImageSolver}
              className="p-1.5 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ask from image / textbook photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMaximized ? "Restore compact size" : "Expand window"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Language & Pedagogical Mode Selector Bar */}
      <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px] shrink-0">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-slate-500 flex items-center gap-1 font-medium text-[10px] uppercase tracking-wider mr-1">
            <Languages className="w-3 h-3 text-purple-500" />
            Language:
          </span>
          <button
            onClick={() => setSelectedLanguage('hinglish')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedLanguage === 'hinglish'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Hinglish ✨
          </button>
          <button
            onClick={() => setSelectedLanguage('hindi')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedLanguage === 'hindi'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            हिंदी 🇮🇳
          </button>
          <button
            onClick={() => setSelectedLanguage('english')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedLanguage === 'english'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            English 🇬🇧
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExplainMode('simple_analogy')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              explainMode === 'simple_analogy'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🌟 Analogy
          </button>
          <button
            onClick={() => setExplainMode('exam_ready')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              explainMode === 'exam_ready'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🎯 Exam Ready
          </button>
        </div>
      </div>

      {/* 14 Quick Action Buttons Ribbon */}
      <div className="px-3 py-1 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] shrink-0 no-scrollbar">
        {pedagogicalActions.map((act, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(act.prompt, act.label)}
            className="whitespace-nowrap px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 rounded-md border border-slate-200/80 dark:border-slate-700 transition-all font-medium cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {act.label}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950/60 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              msg.role === 'user' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className={`max-w-[88%] rounded-2xl p-3.5 shadow-2xs ${
              msg.role === 'user'
                ? 'bg-amber-500 text-slate-950 rounded-tr-xs font-medium'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-xs leading-relaxed relative group'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              ) : (
                <>
                  <AIMessageRenderer 
                    content={msg.text} 
                    onExecuteCommand={onApplyCommand} 
                  />

                  {/* Reaction & Action Quick Buttons under Bot Response */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={() => handleSendMessage("Explain that again with a simpler daily-life example.")}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-600 dark:text-slate-300 hover:text-purple-700 cursor-pointer"
                      >
                        Explain Again
                      </button>
                      <button
                        onClick={() => handleSendMessage("Explain this even simpler like I'm 10 years old.")}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-600 dark:text-slate-300 hover:text-purple-700 cursor-pointer"
                      >
                        Simpler
                      </button>
                      <button
                        onClick={() => handleSendMessage("Give me a real-life analogy for this.")}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-600 dark:text-slate-300 hover:text-purple-700 cursor-pointer"
                      >
                        Example
                      </button>
                      <button
                        onClick={() => handleSendMessage("Now quiz me with 1 question on this.")}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-600 dark:text-slate-300 hover:text-purple-700 cursor-pointer"
                      >
                        Quiz Me
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Voice Read Aloud Button */}
                      <button
                        onClick={() => toggleTextToSpeech(msg.id, msg.text)}
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 ${
                          speakingMsgId === msg.id ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-purple-400'
                        }`}
                        title={speakingMsgId === msg.id ? "Stop voice" : "Read aloud"}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            <span className="text-[10px]">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Listen</span>
                          </>
                        )}
                      </button>

                      {/* Copy Answer Button */}
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-purple-400 cursor-pointer flex items-center gap-0.5"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <span className="text-slate-400">{msg.timestamp}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs p-3.5 text-slate-600 dark:text-slate-300 flex items-center gap-2.5 shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <div className="text-xs">
                <span className="font-semibold text-purple-600 dark:text-purple-400">AI Tutor is analyzing...</span>
                <span className="block text-[10px] text-slate-400">
                  Formulating simple analogies, LaTeX steps, and NCERT exam points...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Row with Voice Mic & Image Trigger */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }} 
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
      >
        {/* Voice Input Mic Button */}
        <button
          type="button"
          onClick={toggleVoiceRecognition}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            isListening 
              ? 'bg-rose-500 border-rose-600 text-white animate-pulse shadow-md' 
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
          title={isListening ? "Listening... Click to stop" : "Speak your doubt (Voice input)"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={
            isListening 
              ? "Listening to your voice... Speak clearly" 
              : selectedLanguage === 'hindi'
              ? "कोई भी प्रश्न पूछें (सरल हिंदी में समझें)..."
              : selectedLanguage === 'english'
              ? "Ask any NCERT concept, formula, or exam doubt..."
              : "Ask in Hinglish or English (e.g. Cricket example se Newton's law samjhao)..."
          }
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder:text-slate-400"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !inputPrompt.trim()}
          className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
