/**
 * Buzzing Brain — Free Education for All
 * Open NCERT Handwritten Notes Engine, Chapter Assessments, Digital Textbooks & YouTube Portal
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logOut, 
  syncUserProfile, 
  updateStudentProfile,
  subscribeToUserProfile, 
  checkRedirectAuthResult,
  buildFallbackUserProfile,
  saveStudyNote, 
  deleteStudyNote, 
  subscribeToStudyNotes, 
  submitComplaint, 
  updateComplaintStatus, 
  subscribeToComplaints 
} from './services/firebase';
import { logger } from './services/logger';
import { Navbar, NavTab } from './components/Navbar';
import { AstraLandingPage } from './components/AstraLandingPage';
import { HandwritingCommandBar } from './components/HandwritingCommandBar';
import { HandwrittenNoteRenderer } from './components/HandwrittenNoteRenderer';
import { NcertBooksSection } from './components/NcertBooksSection';
import { SyllabusSection } from './components/SyllabusSection';
import { YouTubeChannelSection } from './components/YouTubeChannelSection';
import { StudentNotesLibrary } from './components/StudentNotesLibrary';
import { TestSection } from './components/TestSection';
import { CourseGeneratorSection } from './components/CourseGeneratorSection';
import { EducationalVideoStudio } from './components/EducationalVideoStudio';
import { HomeworkScannerSection } from './components/HomeworkScannerSection';
import { InteractiveLabsAndMindMaps } from './components/InteractiveLabsAndMindMaps';
import { AdaptiveLearningDashboard } from './components/AdaptiveLearningDashboard';
import { ExamRevisionPlanner } from './components/ExamRevisionPlanner';
import { CommunityNotesHub } from './components/CommunityNotesHub';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { AdminDashboard } from './components/AdminDashboard';
import { TermsAndConditionsPage } from './components/TermsAndConditionsPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { ComplaintModal } from './components/ComplaintModal';
import { OnboardingModal } from './components/OnboardingModal';
import { TermsPrivacyModal } from './components/TermsPrivacyModal';
import { AiTutorChatDrawer } from './components/AiTutorChatDrawer';
import { AuthWallModal } from './components/AuthWallModal';
import { InteractiveSpaceBackground } from './components/InteractiveSpaceBackground';
import { 
  StudyNote, 
  UserProfile, 
  ComplaintTicket, 
  NoteContentPayload, 
  HandwritingStyleConfig,
  ComplaintCategory,
  AuthStateStatus
} from './types';
import { 
  Sparkles, 
  PenTool, 
  BookOpen, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle,
  FileText,
  Lock,
  ArrowRight,
  Play,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function App() {
  // Authentication & Profile Lifecycle State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStateStatus>('AUTH_LOADING');

  // App Navigation & Selected Grade (Default to Class 11 or landing)
  const [currentTab, setCurrentTab] = useState<NavTab>('landing');
  const [activeClass, setActiveClass] = useState<string>('Class 11');

  // Study Notes State
  const [notesList, setNotesList] = useState<StudyNote[]>([]);
  const [currentActiveNote, setCurrentActiveNote] = useState<NoteContentPayload | null>(null);
  const [currentActiveStyle, setCurrentActiveStyle] = useState<HandwritingStyleConfig | null>(null);
  const [activeNoteSavedId, setActiveNoteSavedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [queuedCommand, setQueuedCommand] = useState<string | undefined>(undefined);

  // Complaints & Grievance State
  const [complaintsList, setComplaintsList] = useState<ComplaintTicket[]>([]);

  // Modals & Drawers
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');
  const [showTutorChat, setShowTutorChat] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authWallMessage, setAuthWallMessage] = useState<string | undefined>(undefined);

  // 1. Listen for Auth State & sync Profile Lifecycle
  useEffect(() => {
    logger.info('App', 'Mounting auth lifecycle listener');
    let isMounted = true;

    // Check for incoming redirect OAuth credentials on boot
    checkRedirectAuthResult().then((redirectUser) => {
      if (redirectUser && isMounted) {
        logger.info('App', `Redirect OAuth verified for: ${redirectUser.email}`);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setAuthStatus('UNAUTHENTICATED');
        return;
      }

      setAuthStatus('AUTHENTICATED_PROFILE_LOADING');

      try {
        const profile = await syncUserProfile(user, activeClass);
        if (!isMounted) return;
        setUserProfile(profile);
        setAuthStatus('AUTHENTICATED_PROFILE_READY');

        // Check if required student profile details are present
        const isComplete = Boolean(
          profile.acceptedTerms && 
          profile.age && 
          profile.sex && 
          profile.mobileNumber && 
          profile.targetExam
        );
        const isDismissed = sessionStorage.getItem(`bb_onboarding_dismissed_${user.uid}`);
        if (!isComplete && !isDismissed && !user.isAnonymous) {
          setShowOnboarding(true);
        }
      } catch (err) {
        logger.error('App', 'Profile sync notice:', err);
        if (!isMounted) return;
        setAuthStatus('AUTHENTICATED_PROFILE_ERROR');
        // Resilient fallback profile keeps student authenticated
        const fallback = buildFallbackUserProfile(user, activeClass);
        setUserProfile(fallback);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  // Real-time Firestore user profile sync listener (updates in background)
  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToUserProfile(firebaseUser.uid, (remoteProfile) => {
      if (remoteProfile) {
        setUserProfile(remoteProfile);
      }
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  // 2. Real-time Firestore Notes Listener
  useEffect(() => {
    const unsubNotes = subscribeToStudyNotes((notes) => {
      setNotesList(notes);
      logger.info('App', `Synced ${notes.length} notes from Firestore`);
    });

    return () => {
      unsubNotes();
    };
  }, []);

  // 3. Real-time Firestore Complaints Listener (only when authenticated)
  useEffect(() => {
    if (!firebaseUser) {
      setComplaintsList([]);
      return;
    }

    const unsubComplaints = subscribeToComplaints((complaints) => {
      setComplaintsList(complaints);
      logger.info('App', `Synced ${complaints.length} complaints from Firestore`);
    });

    return () => {
      unsubComplaints();
    };
  }, [firebaseUser]);

  // 4. Command Execution Engine (/handwriting) - Enforces Login for Generating Notes
  const handleExecuteCommand = async (
    commandString: string, 
    options?: Partial<HandwritingStyleConfig> & { thinkingMode?: 'standard' | 'high' }
  ) => {
    // Strictly require login before notes generation
    if (!firebaseUser) {
      setAuthWallMessage("To synthesize authentic handwritten NCERT study notes with formulas, diagrams, and PDF exports, please log in or sign up first. It's completely free!");
      setShowAuthWall(true);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    logger.info('Pipeline', `Executing note generation: ${commandString}`);

    try {
      const response = await fetch('/api/handwriting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandString,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedNote = data.noteContent as NoteContentPayload;
      const appliedStyle = data.styleConfig as HandwritingStyleConfig;

      setCurrentActiveNote(generatedNote);
      setCurrentActiveStyle(appliedStyle);
      setCurrentTab('studio');

      // Auto-save to Firestore if user is authenticated
      if (firebaseUser) {
        try {
          const noteId = await saveStudyNote({
            title: generatedNote.title,
            classGrade: generatedNote.classGrade,
            subject: generatedNote.subject,
            chapter: generatedNote.chapter,
            topic: generatedNote.topic,
            commandUsed: commandString,
            contentJson: JSON.stringify(generatedNote),
            styleConfig: JSON.stringify(appliedStyle),
            userId: firebaseUser.uid,
            userEmail: firebaseUser.email || undefined,
            userName: firebaseUser.displayName || 'Student',
            isPublic: true,
            likesCount: 0,
          });
          setActiveNoteSavedId(noteId);
          logger.info('Pipeline', `Auto-persisted note ${noteId} to Firestore`);
        } catch (dbErr) {
          logger.warn('Pipeline', 'Note generated but auto-save deferred:', dbErr);
        }
      } else {
        setActiveNoteSavedId(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate note';
      logger.error('Pipeline', 'Error during note generation:', err);
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Save current note to user's library manually
  const handleSaveActiveNote = async () => {
    if (!currentActiveNote || !currentActiveStyle) return;
    if (!firebaseUser) {
      setAuthWallMessage("Please log in to save handwritten notes to your personal student library.");
      setShowAuthWall(true);
      return;
    }

    try {
      const noteId = await saveStudyNote({
        title: currentActiveNote.title,
        classGrade: currentActiveNote.classGrade,
        subject: currentActiveNote.subject,
        chapter: currentActiveNote.chapter,
        topic: currentActiveNote.topic,
        commandUsed: `/handwriting ${currentActiveNote.classGrade} ${currentActiveNote.subject} ${currentActiveNote.chapter}`,
        contentJson: JSON.stringify(currentActiveNote),
        styleConfig: JSON.stringify(currentActiveStyle),
        userId: firebaseUser.uid,
        userEmail: firebaseUser.email || undefined,
        userName: firebaseUser.displayName || 'Student',
        isPublic: true,
        likesCount: 0,
      });
      setActiveNoteSavedId(noteId);
      alert('Handwritten note saved to your Student Library!');
    } catch (err) {
      logger.error('App', 'Failed to save note:', err);
    }
  };

  // 5b. Regenerate an individual section of the active note without re-running everything
  const handleRegenerateSection = async (secIdx: number) => {
    if (!currentActiveNote) return;
    const targetSec = currentActiveNote.sections[secIdx];
    if (!targetSec) return;

    try {
      const response = await fetch('/api/handwriting/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: currentActiveNote.chapter,
          subject: currentActiveNote.subject,
          classGrade: currentActiveNote.classGrade,
          sectionHeading: targetSec.heading,
          sectionContext: targetSec.content,
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate section');
      const data = await response.json();
      if (data.section) {
        const updated = [...currentActiveNote.sections];
        updated[secIdx] = data.section;
        setCurrentActiveNote({
          ...currentActiveNote,
          sections: updated,
        });
      }
    } catch (err) {
      logger.error('App', 'Failed to regenerate individual note section:', err);
    }
  };

  // 6. Select Note from Library
  const handleSelectNoteFromLibrary = (note: StudyNote) => {
    if (!firebaseUser) {
      setAuthWallMessage("Please log in or sign up to read and open full handwritten study notes from the library.");
      setShowAuthWall(true);
      return;
    }

    try {
      const parsedContent = JSON.parse(note.contentJson) as NoteContentPayload;
      let parsedStyle: HandwritingStyleConfig = {
        penType: 'gel-pen',
        inkColor: 'royal-blue',
        paperType: 'ruled-notebook',
        fontFamily: 'Kalam',
        fontSize: 20,
        slantAngle: 0.3,
        inkPressure: 'medium',
        highlightColor: 'yellow',
        showMarginLine: true,
        showHoles: true,
      };
      if (note.styleConfig) {
        parsedStyle = JSON.parse(note.styleConfig);
      }
      setCurrentActiveNote(parsedContent);
      setCurrentActiveStyle(parsedStyle);
      setActiveNoteSavedId(note.id);
      setCurrentTab('studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      logger.error('App', 'Failed to parse note content from library:', err);
    }
  };

  // 7. Delete Note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteStudyNote(noteId);
      if (activeNoteSavedId === noteId) {
        setActiveNoteSavedId(null);
      }
    } catch (err) {
      logger.error('App', 'Failed to delete note:', err);
    }
  };

  // 8. Complaint submission
  const handleSubmitComplaint = async (category: ComplaintCategory, title: string, description: string) => {
    if (!firebaseUser) {
      await handleSignIn();
      if (!auth.currentUser) throw new Error('Authentication required');
    }

    const complainant = auth.currentUser!;
    const ticketId = await submitComplaint({
      userId: complainant.uid,
      userEmail: complainant.email || '',
      userName: complainant.displayName || 'Student',
      category,
      title,
      description,
    });
    return ticketId;
  };

  // 9. Authentication Actions
  const handleSignIn = () => {
    setAuthModalMode('signin');
    setAuthWallMessage(undefined);
    setShowAuthWall(true);
  };

  const handleSignUp = () => {
    setAuthModalMode('signup');
    setAuthWallMessage(undefined);
    setShowAuthWall(true);
  };

  const isAdmin = Boolean(
    userProfile?.role === 'admin' ||
    userProfile?.email?.toLowerCase() === 'brainyyybuzz@gmail.com' ||
    userProfile?.email?.toLowerCase() === 'gautamankur0101@gmail.com' ||
    userProfile?.email?.toLowerCase() === 'pathpriya99@gmail.com' ||
    firebaseUser?.email?.toLowerCase() === 'brainyyybuzz@gmail.com' ||
    firebaseUser?.email?.toLowerCase() === 'gautamankur0101@gmail.com' ||
    firebaseUser?.email?.toLowerCase() === 'pathpriya99@gmail.com'
  );

  const handleSignOut = async () => {
    try {
      await logOut();
      setUserProfile(null);
      setFirebaseUser(null);
      setAuthStatus('UNAUTHENTICATED');
      setCurrentTab('landing');
      logger.info('App', 'Sign-out finished cleanly');
    } catch (err) {
      logger.error('App', 'Sign-out failed:', err);
    }
  };

  // 10. Student Onboarding Completion
  const handleCompleteOnboarding = async (details: {
    className: string;
    classPreference: string;
    displayName: string;
    age: number | string;
    sex: string;
    mobileNumber: string;
    email: string;
    targetExam: string;
    acceptedTerms: boolean;
  }) => {
    if (firebaseUser) {
      try {
        const updated = await updateStudentProfile(firebaseUser.uid, details);
        setUserProfile(updated);
        setActiveClass(details.className || details.classPreference);
        sessionStorage.setItem(`bb_onboarding_dismissed_${firebaseUser.uid}`, 'true');
        logger.info('App', 'Student profile onboarding saved successfully');
      } catch (err) {
        logger.error('App', 'Failed to save student profile onboarding:', err);
      }
    }
    setShowOnboarding(false);
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'admin' && !isAdmin) {
      setAuthWallMessage("Administrative privileges required to access the Administrative Operations Roster.");
      setShowAuthWall(true);
      return;
    }
    if (!firebaseUser && tab !== 'landing' && tab !== 'terms' && tab !== 'privacy') {
      setAuthWallMessage("Login or Sign Up is compulsory before accessing study materials, handwritten notes, syllabus, textbooks, and tests. Please sign in or create your free student account.");
      setShowAuthWall(true);
      return;
    }
    setCurrentTab(tab);
  };

  const handleOpenLegal = (tab: 'terms' | 'privacy' = 'terms') => {
    setLegalModalTab(tab);
    setShowLegalModal(true);
  };

  // 11. Generate Notes from NCERT Books section or presets
  const handleGenerateFromBook = (classGrade: string, subject: string, chapter: string) => {
    const cmd = `/handwriting class:${classGrade.replace('Class ', '')} subject:${subject} chapter:${chapter} style:gel-pen paper:ruled ink:royal-blue thinking:high`;
    setQueuedCommand(cmd);
    setActiveClass(classGrade);

    if (!firebaseUser) {
      setAuthWallMessage(`Please log in or sign up to generate authentic handwritten study notes for ${chapter} (${classGrade} ${subject}).`);
      setShowAuthWall(true);
      return;
    }

    handleExecuteCommand(cmd);
  };

  const userComplaints = complaintsList.filter(c => c.userId === firebaseUser?.uid);

  // Dedicated Session Restoration Splash - Never flash login while Firebase restores session
  if (authStatus === 'AUTH_LOADING') {
    return (
      <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center p-4 z-50 text-white select-none">
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <div className="relative">
            <img
              src="/BuzzingBrain_Video_Watermark_150x150.png"
              alt="Buzzing Brain"
              className="w-16 h-16 rounded-full border-2 border-amber-400/80 shadow-2xl object-cover animate-pulse"
            />
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-25"></div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold tracking-tight text-white">Buzzing Brain</h2>
            <p className="text-xs text-amber-300 font-medium">Free Education for All</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Restoring student session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InteractiveSpaceBackground>
      {/* Navigation Bar (Astra Style + Buzzing Brain Logo) */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        user={userProfile}
        authStatus={authStatus}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onSignOut={handleSignOut}
        activeClass={activeClass}
        onClassChange={setActiveClass}
        onOpenChat={() => setShowTutorChat(true)}
        onOpenComplaint={() => setShowComplaintModal(true)}
        onOpenProfile={() => setShowOnboarding(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Offline Profile Notification if Firestore sync encountered transient issue */}
        {authStatus === 'AUTHENTICATED_PROFILE_ERROR' && (
          <div className="mb-4 p-3 astra-card border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Local Session Mode:</strong> Working with cached student profile. Full handwritten studio, textbooks, and syllabus features remain active.
              </span>
            </div>
            <button
              onClick={async () => {
                if (firebaseUser) {
                  try {
                    const refreshed = await syncUserProfile(firebaseUser, activeClass);
                    setUserProfile(refreshed);
                    setAuthStatus('AUTHENTICATED_PROFILE_READY');
                  } catch (_) {}
                }
              }}
              className="text-[11px] font-bold text-amber-200 hover:text-white px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* Error notification banner if generation failed */}
        {generationError && (
          <div className="mb-6 p-4 astra-card border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span><strong>Generation Notice:</strong> {generationError}</span>
            </div>
            <button
              onClick={() => setGenerationError(null)}
              className="font-bold text-rose-200 hover:text-white px-2 py-0.5 rounded hover:bg-rose-900/40"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab: Landing Page (Free Education for All) */}
        {currentTab === 'landing' && (
          <AstraLandingPage
            onGoToStudio={(sampleCmd) => {
              if (!firebaseUser) {
                if (sampleCmd) setQueuedCommand(sampleCmd);
                setAuthWallMessage("Login or Sign Up is compulsory to create or access handwritten study notes. Please sign in or create your free student account!");
                setShowAuthWall(true);
                return;
              }
              if (sampleCmd) {
                setQueuedCommand(sampleCmd);
                handleExecuteCommand(sampleCmd);
              } else {
                setCurrentTab('studio');
              }
            }}
            onGoToBooks={() => {
              if (!firebaseUser) {
                setAuthWallMessage("Login or Sign Up is compulsory to access digital NCERT textbooks. Please sign in or create your free account!");
                setShowAuthWall(true);
                return;
              }
              setCurrentTab('books');
            }}
            onGoToSyllabus={() => {
              if (!firebaseUser) {
                setAuthWallMessage("Login or Sign Up is compulsory to access the official NCERT syllabus and chapter breakdown!");
                setShowAuthWall(true);
                return;
              }
              setCurrentTab('syllabus');
            }}
            onGoToYouTube={() => setCurrentTab('youtube')}
            onGoToLibrary={() => {
              if (!firebaseUser) {
                setAuthWallMessage("Login or Sign Up is compulsory to access your personal study notes library.");
                setShowAuthWall(true);
                return;
              }
              setCurrentTab('library');
            }}
            onGoToTests={() => {
              if (!firebaseUser) {
                setAuthWallMessage("Login or Sign Up is compulsory to take chapter tests and track assessment results!");
                setShowAuthWall(true);
                return;
              }
              setCurrentTab('tests');
            }}
            onGoToDashboard={() => setCurrentTab('dashboard')}
            onGoToCourses={() => setCurrentTab('courses')}
            onGoToVideos={() => setCurrentTab('videos')}
            onGoToScanner={() => setCurrentTab('scanner')}
            onGoToLabs={() => setCurrentTab('labs')}
            onGoToPlanner={() => setCurrentTab('planner')}
            onGoToCommunity={() => setCurrentTab('community')}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            user={userProfile}
          />
        )}

        {/* Tab: Handwritten Studio */}
        {currentTab === 'studio' && (
          <div className="space-y-6">
            {/* If user is not logged in, show student login banner */}
            {!firebaseUser && (
              <div className="astra-card rounded-2xl p-4 sm:p-5 border border-amber-400/40 bg-amber-400/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Student Sign-In Required</h4>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      To access and synthesize authentic handwritten notes with diagrams and formulas, sign in with your Google account. It's 100% free!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSignIn}
                  className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  Log In / Sign Up Free
                </button>
              </div>
            )}

            {/* Astra Studio Command Bar */}
            <HandwritingCommandBar
              onGenerate={handleExecuteCommand}
              isGenerating={isGenerating}
              activeClass={activeClass}
              onClassChange={setActiveClass}
              initialCommand={queuedCommand}
            />

            {/* Generated Note Renderer or Empty Prompt */}
            {currentActiveNote ? (
              <HandwrittenNoteRenderer
                note={currentActiveNote}
                styleConfig={currentActiveStyle || {
                  penType: 'gel-pen',
                  inkColor: 'royal-blue',
                  paperType: 'ruled-notebook',
                  fontFamily: 'Kalam',
                  fontSize: 20,
                  slantAngle: 0.3,
                  inkPressure: 'medium',
                  highlightColor: 'yellow',
                  showMarginLine: true,
                  showHoles: true,
                }}
                onSaveToLibrary={handleSaveActiveNote}
                isSaved={!!activeNoteSavedId}
                onOpenChatWithNote={(n) => setShowTutorChat(true)}
                rawNoteId={activeNoteSavedId || undefined}
                isLoggedIn={!!firebaseUser}
                onRequireAuth={() => {
                  setAuthWallMessage("Please log in or sign up to print or export notes as high-resolution PDF.");
                  setShowAuthWall(true);
                }}
                onRegeneratePage={(pg) => {
                  if (currentActiveNote) {
                    handleExecuteCommand(`/handwriting ${currentActiveNote.chapter} --class ${currentActiveNote.classGrade.replace('Class ', '')} --detailed`);
                  }
                }}
                onRegenerateSection={handleRegenerateSection}
              />
            ) : (
              /* Starter Guide & Features Hero */
              <div className="max-w-4xl mx-auto my-8 astra-card border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 rounded-full border border-amber-400/40 p-1 mx-auto bg-black/40">
                  <img
                    src="/BuzzingBrain_Video_Watermark_150x150.png"
                    alt="Buzzing Brain"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                <div className="space-y-2 max-w-xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Buzzing Brain Handwritten Studio
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Synthesize authentic handwritten study notes matching real student registers with ruled paper, dual margins, formulas, diagrams, and topper memory hacks.
                  </p>
                </div>

                {/* 3 Step Card Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
                  <div className="p-4 rounded-2xl astra-card border border-white/10 space-y-1.5">
                    <span className="font-mono text-xs font-bold text-amber-400">01. CLASS 11 &amp; 12 NCERT</span>
                    <h4 className="font-bold text-white text-sm">Full Curriculum</h4>
                    <p className="text-xs text-slate-400 leading-snug">
                      Physics, Chemistry, Biology, and Mathematics with all official NCERT textbook chapters.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl astra-card border border-white/10 space-y-1.5">
                    <span className="font-mono text-xs font-bold text-purple-400">02. HIGH THINKING AI</span>
                    <h4 className="font-bold text-white text-sm">Deep Derivations</h4>
                    <p className="text-xs text-slate-400 leading-snug">
                      Powered by high thinking logic for rigorous multi-step mathematical and chemical derivations.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl astra-card border border-white/10 space-y-1.5">
                    <span className="font-mono text-xs font-bold text-emerald-400">03. AUTHENTIC REGISTER</span>
                    <h4 className="font-bold text-white text-sm">Printable PDF</h4>
                    <p className="text-xs text-slate-400 leading-snug">
                      Authentic two-page open notebook spread with red margins, sketches, tables, and vector print export.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!firebaseUser) {
                        setAuthWallMessage("Please log in or sign up to synthesize handwritten notes.");
                        setShowAuthWall(true);
                        return;
                      }
                      handleExecuteCommand('/handwriting class:11 subject:Physics chapter:Laws of Motion topic:Friction & Circular Motion style:gel-pen paper:ruled ink:royal-blue thinking:high');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Synthesize Sample Class 11 Note (Laws of Motion)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Official 2026-27 Syllabus Section */}
        {currentTab === 'syllabus' && (
          <SyllabusSection
            activeClass={activeClass}
            onClassChange={(cls) => setActiveClass(cls)}
            onGenerateNotesForChapter={(classGrade, subject, chapter) => {
              handleGenerateFromBook(classGrade, subject, chapter);
            }}
            onGoToTests={(classGrade, chapter) => {
              setCurrentTab('tests');
            }}
          />
        )}

        {/* Tab: NCERT Books Section */}
        {currentTab === 'books' && (
          <NcertBooksSection
            onGenerateNotesForChapter={handleGenerateFromBook}
          />
        )}

        {/* Tab: Practice Tests Section */}
        {currentTab === 'tests' && (
          <TestSection
            user={userProfile}
            onRequireAuth={() => {
              setAuthWallMessage("Please log in or sign up to attempt chapter practice tests and track your score.");
              setShowAuthWall(true);
            }}
            activeClass={activeClass}
            onGoToStudio={(cmd) => {
              setQueuedCommand(cmd);
              setCurrentTab('studio');
              if (firebaseUser) {
                handleExecuteCommand(cmd);
              } else {
                setAuthWallMessage("Please log in or sign up to view the handwritten note for this chapter.");
                setShowAuthWall(true);
              }
            }}
          />
        )}

        {/* Tab: YouTube Channel Section */}
        {currentTab === 'youtube' && (
          <YouTubeChannelSection
            channelUrl="https://www.youtube.com/@BrainBuzz2702"
          />
        )}

        {/* Tab: Notes Library */}
        {currentTab === 'library' && (
          <StudentNotesLibrary
            notes={notesList}
            currentUserId={firebaseUser?.uid}
            isAdmin={isAdmin}
            onSelectNote={handleSelectNoteFromLibrary}
            onDeleteNote={handleDeleteNote}
            onNewNoteClick={() => setCurrentTab('studio')}
          />
        )}

        {/* Tab: Admin Dashboard */}
        {currentTab === 'admin' && (
          isAdmin ? (
            <AdminDashboard
              notes={notesList}
              complaints={complaintsList}
              currentProfile={userProfile}
              onUpdateComplaintStatus={updateComplaintStatus}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 astra-card border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Administrative Access Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You do not have administrative credentials to view telemetry and student grievances.
              </p>
              <button
                onClick={() => setCurrentTab('landing')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          )
        )}

        {/* Tab: Dedicated Terms & Conditions Page */}
        {currentTab === 'terms' && (
          <TermsAndConditionsPage
            onBack={() => setCurrentTab('landing')}
          />
        )}

        {/* Tab: Dedicated Privacy Policy Page */}
        {currentTab === 'privacy' && (
          <PrivacyPolicyPage
            onBack={() => setCurrentTab('landing')}
          />
        )}

        {/* Tab: Adaptive Learning Dashboard */}
        {currentTab === 'dashboard' && (
          <AdaptiveLearningDashboard
            user={userProfile}
            activeClass={activeClass}
            onGoToStudio={(cmd) => {
              if (cmd) {
                handleExecuteCommand(cmd);
              }
              setCurrentTab('studio');
            }}
            onGoToTests={() => setCurrentTab('tests')}
            onGoToCourses={() => setCurrentTab('courses')}
            onRequireAuth={() => {
              setAuthWallMessage("Please log in or sign up to view your personalized study dashboard.");
              setShowAuthWall(true);
            }}
          />
        )}

        {/* Tab: Textbook to Complete Course Generator */}
        {currentTab === 'courses' && (
          <CourseGeneratorSection
            user={userProfile}
            activeClass={activeClass}
            onGoToStudio={(cmd) => {
              handleExecuteCommand(cmd);
              setCurrentTab('studio');
            }}
            onRequireAuth={() => {
              setAuthWallMessage("Please log in or sign up to generate textbook courses.");
              setShowAuthWall(true);
            }}
          />
        )}

        {/* Tab: AI Educational Video Studio */}
        {currentTab === 'videos' && (
          <EducationalVideoStudio
            user={userProfile}
            activeClass={activeClass}
            onRequireAuth={() => {
              setAuthWallMessage("Please log in or sign up to generate educational videos.");
              setShowAuthWall(true);
            }}
          />
        )}

        {/* Tab: AI Homework Scanner */}
        {currentTab === 'scanner' && (
          <HomeworkScannerSection
            user={userProfile}
            activeClass={activeClass}
            onRequireAuth={() => {
              setAuthWallMessage("Please log in or sign up to scan and evaluate homework solutions.");
              setShowAuthWall(true);
            }}
          />
        )}

        {/* Tab: Mind Maps & Virtual Labs */}
        {currentTab === 'labs' && (
          <InteractiveLabsAndMindMaps
            activeClass={activeClass}
          />
        )}

        {/* Tab: Exam Revision Planner (Phase 4) */}
        {currentTab === 'planner' && (
          <ExamRevisionPlanner
            user={userProfile}
            activeClass={activeClass}
            onGoToStudio={(cmd) => {
              setQueuedCommand(cmd);
              setCurrentTab('studio');
              if (firebaseUser) {
                handleExecuteCommand(cmd);
              } else {
                setAuthWallMessage("Please log in or sign up to generate study notes for this revision slot.");
                setShowAuthWall(true);
              }
            }}
            onRequireAuth={() => {
              setAuthWallMessage("Please log in or sign up to personalize your exam revision schedule.");
              setShowAuthWall(true);
            }}
          />
        )}

        {/* Tab: Community Notes Hub & Study Circles (Phase 4) */}
        {currentTab === 'community' && (
          <CommunityNotesHub
            user={userProfile}
            activeClass={activeClass}
            onGoToStudio={(cmd) => {
              setQueuedCommand(cmd);
              setCurrentTab('studio');
              if (firebaseUser) {
                handleExecuteCommand(cmd);
              } else {
                setAuthWallMessage("Please log in or sign up to view and customize community handwritten notes.");
                setShowAuthWall(true);
              }
            }}
            onRequireAuth={() => {
              setAuthWallMessage("Please log in or sign up to upvote notes and join peer study circles.");
              setShowAuthWall(true);
            }}
          />
        )}
      </main>

      {/* Astra Footer */}
      <footer className="bg-black/80 border-t border-white/10 mt-16 py-10 text-xs text-slate-400 print:hidden relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/BuzzingBrain_Video_Watermark_150x150.png"
                alt="Buzzing Brain"
                className="w-8 h-8 rounded-full border border-amber-400/80 object-cover"
              />
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight">Buzzing Brain</span>
                <span className="text-slate-500 block text-[11px]">Free Education for All &bull; NEWS | EDUCATION | A BRIGHTER TOMORROW</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
              <button
                onClick={() => setCurrentTab('landing')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Free Education
              </button>
              <button
                onClick={() => setCurrentTab('syllabus')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                2026–27 Syllabus
              </button>
              <button
                onClick={() => setCurrentTab('books')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                NCERT Books
              </button>
              <button
                onClick={() => setCurrentTab('tests')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Practice Tests
              </button>
              <button
                onClick={() => setCurrentTab('studio')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Handwritten Studio
              </button>
              <button
                onClick={() => setCurrentTab('youtube')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                YouTube (@BrainBuzz2702)
              </button>
              <button
                onClick={() => setCurrentTab('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms and Conditions
              </button>
              <button
                onClick={() => setCurrentTab('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setShowComplaintModal(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Grievance Desk
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>&copy; {new Date().getFullYear()} Buzzing Brain. All NCERT references adhere to CBSE public curriculum.</span>
            <span className="font-mono">YouTube: @BrainBuzz2702 &bull; Free Open Platform</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleCompleteOnboarding}
        onClose={() => {
          if (firebaseUser) {
            sessionStorage.setItem(`bb_onboarding_dismissed_${firebaseUser.uid}`, 'true');
          }
          setShowOnboarding(false);
        }}
        userProfile={userProfile}
        userName={firebaseUser?.displayName || undefined}
        userEmail={firebaseUser?.email || undefined}
        onOpenLegalModal={(tab) => {
          setLegalModalTab(tab);
          setShowLegalModal(true);
        }}
      />

      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSubmit={handleSubmitComplaint}
        myComplaints={userComplaints}
        currentProfile={userProfile}
      />

      <TermsPrivacyModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalModalTab}
      />

      <AiTutorChatDrawer
        isOpen={showTutorChat}
        onClose={() => setShowTutorChat(false)}
        activeNote={currentActiveNote}
        initialGrade={activeClass}
        onApplyCommand={(cmd) => {
          setShowTutorChat(false);
          handleExecuteCommand(cmd);
        }}
      />

      {/* Floating AI Tutor Quick Trigger Button */}
      {!showTutorChat && (
        <button
          onClick={() => setShowTutorChat(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-900/40 border border-purple-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Open AI Tutor (Hinglish, Hindi & English explanations)"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <span>Ask AI Tutor</span>
          <span className="hidden sm:inline-block text-[10px] bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30 font-medium">
            Hinglish • हिंदी • English
          </span>
        </button>
      )}

      <AuthWallModal
        isOpen={showAuthWall}
        onClose={() => setShowAuthWall(false)}
        initialMode={authModalMode}
        description={authWallMessage}
        onOpenLegal={handleOpenLegal}
      />

      {/* Global Accessibility & Neuroinclusive Floating Toolbar */}
      <AccessibilityToolbar />
    </InteractiveSpaceBackground>
  );
}
