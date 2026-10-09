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

export const apiRouter = express.Router();

// Allow up to 15mb payload for image question uploads
apiRouter.use(express.json({ limit: '15mb' }));

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
apiRouter.post('/handwriting/generate', async (req: Request, res: Response) => {
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
apiRouter.post('/chat', async (req: Request, res: Response) => {
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
apiRouter.post('/ai/solve-image', async (req: Request, res: Response) => {
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
apiRouter.post('/ai/check-handwriting', async (req: Request, res: Response) => {
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
apiRouter.post('/ai/generate-test', async (req: Request, res: Response) => {
  try {
    const { classGrade, subject, chapter, difficulty, count, questionTypes } = req.body;
    if (!chapter) {
      return res.status(400).json({ error: 'Chapter name is required' });
    }

    const questions = await generateCustomChapterTest(
      classGrade || 'Class 10',
      subject || 'Science',
      chapter,
      difficulty || 'medium',
      count || 5,
      questionTypes || ['mcq', 'numerical', 'assertion_reason']
    );
    return res.json({ success: true, questions });
  } catch (error) {
    console.error('Error in /ai/generate-test:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Test generation failed' });
  }
});

// AI Chapter Mind Map Generator Endpoint
apiRouter.post('/ai/generate-mindmap', async (req: Request, res: Response) => {
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
apiRouter.post('/ai/generate-course', async (req: Request, res: Response) => {
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
apiRouter.post('/ai/generate-video-script', async (req: Request, res: Response) => {
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
apiRouter.post('/handwriting/regenerate-section', async (req: Request, res: Response) => {
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


