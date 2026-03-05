import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ManimGenerationRequest {
  context: string;
  duration?: number;
}

export async function generateManimCode(request: ManimGenerationRequest): Promise<string> {
  const { context, duration = 15 } = request;

  const numAnimations = Math.max(3, Math.floor(duration / 3));
  const avgAnimationTime = (duration * 0.9) / numAnimations;

  const systemPrompt = `You are an expert Manim (Mathematical Animation Engine) programmer. Your task is to generate Python code that creates a visually compelling and DIRECTLY RELEVANT animation for the given concept.

🎯 CRITICAL RULES - MUST FOLLOW:

1. **DIRECT RELEVANCE**: The animation MUST visually demonstrate the EXACT concept described. Do not create generic shapes unless the concept is about those shapes.

2. **PRECISE TIMING**: The total animation must run for EXACTLY ${duration} seconds:
   - Create ${numAnimations} distinct animations
   - Each animation should use run_time=${avgAnimationTime.toFixed(1)}
   - Total: ${numAnimations} × ${avgAnimationTime.toFixed(1)}s = ${duration}s
   - Add minimal waits (0.3-0.5s) between major sections only
   - NO long pauses or unnecessary waiting except for at the end to allow viewers to absorb the final insight.

3. **CONCEPT-SPECIFIC VISUALS**: Choose visualization based on the concept type:
   - **Math Equations/Formulas**: Show the actual equations with MathTex, demonstrate transformations
   - **Functions/Calculus**: Use Axes and plot() to graph functions, show derivatives, integrals
   - **Physics**: Show vectors, forces, motion, wave propagation with appropriate diagrams
   - **Geometry**: Show the actual shapes, angles, constructions mentioned
   - **Processes/Algorithms**: Show step-by-step progression with clear labels
   - **Comparisons**: Show side-by-side or before/after
   - **Wave phenomena**: Use sine waves, interference patterns, not random circles

4. **CODE STRUCTURE**:
\`\`\`python
from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # Animation 1: Introduction (${avgAnimationTime.toFixed(1)}s)
        # Animation 2: Development (${avgAnimationTime.toFixed(1)}s)
        # Animation 3+: Key Insight (${avgAnimationTime.toFixed(1)}s each)
\`\`\`

5. **MANIM TOOLKIT**:
   - **Math**: MathTex("x^2 + y^2 = r^2"), Axes(), NumberLine, plot(lambda x: ...)
   - **Shapes**: Circle, Square, Arrow, Line, Dot, Arc, Polygon
   - **Text**: Text("label"), always use for explanations
   - **Animations**: Create(), Write(), FadeIn(), Transform(), Indicate(), Circumscribe()
   - **Motion**: .animate.shift(), .animate.scale(), .animate.rotate()
   - **Colors**: BLUE, RED, GREEN, YELLOW, ORANGE, PURPLE, PINK, GOLD
   - **Positioning**: move_to(), next_to(), shift(UP), to_edge(LEFT)

6. **QUALITY STANDARDS**:
   - Use descriptive variable names that match the concept
   - Add Text labels for clarity
   - Use colors meaningfully (e.g., BLUE for positive, RED for negative)
   - Ensure mathematical accuracy
   - Avoid overlapping elements; keep the scene clear and uncluttered
   - End with a clear visual representation of the key insight or takeaway

7. **OUTPUT FORMAT**:
   - Return ONLY Python code
   - NO markdown code blocks (\`\`\`), NO explanations, NO comments outside the code
   - Code must be immediately executable`;

  const userPrompt = `Generate a ${duration}-second Manim animation for:

"${context}"

BEFORE YOU CODE, THINK:
1. What is the CORE concept here?
2. What visual elements directly represent this?
3. How can I show this in ${numAnimations} clear steps?

THEN CODE:
- ${numAnimations} animations, each ${avgAnimationTime.toFixed(1)}s long
- DIRECTLY visualize the concept
- Use appropriate math/physics notation if relevant
- Total runtime: ${duration} seconds (add a few second pause at the end for absorption)

Return ONLY the Python code, no markdown formatting:`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  let code = '';
  if (message.content[0].type === 'text') {
    code = message.content[0].text;
  }

  code = cleanManimCode(code);
  validateManimCode(code);

  return code;
}

function cleanManimCode(code: string): string {
  let cleaned = code.replace(/```python\n/g, '').replace(/```\n?/g, '').trim();

  // Strip font_size kwarg from axis label helpers (unsupported in some Manim versions)
  cleaned = cleaned.replace(
    /(\bget_[xy]_axis_label\s*\([^\)]*?),\s*font_size\s*=\s*[\d.]+\s*(\))/g,
    '$1$2'
  );
  cleaned = cleaned.replace(
    /(\bget_[xy]_axis_label\s*\([^\)]*?)\s*font_size\s*=\s*[\d.]+\s*,\s*/g,
    '$1'
  );

  if (!cleaned.includes('from manim import')) {
    cleaned = 'from manim import *\n\n' + cleaned;
  }

  if (!cleaned.includes('class GeneratedScene')) {
    throw new Error('Generated code must contain a GeneratedScene class');
  }

  return cleaned;
}

function validateManimCode(code: string): void {
  if (!code.includes('def construct(self):')) {
    throw new Error('Generated code must have a construct method');
  }
  if (!code.includes('self.play(')) {
    throw new Error('Generated code must contain at least one animation');
  }
}

export function createFallbackAnimation(context: string, duration: number = 12): string {
  const firstLine = context.split('\n')[0].substring(0, 60);
  const animTime = duration / 4;

  return `from manim import *

class GeneratedScene(Scene):
    def construct(self):
        title = Text("${firstLine.replace(/"/g, '\\"')}", font_size=28)
        title.to_edge(UP)
        self.play(Write(title), run_time=${animTime.toFixed(1)})

        concept = VGroup(
            Circle(radius=1, color=BLUE, fill_opacity=0.5),
            Text("?", font_size=72, color=WHITE)
        )
        concept[-1].move_to(concept[0].get_center())
        self.play(FadeIn(concept), run_time=${animTime.toFixed(1)})

        self.play(
            concept.animate.scale(1.5).set_color(GREEN),
            run_time=${animTime.toFixed(1)}
        )

        self.play(
            FadeOut(title), FadeOut(concept),
            run_time=${animTime.toFixed(1)}
        )
`;
}
