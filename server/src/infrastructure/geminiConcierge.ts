// ============================================================
// Pulse26 — Gemini Concierge Service
// ============================================================
// Streaming multilingual chat concierge.
// Detects the user's language automatically and responds natively.
// Context-aware: knows venue, match phase, and active alerts.
// Falls back to canned responses if Gemini is unavailable.
// ============================================================

import { GoogleGenAI } from '@google/genai';
import type { IConciergeService } from '../domain/interfaces.js';
import type { ChatRequest, ChatChunk, Language } from '../domain/types.js';

const SYSTEM_PROMPT = `You are Pulse, the AI fan companion for FIFA World Cup 2026.
You help fans navigate stadiums, find their seats, get food and drink recommendations,
understand transportation options, and answer any questions about their match experience.

CRITICAL LANGUAGE RULE: Detect the language the fan is writing in and ALWAYS respond
in that same language. Never ask them to switch languages. If they write in Spanish,
respond in Spanish. If they write in French, respond in French. If they write in
Portuguese, respond in Portuguese. If mixed, match the dominant language.

You are friendly, concise, and knowledgeable about:
- All 16 WC26 venues (US, Canada, Mexico)
- Transportation: transit, rideshare, parking
- Accessibility routes and wheelchair-accessible entrances
- Concessions, restrooms, and venue facilities
- Real-time crowd conditions (you will be given current telemetry context)
- Match schedules (Round of 16 finishing, Quarterfinals July 14-15, Final July 19 at MetLife)

When you don't know something for certain, say so clearly rather than guessing.
Keep responses mobile-friendly: concise, bullet points for multi-step info.`;

const CANNED_RESPONSES: Record<Language, string[]> = {
  en: [
    "I'm having trouble connecting right now. For immediate help, please ask a nearby volunteer (they're wearing orange vests).",
    "Sorry, I'm temporarily offline. Check the venue map on your ticket app, or find a wayfinding kiosk near the main entrance.",
  ],
  es: [
    "Tengo problemas para conectarme ahora. Para ayuda inmediata, consulta a un voluntario cercano (llevan chalecos naranjas).",
    "Lo siento, estoy temporalmente fuera de línea. Consulta el mapa del estadio en tu app de entradas.",
  ],
  fr: [
    "J'ai du mal à me connecter en ce moment. Pour une aide immédiate, demandez à un bénévole (ils portent des gilets oranges).",
    "Désolé, je suis temporairement hors ligne. Consultez la carte du stade sur votre application de billetterie.",
  ],
  pt: [
    "Estou com problemas de conexão agora. Para ajuda imediata, pergunte a um voluntário próximo (eles usam coletes laranja).",
    "Desculpe, estou temporariamente offline. Verifique o mapa do estádio no seu aplicativo de ingressos.",
  ],
};

function getFallbackResponse(detectedLang: Language): string {
  const responses = CANNED_RESPONSES[detectedLang] ?? CANNED_RESPONSES['en'];
  return responses[Math.floor(Math.random() * responses.length)];
}

function buildContextMessage(request: ChatRequest): string {
  const parts: string[] = [];
  if (request.context.venueId) {
    parts.push(`Current venue: ${request.context.venueId}`);
  }
  if (request.context.matchId) {
    parts.push(`Match ID: ${request.context.matchId}`);
  }
  if (request.context.currentPhase) {
    parts.push(`Match phase: ${request.context.currentPhase}`);
  }
  if (request.context.accessibilityNeeds) {
    parts.push('Fan has accessibility needs — prioritize accessible routes and entrances.');
  }
  return parts.length > 0 ? `[CONTEXT: ${parts.join(' | ')}]` : '';
}

export class GeminiConciergeService implements IConciergeService {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async streamResponse(
    request: ChatRequest,
    onChunk: (chunk: ChatChunk) => void,
  ): Promise<void> {
    try {
      const contextMsg = buildContextMessage(request);
      const fullMessage = contextMsg
        ? `${contextMsg}\n\n${request.message}`
        : request.message;

      // Build history in the format the SDK expects
      const history = request.history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = this.ai.chats.create({
        model: this.model,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        history,
      });

      const stream = await chat.sendMessageStream({ message: fullMessage });

      let fullText = '';
      for await (const chunk of stream) {
        const delta = chunk.text ?? '';
        if (delta) {
          fullText += delta;
          onChunk({
            sessionId: request.sessionId,
            delta,
            done: false,
          });
        }
      }

      // Detect language from response (simple heuristic based on script)
      const detectedLanguage = detectLanguage(fullText);

      onChunk({
        sessionId: request.sessionId,
        delta: '',
        done: true,
        detectedLanguage,
      });
    } catch (err) {
      console.warn('[Concierge] Gemini stream failed, using fallback:', err);
      const lang = request.context.userLanguage ?? 'en';
      const fallback = getFallbackResponse(lang);

      onChunk({ sessionId: request.sessionId, delta: fallback, done: false });
      onChunk({ sessionId: request.sessionId, delta: '', done: true, detectedLanguage: lang });
    }
  }
}

/** Simple language detection heuristic based on common words */
function detectLanguage(text: string): Language {
  const lower = text.toLowerCase();
  // Check for language-specific common words
  if (/\b(el|la|los|las|es|está|para|con|una|que|por)\b/.test(lower)) return 'es';
  if (/\b(le|la|les|du|de|est|pour|avec|une|que|par)\b/.test(lower)) return 'fr';
  if (/\b(o|a|os|as|é|para|com|uma|que|por|não)\b/.test(lower)) return 'pt';
  return 'en';
}

export class CannedResponseConcierge implements IConciergeService {
  async streamResponse(
    request: ChatRequest,
    onChunk: (chunk: ChatChunk) => void,
  ): Promise<void> {
    const lang = request.context.userLanguage ?? 'en';
    const response = getFallbackResponse(lang);
    const words = response.split(' ');

    // Simulate streaming with word-by-word delivery
    for (let i = 0; i < words.length; i++) {
      await new Promise((res) => setTimeout(res, 50));
      onChunk({
        sessionId: request.sessionId,
        delta: (i === 0 ? '' : ' ') + words[i],
        done: false,
      });
    }

    onChunk({ sessionId: request.sessionId, delta: '', done: true, detectedLanguage: lang });
  }
}
