import { Leaf, Globe, Users, Code2, Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ButtonLink } from "@/components/ui/button-link";

const TECH_STACK = [
  { label: "Next.js 16", desc: "React framework, App Router" },
  { label: "TypeScript", desc: "Strict mode" },
  { label: "Tailwind CSS + shadcn/ui", desc: "Styling & components" },
  { label: "Leaflet / react-leaflet", desc: "Interactive map" },
  { label: "React Hook Form + Zod", desc: "Forms & validation" },
  { label: "NestJS (backend)", desc: "REST API, JWT auth" },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Hero */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-accent" />
        </div>
        <h1 className="heading text-2xl font-bold text-foreground">GreenRanger</h1>
      </div>

      {/* Hackathon badge */}
      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:text-accent dark:bg-accent/10 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
        <Trophy className="w-4 h-4" />
        1 место — Hack4Humanity · 486 участников
      </div>

      <p className="text-muted-foreground leading-relaxed mb-8">
        GreenRanger — это городской сервис для поиска пунктов раздельного сбора отходов
        в Астане. Покажем, где сдать пластик, бумагу, стекло, металл, одежду и электронику —
        рядом с вашим домом, работой или маршрутом.
      </p>

      <Separator className="mb-8" />

      {/* Mission */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-accent" />
          <h2 className="heading text-base font-bold">Миссия</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Сделать переработку доступной для каждого жителя Астаны. Мы собираем
          актуальную информацию о пунктах приёма вторсырья и отображаем её на удобной
          интерактивной карте с фильтрацией по материалам и типу пункта.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { value: "22+", label: "Пунктов на карте" },
          { value: "3", label: "Языка интерфейса" },
          { value: "10", label: "Типов материалов" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="heading text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Separator className="mb-8" />

      {/* Tech stack */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-4 h-4 text-accent" />
          <h2 className="heading text-base font-bold">Технологии</h2>
        </div>
        <div className="space-y-2">
          {TECH_STACK.map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Author */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent" />
          <h2 className="heading text-base font-bold">Автор</h2>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Дипломный проект программы <span className="font-medium text-foreground">Fullstack + AI</span> (Datagroup × TechOrda).
          Проект вырос из хакатонного прототипа, занявшего 1 место на Hack4Humanity среди 486 участников,
          в полноценное production-приложение.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ButtonLink href="/map" className="flex-1">Открыть карту</ButtonLink>
        <ButtonLink href="/submit" variant="outline" className="flex-1">Добавить пункт</ButtonLink>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8">
        GreenRanger v2.0 · Астана, Казахстан · {new Date().getFullYear()}
      </p>
    </div>
  );
}
