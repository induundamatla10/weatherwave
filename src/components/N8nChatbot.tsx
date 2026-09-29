import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  Settings,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { WeatherDashboardData } from '../services/weather';

export const DEFAULT_N8N_WEBHOOK_URL =
  'https://indirapriya-19.app.n8n.cloud/webhook/33d0c792-b44d-49a6-ac58-595bbabfd5e3/chat';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface N8nChatbotProps {
  currentWeather: WeatherDashboardData | null;
  tempUnit: 'C' | 'F';
}

export const N8nChatbot: React.FC<N8nChatbotProps> = ({
  currentWeather,
  tempUnit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('n8n_custom_webhook_url') || DEFAULT_N8N_WEBHOOK_URL;
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(webhookUrl);
  const [urlSaved, setUrlSaved] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize unique session ID for n8n memory and welcome message
  useEffect(() => {
    let savedSession = sessionStorage.getItem('n8n_chat_session_id');
    if (!savedSession) {
      savedSession = 'session_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      sessionStorage.setItem('n8n_chat_session_id', savedSession);
    }
    setSessionId(savedSession);

    const city = currentWeather?.location.city || 'your city';
    const temp = currentWeather
      ? `${tempUnit === 'C' ? currentWeather.current.tempC : currentWeather.current.tempF}°${tempUnit}`
      : '';
    const cond = currentWeather?.condition.description || 'weather';

    setMessages([
      {
        id: 'initial_greeting',
        sender: 'bot',
        text: `Hello! 👋 I'm your AI Weather Assistant connected to n8n.\n\nCurrently monitoring **${city}** (${temp} ${cond}). Ask me about outfit suggestions, weekend forecasts, or weather recommendations!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Listen for global open chat triggers (e.g. from top navigation bar)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-n8n-chat', handleOpen);
    return () => window.removeEventListener('open-n8n-chat', handleOpen);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isConfigOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isConfigOpen]);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    setWebhookUrl(trimmed);
    localStorage.setItem('n8n_custom_webhook_url', trimmed);
    setUrlSaved(true);
    setTimeout(() => {
      setUrlSaved(false);
      setIsConfigOpen(false);
    }, 800);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = 'msg_' + Date.now();
    const newMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsLoading(true);

    const contextSummary = currentWeather
      ? {
          city: currentWeather.location.city,
          region: currentWeather.location.region,
          country: currentWeather.location.country,
          temperature: `${currentWeather.current.tempC}°C / ${currentWeather.current.tempF}°F`,
          apparentTemp: `${currentWeather.current.apparentTempC}°C / ${currentWeather.current.apparentTempF}°F`,
          condition: currentWeather.condition.description,
          humidity: `${currentWeather.current.humidity}%`,
          windSpeed: `${currentWeather.current.windSpeedKmH} km/h`,
          windDirection: `${currentWeather.current.windDirectionCompass} (${currentWeather.current.windDirectionDeg}°)`,
          cloudCover: `${currentWeather.current.cloudCover}%`,
          sunrise: currentWeather.current.sunriseFormatted,
          sunset: currentWeather.current.sunsetFormatted,
          isNight: currentWeather.condition.isNight,
        }
      : null;

    try {
      const payload = {
        action: 'sendMessage',
        sessionId: sessionId,
        chatInput: text,
        message: text,
        text: text,
        context: contextSummary,
        weather: contextSummary,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetails = '';
        try {
          const errJson = await response.json();
          errDetails = errJson.message || errJson.hint || '';
        } catch {
          // not json
        }

        if (response.status === 404) {
          throw new Error(
            `n8n webhook returned 404 (Not Registered).\n\n💡 Tip: Your n8n workflow must be toggled to "Active" (switch in top-right of your n8n workflow editor) to receive calls on the production webhook URL.\n\nIf you are testing directly in the canvas, try your n8n test webhook URL instead (typically containing "/webhook-test/").`
          );
        }

        throw new Error(
          `n8n webhook error (Status ${response.status}): ${errDetails || response.statusText || 'Unable to process request'}`
        );
      }

      let botReply = '';
      const responseContentType = response.headers.get('content-type') || '';

      if (responseContentType.includes('application/json')) {
        const data = await response.json();
        if (typeof data === 'string') {
          botReply = data;
        } else if (data.output) {
          botReply = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        } else if (data.text) {
          botReply = data.text;
        } else if (data.response) {
          botReply = data.response;
        } else if (data.message) {
          botReply = data.message;
        } else if (data.chatOutput) {
          botReply = data.chatOutput;
        } else if (Array.isArray(data) && data.length > 0) {
          botReply = data[0].output || data[0].text || data[0].message || JSON.stringify(data[0]);
        } else {
          botReply = JSON.stringify(data, null, 2);
        }
      } else {
        botReply = await response.text();
      }

      if (!botReply || botReply.trim() === '') {
        botReply = 'Your message was received by the n8n workflow! (Workflow finished with empty text output)';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: unknown) {
      let friendlyError = '';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          friendlyError = 'Request timed out after 20 seconds. Please check your n8n workflow execution logs.';
        } else if (err.message.includes('Failed to fetch')) {
          friendlyError = `⚠️ Connection to n8n webhook failed (Network/CORS).\n\nCommon solutions:\n1. Ensure your workflow in n8n Cloud is turned **Active** (toggle in the top-right corner).\n2. If testing in n8n editor, verify the webhook URL.\n3. Endpoint: \`${webhookUrl}\``;
        } else {
          friendlyError = err.message;
        }
      } else {
        friendlyError = 'Unknown communication issue with n8n webhook.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'bot',
          text: friendlyError,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const newSession = 'session_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    sessionStorage.setItem('n8n_chat_session_id', newSession);
    setSessionId(newSession);

    const city = currentWeather?.location.city || 'your city';
    const temp = currentWeather
      ? `${tempUnit === 'C' ? currentWeather.current.tempC : currentWeather.current.tempF}°${tempUnit}`
      : '';
    const cond = currentWeather?.condition.description || 'weather';

    setMessages([
      {
        id: 'initial_greeting_' + Date.now(),
        sender: 'bot',
        text: `Conversation reset! 🔄\n\nI'm ready for new questions about **${city}** (${temp} ${cond}) or any weather inquiry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const currentCity = currentWeather?.location.city || 'current location';
  const quickPrompts = [
    `What should I wear in ${currentCity} right now?`,
    `Will it rain today in ${currentCity}?`,
    `Is it good for outdoor running?`,
    `Weekend forecast advice`,
  ];

  // Simple Markdown renderer
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={pIdx}
              className="px-1.5 py-0.5 rounded bg-black/50 text-sky-300 font-mono text-[11px] border border-white/10"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={i} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-sky-400 mt-0.5">•</span>
            <span>{renderedParts}</span>
          </div>
        );
      }

      return (
        <React.Fragment key={i}>
          {renderedParts}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 text-white/90 text-xs px-3.5 py-2 rounded-2xl shadow-xl border border-white/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chat with n8n Weather AI</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/30 cursor-pointer"
            aria-label="Open n8n Weather AI Chat"
          >
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
            <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
          </button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col overflow-hidden bg-slate-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl ${
            isExpanded
              ? 'inset-3 sm:inset-6 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl'
          }`}
          role="dialog"
          aria-label="n8n Weather Assistant Chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md border border-white/20">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Weather AI Assistant</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/20">
                    n8n
                  </span>
                </h3>
                <p className="text-[11px] text-white/60 truncate max-w-[200px]">
                  {webhookUrl.replace('https://', '').slice(0, 28)}...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className={`p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                  isConfigOpen ? 'bg-white/15 text-white' : ''
                }`}
                title="Webhook settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Webhook Settings Panel */}
          {isConfigOpen && (
            <div className="p-3.5 bg-slate-900 border-b border-white/15 text-xs text-white shrink-0 animate-fade-in">
              <form onSubmit={handleSaveWebhook} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5 text-sky-300">
                    <Settings className="w-3.5 h-3.5" />
                    n8n Webhook Configuration
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlDraft(DEFAULT_N8N_WEBHOOK_URL);
                      setWebhookUrl(DEFAULT_N8N_WEBHOOK_URL);
                      localStorage.removeItem('n8n_custom_webhook_url');
                    }}
                    className="text-[10px] text-white/60 hover:text-white underline cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>
                <input
                  type="url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://your-n8n.cloud/webhook/.../chat"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-white/50 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-sky-400" />
                    Ensure workflow is Active in n8n Cloud
                  </span>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {urlSaved ? <Check className="w-3 h-3" /> : null}
                    <span>{urlSaved ? 'Saved!' : 'Save URL'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Weather Context Banner */}
          {currentWeather && (
            <div className="bg-sky-950/40 border-b border-sky-500/20 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-sky-200/90 shrink-0">
              <span className="truncate flex items-center gap-1">
                <span>📍</span>
                <strong className="text-white">{currentWeather.location.city}</strong>
                <span>
                  &middot; {tempUnit === 'C' ? currentWeather.current.tempC : currentWeather.current.tempF}°{tempUnit}
                  &middot; {currentWeather.condition.description}
                </span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">Synced</span>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin select-text">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-sky-600/40 border border-sky-400/30 flex items-center justify-center shrink-0 text-white text-xs mt-0.5">
                    <Bot className="w-4 h-4 text-sky-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-sky-500 text-white rounded-br-xs'
                      : msg.isError
                      ? 'bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-bl-xs'
                      : 'bg-white/10 border border-white/15 text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {msg.isError && (
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>n8n Notice</span>
                    </div>
                  )}
                  <div className="break-words">{renderMessageContent(msg.text)}</div>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-white/70' : 'text-white/40'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center shrink-0 text-white text-xs mt-0.5">
                    <User className="w-4 h-4 text-indigo-200" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-sky-600/40 border border-sky-400/30 flex items-center justify-center shrink-0 text-white text-xs">
                  <Bot className="w-4 h-4 text-sky-300" />
                </div>
                <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 rounded-bl-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                  <span className="text-xs text-white/70">Connecting to n8n agent…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 border-t border-white/10 bg-black/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] text-white/50 shrink-0 font-medium">Try:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-[11px] whitespace-nowrap bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white px-2.5 py-1 rounded-full border border-white/15 transition-all cursor-pointer disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white/5 border-t border-white/10 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask anything about ${currentCity} or weather...`}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/80 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md shrink-0 flex items-center justify-center"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
