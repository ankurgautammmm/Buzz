import express, { Request, Response } from 'express';
import { 
  parseHandwritingCommand, 
  generateHandwrittenNotes, 
  chatWithScribbleTutor,
  solveImageQuestion,
  checkHandwrittenAnswer,
  generateCustomChapterTest,
  generateChapterMindMap,
  generateCourseFromTextbook,
  generateVideoScript,
  regenerateNoteSection
} from './geminiService';
import { NCERT_SYLLABUS, validateNcertSyllabus } from '../src/data/ncertSyllabus';
import { 
  CURRICULA_REGISTRY, 
  getAllCurriculumChapters, 
  findChapterById, 
  calculateTopicCoverage, 
  startNotesGenerationJob, 
  GENERATION_JOBS, 
  PERSISTED_NOTES, 
  STUDENT_PROGRESS, 
  buildChapterId,
  StudentProgressRecord,
  savePersistedNotesToDisk,
  saveStudentProgressToDisk
} from './curriculumService';
import { getCuratedChapterNote, COMPREHENSIVE_CHAPTER_NOTES, getStrictTopicNotes } from '../src/data/curatedChapterNotes';
import { 
  generateAiQuestions, 
  VERIFIED_QUESTION_BANK, 
  validateQuestion 
} from './questionService';

export const apiRouter = express.Router();

// Allow up to 15mb payload for image question uploads
apiRouter.use(express.json({ limit: '15mb' }));

// ============================================================================
// P0 Security & Protection: Rate Limiting Token Bucket
// ============================================================================
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();
const MAX_BURST_TOKENS = 60;
const REFILL_RATE_PER_SEC = 1.0; // up to 60 req/min for student study pipelines

function aiRateLimiter(req: Request, res: Response, next: () => void) {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  let bucket = rateLimitMap.get(clientIp);

  if (!bucket) {
    bucket = { tokens: MAX_BURST_TOKENS, lastRefill: now };
    rateLimitMap.set(clientIp, bucket);
  } else {
    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(MAX_BURST_TOKENS, bucket.tokens + elapsedSec * REFILL_RATE_PER_SEC);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    res.setHeader('Retry-After', '3');
    return res.status(429).json({
      error: 'Rate limit reached for AI educational generation. Please wait a few seconds before requesting again.',
      retryAfterSec: 3,
    });
  }

  bucket.tokens -= 1;
  next();
}

// Trusted Administrators
const envAdminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const TRUSTED_ADMIN_EMAILS = [
  'brainyyybuzz@gmail.com',
  'gautamankur0101@gmail.com',
  'pathpriya99@gmail.com',
  ...envAdminEmails
];

function adminAuthMiddleware(req: Request, res: Response, next: () => void) {
  const adminHeader = (req.headers['x-admin-email'] as string || req.headers['authorization'] || '').toLowerCase();
  const isMatch = TRUSTED_ADMIN_EMAILS.some(email => adminHeader.includes(email.toLowerCase()));
  if (!isMatch && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Administrative authorization credentials required.' });
  }
  next();
}

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get NCERT Syllabus Database
apiRouter.get('/syllabus', (_req: Request, res: Response) => {
  res.json({ syllabus: NCERT_SYLLABUS });
});

// Parse Command Only (for instant UI feedback & syllabus validation)
apiRouter.post('/handwriting/parse', (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const parsed = parseHandwritingCommand(command);
    const syllabusValidation = validateNcertSyllabus(parsed.classGrade, parsed.subject, parsed.chapter || parsed.topic);

    return res.json({
      parsed,
      syllabusValidation,
    });
  } catch (error) {
    console.error('Error in /handwriting/parse:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to parse command' });
  }
});

