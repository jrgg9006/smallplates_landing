import OpenAI from 'openai';
import type { NotificationCandidate, NotificationInterpretation } from './monitor-types';
import { RADAR_MONITOR_SYSTEM_PROMPT, buildUserMessage, parseInterpretation } from './monitor-prompt';

export async function interpretCandidate(
  candidate: NotificationCandidate,
  client?: OpenAI,
): Promise<NotificationInterpretation> {
  const openai = client ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: RADAR_MONITOR_SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(candidate) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 700,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');
  return parseInterpretation(JSON.parse(content));
}
