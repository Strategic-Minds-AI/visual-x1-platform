import React from "react";
import { Eye, Globe, Users, Shield, Link2 } from "lucide-react";
import SimulatorResults from "@/components/editor/SimulatorResults";
import PromptChainBuilder from "@/components/editor/PromptChainBuilder";
import BrowserPanel from "@/components/editor/BrowserPanel";
import MultiAgentPanel from "@/components/editor/MultiAgentPanel";

const TABS = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "browser", label: "Browser", icon: Globe },
  { id: "agents", label: "Multi-Agent", icon: Users },
  { id: "simulator", label: "Simulator", icon: Shield },
  { id: "chain", label: "Chain", icon: Link2 }
];

export default function EditorOutputPanel({ engine, activeTab, setActiveTab, onSendToChat }) {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border flex shrink-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 bg-muted/20">
        {activeTab === "preview" && (
          <div className="h-full">
            {engine.previewHtml ? (
              <iframe srcDoc={engine.previewHtml} className="w-full h-full border-0 bg-card" sandbox="allow-scripts" title="Preview" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Eye className="w-10 h-10 opacity-30" />
                <p className="text-sm">Render a prompt to see the artifact here</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "browser" && <BrowserPanel onSendToChat={onSendToChat} />}
        {activeTab === "agents" && <MultiAgentPanel onSendToChat={onSendToChat} />}
        {activeTab === "simulator" && <SimulatorResults result={engine.simulatorResult} onUseEnhanced={engine.useEnhanced} />}
        {activeTab === "chain" && (
          <PromptChainBuilder
            chain={engine.chain}
            setChain={engine.setChain}
            onExecute={engine.handleExecuteChain}
            executing={engine.loading.chain}
            executionResult={engine.chainResult}
          />
        )}
      </div>
    </div>
  );
}