import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Calendar,
  Send,
  Plus,
  BookOpen,
  Clock,
  Shield,
  Layers,
  Search,
  Filter,
  Check,
  Award,
  ChevronRight,
  ExternalLink,
  Flame,
  HelpCircle,
  TrendingUp,
  Download
} from 'lucide-react';
import { UserProfile } from '../types';
import { NCERT_SYLLABUS } from '../data/ncertSyllabus';
import { PRESCRIBED_PRACTICALS } from '../data/ncertPracticalsData';

interface TeacherPortalProps {
  userProfile: UserProfile | null;
  activeClass: string;
  onNavigateToSection?: (tab: any, subTab?: any) => void;
}

interface AssignedTask {
  id: string;
  title: string;
  classGrade: string;
  subject: string;
  chapter: string;
  dueDate: string;
  assignedCount: number;
  completedCount: number;
  averageScorePercent: number;
  type: 'chapter_test' | 'practical_journal' | 'revision_quiz';
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  userProfile,
  activeClass,
  onNavigateToSection,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(activeClass || 'Class 10');
  const [selectedSubject, setSelectedSubject] = useState<string>('Science');
  const [activeTab, setActiveTab] = useState<'assignments' | 'analytics' | 'misconceptions' | 'journals'>('assignments');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // New assignment modal form state
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentChapter, setAssignmentChapter] = useState('');
  const [assignmentType, setAssignmentType] = useState<'chapter_test' | 'practical_journal' | 'revision_quiz'>('chapter_test');
  const [dueDate, setDueDate] = useState('2026-11-15');

  // Active assignments
  const [assignments, setAssignments] = useState<AssignedTask[]>([
    {
      id: 'asg_1',
      title: 'Class 10 Life Processes: Respiration & Circulation Test',
      classGrade: 'Class 10',
      subject: 'Science',
      chapter: 'Life Processes',
      dueDate: '2026-10-25',
      assignedCount: 42,
      completedCount: 38,
      averageScorePercent: 82,
      type: 'chapter_test',
    },
    {
      id: 'asg_2',
      title: 'Practical Work: Onion Peel Epidermal Cell Mount & Log',
      classGrade: 'Class 9',
      subject: 'Science',
      chapter: 'The Fundamental Unit of Life',
      dueDate: '2026-10-30',
      assignedCount: 39,
      completedCount: 29,
      averageScorePercent: 88,
      type: 'practical_journal',
    },
    {
      id: 'asg_3',
      title: 'Electricity & Ohm’s Law Graphical Derivation Check',
      classGrade: 'Class 10',
      subject: 'Science',
      chapter: 'Electricity',
      dueDate: '2026-11-05',
      assignedCount: 42,
      completedCount: 31,
      averageScorePercent: 74,
      type: 'revision_quiz',
    }
  ]);

  // Common Misconceptions identified across tests
  const commonMisconceptions = [
    {
      id: 'misc_1',
      topic: 'Double Circulation (Life Processes)',
      studentError: 'Confusing Left Ventricle vs Right Ventricle oxygenation status.',
      frequency: '68% of incorrect attempts',
      recommendedRemedy: 'Assign the 3D Beating Heart Virtual Simulation with blood flow trace.',
      remedySubTab: 'organs3d',
    },
    {
      id: 'misc_2',
      topic: 'Ohm’s Law V-I Graphing (Electricity)',
      studentError: 'Inverting slope (calculating I/V instead of V/I for resistance R).',
      frequency: '54% of students in Class 10 Section A',
      recommendedRemedy: 'Review Metre Bridge & Resistance derivation notes.',
      remedySubTab: 'virtual_tools',
    },
    {
      id: 'misc_3',
      topic: 'Snell’s Law & Refractive Index (Light)',
      studentError: 'Measuring angles to the interface surface rather than the perpendicular normal.',
      frequency: '47% of students',
      recommendedRemedy: 'Run the Optics Ray Diagram Simulation.',
      remedySubTab: 'simulations',
    }
  ];

  // Submitted student experiment journals for review
  const submittedJournals = [
    {
      id: 'jrn_1',
      studentName: 'Aarav Sharma',
      rollNo: '10-A-04',
      experimentTitle: 'Digital pH Meter Calibration & Soil Acidity',
      date: '2026-10-16',
      readingsCount: 5,
      status: 'pending_review',
      score: null,
    },
    {
      id: 'jrn_2',
      studentName: 'Priya Patel',
      rollNo: '10-A-19',
      experimentTitle: 'Compound Microscope: Onion Cell Sizing & Organelles',
      date: '2026-10-15',
      readingsCount: 4,
      status: 'reviewed',
      score: '10/10',
    },
    {
      id: 'jrn_3',
      studentName: 'Rohan Verma',
      rollNo: '10-A-27',
      experimentTitle: 'Chemical Analytical Balance: 0.1M Oxalic Acid Mass Prep',
      date: '2026-10-14',
      readingsCount: 3,
      status: 'reviewed',
      score: '9/10',
    }
  ];

  const classData = NCERT_SYLLABUS[selectedClass] || {};
  const chapters = classData[selectedSubject] || [];

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) return;

    const newTask: AssignedTask = {
      id: `asg_${Date.now()}`,
      title: assignmentTitle,
      classGrade: selectedClass,
      subject: selectedSubject,
      chapter: assignmentChapter || (chapters[0]?.name || 'General'),
      dueDate: dueDate,
      assignedCount: 42,
      completedCount: 0,
      averageScorePercent: 0,
      type: assignmentType,
    };

    setAssignments([newTask, ...assignments]);
    setShowAssignModal(false);
    setAssignmentTitle('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 space-y-6 text-slate-100">
      {/* HEADER BANNER */}
      <div className="astra-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Teacher & Educator Portal • Academic Session 2026–27</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Educator Classroom & Assessment Command
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Assign NCERT chapter tests, evaluate student 3D practical journals, diagnose learning misconceptions in real time, and deploy targeted remedial revision sets.
          </p>
        </div>

        {/* Global Classroom Control Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Chapter Test or Lab</span>
          </button>

          {/* Class Grade Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedClass === cls
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'assignments', label: 'Active Assignments', icon: Calendar, count: assignments.length },
          { id: 'misconceptions', label: 'Student Misconceptions', icon: AlertTriangle, count: commonMisconceptions.length },
          { id: 'journals', label: 'Practical Journals', icon: FileText, count: submittedJournals.length },
          { id: 'analytics', label: 'Class Analytics', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACTIVE ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled Students</span>
              <p className="text-2xl font-black text-white">42</p>
              <span className="text-xs text-emerald-400 font-semibold">91% active this week</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Completed Assessments</span>
              <p className="text-2xl font-black text-white">98 / 123</p>
              <span className="text-xs text-blue-400 font-semibold">79.6% completion rate</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Class Average Score</span>
              <p className="text-2xl font-black text-amber-400">81.3%</p>
              <span className="text-xs text-slate-400 font-semibold">CBSE Board Pattern Benchmark</span>
            </div>
          </div>

          <div className="space-y-3">
            {assignments.map(asg => (
              <div
                key={asg.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {asg.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">Due: {asg.dueDate}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{asg.title}</h3>
                    <p className="text-xs text-slate-400">{asg.classGrade} • {asg.subject} • {asg.chapter}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-300">
                      Completed: <strong className="text-emerald-400">{asg.completedCount} / {asg.assignedCount}</strong>
                    </div>
                    <div className="text-xs font-bold text-amber-400 mt-0.5">
                      Avg Score: {asg.averageScorePercent}%
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full"
                    style={{ width: `${(asg.completedCount / asg.assignedCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COMMON MISCONCEPTIONS */}
      {activeTab === 'misconceptions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300">
            <strong className="text-amber-400">Diagnostic Misconception Radar: </strong>
            These persistent misunderstandings were automatically extracted from student errors on chapter tests and mistake notebooks across {selectedClass}.
          </div>

          <div className="space-y-3">
            {commonMisconceptions.map(m => (
              <div key={m.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{m.topic}</span>
                  </h4>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {m.frequency}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-slate-400">Identified Error: </strong> {m.studentError}
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span><strong>Pedagogical Remedy: </strong> {m.recommendedRemedy}</span>
                  </div>

                  {onNavigateToSection && (
                    <button
                      onClick={() => onNavigateToSection('labs', m.remedySubTab)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold border border-blue-500/40 transition-all cursor-pointer"
                    >
                      <span>Deploy Lab</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRACTICAL JOURNALS */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Student Practical Work Submissions</h4>
              <p className="text-xs text-slate-400">Review observations, calculations, and assign viva marks</p>
            </div>
            {onNavigateToSection && (
              <button
                onClick={() => onNavigateToSection('labs', 'journal')}
                className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Open Virtual Journal Hub
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {submittedJournals.map(j => (
              <div
                key={j.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{j.studentName}</span>
                    <span className="text-xs font-mono text-slate-500">({j.rollNo})</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{j.experimentTitle}</p>
                  <span className="text-[10px] text-slate-500">Submitted: {j.date} • {j.readingsCount} observations logged</span>
                </div>

                <div className="flex items-center gap-3">
                  {j.score ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                      Grade: {j.score}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
                      Needs Review
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (onNavigateToSection) onNavigateToSection('labs', 'journal');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    View Journal Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLASS ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Subject Performance Index</h4>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Biology (Life Processes, Control & Coordination)', score: 86, color: 'from-emerald-400 to-emerald-600' },
                  { name: 'Physics (Electricity, Magnetic Effects, Light)', score: 79, color: 'from-blue-400 to-blue-600' },
                  { name: 'Chemistry (Chemical Reactions, Acids & Bases)', score: 74, color: 'from-amber-400 to-amber-600' }
                ].map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-300">
                      <span>{s.name}</span>
                      <span>{s.score}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${s.color}`} style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attendance & Practical Mastery</h4>
              <p className="text-xs text-slate-400">
                87% of students completed all mandatory Class 10 term experiments (Digital pH Meter, Microscope Onion Peel, Ohm’s Law).
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <strong>NCERT Board Readiness: </strong> Classroom is 12 days ahead of the CBSE annual timetable schedule.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT CREATION MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Assign Assessment or Lab Activity</span>
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g. Class 10 Electricity Numerical Test"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {['Science', 'Physics', 'Chemistry', 'Biology'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Type</label>
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="chapter_test">Chapter Test</option>
                    <option value="practical_journal">Practical Lab Journal</option>
                    <option value="revision_quiz">Revision Quiz</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Chapter</label>
                <select
                  value={assignmentChapter}
                  onChange={(e) => setAssignmentChapter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {chapters.map(ch => (
                    <option key={`${ch.number}-${ch.name}`} value={ch.name}>{ch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
