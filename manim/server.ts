import express, { Request, Response } from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateManimCode, createFallbackAnimation } from './generator';
import { executeManimCode } from './executor';

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;
const VIDEO_OUTPUT_DIR = process.env.VIDEO_OUTPUT_DIR || '/app/public/videos';

// Ensure video output directory exists on startup
fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'];

app.use(cors({
  origin: (origin: string | undefined, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Serve rendered MP4s — matches PRD videoUrl format: /videos/{id}.mp4
app.use('/videos', express.static(VIDEO_OUTPUT_DIR));

// Auth middleware (skip for health)
app.use((req: Request, res: Response, next: Function) => {
  if (req.path === '/health') return next();

  const apiSecret = process.env.RENDER_API_SECRET;
  if (apiSecret) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || token !== apiSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'luminary-manim-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Check Manim installation
app.get('/check-manim', async (_req: Request, res: Response) => {
  try {
    const { stdout } = await execAsync('manim --version');
    res.json({ status: 'Manim is installed', ready: true, version: stdout.trim() });
  } catch {
    res.json({ status: 'Manim not installed', ready: false, message: 'Install with: pip install manim' });
  }
});

// Generate animation
app.post('/generate', async (req: Request, res: Response) => {
  try {
    const { context, duration = 12 } = req.body;

    if (!context || typeof context !== 'string') {
      return res.status(400).json({ error: 'context is required' });
    }
    if (typeof duration !== 'number' || duration < 5 || duration > 60) {
      return res.status(400).json({ error: 'duration must be between 5 and 60 seconds' });
    }

    const limitedContext = context.substring(0, 1000);

    console.log('\n🎬 Starting animation generation...');
    console.log('📝 Context:', limitedContext.substring(0, 100) + '...');
    console.log('⏱️  Duration:', duration, 'seconds');

    let manimCode: string;
    let usedFallback = false;

    try {
      console.log('🤖 Generating Manim code with Claude...');
      manimCode = await generateManimCode({ context: limitedContext, duration });
      console.log('✅ Code generated');
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      console.log('⚠️  Using fallback animation');
      usedFallback = true;
      manimCode = createFallbackAnimation(limitedContext, duration);
    }

    console.log('🎥 Rendering with Manim...');
    const outputName = `animation_${Date.now()}`;
    const result = await executeManimCode(manimCode, outputName, 'low');

    if (!result.success) {
      console.error('❌ Render failed:', result.error);
      return res.status(500).json({
        error: result.error || 'Failed to generate animation',
        logs: result.logs,
        usedFallback,
      });
    }

    console.log('✅ Done! Video:', result.videoPath);

    res.json({
      success: true,
      videoUrl: result.videoPath,
      message: 'Animation generated successfully',
      usedFallback,
      duration,
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  console.log('🚀 Luminary Manim API started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🎬 Videos dir: ${VIDEO_OUTPUT_DIR}`);
  console.log(`🔒 Auth: ${process.env.RENDER_API_SECRET ? 'Enabled' : 'Disabled'}`);
  console.log('\n✅ Ready!\n');
});

process.on('SIGTERM', () => { console.log('Shutting down...'); process.exit(0); });
process.on('SIGINT', () => { console.log('Shutting down...'); process.exit(0); });
