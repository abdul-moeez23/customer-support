/**
 * AI Customer Support — Embeddable Chat Widget
 *
 * Usage (on any website):
 *   <script src="https://your-platform.com/widget.js"
 *           data-widget-key="YOUR_WIDGET_KEY">
 *   </script>
 *
 * The widget reads `data-widget-key` from itself, fetches the company's
 * branding config from the backend, and renders a fully-styled chat bubble
 * and panel — all scoped under a shadow DOM so it never conflicts with the
 * host site's CSS.
 */

(function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────
  const API_BASE = "http://localhost:8000"; // Override in production via data-api-url

  interface WidgetConfig {
    bot_name: string;
    greeting_message: string;
    placeholder_text: string;
    primary_color: string;
    text_color: string;
    bg_color: string;
    user_bubble_color: string;
    bot_bubble_color: string;
    position: "bottom-right" | "bottom-left";
    show_branding: boolean;
    allow_attachments: boolean;
  }

  interface Message {
    role: "user" | "bot";
    text: string;
    escalated?: boolean;
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────
  const scriptTag = document.currentScript as HTMLScriptElement | null;
  const widgetKey = scriptTag?.getAttribute("data-widget-key") ?? "";
  const apiBase = scriptTag?.getAttribute("data-api-url") ?? API_BASE;

  if (!widgetKey) {
    console.error("[AI Widget] No data-widget-key attribute found on <script> tag.");
    return;
  }

  // ── Fetch config then mount ──────────────────────────────────────────────
  fetch(`${apiBase}/api/public/widget-config/${widgetKey}`)
    .then((r) => r.json())
    .then((config: WidgetConfig) => mountWidget(config, widgetKey, apiBase))
    .catch(() => {
      // Use defaults if backend unreachable
      mountWidget(
        {
          bot_name: "Support Assistant",
          greeting_message: "👋 Hi! How can I help you today?",
          placeholder_text: "Type your message...",
          primary_color: "#2563eb",
          text_color: "#ffffff",
          bg_color: "#ffffff",
          user_bubble_color: "#2563eb",
          bot_bubble_color: "#f3f4f6",
          position: "bottom-right",
          show_branding: true,
          allow_attachments: false,
        },
        widgetKey,
        apiBase
      );
    });

  // ── Mount ────────────────────────────────────────────────────────────────
  function mountWidget(cfg: WidgetConfig, key: string, api: string): void {
    const isLeft = cfg.position === "bottom-left";

    // Host element — sits in the real DOM, shadow inside
    const host = document.createElement("div");
    host.id = "ai-support-widget-host";
    Object.assign(host.style, {
      position: "fixed",
      bottom: "24px",
      [isLeft ? "left" : "right"]: "24px",
      zIndex: "2147483647",
      fontFamily: "system-ui, -apple-system, sans-serif",
    });
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });

    // ── CSS ────────────────────────────────────────────────────────────────
    const style = document.createElement("style");
    style.textContent = buildCSS(cfg);
    shadow.appendChild(style);

    // ── Chat panel ────────────────────────────────────────────────────────
    const panel = document.createElement("div");
    panel.className = "chat-panel hidden";
    panel.innerHTML = buildPanelHTML(cfg);
    shadow.appendChild(panel);

    // ── Bubble button ─────────────────────────────────────────────────────
    const bubble = document.createElement("button");
    bubble.className = "bubble";
    bubble.setAttribute("aria-label", "Open chat");
    bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    shadow.appendChild(bubble);

    // ── State ──────────────────────────────────────────────────────────────
    let isOpen = false;
    let sessionId = localStorage.getItem("ai_widget_session_id");
    if (!sessionId) {
      sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("ai_widget_session_id", sessionId);
    }

    const messages: Message[] = [
      { role: "bot", text: cfg.greeting_message },
    ];

    const messagesEl = panel.querySelector(".messages") as HTMLDivElement;
    const inputEl = panel.querySelector(".chat-input") as HTMLInputElement;
    const sendBtn = panel.querySelector(".send-btn") as HTMLButtonElement;
    const closeBtn = panel.querySelector(".close-btn") as HTMLButtonElement;

    // Render initial greeting
    renderMessages();

    // ── Events ────────────────────────────────────────────────────────────
    bubble.addEventListener("click", () => togglePanel());
    closeBtn.addEventListener("click", () => closePanel());

    sendBtn.addEventListener("click", () => sendMessage());
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // ── Functions ─────────────────────────────────────────────────────────
    function togglePanel(): void {
      isOpen ? closePanel() : openPanel();
    }

    async function fetchHistory(): Promise<void> {
      try {
        const res = await fetch(`${api}/api/public/chat/${key}/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          // Rebuild messages
          messages.length = 0;
          messages.push({ role: "bot", text: cfg.greeting_message });
          
          let lastEscalated = false;
          data.messages.forEach((m: any) => {
            if (m.role === "agent") lastEscalated = false;
            messages.push({ role: m.role, text: m.content });
          });
          
          if (data.status === "escalated") {
             lastEscalated = true;
          }
          
          renderMessages();
          if (lastEscalated) {
            showEscalationBanner();
          } else {
            hideEscalationBanner();
          }
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    }

    let pollInterval: any;

    function openPanel(): void {
      isOpen = true;
      panel.classList.remove("hidden");
      panel.classList.add("visible");
      bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      inputEl.focus();
      
      // Load history and start polling
      fetchHistory();
      if (!pollInterval) {
        pollInterval = setInterval(fetchHistory, 5000);
      }
      
      scrollToBottom();
    }

    function closePanel(): void {
      isOpen = false;
      panel.classList.remove("visible");
      panel.classList.add("hidden");
      bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }

    async function sendMessage(): Promise<void> {
      const text = inputEl.value.trim();
      if (!text) return;

      inputEl.value = "";
      messages.push({ role: "user", text });
      renderMessages();

      // Show typing indicator
      const typingId = showTyping();

      try {
        const res = await fetch(`${api}/api/public/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widget_key: key, message: text, session_id: sessionId }),
        });

        const data = await res.json();
        removeTyping(typingId);

        const answer: string = res.ok
          ? data.answer
          : "Sorry, I ran into an error. Please try again.";

        const escalated: boolean = res.ok ? data.escalated : false;
        messages.push({ role: "bot", text: answer, escalated });
        renderMessages();

        if (escalated) {
          showEscalationBanner();
        }
      } catch {
        removeTyping(typingId);
        messages.push({
          role: "bot",
          text: "Connection error. Please check your internet and try again.",
        });
        renderMessages();
      }
    }

    function renderMessages(): void {
      messagesEl.innerHTML = messages
        .map((m) => {
          const isUser = m.role === "user";
          const isAgent = m.role === "agent";
          const bubbleClass = isUser ? "msg-user" : isAgent ? "msg-agent" : "msg-bot";
          const escalatedTag = m.escalated
            ? `<div class="escalated-tag">🔄 Transferred to human agent</div>`
            : "";
          return `
            <div class="msg-row ${isUser ? "msg-row--user" : ""}">
              <div class="msg-label">${isUser ? "" : isAgent ? "Agent" : ""}</div>
              <div class="${bubbleClass}">${escapeHtml(m.text)}</div>
              ${escalatedTag}
            </div>`;
        })
        .join("");
      scrollToBottom();
    }

    function showTyping(): string {
      const id = `typing-${Date.now()}`;
      const el = document.createElement("div");
      el.id = id;
      el.className = "msg-row";
      el.innerHTML = `<div class="msg-bot typing-indicator"><span></span><span></span><span></span></div>`;
      messagesEl.appendChild(el);
      scrollToBottom();
      return id;
    }

    function removeTyping(id: string): void {
      const el = messagesEl.querySelector(`#${id}`);
      if (el) el.remove();
    }

    function scrollToBottom(): void {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showEscalationBanner(): void {
      const existing = panel.querySelector(".escalation-banner");
      if (existing) return;
      const banner = document.createElement("div");
      banner.className = "escalation-banner";
      banner.textContent = "A human agent will respond shortly.";
      messagesEl.parentElement?.appendChild(banner);
    }
    
    function hideEscalationBanner(): void {
      const existing = panel.querySelector(".escalation-banner");
      if (existing) existing.remove();
    }
  }

  // ── HTML template ────────────────────────────────────────────────────────
  function buildPanelHTML(cfg: WidgetConfig): string {
    return `
      <div class="panel-header">
        <div class="header-info">
          <div class="avatar">${cfg.bot_name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="bot-name">${escapeHtml(cfg.bot_name)}</div>
            <div class="status-dot"><span class="dot"></span> Online</div>
          </div>
        </div>
        <button class="close-btn" aria-label="Close chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="messages"></div>
      <div class="input-area">
        <input class="chat-input" type="text" placeholder="${escapeHtml(cfg.placeholder_text)}" autocomplete="off" />
        <button class="send-btn" aria-label="Send message">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
      ${cfg.show_branding ? `<div class="branding">Powered by AI Support</div>` : ""}
    `;
  }

  // ── CSS template (uses company colors) ───────────────────────────────────
  function buildCSS(cfg: WidgetConfig): string {
    const p = cfg.primary_color;
    const t = cfg.text_color;
    const bg = cfg.bg_color;
    const userBubble = cfg.user_bubble_color;
    const botBubble = cfg.bot_bubble_color;

    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }

      .bubble {
        width: 60px; height: 60px; border-radius: 50%;
        background: ${p}; color: ${t};
        border: none; cursor: pointer; display: flex;
        align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.28); }
      .bubble:active { transform: scale(0.96); }

      .chat-panel {
        position: absolute; bottom: 76px;
        ${cfg.position === "bottom-left" ? "left: 0" : "right: 0"};
        width: 360px; height: 520px;
        background: ${bg}; border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        display: flex; flex-direction: column;
        overflow: hidden;
        transform-origin: ${cfg.position === "bottom-left" ? "bottom left" : "bottom right"};
        transition: opacity 0.2s, transform 0.2s;
      }
      .chat-panel.hidden { opacity: 0; transform: scale(0.92) translateY(8px); pointer-events: none; }
      .chat-panel.visible { opacity: 1; transform: scale(1) translateY(0); pointer-events: all; }

      .panel-header {
        background: ${p}; color: ${t};
        padding: 16px 18px; display: flex;
        align-items: center; justify-content: space-between;
        flex-shrink: 0;
      }
      .header-info { display: flex; align-items: center; gap: 12px; }
      .avatar {
        width: 38px; height: 38px; border-radius: 50%;
        background: rgba(255,255,255,0.25);
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 15px;
      }
      .bot-name { font-weight: 700; font-size: 15px; }
      .status-dot { display: flex; align-items: center; gap: 5px; font-size: 12px; opacity: 0.85; margin-top: 2px; }
      .dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block; }
      .close-btn {
        background: transparent; border: none; cursor: pointer;
        color: ${t}; opacity: 0.8; padding: 4px;
        display: flex; align-items: center;
      }
      .close-btn:hover { opacity: 1; }

      .messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 10px;
        background: ${bg};
      }
      .messages::-webkit-scrollbar { width: 4px; }
      .messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

      .msg-row { display: flex; flex-direction: column; align-items: flex-start; }
      .msg-row--user { align-items: flex-end; }

      .msg-bot, .msg-user, .msg-agent {
        max-width: 80%; padding: 10px 14px;
        border-radius: 16px; font-size: 14px; line-height: 1.5;
        white-space: pre-wrap; word-break: break-word;
      }
      .msg-bot {
        background: ${botBubble}; color: #1f2937;
        border-bottom-left-radius: 4px;
      }
      .msg-agent {
        background: #fef08a; color: #854d0e;
        border-bottom-left-radius: 4px;
        border: 1px solid #fde047;
      }
      .msg-user {
        background: ${userBubble}; color: ${t};
        border-bottom-right-radius: 4px;
      }
      .msg-label {
        font-size: 10px; color: #6b7280; font-weight: 600; margin-bottom: 2px;
        text-transform: uppercase; letter-spacing: 0.5px;
      }

      .escalated-tag {
        font-size: 11px; color: #6b7280; margin-top: 4px;
        padding: 4px 8px; background: #f9fafb;
        border-radius: 6px; border: 1px solid #e5e7eb;
      }

      /* Typing indicator */
      .typing-indicator { display: flex; align-items: center; gap: 4px; padding: 12px 14px; }
      .typing-indicator span {
        width: 7px; height: 7px; border-radius: 50%;
        background: #9ca3af; animation: bounce 1.2s infinite;
      }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-6px); }
      }

      .input-area {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 14px; border-top: 1px solid #e5e7eb;
        background: ${bg}; flex-shrink: 0;
      }
      .chat-input {
        flex: 1; border: 1px solid #e5e7eb; border-radius: 20px;
        padding: 9px 16px; font-size: 14px; outline: none;
        background: #f9fafb; color: #111827;
        transition: border-color 0.15s;
      }
      .chat-input:focus { border-color: ${p}; background: #fff; }
      .send-btn {
        width: 38px; height: 38px; border-radius: 50%;
        background: ${p}; color: ${t};
        border: none; cursor: pointer; display: flex;
        align-items: center; justify-content: center;
        flex-shrink: 0; transition: opacity 0.15s;
      }
      .send-btn:hover { opacity: 0.85; }

      .escalation-banner {
        margin: 0 14px 10px; padding: 10px 14px;
        background: #fef3c7; border: 1px solid #fcd34d;
        border-radius: 8px; font-size: 13px; color: #92400e;
        text-align: center;
      }

      .branding {
        text-align: center; font-size: 11px; color: #9ca3af;
        padding: 6px 0 10px; flex-shrink: 0; background: ${bg};
      }
    `;
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
