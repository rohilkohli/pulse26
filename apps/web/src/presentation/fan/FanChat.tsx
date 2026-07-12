// ============================================================
// Pulse26 — Fan Chat Screen (Multilingual AI Concierge)
// ============================================================

import { useEffect, useRef, useState, FormEvent } from 'react';
import { Sparkles, ArrowUp, X } from 'lucide-react';
import { useFanContext } from './FanLayout';
import { useChat } from '../../application/useChat';
import { usePreferences } from '../../application/usePreferences';

const SUGGESTION_SETS: Record<string, string[]> = {
  en: [
    'How do I get to Gate A from the transit hub?',
    'Where is the nearest accessible entrance?',
    'How long is the wait at Gate B?',
    'Are there vegetarian options at the concessions?',
    'What time does the match start?',
  ],
  es: [
    '¿Cómo llego a la Puerta A desde el metro?',
    '¿Dónde está la entrada accesible más cercana?',
    '¿Cuánto tiempo de espera hay en la Puerta B?',
    '¿Hay opciones vegetarianas en los puestos de comida?',
    '¿A qué hora empieza el partido?',
  ],
  fr: [
    'Comment aller à la Porte A depuis la station de métro ?',
    'Où est l\'entrée accessible la plus proche ?',
    'Combien de temps d\'attente à la Porte B ?',
    'Y a-t-il des options végétariennes aux concessions ?',
    'À quelle heure commence le match ?',
  ],
  pt: [
    'Como chego ao Portão A a partir do metrô?',
    'Onde fica a entrada acessível mais próxima?',
    'Quanto tempo é a espera no Portão B?',
    'Há opções vegetarianas nas lanchonetes?',
    'A que horas começa o jogo?',
  ],
};

const LANG_LABELS: Record<string, string> = { en: 'EN', es: 'ES', fr: 'FR', pt: 'PT' };
const WELCOME_MSGS: Record<string, string> = {
  en: "👋 Hi! I'm Pulse, your AI fan companion for FIFA World Cup 2026. I can help you navigate the stadium, find accessible routes, check wait times, and answer any questions — in your language. What do you need?",
  es: "👋 ¡Hola! Soy Pulse, tu asistente de IA para la Copa Mundial FIFA 2026. Puedo ayudarte a navegar el estadio, encontrar rutas accesibles, verificar tiempos de espera y responder cualquier pregunta. ¿En qué te puedo ayudar?",
  fr: "👋 Salut ! Je suis Pulse, votre assistant IA pour la Coupe du Monde FIFA 2026. Je peux vous aider à naviguer dans le stade, trouver des itinéraires accessibles, vérifier les temps d'attente et répondre à toutes vos questions. Que puis-je faire pour vous ?",
  pt: "👋 Olá! Eu sou o Pulse, seu assistente de IA para a Copa do Mundo FIFA 2026. Posso ajudá-lo a navegar pelo estádio, encontrar rotas acessíveis, verificar tempos de espera e responder qualquer pergunta. No que posso ajudar?",
};

export function FanChat() {
  const { venueId, matchId } = useFanContext();
  const { prefs } = usePreferences();
  const { messages, isStreaming, detectedLanguage, sendMessage, clearHistory } = useChat({
    venueId, matchId, accessibilityNeeds: prefs.accessibilityNeeds,
  });

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lang = prefs.preferredLanguage;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    void sendMessage(inputValue);
    setInputValue('');
  };

  const handleSuggestion = (text: string) => {
    void sendMessage(text);
    inputRef.current?.focus();
  };

  const suggestions = SUGGESTION_SETS[lang] ?? SUGGESTION_SETS.en;
  const welcomeMsg = WELCOME_MSGS[lang] ?? WELCOME_MSGS.en;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100dvh - var(--bottom-nav-height))' }}>

      {/* Header */}
      <div className="topbar">
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }} aria-hidden="true"><Sparkles size={16} strokeWidth={2.5} /></div>
        <div className="flex-1">
          <div className="font-semi text-sm">Pulse — AI Concierge</div>
          <div className="text-xs text-muted">
            {isStreaming ? (
              <span className="text-pulse" aria-live="polite" aria-label="Pulse is typing">Typing...</span>
            ) : (
              `Responds in your language · ${LANG_LABELS[detectedLanguage] ?? 'EN'}`
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="badge badge--pulse text-xs">{LANG_LABELS[lang] ?? 'EN'}</span>
          <button
            className="btn btn--ghost btn--sm"
            onClick={clearHistory}
            aria-label="Clear chat history"
            title="New conversation"
          ><X size={16} strokeWidth={2} /></button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >

        {/* Welcome / Empty State */}
        {messages.length === 0 && (
          <div className="fade-in">
            {/* Welcome bubble */}
            <div className="flex gap-3 mb-6">
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }} aria-hidden="true"><Sparkles size={16} strokeWidth={2.5} /></div>
              <div className="chat-bubble chat-bubble--assistant" style={{ maxWidth: '90%' }}>
                {welcomeMsg}
              </div>
            </div>

            {/* Suggestions */}
            <div className="text-xs text-muted mb-3 uppercase tracking-wide">Quick questions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="btn btn--secondary"
                  style={{ textAlign: 'left', justifyContent: 'flex-start', whiteSpace: 'normal', height: 'auto', lineHeight: 1.4 }}
                  aria-label={`Ask: ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-sm)', flexShrink: 0, marginTop: 2,
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }} aria-hidden="true"><Sparkles size={14} strokeWidth={2.5} /></div>
            )}
            <div className={`chat-bubble chat-bubble--${msg.role}`}>
              {msg.content}
              {msg.role === 'assistant' && msg.content === '' && (
                <div className="flex gap-2 items-center" style={{ padding: '2px 0' }}>
                  <span className="typing-dot" aria-hidden="true" />
                  <span className="typing-dot" aria-hidden="true" />
                  <span className="typing-dot" aria-hidden="true" />
                  <span className="sr-only">Pulse is typing</span>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Floating Input Pill */}
      <div style={{
        position: 'absolute',
        bottom: 'var(--space-4)',
        left: 'var(--space-4)',
        right: 'var(--space-4)',
        zIndex: 10,
      }}>
        <form onSubmit={handleSubmit} className="flex gap-2 fade-in" style={{
          background: 'var(--surface-01)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 6px 6px 20px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
          transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            type="text"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-base)',
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              lang === 'es' ? 'Escribe tu pregunta...' :
              lang === 'fr' ? 'Tapez votre question...' :
              lang === 'pt' ? 'Digite sua pergunta...' :
              'Ask anything...'
            }
            disabled={isStreaming}
            aria-label="Chat message input"
            autoComplete="off"
            maxLength={500}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isStreaming || !inputValue.trim()}
            aria-label="Send message"
            style={{ padding: '10px 16px', borderRadius: 'var(--radius-full)' }}
          >
            {isStreaming ? (
              <span className="typing-dot" aria-hidden="true" style={{ background: 'var(--text-inverse)' }} />
            ) : <ArrowUp size={16} strokeWidth={2.5} />}
          </button>
        </form>
        <div className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          AI responses may not reflect real-time conditions.
        </div>
      </div>
    </div>
  );
}
