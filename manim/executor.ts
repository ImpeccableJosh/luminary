import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Videos are saved here and served as static files by the Express server
const VIDEO_OUTPUT_DIR = process.env.VIDEO_OUTPUT_DIR || '/app/public/videos';
const PUBLIC_URL = (process.env.PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, '');

export interface ManimExecutionResult {
  success: boolean;
  videoPath?: string;
  error?: string;
  logs?: string;
}

export async function executeManimCode(
  code: string,
  outputName: string = `animation_${Date.now()}`,
  quality: 'low' | 'medium' | 'high' = 'low'
): Promise<ManimExecutionResult> {
  const tempDir = path.join(os.tmpdir(), 'manim_render_' + Date.now());
  const sceneFile = path.join(tempDir, 'scene.py');
  const outputDir = path.join(tempDir, 'media');

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });

    if (!code.includes('class GeneratedScene')) {
      throw new Error('Code must contain GeneratedScene class');
    }
    if (!code.includes('def construct')) {
      throw new Error('Code must contain construct method');
    }

    fs.writeFileSync(sceneFile, code);

    const qualityFlag = quality === 'low' ? '-ql' : quality === 'high' ? '-qh' : '-qm';
    const manimCommand = `cd "${tempDir}" && manim ${qualityFlag} --format=mp4 --media_dir="${outputDir}" scene.py GeneratedScene`;

    console.log('Running command:', manimCommand);

    let stdout = '';
    let stderr = '';

    try {
      const result = await execAsync(manimCommand, {
        timeout: 180000,
        maxBuffer: 20 * 1024 * 1024,
      });
      stdout = result.stdout;
      stderr = result.stderr;
      if (stderr) console.log('Manim stderr:', stderr.substring(0, 500));
    } catch (execError: any) {
      stdout = execError.stdout || '';
      stderr = execError.stderr || '';

      if (execError.killed && execError.signal === 'SIGTERM') {
        return {
          success: false,
          error: 'Animation rendering timed out (exceeded 3 minutes).',
          logs: stdout + '\n' + stderr,
        };
      }
      if (execError.message?.includes('command not found') || execError.code === 127) {
        return {
          success: false,
          error: 'Manim not installed. Install with: pip3 install manim',
          logs: execError.message,
        };
      }
      if (stderr?.includes('SyntaxError') || stderr?.includes('IndentationError')) {
        return {
          success: false,
          error: 'Python syntax error in generated code',
          logs: stderr,
        };
      }

      // Log stderr so errors are visible even when we fall through
      if (stderr) console.error('Manim stderr:', stderr.substring(0, 5000));

      // Check for missing ffmpeg explicitly
      if (stderr?.includes('ffmpeg') || stderr?.includes('No such file or directory')) {
        return {
          success: false,
          error: 'ffmpeg not found. Install with: brew install ffmpeg',
          logs: stderr,
        };
      }

      // Non-zero exit but video may still have been generated — fall through
    }

    const videoFiles = findVideoFiles(outputDir);

    if (videoFiles.length === 0) {
      const dirContents = listDirectoryRecursive(tempDir);
      // Surface Manim's stderr so the real cause is visible
      const manimError = stderr
        ? `Manim output:\n${stderr.substring(0, 5000)}\n\n`
        : '';
      return {
        success: false,
        error: `${manimError}No video file generated. Directory contents:\n${dirContents}`,
        logs: stdout + '\n' + stderr,
      };
    }

    const srcPath = videoFiles[0];
    const stats = fs.statSync(srcPath);

    if (stats.size === 0) {
      return { success: false, error: 'Generated video file is empty', logs: stdout + '\n' + stderr };
    }

    console.log('Video size:', (stats.size / 1024).toFixed(2), 'KB');

    // Copy to persistent output directory so Express can serve it
    const destPath = path.join(VIDEO_OUTPUT_DIR, `${outputName}.mp4`);
    fs.copyFileSync(srcPath, destPath);
    console.log('Saved video to:', destPath);

    // Cleanup temp dir
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}

    const videoUrl = `${PUBLIC_URL}/videos/${outputName}.mp4`;
    console.log('Video URL:', videoUrl);

    return {
      success: true,
      videoPath: videoUrl,
      logs: stdout,
    };
  } catch (error: any) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    return {
      success: false,
      error: error.message,
      logs: error.stack,
    };
  }
}

function findVideoFiles(dir: string): string[] {
  const results: string[] = [];

  function search(current: string) {
    if (!fs.existsSync(current)) return;
    for (const file of fs.readdirSync(current)) {
      const full = path.join(current, file);
      if (fs.statSync(full).isDirectory()) {
        search(full);
      } else if (file.endsWith('.mp4')) {
        results.push(full);
      }
    }
  }

  search(dir);
  return results;
}

function listDirectoryRecursive(dir: string, indent = ''): string {
  if (!fs.existsSync(dir)) return `${indent}[not found]\n`;
  let out = '';
  try {
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        out += `${indent}📁 ${file}/\n` + listDirectoryRecursive(full, indent + '  ');
      } else {
        out += `${indent}📄 ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)\n`;
      }
    }
  } catch {}
  return out;
}
