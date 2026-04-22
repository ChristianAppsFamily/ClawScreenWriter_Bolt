// API client for ClawScreenwriter backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://clawscreenwriter-production.up.railway.app/api';

export interface AIWritingRequest {
  script: {
    title: string;
    written_by?: string;
    author_name?: string;
  };
  steps: Array<{
    title: string;
    step_type: string;
    content?: string;
  }>;
  drafts: Array<{
    title: string;
    content?: string;
  }>;
  prompt: string;
  format: 'fountain' | 'prose';
}

export interface AIWritingResponse {
  content: string;
  format: 'fountain' | 'prose';
  suggestions?: string[];
}

export async function generateWithOpenClaw(
  request: AIWritingRequest,
  authToken?: string
): Promise<AIWritingResponse> {
  const response = await fetch(`${API_BASE_URL}/openclaw/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

// Export prompts for reuse
export const WRITING_PROMPTS = {
  expandScene: 'Expand this scene with more action and dialogue',
  addDialogue: 'Add dialogue to this scene',
  describeAction: 'Describe the action in this scene in more detail',
  generateFromSteps: 'Using the development steps above, generate screenplay pages',
  continueWriting: 'Continue writing from where the draft left off',
  improveDialogue: 'Improve the dialogue to sound more natural',
  addSubtext: 'Add subtext and tension to this scene',
};
