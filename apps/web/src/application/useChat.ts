// ============================================================
// Pulse26 — useChat Hook
// Streaming multilingual chat with session management.
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { streamChat } from '../infrastructure/apiClient';
import type { ChatMessage } from '../domain/types';

export interface UseChatOptions {
  venueId?: string;
  matchId?: string;
  accessibilityNeeds?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef(uuidv4());
  const currentPhaseRef = useRef<string | undefined>(undefined);

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming || !content.trim()) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      language: detectedLanguage,
      timestampUtc: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Create placeholder for assistant response
    const assistantId = uuidv4();
    const placeholderMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      language: detectedLanguage,
      timestampUtc: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, placeholderMsg]);

    await streamChat({
      sessionId: sessionId.current,
      message: content.trim(),
      history: messages,
      context: {
        venueId: options.venueId,
        matchId: options.matchId,
        userLanguage: detectedLanguage,
        accessibilityNeeds: options.accessibilityNeeds,
        currentPhase: currentPhaseRef.current,
      },
      onChunk: (chunk) => {
        if (chunk.delta) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk.delta } : m,
            ),
          );
        }
        if (chunk.detectedLanguage) {
          setDetectedLanguage(chunk.detectedLanguage);
        }
      },
      onDone: () => {
        setIsStreaming(false);
      },
      onError: (err) => {
        setError(err);
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || 'Sorry, I encountered an error. Please try again.' }
              : m,
          ),
        );
      },
    });
  }, [isStreaming, messages, detectedLanguage, options]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    sessionId.current = uuidv4();
    setError(null);
  }, []);

  const setPhase = useCallback((phase: string) => {
    currentPhaseRef.current = phase;
  }, []);

  return {
    messages,
    isStreaming,
    detectedLanguage,
    error,
    sendMessage,
    clearHistory,
    setPhase,
  };
}