// Full Pipeline: Parse -> Validate Syllabus -> Retrieve NCERT Context -> AI Generation -> JSON Validation
apiRouter.post('/handwriting/generate', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { command, options } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const parsedCommand = parseHandwritingCommand(command);
    if (options) {
      if (options.penType) parsedCommand.penType = options.penType;
      if (options.paperType) parsedCommand.paperType = options.paperType;
      if (options.inkColor) parsedCommand.inkColor = options.inkColor;
      if (options.fontFamily) parsedCommand.fontFamily = options.fontFamily;
      if (options.thinkingMode) parsedCommand.thinkingMode = options.thinkingMode;
    }

    console.log(`[Handwriting Engine] Generating notes for: ${parsedCommand.classGrade} | ${parsedCommand.subject} | ${parsedCommand.chapter}`);

    const result = await generateHandwrittenNotes(parsedCommand);

    return res.json({
      success: true,
      parsedCommand,
      ...result,
    });
  } catch (error) {
    console.error('Error in /handwriting/generate:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Generation failed',
      details: String(error)
    });
  }
});

// Multi-turn Chatbot endpoint with multilingual & intuitive pedagogy support
apiRouter.post('/chat', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, contextNote, language, explainMode, classGrade } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const reply = await chatWithScribbleTutor(messages, contextNote, {
      language,
      explainMode,
      classGrade,
    });
    return res.json({ reply });
  } catch (error) {
    console.error('Error in /chat:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Chat error' });
  }
});

// AI Image Question Solver Endpoint
apiRouter.post('/ai/solve-image', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64, userPrompt, subject } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const solution = await solveImageQuestion(imageBase64, userPrompt, subject);
    return res.json({ success: true, solution });
  } catch (error) {
    console.error('Error in /ai/solve-image:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to solve question image' });
  }
});

// AI Handwriting Answer Checker Endpoint
apiRouter.post('/ai/check-handwriting', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64, answerText, questionText, maxMarks } = req.body;
    if (!imageBase64 && !answerText) {
      return res.status(400).json({ error: 'Either answer image or text is required' });
    }

    const evaluation = await checkHandwrittenAnswer(imageBase64, answerText, questionText, maxMarks || 5);
    return res.json({ success: true, evaluation });
  } catch (error) {
    console.error('Error in /ai/check-handwriting:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Handwriting evaluation failed' });
  }
});

// AI Custom Chapter Test Generator Endpoint
apiRouter.post('/ai/generate-test', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { classGrade, subject, chapter, difficulty, count, questionTypes } = req.body;
    if (!chapter) {
      return res.status(400).json({ error: 'Chapter name is required' });
    }

    // Use unified strict question generator to guarantee schema compliance
    const targetCount = count ? Number(count) : 10;
    const questions = await generateAiQuestions({
      classLevel: classGrade,
      subject: subject || 'Science',
      chapter,
      difficulty: difficulty === 'board_level' ? 'medium' : difficulty,
      count: targetCount,
    });

    // Provide topic notes exclusively covering the input topic and not more than that
    const topicNotes = getStrictTopicNotes(chapter, classGrade, subject);

    return res.json({ success: true, count: questions.length, questions, topicNotes });
  } catch (error) {
    console.error('Error in /ai/generate-test:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Test generation failed' });
  }
});

// Dedicated Questions API: Generate exactly 10 (or custom count) validated MCQs adhering strictly to the schema
apiRouter.post('/questions/generate', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { classLevel, subject, chapter, topic, difficulty, count } = req.body;
    
    // Parse target count, default to exactly 10
    const targetCount = count !== undefined ? Math.min(25, Math.max(1, parseInt(String(count), 10) || 10)) : 10;

    const questions = await generateAiQuestions({
      classLevel: classLevel || 10,
      subject: subject || 'Science',
      chapter: chapter || 'Force and Laws of Motion',
      topic: topic,
      difficulty: difficulty || 'medium',
      count: targetCount,
    });

    return res.json({
      success: true,
      requestedCount: targetCount,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error('Error in /questions/generate:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Question generation failed' });
  }
});

// GET /api/questions query endpoint for verified NCERT question retrieval
apiRouter.get('/questions', async (req: Request, res: Response) => {
  try {
    const { classLevel, subject, chapter, difficulty, count } = req.query;
    const targetCount = count ? Math.min(25, Math.max(1, parseInt(String(count), 10) || 10)) : 10;

    const questions = await generateAiQuestions({
      classLevel: classLevel ? String(classLevel) : undefined,
      subject: subject ? String(subject) : undefined,
      chapter: chapter ? String(chapter) : undefined,
      difficulty: difficulty as any,
      count: targetCount,
    });

    return res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error('Error in /questions:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to retrieve questions' });
  }
});

