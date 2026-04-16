"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Wifi, WifiOff, Terminal, Zap, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const WS_URL = "ws://127.0.0.1:18789";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

// ── 3-D rotating claw orb ──────────────────────────────────────────────────
function ClawOrb({ pulse }: { pulse: boolean }) {
  return (
    <div className="relative w-14 h-14 flex-shrink-0" style={{ perspective: "200px" }}>
      {/* Glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-violet-500/30"
        animate={{ rotateY: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ transformStyle: "preserve-3d" }}
      />
      <motion.div
        className="absolute inset-1 rounded-full border border-indigo-400/20"
        animate={{ rotateX: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ transformStyle: "preserve-3d" }}
      />

      {/* Core sphere */}
      <motion.div
        className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-600 via-indigo-700 to-black border border-violet-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]"
        animate={pulse ? { scale: [1, 1.08, 1], boxShadow: ["0 0 20px rgba(139,92,246,0.4)", "0 0 40px rgba(139,92,246,0.7)", "0 0 20px rgba(139,92,246,0.4)"] } : {}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <Terminal className="w-4 h-4 text-violet-200" />
      </motion.div>

      {/* Orbiting dot */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]"
        style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4, transformOrigin: "4px 28px" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ── Typing dots ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ConnectionStatus }) {
  const map = {
    connected:    { label: "Connected",    color: "text-green-400",  dot: "bg-green-400",  border: "border-green-500/30 bg-green-500/5"  },
    connecting:   { label: "Connecting…",  color: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30 bg-yellow-500/5" },
    disconnected: { label: "Disconnected", color: "text-ink-4",      dot: "bg-ink-5",      border: "border-surface-5 bg-surface-2"        },
    error:        { label: "Error",        color: "text-red-400",    dot: "bg-red-400",    border: "border-red-500/30 bg-red-500/5"        },
  }[status];

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all duration-300", map.border)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", map.dot, status === "connected" && "animate-pulse")} />
      <span className={map.color}>{map.label}</span>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, isLast }: { msg: Message; isLast: boolean }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <span className="text-[11px] text-ink-5 px-3 py-1 rounded-full border border-surface-4/50 bg-surface-2/40">
          {msg.content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-indigo-800 border border-violet-500/40 flex items-center justify-center mt-1">
          <Terminal className="w-3 h-3 text-violet-200" />
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[75%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-white text-black rounded-tr-sm"
              : "bg-surface-3 border border-surface-5 text-white rounded-tl-sm"
          )}
        >
          {/* Render with line breaks preserved */}
          {msg.content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < msg.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-ink-5 tabular-nums px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mt-1">
          <span className="text-[10px] text-white font-bold">U</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isTyping, setIsTyping] = useState(false);
  const [orbPulse, setOrbPulse] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMessage = useCallback((role: Message["role"], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, content, timestamp: new Date() },
    ]);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) scrollToBottom();
  }, [messages, scrollToBottom]);

  // Show scroll-to-bottom btn
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 160);
  }, []);

  // ── WebSocket logic ─────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    wsRef.current?.close();

    setStatus("connecting");
    addMessage("system", `Connecting to openclaw at ${WS_URL}…`);

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        addMessage("system", "Connected to openclaw ✓");
      };

      ws.onmessage = (ev) => {
        // Clear typing indicator
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setIsTyping(false);

        // Pulse the orb
        setOrbPulse(true);
        setTimeout(() => setOrbPulse(false), 600);

        const text = typeof ev.data === "string" ? ev.data : "[binary data]";
        addMessage("assistant", text);
      };

      ws.onerror = () => {
        setStatus("error");
      };

      ws.onclose = (ev) => {
        setStatus("disconnected");
        const reason = ev.reason ? ` — ${ev.reason}` : "";
        addMessage("system", `Disconnected${reason}`);
        wsRef.current = null;
      };
    } catch {
      setStatus("error");
      addMessage("system", "Failed to create WebSocket connection.");
    }
  }, [addMessage]);

  const disconnect = useCallback(() => {
    wsRef.current?.close(1000, "User disconnected");
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => wsRef.current?.close(1000, "Component unmounted");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || status !== "connected") return;

    wsRef.current?.send(text);
    addMessage("user", text);
    setInput("");

    // Show typing indicator after sending
    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 15_000);

    // Focus back
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [input, status, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-grow textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const isConnected = status === "connected";
  const canSend = isConnected && input.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Header ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 mb-4 flex-shrink-0"
      >
        <ClawOrb pulse={orbPulse} />

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            openclaw
            <span className="text-xs font-normal text-ink-5 bg-surface-3 border border-surface-5 px-2 py-0.5 rounded-full">
              ws://127.0.0.1:18789
            </span>
          </h1>
          <p className="text-xs text-ink-4 mt-0.5">Local AI agent interface</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={status} />

          {/* Reconnect / disconnect button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={isConnected ? disconnect : connect}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
              isConnected
                ? "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                : "border-surface-5 bg-surface-2 text-ink-3 hover:bg-surface-3"
            )}
          >
            {status === "connecting" ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : isConnected ? (
              <WifiOff className="w-3 h-3" />
            ) : (
              <Wifi className="w-3 h-3" />
            )}
            {isConnected ? "Disconnect" : "Connect"}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Chat area ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 relative rounded-2xl border border-surface-4/50 bg-surface-1 overflow-hidden flex flex-col shadow-card"
      >
        {/* 3D depth decorations */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.04) 0%, transparent 70%)" }}
        />

        {/* Messages */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin scrollbar-thumb-surface-4 scrollbar-track-transparent"
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center gap-4 py-12"
            >
              <div className="relative">
                {/* Decorative 3D rings */}
                <motion.div
                  className="absolute -inset-8 rounded-full border border-violet-500/10"
                  animate={{ rotateX: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ transformStyle: "preserve-3d" }}
                />
                <motion.div
                  className="absolute -inset-5 rounded-full border border-violet-500/15"
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  style={{ transformStyle: "preserve-3d" }}
                />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-800/20 border border-violet-500/20 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-violet-400/60" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-ink-3">No messages yet</p>
                <p className="text-xs text-ink-5 max-w-xs">
                  {isConnected
                    ? "Say something to openclaw…"
                    : "Connect to openclaw to start chatting"}
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} />
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex gap-3 items-start"
              >
                <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-indigo-800 border border-violet-500/40 flex items-center justify-center">
                  <Terminal className="w-3 h-3 text-violet-200" />
                </div>
                <div className="bg-surface-3 border border-surface-5 rounded-2xl rounded-tl-sm px-4 py-3">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToBottom()}
              className="absolute bottom-20 right-4 w-8 h-8 rounded-full bg-surface-4 border border-surface-6 flex items-center justify-center text-ink-3 hover:text-white hover:bg-surface-5 transition-all shadow-lg"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Input bar ─────────────────────────────── */}
        <div className="border-t border-surface-4/60 px-4 py-3 bg-surface-1/80 backdrop-blur-sm flex-shrink-0">
          <div className={cn(
            "flex items-end gap-2 rounded-xl border px-3 py-2 transition-all duration-200",
            isConnected
              ? "border-surface-5 bg-surface-2 focus-within:border-violet-500/50 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.08)]"
              : "border-surface-4/40 bg-surface-2/40 opacity-60"
          )}>
            <Zap className="w-4 h-4 text-violet-400/60 flex-shrink-0 mb-1.5" />

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              placeholder={isConnected ? "Message openclaw… (Enter to send, Shift+Enter for newline)" : "Not connected"}
              rows={1}
              className="flex-1 bg-transparent text-white text-sm placeholder-ink-5 resize-none focus:outline-none min-h-[28px] max-h-[160px] py-0.5 leading-relaxed disabled:cursor-not-allowed"
              style={{ height: "28px" }}
            />

            <motion.button
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
              onClick={sendMessage}
              disabled={!canSend}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
                canSend
                  ? "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  : "bg-surface-3 text-ink-5 cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <p className="text-[10px] text-ink-5 mt-1.5 text-center">
            Messages are sent directly over WebSocket — no server relay
          </p>
        </div>
      </motion.div>
    </div>
  );
}
