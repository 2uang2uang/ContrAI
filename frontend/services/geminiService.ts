interface MessageHistory {
  role: string;
  parts: { text: string }[];
}

interface GeminiResponse {
  text: string;
  data?: any;
}

export async function sendMessageToGemini(
  history: MessageHistory[],
  message: string
): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from API');
    }

    const data = await response.json();
    return {
      text: data.text || data.message || 'No response',
      data: data.data,
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
