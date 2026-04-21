import { Script, StoryStep, ScriptDraft } from './supabase';

export interface OpenClawContext {
  script: Script;
  steps: StoryStep[];
  drafts: ScriptDraft[];
}

export interface AIWritingRequest {
  context: OpenClawContext;
  prompt: string;
  targetDraftId?: string;
  format: 'fountain' | 'prose';
}

export interface AIWritingResponse {
  content: string;
  format: 'fountain' | 'prose';
  suggestions?: string[];
}

export function buildContextFromScript(
  script: Script,
  steps: StoryStep[],
  drafts: ScriptDraft[]
): OpenClawContext {
  return {
    script,
    steps: steps.sort((a, b) => a.order_index - b.order_index),
    drafts: drafts.sort((a, b) => a.order_index - b.order_index),
  };
}

export function buildPromptContext(context: OpenClawContext): string {
  const lines: string[] = [];

  lines.push(`# Script: ${context.script.title}`);
  lines.push('');

  if (context.script.written_by) {
    lines.push(`Written by: ${context.script.written_by}`);
  }
  if (context.script.author_name) {
    lines.push(`Author: ${context.script.author_name}`);
  }
  lines.push('');

  if (context.steps.length > 0) {
    lines.push('## Development Steps');
    lines.push('');

    context.steps.forEach(step => {
      lines.push(`### ${step.title} (${step.step_type})`);
      if (step.content) {
        lines.push(step.content);
      }
      lines.push('');
    });
  }

  if (context.drafts.length > 0) {
    lines.push('## Existing Drafts');
    lines.push('');

    context.drafts.forEach(draft => {
      lines.push(`### ${draft.title}`);
      if (draft.content) {
        const preview = draft.content.substring(0, 500);
        lines.push(preview + (draft.content.length > 500 ? '...' : ''));
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

export function formatForFountain(text: string): string {
  let formatted = text;

  formatted = formatted.replace(/^(INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.)/gim, match => match.toUpperCase());

  formatted = formatted.replace(/^([A-Z][A-Z\s]+)$/gm, (match) => {
    if (match.includes('.') || match.length > 40) return match;
    return match.toUpperCase();
  });

  return formatted;
}

export async function generateWithOpenClaw(
  request: AIWritingRequest,
  apiKey: string
): Promise<AIWritingResponse> {
  const contextText = buildPromptContext(request.context);

  const systemPrompt = `You are OpenClaw, an AI screenwriting assistant.
You help writers develop their scripts by understanding their story development work and generating screenplay content.
Always output in Fountain format when requested.

Current script context:
${contextText}`;

  const response = await fetch('/functions/v1/openclaw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      system: systemPrompt,
      prompt: request.prompt,
      format: request.format,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenClaw API error: ${response.statusText}`);
  }

  return response.json();
}

export const WRITING_PROMPTS = {
  expandScene: 'Expand this scene with more action and dialogue',
  addDialogue: 'Add dialogue to this scene',
  describeAction: 'Describe the action in this scene in more detail',
  generateFromSteps: 'Using the development steps above, generate screenplay pages',
  continueWriting: 'Continue writing from where the draft left off',
  improveDialogue: 'Improve the dialogue to sound more natural',
  addSubtext: 'Add subtext and tension to this scene',
};
