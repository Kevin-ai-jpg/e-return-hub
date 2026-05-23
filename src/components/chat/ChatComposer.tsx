import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useRef, useEffect } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { ParsedChatImage } from "@/lib/chatImage";

export function ChatComposer({
  value,
  onChange,
  onSend,
  onImageSelect,
  pendingImage,
  onClearImage,
  disabled,
  pending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onImageSelect: (file: File) => void;
  pendingImage: ParsedChatImage | null;
  onClearImage: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = Boolean(value.trim() || pendingImage);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && canSend) onSend();
      }}
      className="border-t border-border bg-card p-3"
    >
      {pendingImage && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border border-border bg-background p-2">
          <img
            src={pendingImage.previewUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-xs font-medium text-foreground">{pendingImage.fileName}</p>
            <p className="text-[11px] text-muted-foreground">{t("chat.photoAttached")}</p>
          </div>
          <button
            type="button"
            onClick={onClearImage}
            disabled={pending}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
            aria-label={t("chat.removePhoto")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageSelect(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending || disabled}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-foreground transition hover:bg-secondary disabled:opacity-50"
          aria-label={t("chat.addPhoto")}
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && canSend) onSend();
            }
          }}
          rows={1}
          placeholder={t("chat.placeholder")}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={pending}
        />
        <button
          type="submit"
          disabled={disabled || !canSend}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          aria-label={t("chat.send")}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
