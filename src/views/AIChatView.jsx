import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Trash2, Database, ChevronDown, ChevronUp, Sparkles, RotateCcw } from 'lucide-react';
import { useAIChat, QUICK_ACTIONS } from '../hooks/useAIChat';
import DataTable from '../components/chat/DataTable';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';

// ─── Branding Config ────────────────────────────────────────────────────────────
const BRAND = {
  name: 'Ask Gandalf',
  tagline: 'Your data wizard',
  gradient: 'linear-gradient(135deg, #10B981, #059669)',
  accent: '#10B981',
  glow: 'rgba(16, 185, 129, 0.15)',
};

const SOURCE_CONFIG = {
  'Command Center': { color: '#F59E0B', icon: '🎯', badge: 'Cmd' },
  'KOL Master Sheet': { color: '#EC4899', icon: '👥', badge: 'KOL' },
  'BigQuery Meta Ads': { color: '#1877F2', icon: '📊', badge: 'Meta' },
  'BigQuery TikTok Ads': { color: '#FF0050', icon: '🎵', badge: 'TikTok' },
};

// ─── Source Badge ───────────────────────────────────────────────────────────────
const SourceBadge = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {sources.map((src) => {
        const cfg = SOURCE_CONFIG[src] || { color: '#6366F1', icon: '📊', badge: src };
        return (
          <span
            key={src}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 500,
              background: `${cfg.color}18`,
              color: cfg.color,
              border: `1px solid ${cfg.color}30`,
            }}
          >
            {cfg.icon} {cfg.badge}
          </span>
        );
      })}
    </div>
  );
};

