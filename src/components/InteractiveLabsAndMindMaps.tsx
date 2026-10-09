import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  Cpu, 
  Eye, 
  Sparkles, 
  Zap, 
  Sliders, 
  RotateCcw, 
  Layers, 
  HelpCircle, 
  Download, 
  Maximize2, 
  ChevronRight, 
  ChevronDown,
  Activity,
  Play,
  Pause
} from 'lucide-react';

interface MindMapNodeData {
  id: string;
  label: string;
  description?: string;
  formula?: string;
  children?: MindMapNodeData[];
}

export const InteractiveLabsAndMindMaps: React.FC<{ activeClass: string }> = ({ activeClass }) => {
  const [activeTab, setActiveTab] = useState<'mindmap' | 'ohms_law' | 'optics' | 'pendulum'>('mindmap');

  // Mind Map State
  const [selectedChapter, setSelectedChapter] = useState('Electricity & Circuits');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root': true,
    'sub_1': true,
    'sub_2': true,
  });

  // Ohm's Law Lab State
  const [ohmsVoltage, setOhmsVoltage] = useState(12); // Volts
  const [ohmsResistance, setOhmsResistance] = useState(6); // Ohms
  const ohmsCurrent = (ohmsVoltage / ohmsResistance).toFixed(2);
  const ohmsPower = (ohmsVoltage * Number(ohmsCurrent)).toFixed(2);

  // Optics Lab State
  const [focalLength, setFocalLength] = useState(10); // cm
  const [objectDistance, setObjectDistance] = useState(-25); // cm (convention: negative)
  // Lens formula: 1/v - 1/u = 1/f => 1/v = 1/f + 1/u => v = (f * u) / (u + f)
  const imageDistance = ((focalLength * objectDistance) / (objectDistance + focalLength)).toFixed(1);
  const magnification = (-Number(imageDistance) / objectDistance).toFixed(2);
  const isImageReal = Number(imageDistance) > 0;

  // Pendulum Lab State
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
    if (!isPendulumSwinging || activeTab !== 'pendulum') return;
    let frameId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const omega = Math.sqrt(currentG / pendulumLength);
      // theta = theta0 * cos(omega * t)
      const maxAngle = 25; // degrees
      const angle = maxAngle * Math.cos(omega * elapsed);
      setPendulumAngle(angle);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPendulumSwinging, pendulumLength, currentG, activeTab]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Sample Hierarchical Mind Map Data
  const sampleMindMap: MindMapNodeData = {
    id: 'root',
    label: selectedChapter,
    description: `Core NCERT Curriculum for ${activeClass}`,
    children: [
      {
        id: 'sub_1',
        label: "Electric Current & Potential",
        description: "Rate of flow of electric charge through a conductor",
        formula: "I = Q / t",
        children: [
          {
            id: 'leaf_1_1',
            label: "Electric Current (I)",
            description: "SI Unit: Ampere (A). Measured by Ammeter in series.",
            formula: "1 A = 1 C / 1 s"
          },
          {
            id: 'leaf_1_2',
            label: "Potential Difference (V)",
            description: "Work done in moving unit positive charge. Measured by Voltmeter in parallel.",
            formula: "V = W / Q  [Volt]"
          }
        ]
      },
      {
        id: 'sub_2',
        label: "Ohm's Law & Resistance",
        description: "Potential difference across a conductor is proportional to current at constant temperature",
        formula: "V = I * R",
        children: [
          {
            id: 'leaf_2_1',
            label: "Resistance (R)",
            description: "Opposition offered by conductor to flow of charge. SI Unit: Ohm (Ω).",
            formula: "R = ρ * (L / A)"
          },
          {
            id: 'leaf_2_2',
            label: "Factors Affecting R",
            description: "Length (R ∝ L), Area (R ∝ 1/A), Nature of material (ρ), Temperature."
          }
        ]
      },
      {
        id: 'sub_3',
        label: "Combination of Resistors",
        description: "Series vs Parallel network calculations",
        children: [
          {
            id: 'leaf_3_1',
            label: "Series Combination",
            description: "Same current flows through all resistors. Equivalent resistance increases.",
            formula: "R_eq = R1 + R2 + R3"
          },
          {
            id: 'leaf_3_2',
            label: "Parallel Combination",
            description: "Same voltage across all branches. Overall equivalent resistance decreases.",
            formula: "1 / R_eq = 1/R1 + 1/R2 + 1/R3"
          }
        ]
      },
      {
        id: 'sub_4',
        label: "Heating Effect & Electric Power",
        description: "Joule's Law of heating and electrical power consumption",
        formula: "H = I^2 * R * t",
        children: [
          {
            id: 'leaf_4_1',
            label: "Electric Power (P)",
            description: "Rate of electrical energy consumption. SI Unit: Watt (W).",
            formula: "P = V * I = I^2 * R = V^2 / R"
          },
          {
            id: 'leaf_4_2',
            label: "Commercial Unit",
            description: "1 kilowatt-hour (kWh) = 1 Board of Trade Unit = 3.6 × 10^6 Joules."
          }
        ]
      }
    ]
  };

  const renderNode = (node: MindMapNodeData, level: number = 0) => {
    const isExpanded = Boolean(expandedNodes[node.id]);
    const hasChildren = Boolean(node.children && node.children.length > 0);

    return (
      <div key={node.id} className="space-y-2">
        <div 
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            level === 0
              ? 'bg-amber-400/20 border-amber-400/50 text-white shadow-lg'
              : level === 1
              ? 'bg-purple-500/15 border-purple-500/30 text-white'
              : 'bg-white/5 border-white/10 text-slate-200'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="text-amber-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              )}
              <span className={`font-bold ${level === 0 ? 'text-base text-amber-300' : 'text-xs text-white'}`}>
                {node.label}
              </span>
            </div>

            {node.description && (
              <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                {node.description}
              </p>
            )}

            {node.formula && (
              <div className="pl-6 pt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-black/40 text-amber-300 font-mono text-[10px] border border-amber-400/30">
                  {node.formula}
                </span>
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-2 border-l border-white/10 ml-4 pl-2">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold mb-3">
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Learning &bull; Requirement 10</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Mind Maps &amp; Virtual Science Labs
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Explore concepts visually with expandable hierarchical mind maps or run real-time virtual physics and science experiments right inside your browser!
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mindmap' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Concept Mind Map
          </button>
          <button
            onClick={() => setActiveTab('ohms_law')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ohms_law' ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ohm's Law Lab
          </button>
          <button
            onClick={() => setActiveTab('optics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'optics' ? 'bg-purple-400 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Convex Lens Lab
          </button>
          <button
            onClick={() => setActiveTab('pendulum')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pendulum' ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendulum Lab
          </button>
        </div>
      </div>

      {/* VIEW 1: CONCEPT MIND MAP */}
      {activeTab === 'mindmap' && (
        <div className="p-6 rounded-3xl astra-card border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-400" />
                <span>Interactive Concept Hierarchy: {selectedChapter}</span>
              </h3>
              <span className="text-xs text-slate-400">Click any node to expand or collapse subtopics</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedNodes({ 'root': true, 'sub_1': true, 'sub_2': true, 'sub_3': true, 'sub_4': true })}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedNodes({ 'root': true })}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {renderNode(sampleMindMap)}
          </div>
        </div>
      )}

      {/* VIEW 2: OHM'S LAW VIRTUAL SIMULATOR */}
      {activeTab === 'ohms_law' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 p-6 rounded-3xl astra-card border border-white/10 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Ohm's Law Laboratory</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Adjust Voltage ($V$) and Resistance ($R$) to observe live current ($I = V/R$) and electrical power dissipation.
              </p>
            </div>

            {/* Voltage Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Voltage Source ($V$):</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{ohmsVoltage} Volts</span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                step={0.5}
                value={ohmsVoltage}
                onChange={(e) => setOhmsVoltage(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 V</span>
                <span>12 V</span>
                <span>24 V</span>
              </div>
            </div>

            {/* Resistance Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Resistor ($R$):</span>
                <span className="font-mono font-bold text-purple-400 text-sm">{ohmsResistance} Ohms (Ω)</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={ohmsResistance}
                onChange={(e) => setOhmsResistance(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 Ω</span>
                <span>25 Ω</span>
                <span>50 Ω</span>
              </div>
            </div>

            {/* Output Meters */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center space-y-1">
                <span className="text-[11px] text-amber-300 font-medium block">Current Flow ($I$):</span>
                <div className="text-2xl font-black text-white font-mono">{ohmsCurrent} <span className="text-sm font-bold text-amber-400">A</span></div>
                <span className="text-[10px] text-slate-400">Ammeter Reading</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center space-y-1">
                <span className="text-[11px] text-purple-300 font-medium block">Power Dissipated ($P$):</span>
                <div className="text-2xl font-black text-white font-mono">{ohmsPower} <span className="text-sm font-bold text-purple-400">W</span></div>
                <span className="text-[10px] text-slate-400">Joule Heating</span>
              </div>
            </div>
          </div>

          {/* Graphical Schematic Diagram & V-I Curve */}
          <div className="lg:col-span-7 p-6 rounded-3xl astra-card border border-white/10 space-y-6">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Dynamic V-I Characteristic Graph (Linear Slope = $1/R$)</span>
              <span className="text-xs font-mono text-amber-400">Slope: {(1 / ohmsResistance).toFixed(3)} mho</span>
            </h4>

            {/* SVG Visual Circuit & Graph */}
            <div className="w-full bg-slate-950 rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
              <svg className="w-full h-48" viewBox="0 0 400 180">
                {/* Graph Axes */}
                <line x1="50" y1="150" x2="360" y2="150" stroke="#475569" strokeWidth="2" />
                <line x1="50" y1="150" x2="50" y2="20" stroke="#475569" strokeWidth="2" />

                {/* Axis Labels */}
                <text x="365" y="154" fill="#94a3b8" fontSize="10" fontFamily="monospace">V (Volts)</text>
                <text x="45" y="15" fill="#94a3b8" fontSize="10" fontFamily="monospace">I (Amperes)</text>

                {/* Grid Lines */}
                <line x1="50" y1="100" x2="350" y2="100" stroke="#334155" strokeDasharray="3,3" />
                <line x1="50" y1="50" x2="350" y2="50" stroke="#334155" strokeDasharray="3,3" />
                <line x1="200" y1="150" x2="200" y2="20" stroke="#334155" strokeDasharray="3,3" />

                {/* V-I Straight Line */}
                <line 
                  x1="50" 
                  y1="150" 
                  x2={50 + 300} 
                  y2={150 - (300 / ohmsResistance) * 8} 
                  stroke="#f59e0b" 
                  strokeWidth="3" 
                />

                {/* Current Operating Point */}
                <circle 
                  cx={50 + (ohmsVoltage / 24) * 300} 
                  cy={150 - (Number(ohmsCurrent) / 24) * 120} 
                  r="6" 
                  fill="#ef4444" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />

                {/* Operating Point Label */}
                <text 
                  x={Math.min(300, 60 + (ohmsVoltage / 24) * 300)} 
                  y={Math.max(30, 140 - (Number(ohmsCurrent) / 24) * 120)} 
                  fill="#ffffff" 
                  fontSize="10" 
                  fontWeight="bold" 
                  fontFamily="monospace"
                >
                  ({ohmsVoltage}V, {ohmsCurrent}A)
                </text>
              </svg>
            </div>

            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-300">
              <strong className="text-amber-300 block mb-0.5">NCERT Takeaway:</strong>
              Ohm's law states that for a metallic conductor, the graph between $V$ and $I$ is always a straight line passing through the origin, confirming direct proportionality.
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: OPTICS VIRTUAL RAY LAB */}
      {activeTab === 'optics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 p-6 rounded-3xl astra-card border border-white/10 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <span>Convex Lens Optics Simulator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Explore real and virtual image formation according to the thin lens formula: $1/v - 1/u = 1/f$.
              </p>
            </div>

            {/* Focal Length Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Focal Length ($f$):</span>
                <span className="font-mono font-bold text-purple-400 text-sm">+{focalLength} cm</span>
              </div>
              <input
                type="range"
                min={5}
                max={20}
                step={1}
                value={focalLength}
                onChange={(e) => setFocalLength(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Object Distance Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Object Distance ($u$):</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{objectDistance} cm</span>
              </div>
              <input
                type="range"
                min={-50}
                max={-8}
                step={1}
                value={objectDistance}
                onChange={(e) => setObjectDistance(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Calculated Image Properties */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Image Distance ($v$):</span>
                <span className="font-mono font-bold text-white">+{imageDistance} cm</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Magnification ($m = v/u$):</span>
                <span className="font-mono font-bold text-white">{magnification}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Image Nature:</span>
                <span className="font-bold text-emerald-400">
                  {isImageReal ? 'Real & Inverted' : 'Virtual & Erect'}
                </span>
              </div>
            </div>
          </div>

          {/* Ray Diagram Canvas */}
          <div className="lg:col-span-7 p-6 rounded-3xl astra-card border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-white">Live Ray Tracing Simulation</h4>
            <div className="w-full bg-slate-950 rounded-2xl p-4 border border-white/5 flex items-center justify-center min-h-[240px]">
              <svg className="w-full h-56" viewBox="0 0 400 200">
                {/* Principal Axis */}
                <line x1="10" y1="100" x2="390" y2="100" stroke="#64748b" strokeWidth="1.5" />

                {/* Convex Lens at center x=200 */}
                <ellipse cx="200" cy="100" rx="6" ry="80" fill="#38bdf822" stroke="#38bdf8" strokeWidth="2" />

                {/* Focal Points F1 and F2 */}
                <circle cx={200 - focalLength * 6} cy="100" r="3" fill="#f59e0b" />
                <text x={200 - focalLength * 6 - 8} y="116" fill="#f59e0b" fontSize="9" fontFamily="monospace">F1</text>

                <circle cx={200 + focalLength * 6} cy="100" r="3" fill="#f59e0b" />
                <text x={200 + focalLength * 6 - 4} y="116" fill="#f59e0b" fontSize="9" fontFamily="monospace">F2</text>

                {/* Object Arrow at x = 200 + objectDistance * 3 */}
                <line 
                  x1={200 + objectDistance * 3} 
                  y1="100" 
                  x2={200 + objectDistance * 3} 
                  y2="50" 
                  stroke="#fbbf24" 
                  strokeWidth="3" 
                />
                <polygon 
                  points={`${200 + objectDistance * 3 - 4},55 ${200 + objectDistance * 3 + 4},55 ${200 + objectDistance * 3},45`} 
                  fill="#fbbf24" 
                />

                {/* Parallel Ray to Lens */}
                <line 
                  x1={200 + objectDistance * 3} 
                  y1="50" 
                  x2="200" 
                  y2="50" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                />
                {/* Refracted Ray through F2 */}
                <line 
                  x1="200" 
                  y1="50" 
                  x2={200 + Number(imageDistance) * 3} 
                  y2={100 + Number(magnification) * 50} 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                />

                {/* Central Ray through Optical Center (undeflected) */}
                <line 
                  x1={200 + objectDistance * 3} 
                  y1="50" 
                  x2={200 + Number(imageDistance) * 3} 
                  y2={100 + Number(magnification) * 50} 
                  stroke="#a855f7" 
                  strokeWidth="1.5" 
                />

                {/* Inverted Image Arrow */}
                {isImageReal && (
                  <line 
                    x1={200 + Number(imageDistance) * 3} 
                    y1="100" 
                    x2={200 + Number(imageDistance) * 3} 
                    y2={100 + Number(magnification) * 50} 
                    stroke="#10b981" 
                    strokeWidth="3" 
                  />
                )}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: PENDULUM LAB */}
      {activeTab === 'pendulum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 p-6 rounded-3xl astra-card border border-white/10 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>Simple Harmonic Pendulum Lab</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Measure the oscillation period T = 2π√(L/g) and explore gravitational variation across celestial bodies.
              </p>
            </div>

            {/* Length Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">String Length ($L$):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{pendulumLength} meters</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={pendulumLength}
                onChange={(e) => setPendulumLength(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Gravity Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Gravity Environment ($g$):</span>
              <div className="grid grid-cols-3 gap-2">
                {(['earth', 'moon', 'jupiter'] as const).map(planet => (
                  <button
                    key={planet}
                    onClick={() => setGravityPreset(planet)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      gravityPreset === planet
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {planet} ({gravities[planet]} m/s²)
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Box */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                <span className="text-[11px] text-emerald-300 font-medium block">Period ($T$):</span>
                <div className="text-2xl font-black text-white font-mono">{timePeriod} <span className="text-sm font-bold text-emerald-400">s</span></div>
                <span className="text-[10px] text-slate-400">1 Full Cycle</span>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-1">
                <span className="text-[11px] text-cyan-300 font-medium block">Frequency ($f$):</span>
                <div className="text-2xl font-black text-white font-mono">{frequency} <span className="text-sm font-bold text-cyan-400">Hz</span></div>
                <span className="text-[10px] text-slate-400">Cycles per second</span>
              </div>
            </div>

            <button
              onClick={() => setIsPendulumSwinging(!isPendulumSwinging)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isPendulumSwinging ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPendulumSwinging ? 'Pause Oscillation' : 'Resume Oscillation'}</span>
            </button>
          </div>

          {/* Harmonic Canvas Animation */}
          <div className="lg:col-span-7 p-6 rounded-3xl astra-card border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-white">Oscillation Simulation Canvas</h4>
            <div className="w-full bg-slate-950 rounded-2xl p-6 border border-white/5 flex items-center justify-center min-h-[260px]">
              <svg className="w-64 h-64" viewBox="-120 0 240 240">
                {/* Ceiling Mount */}
                <rect x="-40" y="0" width="80" height="8" rx="2" fill="#64748b" />
                <circle cx="0" cy="8" r="4" fill="#94a3b8" />

                {/* String with angle */}
                {(() => {
                  const rad = (pendulumAngle * Math.PI) / 180;
                  const bobRadius = 180 * (pendulumLength / 2.5 + 0.3);
                  const bobX = bobRadius * Math.sin(rad);
                  const bobY = 8 + bobRadius * Math.cos(rad);

                  return (
                    <>
                      <line x1="0" y1="8" x2={bobX} y2={bobY} stroke="#f59e0b" strokeWidth="2" />
                      <circle cx={bobX} cy={bobY} r="14" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