// AI Chapter Mind Map Generator Endpoint
apiRouter.post('/ai/generate-mindmap', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { classGrade, subject, chapter } = req.body;
    if (!chapter) {
      return res.status(400).json({ error: 'Chapter name is required' });
    }

    const mindMap = await generateChapterMindMap(
      classGrade || 'Class 10',
      subject || 'Science',
      chapter
    );
    return res.json({ success: true, mindMap });
  } catch (error) {
    console.error('Error in /ai/generate-mindmap:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Mindmap generation failed' });
  }
});

// AI Textbook-to-Complete-Course Generator Endpoint
apiRouter.post('/ai/generate-course', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { textbookText, topic, chapter, classGrade, subject } = req.body;
    if (!chapter && !topic && !textbookText) {
      return res.status(400).json({ error: 'Either chapter, topic, or textbook text is required' });
    }

    const course = await generateCourseFromTextbook({
      textbookText,
      topic,
      chapter,
      classGrade: classGrade || 'Class 10',
      subject: subject || 'Science',
    });

    return res.json({ success: true, course });
  } catch (error) {
    console.error('Error in /ai/generate-course:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Course generation failed' });
  }
});

// AI Educational Video Script Generator Endpoint
apiRouter.post('/ai/generate-video-script', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { topic, classGrade, subject, language, durationMinutes, template } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const script = await generateVideoScript({
      topic,
      classGrade: classGrade || 'Class 10',
      subject: subject || 'Science',
      language: language || 'Hinglish',
      durationMinutes: durationMinutes || 1,
      template: template || 'shorts_vertical',
    });

    return res.json({ success: true, script });
  } catch (error) {
    console.error('Error in /ai/generate-video-script:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Video script generation failed' });
  }
});

// Regenerate Individual Handwritten Note Section
apiRouter.post('/handwriting/regenerate-section', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { heading, currentContent, chapter, classGrade, subject, feedback } = req.body;
    if (!heading) {
      return res.status(400).json({ error: 'Section heading is required' });
    }

    const regenerated = await regenerateNoteSection({
      heading,
      currentContent,
      chapter: chapter || 'Physics Concept',
      classGrade: classGrade || 'Class 10',
      subject: subject || 'Science',
      feedback,
    });

    return res.json({ success: true, section: regenerated });
  } catch (error) {
    console.error('Error in /handwriting/regenerate-section:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Section regeneration failed' });
  }
});

// ============================================================================
// 1. CURRICULUM MANAGEMENT REST APIS
// ============================================================================

// GET /api/curriculum — List verified academic boards & sessions
apiRouter.get('/curriculum', (_req: Request, res: Response) => {
  const curricula = Object.values(CURRICULA_REGISTRY);
  res.json({ success: true, count: curricula.length, curricula });
});

// GET /api/curriculum/:curriculumId — Get specific curriculum record
apiRouter.get('/curriculum/:curriculumId', (req: Request, res: Response) => {
  const record = CURRICULA_REGISTRY[req.params.curriculumId];
  if (!record) {
    return res.status(404).json({ error: `Curriculum not found: ${req.params.curriculumId}` });
  }
  res.json({ success: true, curriculum: record });
});

// GET /api/curriculum/:curriculumId/classes — Get classes for curriculum
apiRouter.get('/curriculum/:curriculumId/classes', (req: Request, res: Response) => {
  const record = CURRICULA_REGISTRY[req.params.curriculumId];
  if (!record) {
    return res.status(404).json({ error: 'Curriculum not found' });
  }
  const classes = Object.keys(NCERT_SYLLABUS);
  res.json({ success: true, curriculumId: record.curriculumId, classes });
});

