import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  GitBranch, 
  Cpu, 
  Eye, 
  Sparkles, 
  Zap, 
  Sliders, 
  RotateCcw, 
  Layers, 
  Download, 
  ChevronRight, 
  ChevronDown,
  Activity,
  Play,
  Pause,
  Heart,
  Search,
  Filter,
  Flame,
  Droplets,
  HelpCircle,
  Maximize2,
  Atom,
  Info,
  CheckCircle2,
  Compass,
  ArrowRight,
  Scale,
  Camera,
  Gauge,
  Thermometer,
  Shield,
  Grid,
  Check,
  RefreshCw,
  FlaskConical,
  BookOpen
} from 'lucide-react';
import { 
  MIND_MAPS_LIBRARY, 
  VISUAL_ORGAN_MODELS, 
  VIRTUAL_TOOLS_LIBRARY,
  MindMapItem,
  MindMapNode,
  VisualOrganModel,
  OrganPartInfo,
  VirtualTool,
  VirtualToolSpecimen
} from '../data/interactiveLabsData';
import { PRESCRIBED_PRACTICALS, NcertPracticalItem } from '../data/ncertPracticalsData';
import { ChemicalBalanceTool } from './labs/ChemicalBalanceTool';
import { DigitalPhMeterTool } from './labs/DigitalPhMeterTool';
import { DigitalMicroscopeTool } from './labs/DigitalMicroscopeTool';
import { ExperimentJournal } from './labs/ExperimentJournal';
import { VirtualPracticalAcademy } from '../features/virtual-lab';
import { UserProfile } from '../types';

interface InteractiveLabsProps {
  activeClass: string;
  initialSubTab?: 'virtual_academy' | 'mindmaps' | 'organs3d' | 'virtual_tools' | 'simulations' | 'journal' | 'practicals';
  userProfile?: UserProfile | null;
}

