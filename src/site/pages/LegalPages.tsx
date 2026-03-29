import { FileCheck2, Scale, ScrollText, ShieldCheck, Info } from "lucide-react";
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

2. Non-Commercial Use Only
Commercial use is not allowed without prior written permission.

3. Redistribution Conditions
Redistributions must keep this license text and existing copyright notices.

4. No Warranty
The Software is provided "as is", without warranty of any kind.`;

const termsSections = [
  { title: "1. Scope", body: "text2scratch is a browser-based conversion tool. These terms apply to the hosted site and cloud features." },
  { title: "2. License", body: "Software use is governed by the project license. Visible attribution is required for redistributions." },
  { title: "3. Acceptable Use", body: "Illegal activity, abuse, and deceptive behavior are strictly prohibited." },
  { title: "4. Responsibility", body: "Account owners are responsible for all activity performed through their credentials." }
];

const privacySections = [
  { title: "1. Local Processing", body: "Project conversion happens in the browser. Local use does not require data transmission to our servers." },
  { title: "2. Cloud Storage", body: "Public projects and metadata are stored in Supabase only when intentionally saved by the user." },
  { title: "3. Third Parties", body: "We load core libraries from CDNs (JSZip, Monaco, Supabase). They process standard browser metadata." }
];

export function PrivacyPage() {
  return (
    <LegalLayout page="privacy" badge="Privacy_Protocol" title="Data Handling Specifications" description="Official disclosure of local processing and hosted storage behavior.">
      <div className="space-y-4">
        {privacySections.map(s => <DocSection key={s.title} title={s.title} body={s.body} />)}
      </div>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout page="terms" badge="Terms_of_Service" title="Usage Framework" description="Standard rules governing access to the authoring network and shared nodes.">
      <div className="space-y-4">
        {termsSections.map(s => <DocSection key={s.title} title={s.title} body={s.body} />)}
      </div>
    </LegalLayout>
  );
}

export function LicensePage() {
  return (
    <LegalLayout page="license" badge="Project_License" title="Distribution Rights" description="Non-commercial attribution requirements for use and redistribution.">
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-[#0d1117] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-800">
            <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">LICENSE.md</span>
          </div>
          <pre className="p-6 text-[0.8rem] font-mono text-slate-300 overflow-x-auto leading-relaxed">
            <code>{licenseText}</code>
          </pre>
        </div>
      </div>
    </LegalLayout>
  );
}

function LegalLayout({ page, badge, title, description, children }: { page: any, badge: string, title: string, description: string, children: ReactNode }) {
  return (
    <AppShell page={page}>
      <div className="bg-[#f6f8fa] dark:bg-[#0d1117] animate-in fade-in duration-500">
        <section className="border-b border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-[#161b22]">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck size={18} />
                  <span className="text-[0.7rem] font-bold uppercase tracking-widest">{badge}</span>
                </div>
                <h1 className="text-3xl font-black tracking-tighter">{title}</h1>
                <p className="max-w-xl text-[0.9rem] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
              </div>
              <div className="hidden lg:block">
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1117]">
                  <h3 className="text-[0.65rem] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                    <Info size={12} /> Compliance
                  </h3>
                  <p className="text-[0.7rem] text-slate-500 leading-relaxed font-medium">
                    This document defines the interface between users and the authoring protocol.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="max-w-3xl">
            {children}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DocSection({ title, body }: { title: string, body: string }) {
  return (
    <div className="p-5 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22] shadow-sm">
      <h3 className="text-[0.9rem] font-bold mb-2">{title}</h3>
      <p className="text-[0.85rem] text-slate-600 dark:text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}