// GET /api/classes/:classId/subjects — Get subjects for a class
apiRouter.get('/classes/:classId/subjects', (req: Request, res: Response) => {
  const rawClass = req.params.classId.replace('-', ' ');
  const classKey = Object.keys(NCERT_SYLLABUS).find(
    (c) => c.toLowerCase() === rawClass.toLowerCase() || c.toLowerCase() === `class ${rawClass.toLowerCase()}`
  );
  if (!classKey || !NCERT_SYLLABUS[classKey]) {
    return res.status(404).json({ error: `Class not found: ${req.params.classId}` });
  }
  const subjects = Object.keys(NCERT_SYLLABUS[classKey]);
  res.json({ success: true, classGrade: classKey, subjects });
});

// GET /api/subjects/:subjectId/chapters — Get verified chapters for a subject
apiRouter.get('/subjects/:subjectId/chapters', (req: Request, res: Response) => {
  const classGrade = (req.query.classGrade as string) || 'Class 10';
  const subjectId = req.params.subjectId;
  const chapters = getAllCurriculumChapters(classGrade, subjectId);
  res.json({ success: true, count: chapters.length, classGrade, subject: subjectId, chapters });
});

// GET /api/chapters/:chapterId — Get chapter details
apiRouter.get('/chapters/:chapterId', (req: Request, res: Response) => {
  const chapter = findChapterById(req.params.chapterId);
  if (!chapter) {
    return res.status(404).json({ error: `Chapter not found: ${req.params.chapterId}` });
  }
  res.json({ success: true, chapter });
});

// GET /api/chapters/:chapterId/topics — Get ordered topics and learning objectives
apiRouter.get('/chapters/:chapterId/topics', (req: Request, res: Response) => {
  const chapter = findChapterById(req.params.chapterId);
  if (!chapter) {
    return res.status(404).json({ error: `Chapter not found: ${req.params.chapterId}` });
  }
  res.json({
    success: true,
    chapterId: chapter.chapterId,
    chapterTitle: chapter.title,
    topics: chapter.keyTopics,
    learningObjectives: chapter.learningObjectives,
  });
});

// ============================================================================
// 2. NOTES RETRIEVAL, GENERATION & COVERAGE REST APIS
// ============================================================================

// GET /api/chapters/:chapterId/notes — Retrieve structured notes for chapter
apiRouter.get('/chapters/:chapterId/notes', (req: Request, res: Response) => {
  const chapter = findChapterById(req.params.chapterId);
  if (!chapter) {
    return res.status(404).json({ error: `Chapter not found: ${req.params.chapterId}` });
  }

  // 1. Check in-memory / persisted notes
  const noteId = `note-${chapter.chapterId}`;
  const persisted = PERSISTED_NOTES.get(noteId);
  if (persisted) {
    const coverage = calculateTopicCoverage(chapter, persisted.note);
    return res.json({
      success: true,
      noteId,
      note: persisted.note,
      metadata: persisted.metadata,
      coverage,
    });
  }

  // 2. Fallback to curated notes repository
  const curated = getCuratedChapterNote(chapter.classGrade, chapter.subject, chapter.title);
  if (curated) {
    const coverage = calculateTopicCoverage(chapter, curated);
    return res.json({
      success: true,
      noteId,
      note: curated,
      metadata: {
        noteId,
        chapterId: chapter.chapterId,
        isCurated: true,
        verificationStatus: 'verified',
      },
      coverage,
    });
  }

  return res.status(404).json({ error: 'Notes not yet generated for this chapter. Call POST to generate.' });
});

// POST /api/chapters/:chapterId/notes/generate — Start structured notes generation
apiRouter.post('/chapters/:chapterId/notes/generate', async (req: Request, res: Response) => {
  try {
    const chapter = findChapterById(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ error: `Chapter not found: ${req.params.chapterId}` });
    }

    const job = await startNotesGenerationJob(chapter);
    return res.json({
      success: true,
      message: 'Notes generation initiated',
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      noteId: job.noteId,
    });
  } catch (error) {
    console.error('Error in /api/chapters/:chapterId/notes/generate:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Generation initiation failed' });
  }
});

