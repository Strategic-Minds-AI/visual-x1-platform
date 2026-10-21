import React, { useState } from "react";
import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ORIGIN="https://www.strategicmindsai.com";
const SOURCE_PREVIEW="https://x1-operating-system-8h398mh99-strategic-minds-advisory.vercel.app";
const SCREENS=[
 {label:"V2 marketing",path:"/v2/b"},
 {label:"Pricing",path:"/pricing"},
 {label:"Client portal",path:"/portal"},
 {label:"Launch Studio",path:"/admin/launch-studio"},
 {label:"Template Designer",path:"/admin/template-designer"},
 {label:"Visual Studio",path:"/admin/visual-editor"},
 {label:"Agent Console",path:"/admin/agent"},
 {label:"Prompt Lab",path:"/admin/prompt-lab"},
 {label:"Coding Kanban",path:"/admin/coding-kanban"},
 {label:"Intelligence",path:"/admin/intelligence"}
];
const VIEWPORTS=[
 {label:"Desktop",width:1440,Icon:Monitor},
 {label:"Tablet",width:868,Icon:Tablet},
 {label:"Mobile",width:390,Icon:Smartphone}
];
export default function X1EmbedPanel(){
 const [path,setPath]=useState(SCREENS[0].path);
 const [width,setWidth]=useState(1440);
 const target=(path==="/admin/template-designer"?SOURCE_PREVIEW:ORIGIN)+path;
 return <Card>
  <CardHeader className="pb-2">
   <CardTitle className="text-base">X1 embed & visual parity viewport</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
   <p className="text-xs text-muted-foreground">
    This is X1's real hosted interface, not a replica. Embedding may remain blocked until X1's framing CSP is deployed. Admin/portal pages require their own X1 sign-in; no access token is sent to an iframe.
   </p>
   <div className="flex flex-wrap gap-2">
    {SCREENS.map(s=><Button key={s.path} size="sm" variant={path===s.path?"default":"outline"} onClick={()=>setPath(s.path)}>{s.label}</Button>)}
   </div>
   <div className="flex flex-wrap items-center gap-2">
    {VIEWPORTS.map(v=><Button key={v.width} size="sm" variant={width===v.width?"default":"outline"} onClick={()=>setWidth(v.width)}><v.Icon className="w-3.5 h-3.5 mr-1"/>{v.label}</Button>)}
    <a href={target} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center text-xs underline">
     Open directly <ExternalLink className="ml-1 w-3.5 h-3.5"/>
    </a>
   </div>
   <div className="w-full overflow-auto rounded-lg border border-border bg-background p-2">
    <iframe key={path} title={"X1 hosted "+path} src={target} style={{width,minWidth:width,maxWidth:"none",height:650,margin:"0 auto",display:"block",background:"#02050d"}}
     loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
     sandbox="allow-forms allow-scripts allow-same-origin allow-popups"/>
   </div>
   <p className="text-xs text-muted-foreground">A visible frame is not a parity pass. Screenshots, layout, functionality and login must be independently verified at all three viewport widths.</p>
  </CardContent>
 </Card>;
}