// ─── Gandalf Avatar ─────────────────────────────────────────────────────────────
const GandalfAvatar = ({ size = 36 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '10px',
      background: BRAND.gradient,
      boxShadow: `0 0 16px ${BRAND.glow}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      alignSelf: 'flex-end',
    }}
  >
    <Sparkles size={size * 0.5} color="white" />
  </div>
);

// ─── User Avatar ────────────────────────────────────────────────────────────────
const UserAvatar = () => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: '10px',
      background: 'rgba(99, 102, 241, 0.25)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      alignSelf: 'flex-end',
      fontSize: '14px',
      fontWeight: 700,
      color: '#818CF8',
    }}
  >
    You
  </div>
);

// ─── Chat Bubble ────────────────────────────────────────────────────────────────
const ChatBubble = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const [tableExpanded, setTableExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = message.text || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasData =
    message.data &&
    Array.isArray(message.data) &&
    message.data.length > 0 &&
    message.tableColumns?.length > 0;

  const hasChart =
    message.chartType &&
    message.data &&
    (message.chartType === 'bar' || message.chartType === 'line') &&
    Array.isArray(message.data) &&
    message.data.length > 0;

  const bubbleStyle = isUser
    ? {
        background: 'rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '16px 16px 4px 16px',
        maxWidth: '72%',
      }
    : {
        background: 'rgba(20, 23, 31, 0.97)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px 16px 16px 4px',
        maxWidth: '80%',
      };

  const markdownStyles = {
    fontSize: '13px',
    lineHeight: 1.7,
    color: '#E2E8F0',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '10px',
        animation: 'fadeIn 0.3s ease forwards',
      }}
    >
      {isUser ? <UserAvatar /> : <GandalfAvatar size={36} />}

      <div style={bubbleStyle}>
        {isUser ? (
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#E2E8F0', padding: '10px 14px' }}>
            {message.text}
          </p>
        ) : message.loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: BRAND.accent,
                    display: 'inline-block',
                    animation: `bounce 1.2s ease-in-out ${i * 200}ms infinite`,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Consulting the wizard...</span>
          </div>
        ) : (
          <div style={{ padding: '12px 14px' }}>
            {message.text && (
              <div
                style={{
                  ...markdownStyles,
                  marginBottom: hasChart || hasData || (message.keyInsights?.length > 0) ? '12px' : 0,
                }}
              >
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}

            {message.keyInsights?.length > 0 && (
              <div
                style={{
                  marginBottom: hasChart || hasData ? '10px' : 0,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.12)',
                }}
              >
                <p style={{ fontSize: '10px', fontWeight: 700, color: BRAND.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', margin: '0 0 6px 0' }}>
                  Key Insights
                </p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {message.keyInsights.map((insight, i) => (
                    <li key={i} style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.5 }}>
                      <ReactMarkdown>{insight}</ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {message.status === 'no_data' && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  fontSize: '12px',
                  color: '#F59E0B',
                }}
              >
                ⚠️ Data tidak tersedia untuk pertanyaan ini.
              </div>
            )}

            {(message.status === 'parse_error' || message.status === 'error') && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  fontSize: '12px',
                  color: '#F87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span>
                  {message.status === 'parse_error'
                    ? '⚠️ Response format tidak valid.'
                    : '❌ Terjadi error.'}
                </span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '6px',
                      color: '#F87171',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <RotateCcw size={11} /> Coba lagi
                  </button>
                )}
              </div>
            )}

            {hasChart && (
              <div
                style={{
                  marginBottom: hasData ? '10px' : 0,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📊 {message.chartLabel || 'Visualization'}
                  </span>
                  <button
                    onClick={() => setTableExpanded((v) => !v)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      transition: 'color 0.2s',
                    }}
                  >
                    {tableExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
                {tableExpanded && (
                  <div style={{ padding: '10px' }}>
                    <ResponsiveContainer width="100%" height={160}>
                      {message.chartType === 'bar' ? (
                        <BarChart data={message.data} margin={{ top: 5, right: 5, left: -12, bottom: 0 }}>
                          <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                          <RechartsTooltip
                            contentStyle={{
                              background: '#111827',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#9CA3AF' }}
                          />
                          <Bar dataKey="value" fill={BRAND.accent} radius={[4, 4, 0, 0]} opacity={0.85} />
                        </BarChart>
                      ) : (
                        <LineChart data={message.data} margin={{ top: 5, right: 5, left: -12, bottom: 0 }}>
                          <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                          <RechartsTooltip
                            contentStyle={{
                              background: '#111827',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#9CA3AF' }}
                          />
                          <Line type="monotone" dataKey="value" stroke={BRAND.accent} strokeWidth={2} dot={{ r: 3, fill: BRAND.accent }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {hasData && (
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                <DataTable
                  columns={message.tableColumns || []}
                  data={message.data}
                  title={message.tableTitle}
                  highlightTop
                  overspendingField="pacing"
                />
              </div>
            )}

            {message.tableNote && (
              <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px', fontStyle: 'italic' }}>
                {message.tableNote}
              </p>
            )}

            {(message.sources?.length > 0 || (!isUser && !message.loading && message.text)) && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <SourceBadge sources={message.sources} />
                {!isUser && !message.loading && message.text && (
                  <button
                    onClick={handleCopy}
                    title="Copy response"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: copied ? '#10B981' : '#64748B',
                      background: 'transparent',
                      border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '5px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    {copied ? '✓ Copied' : '⎘ Copy'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Quick Action Chip ─────────────────────────────────────────────────────────
const QuickActionChip = ({ action, onClick, disabled }) => (
  <button
    onClick={() => onClick(action)}
    disabled={disabled}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: `${BRAND.accent}15`,
      border: `1px solid ${BRAND.accent}30`,
      color: '#6EE7B7',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.35 : 1,
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1.04)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
  >
    {action.label}
  </button>
);

// ─── Main View ──────────────────────────────────────────────────────────────────
export const AIChatView = () => {
  const { messages, isLoading, sendMessage, quickAction, clearChat, messagesEndRef } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messagesWithColumns = messages.map((m) => {
    if (m.data && Array.isArray(m.data) && m.data.length > 0 && !m.columns) {
      const keys = Object.keys(m.data[0]).filter((k) => !k.startsWith('_'));
      const cols = keys.map((key) => {
        let format = 'auto';
        const lower = key.toLowerCase();
        if (lower.includes('budget') || lower.includes('spend') || lower.includes('ratecard') || lower.includes('value'))
          format = 'currency';
        else if (
          lower.includes('pacing') ||
          lower.includes('rate') ||
          lower.includes('cpm') ||
          lower.includes('percent') ||
          lower.includes('achievement')
        )
          format = 'percent';
        else if (lower.includes('trend') || lower.includes('growth')) format = 'trend';
        return {
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          sortable: true,
          format,
          align: 'right',
        };
      });
      return { ...m, columns: cols };
    }
    return m;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GandalfAvatar size={38} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {BRAND.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 500,
                  background: `${BRAND.accent}18`,
                  color: BRAND.accent,
                  border: `1px solid ${BRAND.accent}28`,
                }}
              >
                {BRAND.tagline}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              AI-powered data analyst · Connected to EJI data sources
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SourceBadge
            sources={['Command Center', 'KOL Master Sheet', 'BigQuery Meta Ads', 'BigQuery TikTok Ads']}
          />
          <button
            onClick={clearChat}
            title="Clear chat"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(239,68,68,0.15)',
              color: '#F87171',
              background: 'rgba(239,68,68,0.05)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionChip
              key={action.id}
              action={action}
              onClick={quickAction}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {messagesWithColumns.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '12px',
              opacity: 0.5,
            }}
          >
            <GandalfAvatar size={52} />
            <p style={{ fontSize: '14px', color: '#64748B', textAlign: 'center' }}>
              Ask me anything about your data ✨
            </p>
          </div>
        )}
        {messagesWithColumns.map((msg, idx) => {
          // Find last user message before this assistant message for retry
          let onRetry;
          if (msg.role === 'assistant' && (msg.status === 'error' || msg.status === 'parse_error')) {
            const lastUser = [...messagesWithColumns].slice(0, idx).reverse().find((m) => m.role === 'user');
            if (lastUser) onRetry = () => sendMessage(lastUser.text);
          }
          return <ChatBubble key={msg.id} message={msg} onRetry={onRetry} />;
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(20, 23, 31, 0.97)',
            border: isLoading
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: isLoading ? 'none' : `0 0 0 1px ${BRAND.accent}10`,
            transition: 'all 0.2s ease',
          }}
        >
          <Database size={14} style={{ color: BRAND.accent, flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your data... (Bahasa Indonesia OK)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#E2E8F0',
              fontSize: '13px',
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: inputValue.trim() && !isLoading ? BRAND.gradient : 'rgba(16,185,129,0.15)',
              boxShadow: inputValue.trim() && !isLoading ? `0 0 10px ${BRAND.glow}` : 'none',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() && !isLoading ? 1 : 0.4,
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <Send size={12} color="white" />
          </button>
        </div>
        <p
          style={{
            fontSize: '11px',
            color: '#4B5563',
            marginTop: '8px',
            paddingLeft: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ✨ Try: &quot;brand mana yang paling boros CPM?&quot; · &quot;top 5 KOL TikTok achievement&quot; · &quot;budget pacing semua brand&quot;
        </p>
      </div>
    </div>
  );
};