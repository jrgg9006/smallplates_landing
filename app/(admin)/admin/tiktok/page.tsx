"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PILLAR_LABELS, VALID_PILLARS, buildUserMessage, type Pillar } from '@/lib/tiktok-agent/system-prompt';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const PROSE_CLASSES = `
  prose prose-gray max-w-none
  prose-headings:font-semibold prose-headings:text-brand-charcoal
  prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
  prose-p:text-brand-charcoal/80 prose-p:leading-relaxed prose-p:text-sm
  prose-li:text-brand-charcoal/80 prose-li:text-sm
  prose-strong:text-brand-charcoal
  prose-table:text-sm
  prose-th:text-left prose-th:font-semibold prose-th:text-brand-charcoal
  prose-td:text-brand-charcoal/80
  prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
  prose-hr:my-6
`;

export default function TikTokPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pillar, setPillar] = useState<Pillar>('product');
  const [idea, setIdea] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isAdminEmail(user.email)) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  // Reason: auto-scroll to bottom when new content streams in
  useEffect(() => {
    if (generating) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingContent, generating]);

  const streamResponse = useCallback(async (messagesToSend: ChatMessage[]) => {
    setError(null);
    setGenerating(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/v1/admin/tiktok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesToSend }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || `Generation failed (${response.status}). Try again.`);
        setGenerating(false);
        return;
      }

      if (!response.body) {
        setError('No response stream available.');
        setGenerating(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        if (accumulated.includes('[STREAM_ERROR]:')) {
          const errorMsg = accumulated.split('[STREAM_ERROR]:')[1]?.trim();
          setError(errorMsg || 'Generation failed. Try again.');
          accumulated = accumulated.split('[STREAM_ERROR]:')[0];
          break;
        }

        setStreamingContent(accumulated);
      }

      if (accumulated.trim()) {
        setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
      }
      setStreamingContent('');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!idea.trim()) {
      setError('Enter your content idea first.');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: buildUserMessage(pillar, idea.trim()),
    };

    setMessages([userMessage]);
    await streamResponse([userMessage]);
  }, [pillar, idea, streamResponse]);

  const handleFollowUp = useCallback(async () => {
    const text = followUp.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setFollowUp('');
    await streamResponse(updatedMessages);
  }, [followUp, messages, streamResponse]);

  const handleFollowUpKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFollowUp();
      }
    },
    [handleFollowUp]
  );

  const handleCopy = useCallback(async () => {
    // Reason: copy the last assistant message (most recent brief or refinement)
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    await navigator.clipboard.writeText(lastAssistant.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [messages]);

  const handleGenerateAnother = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
    setIdea('');
    setFollowUp('');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const hasConversation = messages.length > 0;
  const hasAssistantResponse = messages.some((m) => m.role === 'assistant');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 inline-block"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">TikTok Content Generator</h1>
          <p className="text-gray-600 mt-1">
            Enter an idea, get a ready-to-execute video production brief.
          </p>
        </div>

        {/* Initial Form — hidden once conversation starts */}
        {!hasConversation && (
          <div ref={formRef} className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="space-y-5">
              <div>
                <Label htmlFor="pillar" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Content Pillar
                </Label>
                <Select value={pillar} onValueChange={(v) => setPillar(v as Pillar)}>
                  <SelectTrigger id="pillar" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_PILLARS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PILLAR_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="idea" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Your Idea
                </Label>
                <textarea
                  id="idea"
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your video idea. What do you want to talk about? Any specific angle or message?"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                  maxLength={2000}
                  disabled={generating}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {idea.length}/2000
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={generating || !idea.trim()}
                className="w-full bg-brand-charcoal text-white hover:bg-brand-charcoal/90"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating Brief...
                  </span>
                ) : (
                  'Generate Brief'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Conversation Thread */}
        {hasConversation && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  // Reason: skip rendering the first user message (it's the auto-built prompt)
                  i === 0 ? null : (
                    <div className="flex justify-end mb-4">
                      <div className="bg-brand-charcoal text-white rounded-xl rounded-br-sm px-4 py-3 max-w-[85%]">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {i === 1 ? 'Production Brief' : 'Response'}
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await navigator.clipboard.writeText(msg.content);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-xs"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <article className={PROSE_CLASSES}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </article>
                  </div>
                )}
              </div>
            ))}

            {/* Currently streaming response */}
            {generating && streamingContent && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand-charcoal border-t-transparent" />
                  <h2 className="text-lg font-semibold text-gray-900">Generating...</h2>
                </div>
                <article className={PROSE_CLASSES}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent}
                  </ReactMarkdown>
                </article>
              </div>
            )}

            {/* Generating indicator when no content yet */}
            {generating && !streamingContent && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand-charcoal border-t-transparent" />
                  <p className="text-sm text-gray-600">Thinking...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Follow-up input */}
            {hasAssistantResponse && !generating && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex gap-3">
                  <textarea
                    ref={followUpRef}
                    rows={2}
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onKeyDown={handleFollowUpKeyDown}
                    placeholder="Ask a question or request changes... (Enter to send, Shift+Enter for new line)"
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                  <Button
                    onClick={handleFollowUp}
                    disabled={!followUp.trim()}
                    className="self-end bg-brand-charcoal text-white hover:bg-brand-charcoal/90"
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}

            {/* Start over */}
            {hasAssistantResponse && !generating && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={handleGenerateAnother}
                  className="w-full"
                >
                  Start New Brief
                </Button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
