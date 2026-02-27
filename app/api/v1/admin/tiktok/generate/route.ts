import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAdminAuth } from '@/lib/auth/admin';
import { TIKTOK_SYSTEM_PROMPT } from '@/lib/tiktok-agent/system-prompt';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages array is required' },
      { status: 400 }
    );
  }

  if (messages.length > 50) {
    return NextResponse.json(
      { error: 'Too many messages. Start a new conversation.' },
      { status: 400 }
    );
  }

  // Reason: validate structure — roles must alternate user/assistant, starting and ending with user
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user' || !lastMessage.content?.trim()) {
    return NextResponse.json(
      { error: 'Last message must be a non-empty user message' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-5',
          max_tokens: 4000,
          system: TIKTOK_SYSTEM_PROMPT,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error during generation';
        controller.enqueue(encoder.encode(`[STREAM_ERROR]: ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