export const InteractiveLabsAndMindMaps: React.FC<InteractiveLabsProps> = ({ 
  activeClass, 
  initialSubTab = 'virtual_academy',
  userProfile 
}) => {
  // Main Navigation Modes (Virtual Academy 3D, Mind Maps, 3D Organs, Calibrated Virtual Tools, Simulations, Experiment Journal, Practicals)
  const [activeMainTab, setActiveMainTab] = useState<'virtual_academy' | 'mindmaps' | 'organs3d' | 'virtual_tools' | 'simulations' | 'journal' | 'practicals'>(initialSubTab);

  // Live tool readings persisted for quick one-click import into Experiment Journal
  const [liveToolReadings, setLiveToolReadings] = useState<{
    phMeter?: { solutionName: string; ph: number; tempC: number; emfMv: string; hConc: string; timestamp: string };
    microscope?: { specimenName: string; tissueType: string; magnification: number; cellSizeUm: number; objective: string; timestamp: string };
    balance?: { reagentName: string; formula: string; massGrams: number; tareVessel: string; targetMolarity: number; timestamp: string };
  }>({});

  useEffect(() => {
    if (initialSubTab) {
      setActiveMainTab(initialSubTab);
    }
  }, [initialSubTab]);

  // ==========================================
  // TAB 1: MIND MAPS STATE
  // ==========================================
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [mindMapSearch, setMindMapSearch] = useState<string>('');
  const [selectedMindMapId, setSelectedMindMapId] = useState<string>('mm-10-sci-electricity');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root-elec': true,
    'elec-charge': true,
    'elec-ohms': true,
    'elec-comb': true,
    'elec-heat': true,
  });
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<MindMapNode | null>(null);

  const filteredMindMaps = useMemo(() => {
    return MIND_MAPS_LIBRARY.filter(m => {
      const subjMatch = selectedSubjectFilter === 'All' || m.subject === selectedSubjectFilter;
      const searchMatch = !mindMapSearch.trim() || 
        m.title.toLowerCase().includes(mindMapSearch.toLowerCase()) || 
        m.chapter.toLowerCase().includes(mindMapSearch.toLowerCase());
      return subjMatch && searchMatch;
    });
  }, [selectedSubjectFilter, mindMapSearch]);

  const activeMindMap = useMemo(() => {
    return MIND_MAPS_LIBRARY.find(m => m.id === selectedMindMapId) || MIND_MAPS_LIBRARY[0];
  }, [selectedMindMapId]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAllNodes = () => {
    const all: Record<string, boolean> = {};
    const traverse = (node: MindMapNode) => {
      all[node.id] = true;
      if (node.children) node.children.forEach(traverse);
    };
    traverse(activeMindMap.rootNode);
    setExpandedNodes(all);
  };

  const collapseAllNodes = () => {
    setExpandedNodes({ [activeMindMap.rootNode.id]: true });
  };

  // ==========================================
  // TAB 2: 3D ORGANS & BIOLOGICAL SYSTEMS STATE
  // ==========================================
  const [selectedOrganId, setSelectedOrganId] = useState<string>('organ-heart');
  const [selectedPart, setSelectedPart] = useState<OrganPartInfo | null>(null);
  const [rotationAngle, setRotationAngle] = useState<{ x: number; y: number }>({ x: 15, y: -20 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isHeartPulsing, setIsHeartPulsing] = useState<boolean>(true);
  const [heartRate, setHeartRate] = useState<number>(72); // BPM
  const [showBloodFlow, setShowBloodFlow] = useState<boolean>(true);
  const [eyeAccommodation, setEyeAccommodation] = useState<'distant' | 'near'>('distant');
  const [eyeVisionDefect, setEyeVisionDefect] = useState<'normal' | 'myopia' | 'hypermetropia'>('normal');
  const [cellType, setCellType] = useState<'plant' | 'animal'>('plant');

  const activeOrgan = useMemo(() => {
    return VISUAL_ORGAN_MODELS.find(o => o.id === selectedOrganId) || VISUAL_ORGAN_MODELS[0];
  }, [selectedOrganId]);

  useEffect(() => {
    // Default select first part of new organ
    if (activeOrgan && activeOrgan.parts.length > 0) {
      setSelectedPart(activeOrgan.parts[0]);
    }
  }, [activeOrgan]);

  // ==========================================
  // TAB 3: VIRTUAL TOOLS STATE
  // ==========================================
  const [selectedToolId, setSelectedToolId] = useState<string>('tool-microscope');
  
  // Microscope states
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>('spec-onion');
  const [objectiveLens, setObjectiveLens] = useState<'4x' | '10x' | '40x' | '100x'>('10x');
  const [coarseFocus, setCoarseFocus] = useState<number>(50); // 0-100 (50 is optimal)
  const [fineFocus, setFineFocus] = useState<number>(50); // 0-100 (50 is optimal)
  const [lightIntensity, setLightIntensity] = useState<number>(80);

  // Vernier Calliper states
  const [vernierJawPosition, setVernierJawPosition] = useState<number>(2.43); // cm
  const [vernierPresetObject, setVernierPresetObject] = useState<'cylinder' | 'marble' | 'beaker'>('cylinder');

  // Titration states
  const [titrantAddedMl, setTitrantAddedMl] = useState<number>(0);
  const [titrationIndicator, setTitrationIndicator] = useState<'phenolphthalein' | 'methyl_orange' | 'universal'>('phenolphthalein');
  const [isTitratingAuto, setIsTitratingAuto] = useState<boolean>(false);

  // Flame test states
  const [activeFlameMetal, setActiveFlameMetal] = useState<string>('Na');

  // ==========================================
  // TAB 4: PHYSICS & CHEMISTRY SIMULATIONS STATE
  // ==========================================
  // Ohm's Law
  const [ohmsVoltage, setOhmsVoltage] = useState(12); // Volts
  const [ohmsResistance, setOhmsResistance] = useState(6); // Ohms
  const ohmsCurrent = (ohmsVoltage / ohmsResistance).toFixed(2);
  const ohmsPower = (ohmsVoltage * Number(ohmsCurrent)).toFixed(2);

  // Optics Lab
  const [focalLength, setFocalLength] = useState(10); // cm
  const [objectDistance, setObjectDistance] = useState(-25); // cm (convention: negative)
  const imageDistance = ((focalLength * objectDistance) / (objectDistance + focalLength)).toFixed(1);
  const magnification = (-Number(imageDistance) / objectDistance).toFixed(2);
  const isImageReal = Number(imageDistance) > 0;

  // Pendulum Lab
  const [pendulumLength, setPendulumLength] = useState(1.0); // meters
  const [gravityPreset, setGravityPreset] = useState<'earth' | 'moon' | 'jupiter'>('earth');
  const [isPendulumSwinging, setIsPendulumSwinging] = useState(true);
  const [pendulumAngle, setPendulumAngle] = useState(0);

  const gravities = { earth: 9.8, moon: 1.62, jupiter: 24.79 };
  const currentG = gravities[gravityPreset];
  const timePeriod = (2 * Math.PI * Math.sqrt(pendulumLength / currentG)).toFixed(2);
  const frequency = (1 / Number(timePeriod)).toFixed(2);

  // Pendulum oscillation loop
  useEffect(() => {
    if (!isPendulumSwinging || activeMainTab !== 'simulations') return;
    let frameId: number;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const omega = Math.sqrt(currentG / pendulumLength);
      const maxAngle = 25; // degrees
      const angle = maxAngle * Math.cos(omega * elapsed);
      setPendulumAngle(angle);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPendulumSwinging, pendulumLength, currentG, activeMainTab]);

  // Titration auto-drop interval
  useEffect(() => {
    if (!isTitratingAuto) return;
    const timer = setInterval(() => {
      setTitrantAddedMl(prev => {
        if (prev >= 40) {
          setIsTitratingAuto(false);
          return 40;
        }
        return Math.min(40, Number((prev + 0.5).toFixed(1)));
      });
    }, 200);
    return () => clearInterval(timer);
  }, [isTitratingAuto]);

  // Calculate Titration pH
  // Assume 25 mL of 0.1 M HCl titrated with 0.1 M NaOH
  // Equivalence point is at 25.0 mL
  const titrationCalculatedPh = useMemo(() => {
    const vAdded = titrantAddedMl;
    const vHcl = 25.0; // mL
    const mConc = 0.1; // M
    if (vAdded < vHcl) {
      const molesHLeft = (vHcl * mConc - vAdded * mConc) / 1000;
      const totalVolL = (vHcl + vAdded) / 1000;
      const concH = molesHLeft / totalVolL;
      const ph = -Math.log10(concH);
      return Math.max(1.0, Number(ph.toFixed(2)));
    } else if (vAdded === vHcl) {
      return 7.00;
    } else {
      const molesOhExcess = ((vAdded - vHcl) * mConc) / 1000;
      const totalVolL = (vHcl + vAdded) / 1000;
      const concOh = molesOhExcess / totalVolL;
      const pOh = -Math.log10(concOh);
      const ph = 14 - pOh;
      return Math.min(13.0, Number(ph.toFixed(2)));
    }
  }, [titrantAddedMl]);

  // Indicator color based on pH
  const indicatorColorInfo = useMemo(() => {
    const ph = titrationCalculatedPh;
    if (titrationIndicator === 'phenolphthalein') {
      if (ph < 8.2) return { color: '#ffffff', label: 'Colorless (Acidic)', bg: 'rgba(255, 255, 255, 0.15)' };
      if (ph < 10) return { color: '#f472b6', label: 'Faint Pink (Neutralization Endpoint!)', bg: 'rgba(244, 114, 182, 0.5)' };
      return { color: '#db2777', label: 'Deep Magenta Pink (Basic)', bg: 'rgba(219, 39, 119, 0.8)' };
    } else if (titrationIndicator === 'methyl_orange') {
      if (ph < 3.1) return { color: '#ef4444', label: 'Red (Acidic)', bg: 'rgba(239, 68, 68, 0.7)' };
      if (ph < 4.4) return { color: '#f97316', label: 'Orange (Transition)', bg: 'rgba(249, 115, 22, 0.7)' };
      return { color: '#eab308', label: 'Yellow (Equivalence reached)', bg: 'rgba(234, 179, 8, 0.7)' };
    } else {
      // Universal indicator
      if (ph < 3) return { color: '#ef4444', label: `Strong Acid (pH ${ph})`, bg: 'rgba(239, 68, 68, 0.8)' };
      if (ph < 6) return { color: '#f97316', label: `Weak Acid (pH ${ph})`, bg: 'rgba(249, 115, 22, 0.8)' };
      if (ph < 8) return { color: '#22c55e', label: `Neutral (pH ${ph})`, bg: 'rgba(34, 197, 94, 0.8)' };
      if (ph < 11) return { color: '#3b82f6', label: `Base (pH ${ph})`, bg: 'rgba(59, 130, 246, 0.8)' };
      return { color: '#a855f7', label: `Strong Alkaline (pH ${ph})`, bg: 'rgba(168, 85, 247, 0.8)' };
    }
  }, [titrationCalculatedPh, titrationIndicator]);

  // Microscope focus clarity calculation
  const focusBlurRadius = useMemo(() => {
    // Best focus is at coarse 50 and fine 50
    const coarseDiff = Math.abs(coarseFocus - 50);
    const fineDiff = Math.abs(fineFocus - 50);
    const blur = (coarseDiff * 0.2 + fineDiff * 0.08);
    return Math.min(16, Number(blur.toFixed(1)));
  }, [coarseFocus, fineFocus]);

  // ==========================================
  // TAB 6: PRESCRIBED PRACTICAL CATALOGUE STATE
  // ==========================================
  const [selectedPracticalId, setSelectedPracticalId] = useState<string>('c10_ph_testing');
  const [practicalSubjectFilter, setPracticalSubjectFilter] = useState<string>('All');
  const [practicalClassFilter, setPracticalClassFilter] = useState<string>(activeClass || 'Class 10');
  const [practicalSearchQuery, setPracticalSearchQuery] = useState<string>('');
  const [revealedVivaAnswers, setRevealedVivaAnswers] = useState<Record<number, boolean>>({});

  const filteredPracticals = useMemo(() => {
    return PRESCRIBED_PRACTICALS.filter(p => {
      const classMatch = practicalClassFilter === 'All' || p.classGrade === practicalClassFilter;
      const subjMatch = practicalSubjectFilter === 'All' || p.subject === practicalSubjectFilter;
      const searchMatch = !practicalSearchQuery || 
        p.title.toLowerCase().includes(practicalSearchQuery.toLowerCase()) || 
        p.chapter.toLowerCase().includes(practicalSearchQuery.toLowerCase());
      return classMatch && subjMatch && searchMatch;
    });
  }, [practicalClassFilter, practicalSubjectFilter, practicalSearchQuery]);

  const activePractical = useMemo(() => {
    return PRESCRIBED_PRACTICALS.find(p => p.id === selectedPracticalId) || filteredPracticals[0] || PRESCRIBED_PRACTICALS[0];
  }, [selectedPracticalId, filteredPracticals]);

  // Render Mind Map Recursive Node
  const renderMindMapNode = (node: MindMapNode, level: number = 0) => {
    const isExpanded = Boolean(expandedNodes[node.id]);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isSelected = selectedNodeDetails?.id === node.id;

    const levelColors = [
      'bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/30 shadow-lg shadow-amber-500/10',
      'bg-indigo-500/15 border-indigo-400/60 text-indigo-200 hover:bg-indigo-500/25',
      'bg-cyan-500/10 border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/20',
      'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
    ];

    const currentStyle = levelColors[Math.min(level, levelColors.length - 1)];

    return (
      <div key={node.id} className="space-y-2">
        <div 
          onClick={() => {
            setSelectedNodeDetails(node);
            if (hasChildren) toggleNode(node.id);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${currentStyle} ${
            isSelected ? 'ring-2 ring-white shadow-xl scale-[1.01]' : ''
          }`}
          style={{ marginLeft: `${level * 18}px` }}
        >
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="text-amber-400 p-0.5 rounded-md hover:bg-white/10">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
              <span className={`font-bold ${level === 0 ? 'text-base text-white' : level === 1 ? 'text-sm text-white' : 'text-xs text-slate-100'}`}>
                {node.label}
              </span>
              {node.formula && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Formula
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {node.description}
            </p>

            {node.formula && (
              <div className="text-xs font-mono text-amber-300 bg-black/40 px-3 py-1.5 rounded-xl border border-amber-400/30 inline-block">
                {node.formula}
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-dashed border-white/10 pl-2 space-y-2 ml-4">
            {node.children!.map(child => renderMindMapNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Main Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Virtual Labs, 3D Organs & Mind Maps Hub</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Scientific Visualization & Virtual Experiments Library
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Explore 200+ CBSE curriculum chapters with interactive 3D organs, mind maps, and virtual instruments.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveMainTab('virtual_academy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'virtual_academy' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 scale-[1.02]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>3D Practical Academy</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase tracking-wider font-bold ${
              activeMainTab === 'virtual_academy' ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              STAGES 1–6
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('mindmaps')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'mindmaps' 
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Mind Maps Library</span>
          </button>

          <button
            onClick={() => setActiveMainTab('organs3d')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'organs3d' 
                ? 'bg-rose-500 text-white shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>3D Organs & Anatomy</span>
          </button>

          <button
            onClick={() => setActiveMainTab('virtual_tools')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'virtual_tools' 
                ? 'bg-cyan-500 text-slate-950 shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Virtual Lab Tools</span>
          </button>

          <button
            onClick={() => setActiveMainTab('simulations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'simulations' 
                ? 'bg-indigo-500 text-white shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Physics &amp; Chem Labs</span>
          </button>

          <button
            onClick={() => setActiveMainTab('journal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'journal' 
                ? 'bg-emerald-400 text-slate-950 shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Experiment Journal</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase tracking-wider font-bold ${
              activeMainTab === 'journal' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              PDF Report
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('practicals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'practicals' 
                ? 'bg-purple-500 text-white shadow-md scale-[1.02]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Prescribed Practicals</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase tracking-wider font-bold ${
              activeMainTab === 'practicals' ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              NCERT
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 0. 3D VIRTUAL PRACTICAL ACADEMY MULTI-STAGE WORKFLOWS */}
      {/* ========================================================= */}
      {activeMainTab === 'virtual_academy' && (
        <VirtualPracticalAcademy activeClass={activeClass} userProfile={userProfile} />
      )}

      {/* ========================================================= */}
      {/* 1. MIND MAPS LIBRARY VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'mindmaps' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-2">
                <Filter className="w-3.5 h-3.5" /> Subject:
              </span>
              {['All', 'Physics', 'Chemistry', 'Biology', 'Mathematics'].map(subj => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubjectFilter(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedSubjectFilter === subj
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search mind maps & topics..."
                  value={mindMapSearch}
                  onChange={e => setMindMapSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-56"
                />
              </div>

              <button
                onClick={expandAllNodes}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllNodes}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* 2-Column Split: Chapter Selector & Visual Tree */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Mind Maps Catalog */}
            <div className="lg:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-1">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
                <span>Mind Maps Catalog ({filteredMindMaps.length})</span>
                <span className="text-amber-400">{activeClass} Prescribed</span>
              </div>

              {filteredMindMaps.map(m => {
                const isSelected = m.id === selectedMindMapId;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMindMapId(m.id);
                      setSelectedNodeDetails(m.rootNode);
                      setExpandedNodes({ [m.rootNode.id]: true });
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400/80 shadow-lg shadow-amber-400/10'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                        m.subject === 'Physics' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        m.subject === 'Chemistry' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        m.subject === 'Biology' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {m.subject} • {m.classGrade}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {m.chapter}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Mind Map Interactive Tree & Node Inspector */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                      {activeMindMap.subject} • {activeMindMap.chapter}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {activeMindMap.title}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Click any node to reveal formulas and CBSE notes
                  </span>
                </div>

                {/* Tree Visualization Container */}
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-2">
                  {renderMindMapNode(activeMindMap.rootNode, 0)}
                </div>
              </div>

              {/* Node Inspector Bar */}
              {selectedNodeDetails && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border border-amber-400/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Concept Inspector
                    </span>
                    {selectedNodeDetails.formula && (
                      <span className="text-xs font-mono text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/40">
                        {selectedNodeDetails.formula}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white">
                    {selectedNodeDetails.label}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedNodeDetails.description}
                  </p>
                  {selectedNodeDetails.examAlert && (
                    <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl font-semibold mt-2 flex items-center gap-2">
                      <AlertIcon />
                      <span>{selectedNodeDetails.examAlert}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. 3D ORGANS & BIOLOGICAL SYSTEMS VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'organs3d' && (
        <div className="space-y-6">
          {/* Organ Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/70 border border-white/10">
            {VISUAL_ORGAN_MODELS.map(organ => {
              const isSelected = organ.id === selectedOrganId;
              return (
                <button
                  key={organ.id}
                  onClick={() => {
                    setSelectedOrganId(organ.id);
                    setSelectedPart(organ.parts[0]);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>{organ.name.split('(')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          {/* 2-Column Split: 3D Visualization Arena & Part Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 3D Viewport */}
            <div className="lg:col-span-8 rounded-3xl bg-[#030712] border border-white/10 p-6 space-y-4 shadow-2xl relative overflow-hidden">
              {/* Header inside viewport */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold uppercase">
                    <span>{activeOrgan.system}</span>
                    <span>•</span>
                    <span>{activeOrgan.classGrade}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {activeOrgan.name}
                  </h3>
                </div>

                {/* Organ Specific Interactive Controls */}
                <div className="flex items-center gap-2">
                  {activeOrgan.diagramType === 'heart' && (
                    <>
                      <button
                        onClick={() => setIsHeartPulsing(!isHeartPulsing)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isHeartPulsing ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{isHeartPulsing ? `${heartRate} BPM` : 'Paused'}</span>
                      </button>
                      <button
                        onClick={() => setShowBloodFlow(!showBloodFlow)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          showBloodFlow ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Flow Trace
                      </button>
                    </>
                  )}

                  {activeOrgan.diagramType === 'eye' && (
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => setEyeAccommodation('distant')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          eyeAccommodation === 'distant' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        Distant (Relaxed)
                      </button>
                      <button
                        onClick={() => setEyeAccommodation('near')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          eyeAccommodation === 'near' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        Near (25 cm)
                      </button>
                    </div>
                  )}

                  {activeOrgan.diagramType === 'cell' && (
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => setCellType('plant')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          cellType === 'plant' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                        }`}
                      >
                        Plant Cell
                      </button>
                      <button
                        onClick={() => setCellType('animal')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          cellType === 'animal' ? 'bg-rose-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        Animal Cell
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setZoomLevel(prev => (prev === 1 ? 1.25 : 1))}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
                    title="Toggle Zoom"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3D Visual Rendering Canvas */}
              <div 
                className="w-full h-[420px] rounded-2xl bg-gradient-to-b from-slate-950 via-[#070b19] to-black border border-white/5 flex items-center justify-center relative select-none cursor-grab active:cursor-grabbing overflow-hidden"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.3s ease'
                }}
              >
                {/* SVG Anatomical Renderings based on organ */}
                {activeOrgan.diagramType === 'heart' && (
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px]">
                    <defs>
                      <linearGradient id="oxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#991b1b" />
                      </linearGradient>
                      <linearGradient id="deoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1e3a8a" />
                      </linearGradient>
                    </defs>

                    {/* Heart Background Glow */}
                    <circle cx="250" cy="200" r="160" fill="url(#oxGrad)" opacity="0.08" />

                    {/* Superior & Inferior Vena Cava */}
                    <path
                      d="M 170 50 L 170 170 L 140 170 L 140 50 Z"
                      fill="url(#deoxGrad)"
                      stroke="#60a5fa"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />
                    <text x="135" y="40" fill="#93c5fd" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Vena Cava (Deoxygenated)</text>

                    {/* Aorta Arch */}
                    <path
                      d="M 230 140 C 230 40, 310 40, 320 120 L 340 120 C 330 20, 210 20, 210 140 Z"
                      fill="url(#oxGrad)"
                      stroke="#f87171"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[5])}
                    />
                    <text x="280" y="30" fill="#fca5a5" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Aorta (High Pressure)</text>

                    {/* Pulmonary Artery */}
                    <path
                      d="M 210 140 L 260 90 L 330 90 L 330 110 L 270 110 L 220 160 Z"
                      fill="#2563eb"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />

                    {/* Cardiac Body with Pulse Animation */}
                    <g 
                      style={{
                        transformOrigin: '250px 220px',
                        animation: isHeartPulsing ? `pulse ${(60 / heartRate).toFixed(2)}s ease-in-out infinite` : 'none'
                      }}
                    >
                      {/* Left Ventricle (Thick Myocardium - Red) */}
                      <path
                        d="M 250 160 C 330 160, 370 240, 310 330 C 270 370, 250 370, 250 370 Z"
                        fill="url(#oxGrad)"
                        stroke="#f87171"
                        strokeWidth="3"
                        className="cursor-pointer hover:brightness-125 transition-all"
                        onClick={() => setSelectedPart(activeOrgan.parts[3])}
                      />

                      {/* Right Ventricle (Blue) */}
                      <path
                        d="M 250 160 C 170 160, 130 240, 190 330 C 230 370, 250 370, 250 370 Z"
                        fill="url(#deoxGrad)"
                        stroke="#60a5fa"
                        strokeWidth="3"
                        className="cursor-pointer hover:brightness-125 transition-all"
                        onClick={() => setSelectedPart(activeOrgan.parts[1])}
                      />

                      {/* Right Atrium */}
                      <ellipse
                        cx="170"
                        cy="160"
                        rx="45"
                        ry="40"
                        fill="#1d4ed8"
                        stroke="#93c5fd"
                        strokeWidth="2"
                        className="cursor-pointer hover:brightness-125 transition-all"
                        onClick={() => setSelectedPart(activeOrgan.parts[0])}
                      />

                      {/* Left Atrium */}
                      <ellipse
                        cx="330"
                        cy="160"
                        rx="45"
                        ry="40"
                        fill="#b91c1c"
                        stroke="#fca5a5"
                        strokeWidth="2"
                        className="cursor-pointer hover:brightness-125 transition-all"
                        onClick={() => setSelectedPart(activeOrgan.parts[2])}
                      />

                      {/* Septum Division */}
                      <line x1="250" y1="160" x2="250" y2="370" stroke="#fbbf24" strokeWidth="5" strokeDasharray="4 2" />

                      {/* Valves markers */}
                      <circle cx="210" cy="190" r="8" fill="#fbbf24" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[4])} />
                      <circle cx="290" cy="190" r="8" fill="#fbbf24" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[4])} />
                    </g>

                    {/* Labels */}
                    <text x="140" y="165" fill="#ffffff" fontSize="11" fontWeight="bold">RA</text>
                    <text x="325" y="165" fill="#ffffff" fontSize="11" fontWeight="bold">LA</text>
                    <text x="195" y="270" fill="#ffffff" fontSize="12" fontWeight="bold">RV (Deoxygenated)</text>
                    <text x="275" y="270" fill="#ffffff" fontSize="12" fontWeight="bold">LV (Oxygenated)</text>
                    <text x="220" y="388" fill="#fbbf24" fontSize="10" fontFamily="monospace">Interventricular Septum</text>
                  </svg>
                )}

                {activeOrgan.diagramType === 'brain' && (
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px]">
                    {/* Cerebrum Lobes */}
                    {/* Frontal Lobe */}
                    <path
                      d="M 120 220 C 100 150, 150 70, 250 60 C 260 120, 240 180, 210 220 Z"
                      fill="#8b5cf6"
                      stroke="#c4b5fd"
                      strokeWidth="2"
                      opacity="0.85"
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />
                    <text x="140" y="140" fill="#ffffff" fontSize="11" fontWeight="bold">Frontal Lobe</text>

                    {/* Parietal Lobe */}
                    <path
                      d="M 250 60 C 330 60, 390 100, 400 170 C 340 180, 290 160, 260 120 Z"
                      fill="#a855f7"
                      stroke="#e9d5ff"
                      strokeWidth="2"
                      opacity="0.85"
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />
                    <text x="300" y="120" fill="#ffffff" fontSize="11" fontWeight="bold">Parietal Lobe</text>

                    {/* Occipital Lobe */}
                    <path
                      d="M 400 170 C 420 220, 390 280, 330 280 C 330 230, 350 200, 360 180 Z"
                      fill="#ec4899"
                      stroke="#fbcfe8"
                      strokeWidth="2"
                      opacity="0.85"
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />
                    <text x="350" y="240" fill="#ffffff" fontSize="11" fontWeight="bold">Occipital (Vision)</text>

                    {/* Temporal Lobe */}
                    <path
                      d="M 210 220 C 240 180, 340 180, 330 250 C 280 270, 220 270, 210 220 Z"
                      fill="#3b82f6"
                      stroke="#93c5fd"
                      strokeWidth="2"
                      opacity="0.85"
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />
                    <text x="240" y="230" fill="#ffffff" fontSize="11" fontWeight="bold">Temporal Lobe</text>

                    {/* Cerebellum */}
                    <ellipse
                      cx="320"
                      cy="310"
                      rx="55"
                      ry="35"
                      fill="#10b981"
                      stroke="#6ee7b7"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[1])}
                    />
                    <text x="285" y="315" fill="#ffffff" fontSize="11" fontWeight="bold">Cerebellum</text>

                    {/* Brainstem (Pons & Medulla) */}
                    <path
                      d="M 230 260 L 250 260 L 245 370 L 225 370 Z"
                      fill="#f59e0b"
                      stroke="#fde68a"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[2])}
                    />
                    <text x="255" y="350" fill="#fbbf24" fontSize="11" fontWeight="bold">Medulla Oblongata</text>
                  </svg>
                )}

                {activeOrgan.diagramType === 'eye' && (
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px]">
                    {/* Eyeball outer sclera */}
                    <circle cx="270" cy="200" r="140" fill="#0f172a" stroke="#475569" strokeWidth="4" />

                    {/* Retina layer (Yellow/Orange inner lining) */}
                    <path
                      d="M 270 65 A 135 135 0 0 1 270 335"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      className="cursor-pointer hover:stroke-amber-300"
                      onClick={() => setSelectedPart(activeOrgan.parts[3])}
                    />
                    <text x="320" y="100" fill="#fcd34d" fontSize="11" fontWeight="bold">Retina (Photoreceptors)</text>

                    {/* Optic Nerve exit */}
                    <path d="M 405 185 L 470 185 L 470 215 L 405 215 Z" fill="#94a3b8" />
                    <text x="410" y="180" fill="#94a3b8" fontSize="10">Optic Nerve</text>

                    {/* Anterior Cornea bulge */}
                    <path
                      d="M 140 120 C 80 160, 80 240, 140 280"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="6"
                      className="cursor-pointer hover:stroke-cyan-300"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />
                    <text x="65" y="180" fill="#38bdf8" fontSize="11" fontWeight="bold">Cornea</text>

                    {/* Iris & Pupil */}
                    <rect x="155" y="115" width="8" height="50" fill="#6366f1" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                    <rect x="155" y="235" width="8" height="50" fill="#6366f1" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                    <text x="130" y="105" fill="#a5b4fc" fontSize="10">Iris (Pupil Control)</text>

                    {/* Crystalline Biconvex Lens */}
                    <ellipse
                      cx="175"
                      cy="200"
                      rx={eyeAccommodation === 'near' ? 22 : 14}
                      ry="55"
                      fill="#c084fc"
                      opacity="0.85"
                      stroke="#e9d5ff"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={() => setSelectedPart(activeOrgan.parts[2])}
                    />
                    <text x="150" y="280" fill="#d8b4fe" fontSize="11" fontWeight="bold">
                      Lens ({eyeAccommodation === 'near' ? 'Thick f↓' : 'Thin f↑'})
                    </text>

                    {/* Light Ray Tracing to Retina */}
                    <path
                      d="M 20 180 L 175 190 L 400 200"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <path
                      d="M 20 220 L 175 210 L 400 200"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  </svg>
                )}

                {activeOrgan.diagramType === 'nephron' && (
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px]">
                    {/* Glomerulus & Bowman's Capsule */}
                    <circle cx="120" cy="120" r="35" fill="none" stroke="#f43f5e" strokeWidth="6" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[0])} />
                    <circle cx="120" cy="120" r="18" fill="#ef4444" opacity="0.6" />
                    <text x="60" y="70" fill="#fca5a5" fontSize="11" fontWeight="bold">Bowman’s Capsule (Ultrafiltration)</text>

                    {/* Proximal Convoluted Tubule (PCT) */}
                    <path
                      d="M 155 120 Q 200 90 230 140 T 260 170"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="10"
                      className="cursor-pointer hover:stroke-amber-300"
                      onClick={() => setSelectedPart(activeOrgan.parts[1])}
                    />
                    <text x="170" y="170" fill="#fcd34d" fontSize="11" fontWeight="bold">PCT (70% Reabsorption)</text>

                    {/* Loop of Henle */}
                    <path
                      d="M 260 170 L 260 320 C 260 360, 310 360, 310 320 L 310 170"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      className="cursor-pointer hover:stroke-blue-300"
                      onClick={() => setSelectedPart(activeOrgan.parts[2])}
                    />
                    <text x="220" y="380" fill="#93c5fd" fontSize="11" fontWeight="bold">Henle’s Hairpin Loop</text>

                    {/* Distal Convoluted Tubule (DCT) to Collecting Duct */}
                    <path
                      d="M 310 170 Q 350 140 380 180 L 420 180"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      className="cursor-pointer hover:stroke-emerald-300"
                      onClick={() => setSelectedPart(activeOrgan.parts[3])}
                    />
                    {/* Collecting Duct Vertical */}
                    <line x1="420" y1="60" x2="420" y2="360" stroke="#10b981" strokeWidth="12" />
                    <text x="350" y="100" fill="#6ee7b7" fontSize="11" fontWeight="bold">Collecting Duct (Urine)</text>
                  </svg>
                )}

                {activeOrgan.diagramType === 'cell' && (
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px]">
                    {cellType === 'plant' ? (
                      <>
                        {/* Hexagonal/Rectangular Plant Cell Wall */}
                        <polygon
                          points="100,60 400,60 450,200 400,340 100,340 50,200"
                          fill="#064e3b"
                          stroke="#22c55e"
                          strokeWidth="8"
                          className="cursor-pointer hover:stroke-emerald-300"
                          onClick={() => setSelectedPart(activeOrgan.parts[4])}
                        />
                        <text x="70" y="45" fill="#86efac" fontSize="11" fontWeight="bold">Rigid Cellulose Cell Wall</text>

                        {/* Large Central Sap Vacuole */}
                        <ellipse
                          cx="260"
                          cy="200"
                          rx="130"
                          ry="85"
                          fill="#0284c7"
                          opacity="0.35"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          className="cursor-pointer hover:opacity-50"
                          onClick={() => setSelectedPart(activeOrgan.parts[3])}
                        />
                        <text x="210" y="200" fill="#bae6fd" fontSize="12" fontWeight="bold">Large Central Vacuole (Tonoplast)</text>

                        {/* Nucleus pushed to periphery */}
                        <circle
                          cx="380"
                          cy="130"
                          r="35"
                          fill="#8b5cf6"
                          stroke="#c4b5fd"
                          strokeWidth="3"
                          className="cursor-pointer hover:opacity-90"
                          onClick={() => setSelectedPart(activeOrgan.parts[0])}
                        />
                        <text x="360" y="135" fill="#ffffff" fontSize="10" fontWeight="bold">Nucleus</text>

                        {/* Chloroplasts */}
                        <ellipse cx="140" cy="110" rx="20" ry="12" fill="#15803d" stroke="#86efac" strokeWidth="1.5" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[2])} />
                        <ellipse cx="150" cy="280" rx="20" ry="12" fill="#15803d" stroke="#86efac" strokeWidth="1.5" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[2])} />
                        <text x="100" y="140" fill="#86efac" fontSize="10" fontWeight="bold">Chloroplasts</text>

                        {/* Mitochondria */}
                        <ellipse cx="360" cy="280" rx="18" ry="10" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                        <text x="330" y="310" fill="#fca5a5" fontSize="10">Mitochondria</text>
                      </>
                    ) : (
                      <>
                        {/* Animal Cell (Irregular oval plasma membrane) */}
                        <ellipse
                          cx="250"
                          cy="200"
                          rx="180"
                          ry="130"
                          fill="#1e1b4b"
                          stroke="#818cf8"
                          strokeWidth="4"
                        />
                        <text x="180" y="55" fill="#a5b4fc" fontSize="11" fontWeight="bold">Flexible Plasma Membrane (No Cell Wall)</text>

                        {/* Central Prominent Nucleus */}
                        <circle
                          cx="250"
                          cy="200"
                          r="45"
                          fill="#8b5cf6"
                          stroke="#c4b5fd"
                          strokeWidth="3"
                          className="cursor-pointer hover:opacity-90"
                          onClick={() => setSelectedPart(activeOrgan.parts[0])}
                        />
                        <circle cx="250" cy="200" r="15" fill="#4c1d95" />
                        <text x="225" y="205" fill="#ffffff" fontSize="11" fontWeight="bold">Nucleus</text>

                        {/* Mitochondria scattered */}
                        <ellipse cx="140" cy="140" rx="22" ry="12" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                        <ellipse cx="360" cy="240" rx="22" ry="12" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                        <text x="110" y="170" fill="#fca5a5" fontSize="10" fontWeight="bold">Mitochondria (ATP)</text>
                      </>
                    )}
                  </svg>
                )}

                {activeOrgan.diagramType === 'lungs' && (
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px]">
                    {/* Trachea */}
                    <rect x="235" y="40" width="30" height="90" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[0])} />
                    <line x1="235" y1="60" x2="265" y2="60" stroke="#bae6fd" strokeWidth="2" />
                    <line x1="235" y1="80" x2="265" y2="80" stroke="#bae6fd" strokeWidth="2" />
                    <line x1="235" y1="100" x2="265" y2="100" stroke="#bae6fd" strokeWidth="2" />
                    <text x="210" y="30" fill="#7dd3fc" fontSize="11" fontWeight="bold">Trachea (Cartilaginous Rings)</text>

                    {/* Left & Right Bronchi */}
                    <path d="M 235 130 L 170 180" stroke="#0284c7" strokeWidth="12" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                    <path d="M 265 130 L 330 180" stroke="#0284c7" strokeWidth="12" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />

                    {/* Right Lung (Lobe) */}
                    <path
                      d="M 170 170 C 80 170, 70 320, 160 330 C 210 330, 220 230, 170 170 Z"
                      fill="#be123c"
                      opacity="0.85"
                      stroke="#fb7185"
                      strokeWidth="2"
                    />
                    <text x="100" y="260" fill="#ffffff" fontSize="12" fontWeight="bold">Right Lung</text>

                    {/* Left Lung (Has Cardiac Notch for Heart) */}
                    <path
                      d="M 330 170 C 420 170, 430 320, 340 330 C 290 330, 280 230, 330 170 Z"
                      fill="#be123c"
                      opacity="0.85"
                      stroke="#fb7185"
                      strokeWidth="2"
                    />
                    <text x="350" y="260" fill="#ffffff" fontSize="12" fontWeight="bold">Left Lung (Cardiac Notch)</text>

                    {/* Alveoli Clusters Callout */}
                    <circle cx="140" cy="220" r="14" fill="#fb7185" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[2])} />
                    <circle cx="155" cy="225" r="12" fill="#fb7185" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[2])} />
                    <text x="80" y="210" fill="#fecdd3" fontSize="10" fontWeight="bold">Alveoli Sacs (O₂/CO₂)</text>

                    {/* Muscular Diaphragm Arch */}
                    <path
                      d="M 70 350 Q 250 320 430 350"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="6"
                      className="cursor-pointer"
                      onClick={() => setSelectedPart(activeOrgan.parts[3])}
                    />
                    <text x="210" y="375" fill="#fcd34d" fontSize="11" fontWeight="bold">Diaphragm Muscle</text>
                  </svg>
                )}

                {activeOrgan.diagramType === 'dna' && (
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px]">
                    {/* DNA Double Helix Strands */}
                    <path
                      d="M 120 40 Q 250 120 380 40 Q 250 200 120 200 Q 250 280 380 200 Q 250 360 120 360"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="6"
                      className="cursor-pointer"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />
                    <path
                      d="M 380 40 Q 250 120 120 40 Q 250 200 380 200 Q 250 280 120 200 Q 250 360 380 360"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="6"
                      className="cursor-pointer"
                      onClick={() => setSelectedPart(activeOrgan.parts[0])}
                    />

                    {/* Base Pairs (Hydrogen Bonds) */}
                    <line x1="200" y1="80" x2="300" y2="80" stroke="#ef4444" strokeWidth="4" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                    <text x="220" y="75" fill="#fca5a5" fontSize="10" fontWeight="bold">A = T (2 H-bonds)</text>

                    <line x1="220" y1="120" x2="280" y2="120" stroke="#10b981" strokeWidth="4" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[2])} />
                    <text x="215" y="115" fill="#86efac" fontSize="10" fontWeight="bold">G ≡ C (3 H-bonds)</text>

                    <line x1="180" y1="240" x2="320" y2="240" stroke="#ef4444" strokeWidth="4" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[1])} />
                    <line x1="210" y1="280" x2="290" y2="280" stroke="#10b981" strokeWidth="4" className="cursor-pointer" onClick={() => setSelectedPart(activeOrgan.parts[2])} />

                    <text x="20" y="190" fill="#c4b5fd" fontSize="11" fontWeight="bold">5′ → 3′ Strand</text>
                    <text x="400" y="190" fill="#fbcfe8" fontSize="11" fontWeight="bold">3′ → 5′ Strand</text>
                    <text x="180" y="385" fill="#fcd34d" fontSize="11" fontFamily="monospace">Pitch = 3.4 nm (10 bp/turn)</text>
                  </svg>
                )}
              </div>
            </div>

            {/* Right Anatomical Inspector Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-sm font-mono text-rose-400 font-bold uppercase flex items-center gap-2">
                    <Info className="w-4 h-4" /> Labeled Anatomical Parts
                  </h4>
                  <span className="text-xs text-slate-500">{activeOrgan.parts.length} Components</span>
                </div>

                <div className="space-y-2">
                  {activeOrgan.parts.map(part => {
                    const isSelected = selectedPart?.id === part.id;
                    return (
                      <button
                        key={part.id}
                        onClick={() => setSelectedPart(part)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-white font-bold shadow-md'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: part.color }}
                          />
                          <span className="text-xs">{part.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>

                {/* Selected Part Full Details */}
                {selectedPart && (
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-rose-300 uppercase tracking-wider font-bold">
                        Physiological Role
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {selectedPart.name}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPart.function}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                        NCERT Textbook Details
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {selectedPart.details}
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 bg-white/5 p-2 rounded-lg">
                      📖 {selectedPart.ncertReference}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. VIRTUAL SCIENCE TOOLS & APPARATUS VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'virtual_tools' && (
        <div className="space-y-6">
          {/* Tool Category Selector */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/70 border border-white/10">
            {VIRTUAL_TOOLS_LIBRARY.map(tool => {
              const isSelected = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{tool.name.split('(')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          {/* TOOL 1: CALIBRATED DIGITAL OPTICAL MICROSCOPE */}
          {selectedToolId === 'tool-microscope' && (
            <DigitalMicroscopeTool
              onLogToJournal={(reading) => {
                setLiveToolReadings(prev => ({ ...prev, microscope: reading }));
              }}
              onOpenJournal={() => setActiveMainTab('journal')}
            />
          )}

          {/* TOOL 2: PRECISION DIGITAL ANALYTICAL CHEMICAL BALANCE */}
          {selectedToolId === 'tool-chemical-balance' && (
            <ChemicalBalanceTool
              onLogToJournal={(reading) => {
                setLiveToolReadings(prev => ({ ...prev, balance: reading }));
              }}
              onOpenJournal={() => setActiveMainTab('journal')}
            />
          )}

          {/* TOOL 3: CALIBRATED DIGITAL BENCHTOP PH METER */}
          {selectedToolId === 'tool-ph-meter' && (
            <DigitalPhMeterTool
              onLogToJournal={(reading) => {
                setLiveToolReadings(prev => ({ ...prev, phMeter: reading }));
              }}
              onOpenJournal={() => setActiveMainTab('journal')}
            />
          )}

          {/* TOOL 2: ACID-BASE TITRATION & PH CURVE */}
          {selectedToolId === 'tool-titration' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 rounded-3xl bg-slate-950 border border-white/10 p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono text-pink-400 font-bold uppercase">Quantitative Volumetric Analysis</span>
                    <h3 className="text-lg font-bold text-white">HCl (Analyte) vs 0.1 M NaOH (Titrant) Titration</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-3 py-1 rounded-xl bg-black border border-pink-400/40 text-pink-300 font-bold">
                      pH: {titrationCalculatedPh}
                    </span>
                  </div>
                </div>

                {/* Simulated Conical Flask and Burette */}
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  {/* Graduated Burette Tube */}
                  <div className="w-10 h-44 rounded-t-lg border-2 border-slate-600 bg-slate-900/60 relative overflow-hidden flex flex-col justify-end">
                    <div 
                      className="w-full bg-blue-500/40 transition-all duration-200"
                      style={{ height: `${Math.max(0, 100 - (titrantAddedMl / 40) * 100)}%` }}
                    />
                    <span className="absolute top-2 left-1 text-[9px] font-mono text-slate-400">0 mL</span>
                    <span className="absolute bottom-2 left-1 text-[9px] font-mono text-slate-400">40 mL</span>
                  </div>

                  {/* Conical Flask */}
                  <div 
                    className="w-48 h-36 border-4 border-slate-500 rounded-b-3xl relative overflow-hidden flex items-end justify-center transition-all duration-300"
                    style={{
                      clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
                      backgroundColor: indicatorColorInfo.bg
                    }}
                  >
                    <span className="text-xs font-bold text-slate-950 mb-4 px-2 py-1 rounded bg-white/70">
                      {indicatorColorInfo.label}
                    </span>
                  </div>
                </div>

                {/* pH Real-Time Curve Summary */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    Titrant (0.1 M NaOH) Added: <strong className="text-pink-300">{titrantAddedMl} mL</strong>
                  </span>
                  <span className="text-xs text-slate-300">
                    Equivalence Point: <strong className="text-emerald-400">25.0 mL (Neutral pH 7.0)</strong>
                  </span>
                </div>
              </div>

              {/* Titration Controls */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-5">
                  <h4 className="text-sm font-mono text-pink-400 font-bold uppercase">Burette & Indicator Controls</h4>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-semibold">Indicator Dye:</label>
                    <select
                      value={titrationIndicator}
                      onChange={e => setTitrationIndicator(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="phenolphthalein">Phenolphthalein (Colorless → Pink at pH 8.2)</option>
                      <option value="methyl_orange">Methyl Orange (Red → Yellow)</option>
                      <option value="universal">Universal Indicator (Full spectrum pH 1-14)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-semibold">Add Titrant (NaOH):</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTitrantAddedMl(prev => Math.min(40, Number((prev + 1.0).toFixed(1))))}
                        className="p-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold border border-pink-500/40 cursor-pointer"
                      >
                        + 1.0 mL Tap
                      </button>
                      <button
                        onClick={() => setTitrantAddedMl(prev => Math.min(40, Number((prev + 0.1).toFixed(1))))}
                        className="p-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold border border-pink-500/40 cursor-pointer"
                      >
                        + 0.1 mL Drop
                      </button>
                    </div>

                    <button
                      onClick={() => setIsTitratingAuto(!isTitratingAuto)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isTitratingAuto ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {isTitratingAuto ? 'Stop Continuous Titration' : 'Start Continuous Burette Flow'}
                    </button>

                    <button
                      onClick={() => {
                        setTitrantAddedMl(0);
                        setIsTitratingAuto(false);
                      }}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold cursor-pointer"
                    >
                      Reset Flask & Burette
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOOL 3: FLAME TEST & EMISSION SPECTRA */}
          {selectedToolId === 'tool-flame-test' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 rounded-3xl bg-slate-950 border border-white/10 p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase">Atomic Spectroscopy Lab</span>
                    <h3 className="text-lg font-bold text-white">Bunsen Flame Color & Quantum Emission Lines</h3>
                  </div>
                </div>

                {/* Bunsen Burner Flame Canvas */}
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-24 h-48 relative flex items-center justify-center">
                    {/* Flame shape with dynamic color */}
                    <div 
                      className="w-20 h-40 rounded-full blur-md transition-all duration-300"
                      style={{
                        backgroundColor: 
                          activeFlameMetal === 'Na' ? '#fbbf24' :
                          activeFlameMetal === 'Cu' ? '#06b6d4' :
                          activeFlameMetal === 'K' ? '#c084fc' :
                          activeFlameMetal === 'Ca' ? '#f97316' :
                          activeFlameMetal === 'Ba' ? '#84cc16' : '#ef4444'
                      }}
                    />
                    <div className="w-8 h-20 rounded-full bg-blue-500 blur-sm absolute bottom-2" />
                  </div>
                  {/* Bunsen Metal Base */}
                  <div className="w-16 h-12 bg-slate-700 border-2 border-slate-500 rounded-t-md" />
                  <div className="w-28 h-4 bg-slate-800 rounded-full" />
                </div>

                {/* Spectral Wavelength Bar */}
                <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Atomic Emission Spectrum:</span>
                    <span className="text-amber-400 font-bold">
                      {activeFlameMetal === 'Na' ? '589.0 nm (D-lines)' :
                       activeFlameMetal === 'Cu' ? '510.5 nm & 521.8 nm' :
                       activeFlameMetal === 'K' ? '766.5 nm (Lilac)' :
                       activeFlameMetal === 'Ca' ? '622.0 nm (Brick Red)' :
                       activeFlameMetal === 'Ba' ? '553.5 nm (Apple Green)' : '606.0 nm'}
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-gradient-to-r from-violet-600 via-emerald-500 via-amber-400 to-rose-600" />
                </div>
              </div>

              {/* Metal Cation Salt Pickers */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-3">
                  <h4 className="text-sm font-mono text-amber-400 font-bold uppercase">Select Metal Salt (Platinum Wire):</h4>
                  {[
                    { id: 'Na', name: 'Sodium (NaCl)', colorText: 'Golden Yellow (589 nm)', bg: 'bg-amber-400' },
                    { id: 'Cu', name: 'Copper (CuSO₄)', colorText: 'Greenish-Blue (510 nm)', bg: 'bg-cyan-400' },
                    { id: 'K', name: 'Potassium (KCl)', colorText: 'Lilac / Violet (766 nm)', bg: 'bg-purple-400' },
                    { id: 'Ca', name: 'Calcium (CaCl₂)', colorText: 'Brick Red (622 nm)', bg: 'bg-orange-500' },
                    { id: 'Ba', name: 'Barium (BaCl₂)', colorText: 'Apple Green (553 nm)', bg: 'bg-lime-400' },
                    { id: 'Sr', name: 'Strontium (SrCl₂)', colorText: 'Crimson Red (606 nm)', bg: 'bg-rose-600' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setActiveFlameMetal(m.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        activeFlameMetal === m.id
                          ? 'bg-amber-400/20 border-amber-400 text-white font-bold'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${m.bg}`} />
                        <span className="text-xs">{m.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{m.colorText}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TOOL 4: VERNIER CALLIPERS */}
          {selectedToolId === 'tool-vernier' && (
            <div className="rounded-3xl bg-slate-950 border border-white/10 p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Physics Practical Unit 1</span>
                  <h3 className="text-lg font-bold text-white">Vernier Callipers Measurement Simulator</h3>
                </div>
                <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-black border border-cyan-400/40 text-cyan-300 font-bold">
                  Total Reading: {vernierJawPosition.toFixed(2)} cm (MSR + VSR × 0.01)
                </div>
              </div>

              {/* Interactive Scale */}
              <div className="p-8 rounded-2xl bg-black/90 border border-white/10 space-y-4">
                <div className="relative h-20 border-b-2 border-white flex items-end">
                  {/* Millimeter Ticks */}
                  {Array.from({ length: 41 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`border-l border-white ${i % 10 === 0 ? 'h-10 text-[10px] font-mono text-white' : i % 5 === 0 ? 'h-6' : 'h-3'}`}
                      style={{ width: '2.5%' }}
                    >
                      {i % 10 === 0 && <span className="absolute -top-5">{i / 10}</span>}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Move Vernier Jaw (cm):</span>
                    <span className="font-mono text-cyan-300">{vernierJawPosition.toFixed(2)} cm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.01"
                    value={vernierJawPosition}
                    onChange={e => setVernierJawPosition(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PHYSICS & CHEMISTRY SIMULATIONS VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'simulations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ohm's Law Lab */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Ohm's Law: V = I · R</span>
              </h3>
              <span className="text-xs font-mono text-amber-400 font-bold">{ohmsCurrent} Amperes</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>DC Voltage (V):</span>
                  <span className="font-mono text-amber-300">{ohmsVoltage} V</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={ohmsVoltage}
                  onChange={e => setOhmsVoltage(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Resistance (R):</span>
                  <span className="font-mono text-amber-300">{ohmsResistance} Ω</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={ohmsResistance}
                  onChange={e => setOhmsResistance(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 flex justify-between">
                <span>Power Dissipation:</span>
                <span className="font-mono text-amber-300 font-bold">{ohmsPower} Watts</span>
              </div>
            </div>
          </div>

          {/* Convex Lens Ray Optics */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>Convex Lens: 1/v - 1/u = 1/f</span>
              </h3>
              <span className="text-xs font-mono text-purple-400 font-bold">v = {imageDistance} cm</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Focal Length (f):</span>
                  <span className="font-mono text-purple-300">{focalLength} cm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={focalLength}
                  onChange={e => setFocalLength(Number(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Object Distance (u):</span>
                  <span className="font-mono text-purple-300">{objectDistance} cm</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="-5"
                  value={objectDistance}
                  onChange={e => setObjectDistance(Number(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 flex justify-between">
                <span>Magnification (m):</span>
                <span className="font-mono text-purple-300 font-bold">{magnification} ({isImageReal ? 'Real & Inverted' : 'Virtual & Erect'})</span>
              </div>
            </div>
          </div>

          {/* Simple Pendulum */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-4 shadow-xl md:col-span-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Simple Harmonic Oscillator (T = 2π√(L/g))</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">Period T = {timePeriod} s</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>String Length (L):</span>
                  <span className="font-mono text-emerald-300">{pendulumLength} m</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={pendulumLength}
                  onChange={e => setPendulumLength(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 mb-1 block">Celestial Gravity Field:</label>
                <div className="flex gap-1.5">
                  {(['earth', 'moon', 'jupiter'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setGravityPreset(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        gravityPreset === p ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 flex justify-between items-center">
                <span>Oscillation Angle:</span>
                <span className="font-mono text-emerald-300 font-bold">{pendulumAngle.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. EXPERIMENT JOURNAL & OFFICIAL PDF LAB REPORT VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'journal' && (
        <ExperimentJournal
          activeClass={activeClass}
          userProfile={userProfile}
          liveToolReadings={liveToolReadings}
          onSwitchToTool={(toolId) => {
            setSelectedToolId(toolId);
            setActiveMainTab('virtual_tools');
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 6. OFFICIAL PRESCRIBED PRACTICAL CATALOGUE VIEW */}
      {/* ========================================================= */}
      {activeMainTab === 'practicals' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/30 via-slate-900 to-slate-950 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CBSE &amp; NCERT Syllabus
                </span>
                <span className="text-xs text-slate-400">Class 9–12 Science Practical Manual</span>
              </div>
              <h3 className="text-xl font-black text-white">Prescribed Laboratory Practical Catalogue</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Every mandatory NCERT physics, chemistry, and biology laboratory experiment with complete apparatus specs, safety protocols, sample observation tables, viva questions, and links to interactive virtual instruments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMainTab('journal')}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>My Practical Journal</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Class:</span>
              {['All', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(cls => (
                <button
                  key={cls}
                  onClick={() => setPracticalClassFilter(cls)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    practicalClassFilter === cls
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cls}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-400 ml-2">Subject:</span>
              {['All', 'Science', 'Physics', 'Chemistry', 'Biology'].map(subj => (
                <button
                  key={subj}
                  onClick={() => setPracticalSubjectFilter(subj)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    practicalSubjectFilter === subj
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={practicalSearchQuery}
                onChange={(e) => setPracticalSearchQuery(e.target.value)}
                placeholder="Search experiments..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-400"
              />
            </div>
          </div>

          {/* 2-Column Layout: Practicals List & Detail Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Practical List */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
              {filteredPracticals.map(p => {
                const isSelected = p.id === activePractical?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPracticalId(p.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-400 shadow-lg shadow-purple-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="font-bold uppercase text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                        {p.classGrade} • {p.subject}
                      </span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>NCERT Verified</span>
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                      {p.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      Chapter: {p.chapter}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Practical Full Details */}
            {activePractical && (
              <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                      {activePractical.classGrade} • {activePractical.subject} • {activePractical.chapter}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      {activePractical.title}
                    </h3>
                  </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveMainTab('virtual_academy')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Open 3D Practical Academy</span>
                      </button>
                      {activePractical.linkedTool && (
                        <button
                          onClick={() => {
                            if (activePractical.linkedTool === 'microscope') {
                              setSelectedToolId('microscope');
                              setActiveMainTab('virtual_tools');
                            } else if (activePractical.linkedTool === 'balance') {
                              setSelectedToolId('balance');
                              setActiveMainTab('virtual_tools');
                            } else if (activePractical.linkedTool === 'ph_meter') {
                              setSelectedToolId('ph_meter');
                              setActiveMainTab('virtual_tools');
                            } else {
                              setActiveMainTab('simulations');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer shrink-0"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Tool Spec</span>
                        </button>
                      )}
                    </div>
                  </div>

                {/* Objective */}
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
                  <strong className="text-purple-300 block mb-1 uppercase font-black text-[10px] tracking-wider">Learning Objective:</strong>
                  <span className="text-slate-200 leading-relaxed">{activePractical.objective}</span>
                </div>

                {/* Apparatus & Safety */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Apparatus &amp; Materials</span>
                    </h5>
                    <ul className="space-y-1 text-slate-400">
                      {activePractical.apparatus.map((app, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{app}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>Safety Precautions</span>
                    </h5>
                    <ul className="space-y-1 text-slate-400">
                      {activePractical.safetyPrecautions.map((safe, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{safe}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Step-by-Step Procedure */}
                <div className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider">Step-by-Step Laboratory Procedure</h5>
                  <div className="space-y-1.5 text-xs">
                    {activePractical.procedureSteps.map((step, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Observation Table */}
                <div className="space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider">Standard Observation Table</h5>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                        <tr>
                          {activePractical.observationHeaders.map((head, i) => (
                            <th key={i} className="p-2.5 font-bold">{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300 font-mono text-[11px]">
                        {activePractical.sampleObservations.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Governing Calculations & Expected Outcome */}
                {activePractical.calculationsFormula && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/20 text-xs">
                    <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">Calculations &amp; Governing Equations:</span>
                    <span className="font-mono text-purple-200">{activePractical.calculationsFormula}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  <strong className="block mb-0.5 text-emerald-400">Expected Experimental Outcome:</strong>
                  <span>{activePractical.expectedOutcome}</span>
                </div>

                {/* Viva Voce Questions */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h5 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Viva Voce Oral Examination Questions</span>
                  </h5>
                  <div className="space-y-2">
                    {activePractical.vivaQuestions.map((viva, vIdx) => {
                      const isRevealed = Boolean(revealedVivaAnswers[vIdx]);
                      return (
                        <div key={vIdx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-200">
                              <span className="text-amber-400 mr-1.5">Q{vIdx + 1}.</span> {viva.question}
                            </span>
                            <button
                              onClick={() => setRevealedVivaAnswers(prev => ({ ...prev, [vIdx]: !prev[vIdx] }))}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold shrink-0 cursor-pointer"
                            >
                              {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                            </button>
                          </div>
                          {isRevealed && (
                            <p className="text-emerald-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800 animate-in fade-in">
                              <strong>Answer: </strong> {viva.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function AlertIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
