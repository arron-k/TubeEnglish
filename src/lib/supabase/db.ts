import { createClient } from './client';
import type { AiTutorResponse } from '@/types';

export async function saveChatMessage(params: {
  userId: string;
  videoId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  messageContent: AiTutorResponse | { text: string };
  correctionNeeded: boolean;
}) {
  const supabase = createClient();
  await supabase.from('chat_histories').insert({
    user_id: params.userId,
    video_id: params.videoId,
    session_id: params.sessionId,
    role: params.role,
    message_content: params.messageContent,
    correction_needed: params.correctionNeeded,
  });
}
