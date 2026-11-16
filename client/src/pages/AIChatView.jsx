import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Sparkles, Send, Bot, User, Trash2, RefreshCw, 
  HelpCircle, ShieldCheck, ArrowRight, CornerDownLeft
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "How much did I spend this month?",
  "How much did I spend on food?",
  "Where am I spending the most?",
  "What was my biggest expense?",
  "How much have I saved?",
  "Compare my spending with last month",
  "Am I staying within my budget?",
  "What can I improve about my spending?"
];

export default function AIChatView() {
  const { user, currency } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/messages');
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages);
      } else {
        // Welcome initial assistant message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `### 👋 Hello ${user?.name || 'there'}! I'm SmartSpend AI ✨

I am your personal financial intelligence assistant. I analyze your authenticated transactions, budget caps, and savings goals to give you real, data-driven answers.

Click any of the suggested questions below or ask me anything about your finances!

*Disclaimer: Informational assistant only, not a licensed financial advisor.*`
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;

    setInput('');
    const tempUserMsg = { id: Date.now(), role: 'user', content: question };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: question });
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: res.data.reply };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: "⚠️ I encountered an issue analyzing your records. Please try again in a moment." 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear conversation history?')) return;
    try {
      await api.post('/ai/clear');
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Conversation cleared. How can I assist you with your finances today?`
        }
      ]);
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  // Helper to format basic markdown (bold, headers, bullets)
  const renderFormattedContent = (content) => {
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="font-bold text-sm text-indigo-300 mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="font-semibold text-xs text-indigo-200 mt-2 mb-0.5">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 my-0.5">
            {line.substring(2)}
          </li>
        );
      }
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-300 my-0.5">
            {line.substring(3)}
          </li>
        );
      }
      if (line.startsWith('*Disclaimer:')) {
        return <p key={idx} className="text-[11px] text-slate-500 italic mt-3 pt-2 border-t border-slate-700/50">{line.replace(/\*/g, '')}</p>;
      }
      return <p key={idx} className="my-1">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[850px] bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base">SmartSpend AI ✨</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Personal Assistant
              </span>
            </div>
            <p className="text-xs text-slate-400">Trained on your private financial ledger</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          title="Clear Conversation"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="prose prose-invert prose-xs max-w-none">
                    {renderFormattedContent(m.content)}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-none p-4 text-slate-400 flex items-center gap-2">
              <RefreshCw className="animate-spin text-violet-400" size={16} />
              <span>SmartSpend AI is querying your financial ledger...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Suggested:</span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSend(q)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/80 shrink-0 transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask SmartSpend AI (e.g. 'How much did I spend on food?')"
            className="flex-1 py-2.5 px-4 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-medium rounded-xl shadow-lg shadow-violet-600/30 transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
}
