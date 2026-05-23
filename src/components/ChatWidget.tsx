import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Leaf } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageBubble, TypingDots, type ChatMessage } from "@/components/chat/MessageBubble";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { useTranslation } from "@/i18n/LanguageProvider";

const SESSION_KEY = "eReturn.chatSession";
const WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL as string | undefined;

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function ChatWidget() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending, open]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || pending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setPending(true);

    try {
      if (!WEBHOOK_URL) {
        throw new Error("Chat webhook is not configured (VITE_N8N_CHAT_WEBHOOK_URL).");
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      const resp = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          userId,
          message: text,
          history: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) throw new Error(`Webhook returned ${resp.status}`);

      const raw = await resp.text();
      let reply = "";
      try {
        const json = JSON.parse(raw);
        reply =
          json.reply ??
          json.output ??
          json.message ??
          json.text ??
          (typeof json === "string" ? json : JSON.stringify(json));
      } catch {
        reply = raw;
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply || "…" },
      ]);
    } catch (err) {
      console.error("[ChatWidget]", err);
      toast.error("Asistentul nu răspunde, încearcă din nou.");
      // Roll back user message so they can retry
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(text);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl ${
            isMobile
              ? "inset-0 rounded-none"
              : "bottom-5 right-5 h-[560px] w-[380px] rounded-2xl"
          }`}
          role="dialog"
          aria-label="AI assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-br from-primary to-primary/80 px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15">
                <Leaf className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Asistent e-Return</p>
                <p className="text-[11px] text-primary-foreground/80">Powered by AI</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-primary-foreground/80 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground">
                  Salut! Te ajut să reciclezi corect și să găsești cea mai bună ofertă pentru
                  DEEE-ul tău. Ce vrei să afli?
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {pending && <TypingDots />}
          </div>

          {/* Composer */}
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => send()}
            disabled={pending}
            pending={pending}
          />
        </div>
      )}
    </>
  );
}
