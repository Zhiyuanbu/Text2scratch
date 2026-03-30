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
  { title: "1. Agreement to Terms", body: "By accessing text2scratch, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you are prohibited from using this service." },
  { title: "2. Use License", body: "Permission is granted to use the text2scratch authoring engine for personal and non-commercial projects. This is the grant of a license, not a transfer of title, and under this license you may not use the materials for any commercial purpose without explicit authorization." },
  { title: "3. User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We reserve the right to terminate accounts that violate our safety guidelines." },
  { title: "4. Disclaimer", body: "The materials on text2scratch are provided 'as is'. text2scratch makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose." },
  { title: "5. Limitations", body: "In no event shall text2scratch or its suppliers be liable for any damages arising out of the use or inability to use the materials on the service." }
];

const privacySections = [
  { title: "1. Information Collection", body: "We collect minimal information necessary to provide cloud services: your email address, username, and encrypted password. When using the authoring engine locally, no data is transmitted to our servers." },
  { title: "2. Data Usage", body: "Your data is used exclusively for account authentication and project synchronization. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties." },
  { title: "3. Project Privacy", body: "Projects saved to our cloud registry are private by default. If you choose to publish a project to the Community Forum, it becomes public and accessible to all users of the authoring protocol." },
  { title: "4. Cookies & Local Storage", body: "We use local storage to maintain your session, theme preferences, and compiler state. These are required for the functional operation of the application." },
  { title: "5. Data Security", body: "We implement a variety of security measures to maintain the safety of your personal information, leveraging industry-standard encryption provided by the Supabase infrastructure." }
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