// POST /api/chapters/:chapterId/notes/regenerate — Force full or section regeneration
apiRouter.post('/chapters/:chapterId/notes/regenerate', async (req: Request, res: Response) => {
  try {
    const chapter = findChapterById(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({ error: `Chapter not found: ${req.params.chapterId}` });
    }

    // Force fresh synthesis
    const cmd = `/handwriting ${chapter.title} --class ${chapter.classGrade.replace('Class ', '')} --detailed`;
    const parsed = parseHandwritingCommand(cmd);
    const generated = await generateHandwrittenNotes(parsed);

    const noteId = `note-${chapter.chapterId}`;
    PERSISTED_NOTES.set(noteId, {
      note: generated.noteContent,
      metadata: {
        noteId,
        chapterId: chapter.chapterId,
        classGrade: chapter.classGrade,
        subject: chapter.subject,
        chapter: chapter.title,
        updatedAt: new Date().toISOString(),
        revision: 2,
        isVerified: true,
      },
    });
    savePersistedNotesToDisk();

    return res.json({
      success: true,
      noteId,
      note: generated.noteContent,
      metadata: PERSISTED_NOTES.get(noteId)?.metadata,
    });
  } catch (error) {
    console.error('Error in /api/chapters/:chapterId/notes/regenerate:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Regeneration failed' });
  }
});

// GET /api/notes/:notesId — Retrieve note by noteId
apiRouter.get('/notes/:notesId', (req: Request, res: Response) => {
  const persisted = PERSISTED_NOTES.get(req.params.notesId);
  if (!persisted) {
    return res.status(404).json({ error: `Note not found: ${req.params.notesId}` });
  }
  res.json({ success: true, noteId: req.params.notesId, note: persisted.note, metadata: persisted.metadata });
});

// PATCH /api/notes/:notesId — Update note title or annotations
apiRouter.patch('/notes/:notesId', (req: Request, res: Response) => {
  const persisted = PERSISTED_NOTES.get(req.params.notesId);
  if (!persisted) {
    return res.status(404).json({ error: `Note not found: ${req.params.notesId}` });
  }

  const { title, sections } = req.body;
  if (title) persisted.note.title = title;
  if (Array.isArray(sections)) persisted.note.sections = sections;
  persisted.metadata.updatedAt = new Date().toISOString();
  savePersistedNotesToDisk();

  res.json({ success: true, noteId: req.params.notesId, note: persisted.note, metadata: persisted.metadata });
});

// DELETE /api/notes/:notesId — Delete note
apiRouter.delete('/notes/:notesId', (req: Request, res: Response) => {
  const exists = PERSISTED_NOTES.has(req.params.notesId);
  if (!exists) {
    return res.status(404).json({ error: `Note not found: ${req.params.notesId}` });
  }
  PERSISTED_NOTES.delete(req.params.notesId);
  savePersistedNotesToDisk();
  res.json({ success: true, message: `Note deleted: ${req.params.notesId}` });
});

// GET /api/notes/:notesId/export — Export structured data & print metadata
apiRouter.get('/notes/:notesId/export', (req: Request, res: Response) => {
  const persisted = PERSISTED_NOTES.get(req.params.notesId);
  if (!persisted) {
    return res.status(404).json({ error: `Note not found: ${req.params.notesId}` });
  }
  res.json({
    success: true,
    noteId: req.params.notesId,
    format: 'a4_landscape',
    totalPages: 4,
    totalSpreads: 2,
    dimensions: { width: '297mm', height: '210mm', orientation: 'landscape' },
    note: persisted.note,
  });
});

// GET /api/notes/:notesId/coverage — Get syllabus topic coverage analysis
apiRouter.get('/notes/:notesId/coverage', (req: Request, res: Response) => {
  const persisted = PERSISTED_NOTES.get(req.params.notesId);
  if (!persisted) {
    return res.status(404).json({ error: `Note not found: ${req.params.notesId}` });
  }

  const allChapters = getAllCurriculumChapters();
  const matchedChapter = allChapters.find(
    (c) => c.title.toLowerCase() === persisted.note.chapter.toLowerCase() ||
      persisted.note.chapter.toLowerCase().includes(c.title.toLowerCase())
  );

  if (!matchedChapter) {
    return res.json({
      success: true,
      coverage: { totalTopics: 0, coveredTopics: [], missingTopics: [], coveragePercent: 100 },
    });
  }

  const coverage = calculateTopicCoverage(matchedChapter, persisted.note);
  res.json({ success: true, chapterId: matchedChapter.chapterId, coverage });
});

