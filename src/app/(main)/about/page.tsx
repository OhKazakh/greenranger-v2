"use client";

import { Mail, Phone, Recycle, Code2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { useLang } from "@/context/LangContext";

export default function AboutPage() {
  const { t } = useLang();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-12">

      {/* Identity */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--forest)" }}
            >
              <Recycle className="w-5 h-5" style={{ color: "var(--teal)" }} />
            </div>
            <h1 className="heading text-2xl font-bold leading-tight">GreenRanger</h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono text-right shrink-0">
            Astana, Kazakhstan
          </p>
        </div>

        <p className="text-[16px] leading-relaxed text-muted-foreground max-w-[56ch]">
          {t("about.serviceDesc")}
        </p>
      </section>

      <div className="border-t border-border" />

      {/* Personal story */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-6">
          {t("about.storyLabel")}
        </p>
        <div className="space-y-4 max-w-[60ch]">
          <p className="text-[15px] leading-relaxed text-foreground">
            {t("about.story1")}
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {t("about.story2")}
          </p>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Contact */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-6">
          {t("about.contactLabel")}
        </p>

        <div className="flex flex-col gap-1 mb-6">
          <p className="heading text-[22px] font-bold text-foreground">Danial Baluanov</p>
          <p className="text-sm text-muted-foreground">{t("about.role")}</p>
        </div>

        <div className="space-y-3">
          <a href="tel:+77072883881" className="flex items-center gap-3 group w-fit">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--teal-soft)" }}
            >
              <Phone className="w-4 h-4" style={{ color: "var(--teal)" }} />
            </div>
            <span className="font-mono text-[14px] text-foreground group-hover:text-accent transition-colors">
              +7 707 288 38 81
            </span>
          </a>

          <a href="mailto:danbaluanov@gmail.com" className="flex items-center gap-3 group w-fit">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--teal-soft)" }}
            >
              <Mail className="w-4 h-4" style={{ color: "var(--teal)" }} />
            </div>
            <span className="font-mono text-[14px] text-foreground group-hover:text-accent transition-colors">
              danbaluanov@gmail.com
            </span>
          </a>

          <a
            href="https://github.com/OhKazakh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group w-fit"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--teal-soft)" }}
            >
              <Code2 className="w-4 h-4" style={{ color: "var(--teal)" }} />
            </div>
            <span className="font-mono text-[14px] text-foreground group-hover:text-accent transition-colors">
              github.com/OhKazakh
            </span>
          </a>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ButtonLink href="/map" className="flex-1 justify-center">
          {t("about.openMap")}
        </ButtonLink>
        <ButtonLink href="/submit" variant="outline" className="flex-1 justify-center">
          {t("about.addPoint")}
        </ButtonLink>
      </div>

      <p className="text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} Danial Baluanov · GreenRanger
      </p>

    </div>
  );
}
