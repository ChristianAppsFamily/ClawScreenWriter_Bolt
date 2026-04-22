import { Script, StoryStep, ScriptDraft } from './supabase';
import { generateWithOpenClaw, AIWritingRequest, AIWritingResponse, WRITING_PROMPTS } from './api';

export interface OpenClawContext {
  script: Script;
  steps: StoryStep[];
  drafts: ScriptDraft[];
}

export type { AIWritingRequest, AIWritingResponse };
export { WRITING_PROMPTS };

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

// Re-export generateWithOpenClaw from api.ts for backward compatibility
export { generateWithOpenClaw };
