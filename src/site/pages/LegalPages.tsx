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
    title: "5. Children under 13",
    body: "Users under 13 may only use hosted account features through a parent- or guardian-managed flow. A parent or guardian should create and use a separate parent account first, then review and continue any child-account request before a child account is used."
  },
  {
    title: "6. Parent-managed account controls",
    body: "If you act as a parent or guardian, you agree to use your own parent account to review child-account requests, review the privacy policy, manage verification and password reset emails, supervise account use, and use the dashboard or account deletion tools when you need to review or remove hosted data."
  },
  {
    title: "7. No warranty",
    body: "The site and software are provided as is, without warranties of any kind. Use the tool with appropriate backups and review generated output before publishing or teaching from it."
  },
  {
    title: "8. Liability",
    body: "To the maximum extent permitted by law, the authors and contributors are not liable for damages arising from your use of the site or software."
  },
  {
    title: "9. Conflicts",
    body: "If these terms conflict with the project license regarding software permissions, the license text controls those permissions."
  }
];

const privacySections = [
  {
    title: "1. Local processing by default",
    body: "text2scratch converts text and Scratch project data in your browser. Local imports, edits, and exports do not require a cloud account."
  },
  {
    title: "2. Accounts and cloud storage",
    body: "If you sign in and choose to save a project, project text and related metadata are stored in Supabase under your account. Public visibility only changes when you explicitly create a share link."
  },
  {
    title: "3. Children under 13 and parent-managed accounts",
    body: "Hosted account features for users under 13 are intended to be used only through a parent- or guardian-managed flow. A child can start a request, but a parent or guardian must create their own account and review the child-account request before the child uses hosted login, save, or sharing features."
  },
  {
    title: "4. Parent handoff step on this device",
    body: "If a child starts the under-13 signup flow before a parent takes over, the requested child username and parent email are stored locally in this browser so the parent can review the request on the same device. That local handoff can be cleared before any child account is created."
  },
  {
    title: "5. Data used for parent and child accounts",
    body: "Parent accounts store the parent email, parent username, and hosted project data. If a parent creates a separate child account, the child account stores its approved username, sign-in email, project data, and metadata that marks the account as parent-managed."
  },
  {
    title: "6. Parent rights and controls",
    body: "The parent or guardian who created or supervises a child account can sign in to the parent account, review the child-account request on the device, send recovery emails, review linked policy pages, and delete the hosted account through the dashboard."
  },
  {
    title: "7. Downloads",
    body: "Generated .sb3 and .t2sh files are created in-browser and downloaded directly to your device."
  },
  {
    title: "8. Third-party services",
    body: "The site loads JSZip, Monaco Editor, Supabase, Font Awesome, and Datadog Browser RUM from third-party CDNs. These services may process standard browser and performance metadata according to their own policies."
  },
  {
    title: "9. Shared links",
    body: "Shared links expose the saved project you intentionally publish. Treat share links as public content and avoid publishing sensitive data in project text."
  },
  {
    title: "10. Hosting logs",
    body: "If the site is hosted on GitHub Pages or another provider, that host may collect standard HTTP logs such as IP address, timestamps, and user agent strings."
  },
  {
    title: "11. Related terms and child-account rules",
    body: "Read the terms page together with this privacy policy if you are creating, supervising, or deleting an under-13 account. The terms page contains the matching child-account and parent-account rules for hosted features."
  }
];

export function PrivacyPage() {
  return (
    <LegalLayout
      page="privacy"
      sectionId="privacy"
      badge="Privacy policy"
      title="Privacy details for hosted accounts, local browser use, and parent-managed child flows."
      description="Last updated: March 9, 2026. This page explains what happens locally in the browser, what is stored when you use cloud features, how separate parent accounts and child-account requests work, and which third-party services are involved."
      sideIcon={<ScrollText className="h-5 w-5" />}
      sideTitle="Read this when"
      sideBody="You are using hosted accounts, reviewing child-account requests, or checking what data is stored locally in the browser versus in hosted cloud features."
    >
      <div className="grid gap-4">
        {privacySections.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.75rem] border border-black/10 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
          </article>
        ))}

        <article className="rounded-[1.75rem] border border-sky-200 bg-sky-50/90 p-6 shadow-[0_16px_40px_rgba(14,165,233,0.08)] dark:border-sky-500/30 dark:bg-sky-500/10">
          <h2 className="text-2xl font-semibold tracking-tight text-sky-950 dark:text-sky-100">Related terms</h2>
          <p className="mt-3 text-sm leading-7 text-sky-900 dark:text-sky-100">
            The hosted child-account and parent-account rules also appear on <a href="terms.html#terms" className="font-semibold underline decoration-sky-400/70 underline-offset-4">the terms page</a>.
          </p>
        </article>
      </div>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      page="terms"
      sectionId="terms"
      badge="Terms of service"
      title="Terms that govern the hosted site and shared project features."
      description="Last updated: March 9, 2026. These terms clarify acceptable use, attribution expectations, child-account rules, and how the hosted experience relates to the underlying project license."
      sideIcon={<Scale className="h-5 w-5" />}
      sideTitle="Read this when"
      sideBody="You are using hosted accounts, publishing shared links, creating a parent account or child account flow, or redistributing a public derivative of the project."
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
  page: "terms" | "license" | "privacy";
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
