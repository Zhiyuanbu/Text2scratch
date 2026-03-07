import { FileCheck2, Scale, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "../components/AppShell";

const licenseText = `Text2Scratch Non-Commercial Attribution License 1.1

Copyright (c) 2026 text2scratch contributors

Permission is granted to use, copy, modify, and redistribute this software and
associated files (the "Software") for personal, educational, research, and
other non-commercial purposes, subject to the conditions below.

1. Attribution Required
Any public use, distribution, deployment, or derivative work must include clear
and visible credit to text2scratch.
Minimum attribution should include:
- Project name: "text2scratch"
- A link to the source repository when practical
- A note if changes were made

2. Non-Commercial Use Only
Commercial use is not allowed without prior written permission from the
copyright holder(s).
Commercial use includes, but is not limited to:
- Selling the Software or derivative works
- Using the Software in paid products, paid features, or paid services
- Using the Software primarily to generate direct revenue

3. Redistribution Conditions
If you redistribute the Software or derivative works, you must keep this
license text and existing copyright notices.

4. No Trademark License
This license does not grant rights to any name, logo, or trademark of
text2scratch contributors.

5. No Warranty
The Software is provided "as is", without warranty of any kind.

6. Limitation of Liability
In no event shall the authors or copyright holders be liable for damages
arising from the use of the Software.`;

const termsSections = [
  {
    title: "1. Scope",
    body: "text2scratch is provided as a browser-based tool for converting text commands into Scratch projects. These terms apply to your use of the hosted site and related cloud features."
  },
  {
    title: "2. License and attribution",
    body: "Your use of the software itself is governed by the project license. If you redistribute the project or public derivatives, visible attribution to text2scratch is required."
  },
  {
    title: "3. Acceptable use",
    body: "You may not use the site or shared project features for unlawful activity, abuse, harassment, malware distribution, or deceptive behavior."
  },
  {
    title: "4. Accounts and shared links",
    body: "If you create an account, you are responsible for activity performed through that account. Shared project links are intended for review and collaboration, not for illegal or abusive content."
  },
  {
    title: "5. No warranty",
    body: "The site and software are provided as is, without warranties of any kind. Use the tool with appropriate backups and review generated output before publishing or teaching from it."
  },
  {
    title: "6. Liability",
    body: "To the maximum extent permitted by law, the authors and contributors are not liable for damages arising from your use of the site or software."
  },
  {
    title: "7. Conflicts",
    body: "If these terms conflict with the project license regarding software permissions, the license text controls those permissions."
  }
];

export function TermsPage() {
  return (
    <LegalLayout
      page="terms"
      sectionId="terms"
      badge="Terms of service"
      title="Terms that govern the hosted site and shared project features."
      description="Last updated: February 19, 2026. These terms clarify acceptable use, attribution expectations, and how the hosted experience relates to the underlying project license."
      sideIcon={<Scale className="h-5 w-5" />}
      sideTitle="Read this when"
      sideBody="You are using hosted accounts, publishing shared links, or redistributing a public derivative of the project."
    >
      <div className="grid gap-4">
        {termsSections.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.75rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
          </article>
        ))}
      </div>
    </LegalLayout>
  );
}

export function LicensePage() {
  return (
    <LegalLayout
      page="license"
      sectionId="license"
      badge="Project license"
      title="Non-commercial attribution terms for using and redistributing text2scratch."
      description="This summary is informational only. The full license text controls the actual permissions and restrictions."
      sideIcon={<FileCheck2 className="h-5 w-5" />}
      sideTitle="Quick summary"
      sideBody="Non-commercial use, modification, and redistribution are allowed with visible attribution to text2scratch. Commercial use requires prior written permission."
    >
      <div className="grid gap-6">
        <article className="rounded-[1.75rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Summary</p>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Non-commercial use, modification, and redistribution are allowed with clear visible attribution to text2scratch. Commercial use requires prior written permission.
          </p>
        </article>

        <article className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-900">
          <div className="border-b border-white/10 px-5 py-4 text-sm font-medium text-white/70">Full license text</div>
          <pre className="overflow-x-auto px-5 py-6 text-sm leading-7 text-slate-100">
            <code>{licenseText}</code>
          </pre>
        </article>
      </div>
    </LegalLayout>
  );
}

function LegalLayout({
  page,
  sectionId,
  badge,
  title,
  description,
  sideIcon,
  sideTitle,
  sideBody,
  children
}: {
  page: "terms" | "license";
  sectionId: string;
  badge: string;
  title: string;
  description: string;
  sideIcon: ReactNode;
  sideTitle: string;
  sideBody: string;
  children: ReactNode;
}) {
  return (
    <AppShell page={page}>
      <section id={sectionId} className="hero-glow border-b border-black/5 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <ScrollText className="h-3.5 w-3.5" />
              {badge}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
              {sideIcon}
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{sideTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{sideBody}</p>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16">{children}</section>
    </AppShell>
  );
}