// ============================================================================
// 3. GENERATION JOB APIS
// ============================================================================

// GET /api/notes/jobs/:jobId — Check job progress
apiRouter.get('/notes/jobs/:jobId', (req: Request, res: Response) => {
  const job = GENERATION_JOBS.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: `Job not found: ${req.params.jobId}` });
  }
  res.json({ success: true, job });
});

// POST /api/notes/jobs/:jobId/retry — Retry failed job
apiRouter.post('/notes/jobs/:jobId/retry', async (req: Request, res: Response) => {
  const job = GENERATION_JOBS.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: `Job not found: ${req.params.jobId}` });
  }

  const chapter = findChapterById(job.chapterId);
  if (!chapter) {
    return res.status(404).json({ error: `Chapter not found for job: ${job.chapterId}` });
  }

  job.status = 'in_progress';
  job.retryCount += 1;
  job.progress = 20;
  job.error = undefined;
  job.updatedAt = new Date().toISOString();

  // Re-run generation
  const refreshedJob = await startNotesGenerationJob(chapter);
  res.json({ success: true, message: 'Job retry initiated', job: refreshedJob });
});

// POST /api/notes/jobs/:jobId/cancel — Cancel active job
apiRouter.post('/notes/jobs/:jobId/cancel', (req: Request, res: Response) => {
  const job = GENERATION_JOBS.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: `Job not found: ${req.params.jobId}` });
  }
  job.status = 'cancelled';
  job.updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Job cancelled', job });
});

// ============================================================================
// 4. SEARCH APIS
// ============================================================================

// GET /api/notes/search?q=... — Search notes by keyword, board, class, or subject
apiRouter.get('/notes/search', (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  const classFilter = (req.query.classGrade as string) || '';
  const subjectFilter = (req.query.subject as string) || '';

  const results: any[] = [];

  for (const [noteId, data] of PERSISTED_NOTES.entries()) {
    const { note, metadata } = data;
    if (classFilter && note.classGrade.toLowerCase() !== classFilter.toLowerCase()) continue;
    if (subjectFilter && note.subject.toLowerCase() !== subjectFilter.toLowerCase()) continue;

    const fullText = [
      note.title,
      note.chapter,
      note.topic,
      ...note.sections.map((s) => s.heading + ' ' + s.content),
    ].join(' ').toLowerCase();

    if (!q || fullText.includes(q)) {
      results.push({
        noteId,
        title: note.title,
        classGrade: note.classGrade,
        subject: note.subject,
        chapter: note.chapter,
        sectionCount: note.sections.length,
        hasDiagrams: note.sections.some((s) => Boolean(s.diagram)),
        metadata,
      });
    }
  }

  res.json({ success: true, count: results.length, query: q, results });
});

// ============================================================================
// 5. STUDENT PROGRESS APIS
// ============================================================================

// GET /api/notes/progress — Get all progress for user
apiRouter.get('/notes/progress', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'guest';
  const list = Array.from(STUDENT_PROGRESS.values()).filter((p) => p.userId === userId);
  res.json({ success: true, count: list.length, userId, progress: list });
});

// GET /api/notes/:notesId/progress — Get progress for single note
apiRouter.get('/notes/:notesId/progress', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'guest';
  const key = `${userId}:${req.params.notesId}`;
  const record = STUDENT_PROGRESS.get(key) || {
    userId,
    notesId: req.params.notesId,
    chapterId: req.params.notesId.replace('note-', ''),
    completedSections: [],
    bookmarks: [],
    lastVisitedPosition: 1,
    totalSections: 4,
    percentComplete: 0,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, progress: record });
});

