import { useTranslation } from "@/i18n/LanguageProvider";
import { LANGS, type Lang } from "@/i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className="inline-flex items-center rounded-full border border-border bg-card p-0.5"
    >
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code as Lang)}
            aria-pressed={active}
            className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span aria-hidden>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
