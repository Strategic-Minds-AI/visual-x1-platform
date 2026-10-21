import React, { useState } from "react";
import {BookOpen,ExternalLink,LayoutTemplate,Monitor,Smartphone,Tablet,ShieldCheck} from "lucide-react";
import {Button} from "@/components/ui/button";

// The exact X1 preview SHA is pinned; release promotion is a separate guarded process.
const X1_PREVIEW="https://x1-operating-system-8h398mh99-strategic-minds-advisory.vercel.app";
const ACADEMY="https://universal-factory-academy.vercel.app";
const CATEGORIES=[
 {id:"all",name:"40 master templates",query:""},
 {id:"epoxy",name:"Epoxy & decorative concrete",query:"?academy=epoxy&template=split-left"},
 {id:"legal",name:"Personal injury & legal",query:"?academy=legal&template=centered"},
 {id:"real-estate",name:"Real estate & investors",query:"?academy=real-estate&template=gallery"},
 {id:"equipment",name:"Industrial equipment",query:"?academy=equipment&template=product-focus"},
 {id:"training",name:"Training academies",query:"?academy=training&template=timeline"},
 {id:"ai-systems",name:"AI systems & automation",query:"?academy=ai-systems&template=dashboard"}
];
const WIDTHS=[{id:"desktop",width:1440,Icon:Monitor},{id:"tablet",width:868,Icon:Tablet},{id:"mobile",width:390,Icon:Smartphone}];

export default function AcademyTemplates(){
 const [category,setCategory]=useState("all");
 const [size,setSize]=useState("desktop");
 const [key,setKey]=useState(0);
 const mode=CATEGORIES.find(c=>c.id===category)||CATEGORIES[0];
 const url=X1_PREVIEW+"/admin/template-designer"+mode.query;
 return <div className="h-full flex flex-col bg-background min-w-0">
  <header className="shrink-0 px-5 py-4 border-b border-border bg-card">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div><div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-widest"><LayoutTemplate size={16}/> X1 Universal Factory · Integrated Editor</div>
     <h1 className="text-2xl font-heading font-bold mt-2">Template Designer</h1>
     <p className="text-xs text-muted-foreground mt-1 max-w-2xl">40 source-controlled website designs · Six specialized academies · 36 tailored examples. Edit the original full-page HTML in X1, switch devices and export a standalone website or configuration.</p>
    </div>
    <div className="flex items-center gap-2">
     <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center gap-1 border border-border rounded-md px-3 py-2 hover:bg-muted">Open X1 editor <ExternalLink size={14}/></a>
     <a href={ACADEMY+"/academies/"} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center gap-1 border border-border rounded-md px-3 py-2 hover:bg-muted"><BookOpen size={14}/> Original academy</a>
    </div>
   </div>
   <div className="flex flex-wrap gap-2 mt-4" aria-label="Select template academy">
    {CATEGORIES.map(c=><Button key={c.id} type="button" size="sm" variant={category===c.id?"default":"outline"} onClick={()=>{setCategory(c.id);setKey(v=>v+1)}}>{c.name}</Button>)}
   </div>
  </header>
  <div className="shrink-0 px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b bg-card">
   <div className="inline-flex gap-1 border rounded-md p-0.5" aria-label="Editor viewport">
    {WIDTHS.map(v=><Button key={v.id} variant={size===v.id?"secondary":"ghost"} size="sm" onClick={()=>setSize(v.id)} className="gap-1"><v.Icon size={14}/>{v.id}</Button>)}
   </div>
   <span className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck size={14}/> Source controlled · Preview builds have no production publication rights</span>
  </div>
  <div className="flex-1 min-h-0 overflow-auto bg-background/95 p-3 md:p-6">
   <div className="mx-auto rounded-xl overflow-hidden shadow-xl border border-slate-700 bg-white" style={{width:WIDTHS.find(v=>v.id===size)?.width,maxWidth:"none",minWidth:WIDTHS.find(v=>v.id===size)?.width}}>
    <div className="h-8 px-3 flex items-center justify-between bg-card text-muted-foreground text-xs">
     <span>● ● ●</span><span>X1 · {mode.name} · {size}</span><span>↗</span>
    </div>
    <iframe title={"X1 Academy Template Designer · "+mode.name} key={key} src={url} style={{height:820,width:"100%",border:0,display:"block"}} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups" referrerPolicy="strict-origin-when-cross-origin"/>
   </div>
  </div>
  <footer className="shrink-0 bg-card border-t p-3 text-xs text-muted-foreground">
   Source: Strategic-Minds-AI/universal-auto-builder-digital-dominance-template · Release 059f9e8042aa… · Candidate integrated with X1 on a verified Vercel preview, not yet promoted to the production domain.
  </footer>
 </div>;
}