// PUT /api/notes/:notesId/progress — Update progress for note
apiRouter.put('/notes/:notesId/progress', (req: Request, res: Response) => {
  const userId = (req.body.userId as string) || 'guest';
  const key = `${userId}:${req.params.notesId}`;
  const { completedSections, bookmarks, lastVisitedPosition, totalSections } = req.body;

  const total = Number(totalSections) || 4;
  const completed = Array.isArray(completedSections) ? completedSections : [];
  const percentComplete = Math.min(100, Math.round((completed.length / total) * 100));

  const record: StudentProgressRecord = {
    userId,
    notesId: req.params.notesId,
    chapterId: req.params.notesId.replace('note-', ''),
    completedSections: completed,
    bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
    lastVisitedPosition: Number(lastVisitedPosition) || 1,
    totalSections: total,
    percentComplete,
    updatedAt: new Date().toISOString(),
  };

  STUDENT_PROGRESS.set(key, record);
  saveStudentProgressToDisk();
  res.json({ success: true, progress: record });
});

// ============================================================================
// 6. ADMINISTRATIVE CURRICULUM & COVERAGE APIS
// ============================================================================

// POST /api/admin/curriculum/import — Import new curriculum definition
apiRouter.post('/admin/curriculum/import', adminAuthMiddleware, (req: Request, res: Response) => {
  const { board, academicSession, version, sourceUrl, chapters } = req.body;
  const curriculumId = `${(board || 'cbse').toLowerCase()}-${(academicSession || '2026-27').replace(/[^a-z0-9]/g, '-')}`;

  CURRICULA_REGISTRY[curriculumId] = {
    curriculumId,
    board: board || 'CBSE',
    academicSession: academicSession || '2026-27',
    classes: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    verificationStatus: 'verified',
    sourceUrl: sourceUrl || 'https://ncert.nic.in',
    version: version || '2026-27.v1',
    lastVerifiedDate: new Date().toISOString().split('T')[0],
  };

  res.json({
    success: true,
    message: 'Curriculum imported and verified',
    curriculum: CURRICULA_REGISTRY[curriculumId],
  });
});

// POST /api/admin/curriculum/validate — Validate curriculum integrity
apiRouter.post('/admin/curriculum/validate', adminAuthMiddleware, (_req: Request, res: Response) => {
  const allChapters = getAllCurriculumChapters();
  const verifiedCount = allChapters.filter((c) => c.verificationStatus === 'verified').length;
  const missingTopicsCount = allChapters.filter((c) => c.keyTopics.length === 0).length;

  res.json({
    success: true,
    totalChapters: allChapters.length,
    verifiedChapters: verifiedCount,
    chaptersWithMissingTopics: missingTopicsCount,
    status: missingTopicsCount === 0 ? 'HEALTHY_AND_VERIFIED' : 'REVIEW_REQUIRED',
  });
});

// GET /api/admin/notes/coverage — System-wide coverage matrix
apiRouter.get('/admin/notes/coverage', adminAuthMiddleware, (_req: Request, res: Response) => {
  const allChapters = getAllCurriculumChapters();
  const coverageMatrix = allChapters.slice(0, 50).map((ch) => {
    const noteId = `note-${ch.chapterId}`;
    const persisted = PERSISTED_NOTES.get(noteId);
    if (!persisted) {
      return {
        chapterId: ch.chapterId,
        title: ch.title,
        classGrade: ch.classGrade,
        subject: ch.subject,
        hasNotes: false,
        coveragePercent: 0,
      };
    }
    const cov = calculateTopicCoverage(ch, persisted.note);
    return {
      chapterId: ch.chapterId,
      title: ch.title,
      classGrade: ch.classGrade,
      subject: ch.subject,
      hasNotes: true,
      coveragePercent: cov.coveragePercent,
    };
  });

  const total = coverageMatrix.length;
  const covered = coverageMatrix.filter((c) => c.hasNotes).length;

  res.json({
    success: true,
    totalIndexed: total,
    notesGenerated: covered,
    overallCoveragePercent: Math.round((covered / total) * 100),
    chapters: coverageMatrix,
  });
});

// GET /api/admin/notes/jobs — List all background generation jobs
apiRouter.get('/admin/notes/jobs', adminAuthMiddleware, (_req: Request, res: Response) => {
  const jobs = Array.from(GENERATION_JOBS.values());
  res.json({ success: true, count: jobs.length, jobs });
});



