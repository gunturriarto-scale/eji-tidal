import { useState, useRef, useEffect } from 'react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const STORAGE_KEY = 'gandalf_chat_history';
const MAX_PERSISTED = 40;

const INITIAL_MESSAGE = {
  id: 'init',
  role: 'assistant',
  text: 'Halo! 👋 Aku AI assistant untuk data EJI. Klik quick action atau ketik pertanyaanmu — Bahasa Indonesia juga boleh!',
  summary: null,
  keyInsights: [],
  sources: [],
  data: null,
  tableTitle: null,
  tableNote: null,
  tableColumns: [],
  chartType: null,
  chartLabel: null,
  status: 'ok',
  timestamp: new Date().toISOString(),
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Restore timestamps as strings (already stored as ISO strings)
    return parsed.filter((m) => m.role && m.text !== undefined && !m.loading);
  } catch {
    return null;
  }
}

function saveToStorage(messages) {
  try {
    const toSave = messages
      .filter((m) => !m.loading)
      .slice(-MAX_PERSISTED)
      .map((m) => ({
        ...m,
        // Don't persist large data arrays — just text/metadata
        data: null,
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage quota exceeded — silently skip
  }
}

export function useAIChat() {
  const [messages, setMessages] = useState(() => loadFromStorage() || [INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    saveToStorage(messages);
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: generateId(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const aiMessageId = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        role: 'assistant',
        text: '',
        sources: [],
        data: null,
        loading: true,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.filter((m) => !m.loading).slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                text: data.text || '',
                summary: data.summary || null,
                keyInsights: data.keyInsights || [],
                sources: data.sources || [],
                data: data.data || null,
                tableTitle: data.tableTitle || null,
                tableNote: data.tableNote || null,
                tableColumns: data.tableColumns || [],
                loading: false,
                chartType: data.chartType || null,
                chartLabel: data.chartLabel || null,
                status: data.status || 'ok',
              }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                text: `❌ Error: ${err.message}. Coba lagi ya.`,
                summary: null,
                keyInsights: [],
                sources: [],
                data: null,
                tableTitle: null,
                tableNote: null,
                tableColumns: [],
                loading: false,
                chartType: null,
                chartLabel: null,
                status: 'error',
              }
            : m
        )
      );
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickAction = (action) => {
    sendMessage(action.prompt);
  };

  const clearChat = () => {
    const freshMsg = { ...INITIAL_MESSAGE, id: generateId(), timestamp: new Date().toISOString(), text: 'Chat cleared! 👋 Ask me anything about your data.' };
    setMessages([freshMsg]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    quickAction,
    clearChat,
    messagesEndRef,
  };
}

// Pre-built quick actions
export const QUICK_ACTIONS = [
  {
    id: 'total-spend',
    label: '💰 Total Spend',
    prompt: 'Berapa total spend seluruh channel bulan ini? Tampilkan breakdown per brand.',
  },
  {
    id: 'budget-pacing',
    label: '📈 Budget Pacing',
    prompt: 'Tampilkan pacing budget semua brand vs target 85%. Mana yang underspending atau overspending?',
  },
  {
    id: 'top-campaign',
    label: '🏆 Top Campaign',
    prompt: 'Apa 10 campaign dengan spend tertinggi? Tampilkan nama campaign, spend, dan impressions.',
  },
  {
    id: 'channel-breakdown',
    label: '📊 Channel Breakdown',
    prompt: 'Breakdown budget dan spend per channel (Meta, TikTok, Google, Criteo). Tampilkan juga CPM per channel.',
  },
  {
    id: 'kol-performance',
    label: '👥 KOL Performance',
    prompt: 'Tampilkan top 10 KOL berdasarkan achievement %. Sertakan platform, engagement, dan ratecard.',
  },
  {
    id: 'overspending-alert',
    label: '⚠️ Overspending Alert',
    prompt: 'Produk atau brand mana yang sudah overspending (>100% pacing)? Tampilkan berapa persen exceed.',
  },
  {
    id: 'monthly-trend',
    label: '📅 Monthly Trend',
    prompt: 'Bagaimana trend spend dan impressions per bulan? Tampilkan juga growth vs month sebelumnya.',
  },
  {
    id: 'brand-performance',
    label: '🏷️ Brand Performance',
    prompt: 'Tampilkan performa semua brand, urutkan berdasarkan pacing dari tertinggi ke terendah.',
  },
];
