/**
 * N8N Webhook Service
 * Handles communication with n8n webhooks for syllabus management and question answering
 */

interface SyllabusUploadPayload {
  type: 'admin';
  branch: string;
  department: string;
  year: string;
  subject: string;
  syllabusText: string;
}

interface TeacherQuestionPayload {
  type: 'teacher';
  department: string;
  year: string;
  subject: string;
  chatInput: string;
  prompt?: string;
}

interface TeacherQuestionResponse {
  answer: string;
}

const parseJsonResponse = async (response: Response): Promise<Record<string, unknown> | null> => {
  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return null;
  }
};

/**
 * Get n8n webhook URL from backend config
 */
const getWebhookUrl = async (webhookType: 'syllabus' | 'question'): Promise<string> => {
  try {
    // Both admin and teacher flows are routed through one webhook and branched by payload.type
    const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_BASE || 'http://localhost:5678/webhook';

    if (webhookType === 'syllabus' || webhookType === 'question') {
      return `${baseUrl}/upload-syllabus`;
    }

    throw new Error('Unsupported webhook type');
  } catch {
    throw new Error('Unable to retrieve webhook configuration');
  }
};

/**
 * Upload syllabus to n8n for processing
 * Extracts text from file and sends to n8n webhook
 * @param payload - Syllabus upload data with extracted text
 * @returns Webhook response
 */
export const uploadSyllabusToN8N = async (payload: SyllabusUploadPayload) => {
  try {
    const webhookUrl = await getWebhookUrl('syllabus');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      const errorMessage = typeof data?.message === 'string'
        ? data.message
        : `n8n webhook error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return {
      success: true,
      data: data || {},
      message: 'Syllabus uploaded successfully',
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to upload syllabus to n8n';
    throw new Error(message);
  }
};

/**
 * Send teacher question to n8n for processing
 * Searches syllabus content and generates answer
 * @param payload - Teacher question data
 * @returns Answer from n8n
 */
export const askTeacherQuestion = async (
  payload: TeacherQuestionPayload
): Promise<TeacherQuestionResponse> => {
  try {
    const webhookUrl = await getWebhookUrl('question');
    const normalizedPrompt = (payload.prompt || payload.chatInput || '').trim();

    if (!normalizedPrompt) {
      throw new Error('Question prompt is required');
    }

    const requestPayload = {
      ...payload,
      prompt: normalizedPrompt,
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      const errorMessage = typeof data?.message === 'string'
        ? data.message
        : `n8n webhook error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return {
      answer: typeof data?.answer === 'string'
        ? data.answer
        : 'No answer generated. Please try rephrasing your question.',
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to get answer from n8n';
    throw new Error(message);
  }
};

/**
 * Check if n8n webhook is available
 */
export const checkN8NAvailability = async (): Promise<boolean> => {
  try {
    const webhookUrl = await getWebhookUrl('syllabus');
    const response = await fetch(webhookUrl, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok || response.status === 404; // 404 is ok for webhook
  } catch {
    return false;
  }
};

export default {
  uploadSyllabusToN8N,
  askTeacherQuestion,
  checkN8NAvailability,
};
