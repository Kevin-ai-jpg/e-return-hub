import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Leaf } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageBubble, TypingDots, type ChatMessage } from "@/components/chat/MessageBubble";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { useTranslation } from "@/i18n/LanguageProvider";
import { readChatImageFile, type ParsedChatImage } from "@/lib/chatImage";

const SESSION_KEY = "eReturn.chatSession";
const CHAT_API_URL = (
  import.meta.env.VITE_CHAT_API_URL ?? import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL
) as string | undefined;

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
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<ParsedChatImage | null>(null);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suggestions = [t("chat.suggest1"), t("chat.suggest2"), t("chat.suggest3")];

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending, open, pendingImage]);

  const handleImageSelect = async (file: File) => {
    try {
      const parsed = await readChatImageFile(file);
      setPendingImage(parsed);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "INVALID_TYPE") toast.error(t("chat.invalidImage"));
      else if (code === "TOO_LARGE") toast.error(t("chat.imageTooLarge"));
      else toast.error(t("chat.error"));
    }
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    const image = pendingImage;
    if ((!text && !image) || pending) return;

    const displayText = text || t("chat.imageDefaultPrompt");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayText,
      imagePreviewUrl: image?.previewUrl,
    };
    const priorMessages = messages;
    setMessages([...priorMessages, userMsg]);
    setInput("");
    setPendingImage(null);
    setPending(true);

    try {
      if (!CHAT_API_URL) {
        throw new Error("Chat API is not configured (set VITE_CHAT_API_URL in .env).");
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      const payload: Record<string, unknown> = {
        sessionId: getSessionId(),
        userId,
        chat_history: priorMessages.map((m) => ({ role: m.role, content: m.content })),
        fresh_text: displayText,
      };
      if (image) {
        payload.fresh_image_base64 = image.base64;
        payload.media_type = image.mediaType;
      }

      const resp = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        let errMsg = `Chat API returned ${resp.status}`;
        try {
          const errJson = JSON.parse(errBody);
          if (errJson.error) errMsg = errJson.error;
        } catch {
          if (errBody) errMsg = errBody;
        }
        throw new Error(errMsg);
      }

      const json = JSON.parse(await resp.text()) as Record<string, unknown>;
      if (json.error) throw new Error(String(json.error));
      const reply =
        (json.response as string | undefined) ??
        (json.reply as string | undefined) ??
        (json.output as string | undefined) ??
        (json.message as string | undefined) ??
        (json.text as string | undefined) ??
        JSON.stringify(json);

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply || "…" },
      ]);
    } catch (err) {
      console.error("[ChatWidget]", err);
      toast.error(t("chat.error"));
      setMessages(priorMessages);
      setInput(text);
      if (image) setPendingImage(image);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={t("chat.open")}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30" />
        </button>
      )}

      {open && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl ${
            isMobile
              ? "inset-0 rounded-none"
              : "bottom-5 right-5 h-[560px] w-[380px] rounded-2xl"
          }`}
          role="dialog"
          aria-label={t("chat.title")}
        >
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-br from-primary to-primary/80 px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15">
                <Leaf className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{t("chat.title")}</p>
                <p className="text-[11px] text-primary-foreground/80">{t("chat.poweredBy")}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-primary-foreground/80 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label={t("chat.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground">
                  {t("chat.welcome")}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
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

          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => send()}
            onImageSelect={handleImageSelect}
            pendingImage={pendingImage}
            onClearImage={() => setPendingImage(null)}
            disabled={pending}
            pending={pending}
          />
        </div>
      )}
    </>
  );
}
