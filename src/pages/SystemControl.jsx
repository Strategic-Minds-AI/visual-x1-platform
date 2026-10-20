import React from "react";
import { ChevronLeft, Cpu, Sparkles, Code, Activity, Radio, Brain, Shield, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GuardianPanel from "@/components/system/GuardianPanel";
import QAPanel from "@/components/system/QAPanel";
import CommunicationBus from "@/components/system/CommunicationBus";
import MemoryPanel from "@/components/system/MemoryPanel";
import AgentRoster from "@/components/system/AgentRoster";
import SecretsVault from "@/components/system/SecretsVault";
import QARefinementPanel from "@/components/system/QARefinementPanel";

export default function SystemControl() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Cpu className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-semibold leading-none">Visual X — System Control</h1>
                <p className="text-xs text-muted-foreground">Autonomous quality operating system</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs ml-2">Self-Operational</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/prompt-lab"><Button variant="ghost" size="sm"><Sparkles className="w-4 h-4 mr-1.5" /> Prompt Lab</Button></Link>
            <Link to="/visual-editor"><Button variant="ghost" size="sm"><Code className="w-4 h-4 mr-1.5" /> Visual Editor</Button></Link>
            <Link to="/agent-activity"><Button variant="ghost" size="sm"><Activity className="w-4 h-4 mr-1.5" /> Activity</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Agent Roster + Memory */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AgentRoster />
          <MemoryPanel />
        </div>

        {/* Guardian + QA */}
        <div className="grid gap-6 lg:grid-cols-2">
          <GuardianPanel />
          <QAPanel />
        </div>

        {/* Secrets Vault + QA Feedback Loop */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SecretsVault />
          <QARefinementPanel />
        </div>

        {/* Communication Bus — full width */}
        <CommunicationBus />

        {/* System convergence summary */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold mb-3">System Convergence</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <Shield className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <div className="font-medium">Guardian</div>
                <div className="text-xs text-muted-foreground">Security + secrets + auto-fix</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <ClipboardCheck className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <div className="font-medium">QA Agent</div>
                <div className="text-xs text-muted-foreground">Quality enforcement + gaps</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <Radio className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <div className="font-medium">Comm Bus</div>
                <div className="text-xs text-muted-foreground">Inter-agent + GPT bridge</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <Brain className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <div className="font-medium">Memory</div>
                <div className="text-xs text-muted-foreground">Persistent across sessions</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}