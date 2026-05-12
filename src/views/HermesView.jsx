import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Trash2, Zap } from 'lucide-react';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Yo brad! Gue Hermes, siap bantu lo. Mau tanya apa?',
};

export const HermesView = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/hermes-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') continue;
          // skip hermes tool progress events (not standard delta)
          if (line.startsWith('event:')) continue;
          try {
            const chunk = JSON.parse(raw);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setStreamingContent(accumulated);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(`Hermes gak bisa dihubungi: ${err.message}`);
      setMessages((prev) => prev.slice(0, -1)); // remove unsent user msg
      setInput(text);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div className="glass-panel" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1.25rem', marginBottom: '1rem', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Hermes</div>
            <div style={{ fontSize: '0.72rem', color: isStreaming ? '#a855f7' : 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {isStreaming ? (
                <><Zap size={10} />&nbsp;thinking...</>
              ) : (
                <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-secondary)', display: 'inline-block' }} />&nbsp;online</>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleClear} title="Clear chat" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-tertiary)', padding: '0.25rem',
          display: 'flex', alignItems: 'center',
        }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="glass-panel" style={{
        flex: 1, overflowY: 'auto', padding: '1rem 1.25rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        marginBottom: '1rem',
      }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {isStreaming && streamingContent && (
          <MessageBubble msg={{ role: 'assistant', content: streamingContent }} streaming />
        )}

        {isStreaming && !streamingContent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bot size={14} color="#fff" />
            </div>
            <TypingDots />
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', flexShrink: 0 }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="glass-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan... (Enter kirim, Shift+Enter baris baru)"
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1, resize: 'none', minHeight: 40, maxHeight: 120,
              padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.9rem',
              lineHeight: 1.5, overflowY: 'auto',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          {isStreaming ? (
            <button type="button" onClick={handleStop} style={{
              padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)',
              background: 'rgba(239,68,68,0.15)', color: '#f87171',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0,
            }}>
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} style={{
              padding: '0.6rem 1rem', borderRadius: 8, border: 'none',
              background: input.trim() ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'var(--bg-panel)',
              color: input.trim() ? '#fff' : 'var(--text-tertiary)',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '0.85rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
            }}>
              <Send size={15} /> Kirim
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

function MessageBubble({ msg, streaming }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={14} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '75%', padding: '0.65rem 0.9rem', borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isUser
          ? 'linear-gradient(135deg, #a855f7, #6366f1)'
          : 'var(--bg-panel)',
        border: isUser ? 'none' : '1px solid var(--border-color)',
        color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.6,
        wordBreak: 'break-word',
      }}>
        <div style={{ '--text-primary': isUser ? '#fff' : undefined }}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ margin: '0 0 0.4em' }}>{children}</p>,
              code: ({ inline, children }) => inline
                ? <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0 4px', borderRadius: 3, fontSize: '0.85em' }}>{children}</code>
                : <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: 6, overflowX: 'auto', margin: '0.4em 0' }}><code style={{ fontSize: '0.82em' }}>{children}</code></pre>,
              ul: ({ children }) => <ul style={{ margin: '0.25em 0', paddingLeft: '1.2em' }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: '0.25em 0', paddingLeft: '1.2em' }}>{children}</ol>,
              li: ({ children }) => <li style={{ margin: '0.1em 0' }}>{children}</li>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        {streaming && <span style={{ display: 'inline-block', width: 8, height: 14, background: '#a855f7', borderRadius: 2, marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'text-bottom' }} />}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{
      padding: '0.65rem 0.9rem', borderRadius: '4px 16px 16px 16px',
      background: 'var(--bg-panel)', border: '1px solid var(--border-color)',
      display: 'flex', gap: 5, alignItems: 'center',
    }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#a855f7',
          display: 'inline-block',
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
