import React, {useEffect,useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowRight,ArrowUpRight,BookOpen,Box,Columns3,CheckCircle2,ChevronDown,Code2,FileCode2,FileDiff,Globe2,Layers3,LayoutDashboard,LockKeyhole,MessageCircle,Mic,MicOff,Monitor,MoreHorizontal,MousePointer2,RefreshCw,Settings2,ShieldCheck,Smartphone,Sparkles,Terminal,TestTube2,Undo2,Workflow,X} from 'lucide-react';
import '@/styles/x1-visual-studio.css';
// Byte-exact port of X1's apps/strategic-minds-v2/src/VisualStudio.jsx at commit
// 0994f0393619777cb701b9a6193c3d340bc706ba. Adaptations: the stylesheet resolves
// to the ported CSS file, and the /v2-assets/ artwork is the same artwork bundled
// through Vite because this host does not serve public/.
import emblemArt from '@/assets/x1/silver-emblem.png';
import earthArt from '@/assets/x1/connected-earth.jpg';

const DEVICES=[{id:'desktop',label:'Desktop',Icon:Monitor},{id:'tablet',label:'Tablet',Icon:Layers3},{id:'mobile',label:'Mobile',Icon:Smartphone}];
const TABS=['Preview','Code','Changes','Checks'];
const SANDBOXES=[
 {id:'sb-01',name:'Corporate V2',branch:'feature/x1-v2-cinematic',kind:'Homepage',status:'Preview shell'},
 {id:'sb-02',name:'Digital Dominance',branch:'feature/site-factory',kind:'Lead generation',status:'Architecture ready'},
 {id:'sb-03',name:'Client Portal',branch:'feature/client-experience',kind:'Portal',status:'Visual concept'}
];
const AGENTS=[{id:'architect',name:'Architect',detail:'Plans the scope and selects the right template',icon:Layers3},
{id:'builder',name:'Builder',detail:'Writes code inside one isolated branch/sandbox',icon:Code2},
{id:'browser',name:'Browser',detail:'Checks behavior using your browser execution layer',icon:Globe2},
{id:'validator',name:'Validator',detail:'Checks visual diffs, security and functional QA',icon:ShieldCheck}];
const startingDesign={title:'INTELLIGENCE\nIN MOTION',eyebrow:'THE FUTURE BELONGS TO BUILDERS',description:'Enterprise intelligence, engineered around your vision.',button:'EXPLORE OUR SOLUTIONS',accent:'#46d7ff',surface:'cosmic'};
const startingConversation=[
 {role:'assistant',type:'status',text:'X1 Visual Studio is ready for visual exploration. Your approved brand assets are loaded. This is a non-persistent design sandbox; no coding agents or production deployments have been started.'},
 {role:'assistant',type:'tip',text:'Try selecting the heading in the preview, changing its text in the inspector, or asking for a blue-to-green accent. Then review the generated change specification.'}
];
const now=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
function SMark({large=false}){return <Link to="/v2/a" className={'x1-smark'+(large?' x1-smark-large':'')} title="Strategic Minds AI home" aria-label="Strategic Minds AI home"><img src={emblemArt} alt="Metallic S icon"/></Link>}
function StatusDot({tone='cyan'}){return <span className={'x1-dot x1-dot-'+tone}/>}
function Bell({children,tone='cyan'}){return <span className={'x1-tag x1-tag-'+tone}>{children}</span>}
function FakeSurface({design,select,selected}){
 return <div className={'x1-surface x1-surface-'+design.surface} style={{'--x1-preview-accent':design.accent}}>
  <div className="x1-surface-stars" aria-hidden="true"/>
  <div className="x1-surface-header"><div className="x1-mini-brand"><img src={emblemArt} alt="" aria-hidden="true"/><span>STRATEGIC MINDS <b>AI</b></span></div><nav aria-label="Sample site"><span>HOME</span><span>SOLUTIONS</span><span>THE PLATFORM</span><span>CONTACT</span></nav><button className="x1-mini-outline" onClick={()=>select('button')}>CALL EDEN <ArrowUpRight size={12}/></button></div>
  <main className="x1-surface-body"><div className="x1-surface-copy">
    <button onClick={()=>select('eyebrow')} className={'x1-selectable x1-surface-eyebrow'+(selected==='eyebrow'?' x1-picked':'')}><span className="x1-tiny-light"/> {design.eyebrow}</button>
    <button onClick={()=>select('title')} className={'x1-selectable x1-surface-h1'+(selected==='title'?' x1-picked':'')} style={{whiteSpace:'pre-line'}}>{design.title}</button>
    <button onClick={()=>select('description')} className={'x1-selectable x1-surface-desc'+(selected==='description'?' x1-picked':'')}>{design.description}</button>
    <button onClick={()=>select('button')} className={'x1-selectable x1-surface-cta'+(selected==='button'?' x1-picked':'')}>{design.button}<ArrowRight size={16}/></button>
  </div><div className="x1-surface-brand" aria-hidden="true"><div className="x1-circular-glow"/><img src={emblemArt} alt=""/></div></main>
  <img className="x1-surface-earth" src={earthArt} alt="" aria-hidden="true"/>
  <div className="x1-surface-bottom"><span>PRECISION · INTELLIGENCE · EXECUTION</span><span>YOUR VISION, ENGINEERED.</span></div>
 </div>;
}
function Inspector({selected,design,apply,onClose}){
 const choices={eyebrow:{label:'Eyebrow',key:'eyebrow'},title:{label:'Hero heading',key:'title'},description:{label:'Description',key:'description'},button:{label:'Primary action',key:'button'}};
 const c=choices[selected];
 return <aside className="x1-inspector"><div className="x1-inspect-title"><span><MousePointer2 size={15}/> VISUAL INSPECTOR</span><button aria-label="Close inspector" onClick={onClose}><X size={16}/></button></div>
 <div className="x1-inspect-body">
  <Bell tone="green">LOCAL EDIT · NO CODE PUSH</Bell>
  <h3>{c?.label||'Page properties'}</h3>
  <p>Select any outlined element in the preview to edit it. The change appears instantly, but remains browser-local.</p>
  {c&&<label>Content{c.key==='title'?<textarea value={design[c.key]} onChange={e=>apply(c.key,e.target.value)} rows={3}/>:<input value={design[c.key]} onChange={e=>apply(c.key,e.target.value)}/>}</label>}
  <label>Accent color<select value={design.accent} onChange={e=>apply('accent',e.target.value)}><option value="#46d7ff">Electric blue</option><option value="#8affb8">Neon green</option><option value="#9e8cff">Cosmic violet</option></select></label>
  <label>Atmosphere<select value={design.surface} onChange={e=>apply('surface',e.target.value)}><option value="cosmic">Cinematic cosmic</option><option value="minimal">Nocturnal minimal</option></select></label>
  <div className="x1-inspect-footer"><ShieldCheck size={16}/> Export a versioned patch for approval before it reaches a repository.</div>
 </div></aside>;
}
export default function VisualStudio(){
 const [sandbox,setSandbox]=useState('sb-01'),[device,setDevice]=useState('desktop'),[tab,setTab]=useState('Preview'),[selected,setSelected]=useState('title');
 const [designStore,setDesignStore]=useState(()=>Object.fromEntries(SANDBOXES.map(s=>[s.id,{...startingDesign}])));
 const [historyStore,setHistoryStore]=useState(()=>Object.fromEntries(SANDBOXES.map(s=>[s.id,[]])));
 const [chatStore,setChatStore]=useState(()=>Object.fromEntries(SANDBOXES.map(s=>[s.id,startingConversation.map(m=>({...m}))])));
 const [draftStore,setDraftStore]=useState(()=>Object.fromEntries(SANDBOXES.map(s=>[s.id,''])));
 const [night,setNight]=useState(false),[panel,setPanel]=useState('chat'),[inspector,setInspector]=useState(false);
 const [queue,setQueue]=useState([]),[listening,setListening]=useState(false),[notice,setNotice]=useState('');
 const recognition=useRef(null),endRef=useRef(null),lastEditRef=useRef({sandbox:null,key:null,at:0});
 const current=SANDBOXES.find(s=>s.id===sandbox);
 // Even in this frontend-only demo, each sandbox owns separate design, undo, chat and drafts.
 const design=designStore[sandbox]||startingDesign,history=historyStore[sandbox]||[];
 const conversation=chatStore[sandbox]||startingConversation,draft=draftStore[sandbox]||'';
 const setDesign=updater=>setDesignStore(store=>({...store,[sandbox]:typeof updater==='function'?updater(store[sandbox]||startingDesign):updater}));
 const setHistory=updater=>setHistoryStore(store=>({...store,[sandbox]:typeof updater==='function'?updater(store[sandbox]||[]):updater}));
 const setConversation=updater=>setChatStore(store=>({...store,[sandbox]:typeof updater==='function'?updater(store[sandbox]||startingConversation):updater}));
 const setDraft=updater=>setDraftStore(store=>({...store,[sandbox]:typeof updater==='function'?updater(store[sandbox]||''):updater}));
 const changes=Object.entries(design).filter(([key,value])=>startingDesign[key]!==value);
 const update=(key,value)=>{
  const at=Date.now();
  const grouped=lastEditRef.current.sandbox===sandbox&&lastEditRef.current.key===key&&at-lastEditRef.current.at<1350;
  if(!grouped)setHistory(h=>[design,...h].slice(0,40));
  lastEditRef.current={sandbox,key,at};
  setDesign(previous=>({...previous,[key]:value}));
 };
 const restore=()=>{if(history.length){setDesign(history[0]);setHistory(h=>h.slice(1));lastEditRef.current={sandbox,key:null,at:0};}};
 const enqueue=(text)=>{
  const clean=text.trim();if(!clean)return;
  const entry={id:Date.now().toString(),text:clean,sandbox,status:'LOCAL DRAFT',at:now()};
  setConversation(c=>[...c,{role:'user',text:clean},{role:'assistant',type:'status',text:'Draft captured for '+current.name+'. No model was called or background job started. When X1 is connected, this command will require a tenant-scoped queue receipt, dedicated sandbox and execution budget.'}]);
  setQueue(q=>[entry,...q]);setDraft('');setNotice('Command stored only in this browser session.');setPanel('chat');
 };
 const promptExample=(text)=>{setDraft(text);setPanel('chat')};
 const startVoice=()=>{
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){setNotice('Speech recognition is unavailable in this browser. Use your phone microphone keyboard or type.');return;}
  if(listening){recognition.current?.stop();setListening(false);return;}
  try{const r=new Speech();r.lang='en-US';r.interimResults=false;r.continuous=false;r.onresult=e=>{const spoken=Array.from(e.results).map(x=>x[0].transcript).join(' ');setDraft(t=>t?(t+' '+spoken):spoken);setNotice('Voice transcribed locally by your browser speech service. Review before submitting.');};r.onend=()=>setListening(false);r.onerror=e=>{setListening(false);setNotice('Microphone or speech recognition error: '+e.error);};recognition.current=r;r.start();setListening(true);}catch(e){setListening(false);setNotice('Microphone unavailable: '+e.message);}
 };
 const patch=useMemo(()=>JSON.stringify({schema:'x1.visual.patch.v1',mode:'review_only',sandbox_id:sandbox,source_repo:'Strategic-Minds-AI/X1-OPERATING-SYSTEM',changes:Object.fromEntries(changes),requires:['authenticated operator','isolated sandbox','agent diff','QA receipts','branch review']},null,2),[changes,sandbox]);
 const exportPatch=()=>{
  const blob=new Blob([patch],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='x1-visual-'+sandbox+'-patch.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);setNotice('Review-only JSON patch downloaded. This did not change GitHub.');
 };
 useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[conversation.length]);
 useEffect(()=>()=>recognition.current?.stop(),[]);
 return <div className="x1-studio">
  <a href="#x1-workspace" className="x1-skip">Skip to visual editor</a>
  <aside className="x1-rail" aria-label="Admin sections">
    <SMark/>
    <div className="x1-rail-divider"/>
    <Link to="/admin" title="Operator console"><LayoutDashboard size={19}/></Link>
    <button className="active" title="Visual Studio" aria-label="Visual Studio"><Layers3 size={21}/></button>
    <Link to="/admin/visual-editor" title="Visual Editor" aria-label="Visual Editor"><MousePointer2 size={20}/></Link>
     <Link to="/admin/prompt-lab" title="Prompt Lab" aria-label="Prompt Lab"><Terminal size={20}/></Link>
     <Link to="/admin/coding-kanban" title="Autonomous Coding Kanban" aria-label="Autonomous Coding Kanban"><Columns3 size={20}/></Link>
     <Link to="/admin/launch-studio" title="Launch Studio" aria-label="Launch Studio"><Sparkles size={20}/></Link>
    <button onClick={()=>setPanel('sandboxes')} title="Sandboxes" aria-label="Sandboxes"><Box size={20}/></button>
    <Link to="/admin/agent" title="X1 GPT Command Agent" aria-label="X1 GPT Command Agent"><MessageCircle size={20}/></Link>
    <button onClick={()=>setPanel('agents')} title="Agent roster" aria-label="Agent roster"><Workflow size={20}/></button>
    <button onClick={()=>setPanel('activity')} title="Local draft queue" aria-label="Local draft queue"><Activity size={20}/></button>
    <div className="x1-rail-spacer"/>
    <Link to="/pricing" title="Pricing"><BookOpen size={19}/></Link>
    <Link to="/v2/b" title="Public homepage"><Globe2 size={19}/></Link>
  </aside>
  <div className="x1-studio-main">
   <header className="x1-topbar"><div className="x1-top-left"><div className="x1-studio-label">STRATEGIC MINDS <b>AI</b> <span>/</span> VISUAL X</div><Bell tone="green"><StatusDot tone="green"/> NONPRODUCTION LAB</Bell></div><div className="x1-top-actions"><button onClick={()=>setNight(v=>!v)} className={'x1-night'+(night?' selected':'')}><Sparkles size={15}/>{night?'NIGHT PLAN PREPARED':'OVERNIGHT MODE'}</button><button className="x1-save" onClick={exportPatch}><FileDiff size={15}/> EXPORT PATCH</button></div></header>
   {night&&<div className="x1-night-banner"><ShieldCheck size={17}/><span>Night workflow is a <strong>prepared plan only</strong>. Persistent agents, real sandbox creation, schedules and spend remain OFF until the authenticated X1 supervisor is integrated.</span><button onClick={()=>setNight(false)} aria-label="Dismiss night plan"><X size={16}/></button></div>}
   <div className="x1-workspace" id="x1-workspace">
    <section className={'x1-chat '+(panel!=='chat'?' x1-chat-alt':'')}>
     <div className="x1-chat-head"><div><div className="x1-chat-icon"><Sparkles size={19}/></div><div><h2>{panel==='chat'?'Build with X1':panel==='sandboxes'?'Sandbox environments':panel==='agents'?'Specialist agents':'Local activity'}</h2><span>GUIDED WORKSPACE · NO BACKEND CONNECTION</span></div></div><button onClick={()=>setPanel('chat')} title="Return to chat" aria-label="Return to chat"><MessageCircle size={18}/></button></div>
     {panel==='chat'?<>
       <div className="x1-chat-scroller" role="log" aria-label="Studio conversation">
        <div className="x1-chat-today">TODAY · INTERACTIVE DEVELOPMENT PREVIEW</div>
        {conversation.map((m,i)=><div className={'x1-message '+(m.role==='user'?'x1-message-user':'x1-message-agent')} key={i}>{m.role==='assistant'&&<div className="x1-message-mark"><Sparkles size={15}/></div>}<div className="x1-message-inner"><span>{m.role==='assistant'?'X1 VISUAL STUDIO':'YOU'}</span><p>{m.text}</p></div></div>)}
        <div ref={endRef}/>
       </div>
       <div className="x1-suggestion-row"><span>QUICK START</span><button onClick={()=>promptExample('Make the hero look more cinematic and premium.')}>Upgrade the hero</button><button onClick={()=>promptExample('Build a multi-page lead capture funnel with a premium contact experience.')}>Lead funnel</button></div>
       <p className="x1-chat-live-link"><Link to="/admin/agent"><Sparkles size={14}/> OPEN X1 COMMAND AGENT <ArrowRight size={14}/></Link></p>
       <form className="x1-chat-compose" onSubmit={e=>{e.preventDefault();enqueue(draft);}}><label htmlFor="x1-chat-command">What should X1 build?</label><textarea id="x1-chat-command" rows={4} placeholder="Describe it... or tap the mic.&#10;The real agent executor will be connected here." value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enqueue(draft);}}}/>
        <div className="x1-compose-bottom"><div><button type="button" className={'x1-mic'+(listening?' recording':'')} aria-label={listening?'Stop voice input':'Dictate a message'} title={listening?'Stop voice input':'Dictate a message'} onClick={startVoice}>{listening?<MicOff size={19}/>:<Mic size={19}/>}</button><span>{listening?'LISTENING':'VOICE INPUT'}</span></div><button type="submit" className="x1-send" disabled={!draft.trim()}>SAVE DRAFT <ArrowRight size={15}/></button></div>
       </form><p className="x1-chat-caveat">Commands are local drafts. They are not autonomous X1 jobs or submitted to any AI provider.</p>
      </>:panel==='sandboxes'?<div className="x1-side-section"><p>Choose a design context. Cards are illustrative workspace entries, not provisioned virtual machines.</p>{SANDBOXES.map(s=><button className={'x1-sandbox-card '+(sandbox===s.id?'active':'')} key={s.id} onClick={()=>{setSandbox(s.id);setPanel('chat');}}><span><Box size={19}/><strong>{s.name}</strong></span><small>{s.branch}</small><em>{s.kind} · {s.status}</em></button>)}<div className="x1-side-hint"><LockKeyhole size={17}/> Isolated Vercel Sandboxes will attach here through X1, each with its own branch, leases, budget and preview URL.</div></div>
      :panel==='agents'?<div className="x1-side-section"><p>Specialist roles are part of the architecture. None are running in this demo.</p>{AGENTS.map(a=><div className="x1-agent-row" key={a.id}><a.icon size={19}/><div><strong>{a.name}</strong><p>{a.detail}</p></div><Bell tone="muted">UNBOUND</Bell></div>)}</div>
      :<div className="x1-side-section"><p>These review-only requests exist in this browser session. Refreshing clears them.</p>{queue.length===0?<div className="x1-empty">No command drafts yet.</div>:queue.map(q=><div className="x1-queue-entry" key={q.id}><Bell tone="muted">{q.status}</Bell><p>{q.text}</p><small>{q.at} · {q.sandbox}</small></div>)}</div>}
    </section>
    <section className="x1-editor" aria-label="Visual editor">
     <div className="x1-editor-top"><div className="x1-editor-project"><button onClick={()=>setPanel('sandboxes')}><span className="x1-project-icon"><Box size={17}/></span><span><strong>{current.name}</strong><small>{current.branch}</small></span><ChevronDown size={15}/></button></div>
      <div className="x1-editor-right"><button className="x1-tools-trigger" type="button" aria-expanded={inspector} aria-controls="x1-visual-x-tools" onClick={()=>{setTab('Preview');setInspector(v=>!v)}}><Settings2 size={15}/> {inspector?'HIDE TOOLS':'SHOW TOOLS'}</button><Bell tone="muted">SANDBOX MOCK · NOT RUNNING</Bell><button onClick={()=>{setDesign(startingDesign);setSelected('title');setHistory([]);}} title="Reset local design"><RefreshCw size={17}/></button></div>
     </div>
     <div className="x1-editor-tabs"><div className="x1-tabs-group">{TABS.map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t==='Preview'?<Monitor size={15}/>:t==='Code'?<Code2 size={15}/>:t==='Changes'?<FileDiff size={15}/>:<TestTube2 size={15}/>} {t}{t==='Changes'&&changes.length>0&&<b>{changes.length}</b>}</button>)}</div><div className="x1-view-controls">{DEVICES.map(({id,label,Icon})=><button className={device===id?'active':''} key={id} onClick={()=>{setDevice(id);setTab('Preview')}} title={label} aria-label={label+' preview'}><Icon size={16}/></button>)}<div className="x1-v-divider"/><button onClick={restore} disabled={!history.length} title="Undo local edit" aria-label="Undo local edit"><Undo2 size={17}/></button><button className={inspector?'active':''} onClick={()=>setInspector(x=>!x)} title={inspector?'Close tools':'Open tools'} aria-label={inspector?'Close tools panel':'Open tools panel'} aria-expanded={inspector} aria-controls="x1-visual-x-tools"><Settings2 size={17}/></button></div></div>
     <div className="x1-stage">
      {tab==='Preview'?<div className="x1-canvas-well"><div className="x1-canvas-measure"><span><StatusDot tone="cyan"/> ISOLATED CANVAS · LOCAL RENDERER</span><span>{device==='desktop'?'1440 × 900':device==='tablet'?'768 × 1024':'390 × 844'} · 100%</span></div><div className={'x1-browser-frame x1-frame-'+device}><div className="x1-browser-toolbar"><div><i/><i/><i/></div><span><LockKeyhole size={11}/> x1.local/visual-preview · not a live sandbox</span><MoreHorizontal size={16}/></div><FakeSurface design={design} selected={selected} select={x=>{setSelected(x);setInspector(true)}}/></div><div className="x1-canvas-footer"><span><MousePointer2 size={13}/> Click headline, description or button to edit</span><span>LIVE VISUAL DRAFT</span></div></div>
       :tab==='Code'?<div className="x1-code-panel"><div className="x1-code-head"><Code2 size={16}/> Generated design spec <Bell tone="muted">LOCAL PATCH</Bell></div><pre><code>{patch}</code></pre><div className="x1-code-note">This is a structured edit instruction, not agent-generated source code. X1 backend must map it to actual source files and commit diffs.</div><button className="x1-export-dark" onClick={exportPatch}><FileCode2 size={16}/> DOWNLOAD PATCH</button></div>
       :tab==='Changes'?<div className="x1-change-panel"><div className="x1-code-head"><FileDiff size={17}/> Local changes · uncommitted</div>{changes.length===0?<div className="x1-empty">No visual changes yet. Select an element in the Preview tab.</div>:changes.map(([key,val])=><div className="x1-diff" key={key}><strong>{key}</strong><div><span>- {String(startingDesign[key])}</span><span>+ {String(val)}</span></div></div>)}<button className="x1-export-dark" onClick={exportPatch}>EXPORT REVIEW PATCH <ArrowRight size={16}/></button></div>
       :<div className="x1-checks"><div className="x1-code-head"><TestTube2 size={17}/> Execution gates</div>{[['Visual preview renders','LOCAL PASS'],['Preview elements editable','LOCAL PASS'],['Accessibility and responsive QA','NOT RUN'],['Tenant-authenticated X1 agent bridge','UNBOUND'],['Real Vercel sandbox and dev server','UNBOUND'],['GitHub branch diff and commit receipts','UNBOUND'],['Full browser regression','NOT RUN'],['Production approval','PROTECTED']].map(([k,v])=><div key={k}><span>{v==='LOCAL PASS'?<CheckCircle2 size={17} color="#75ffb8"/>:<ShieldCheck size={17} color="#799bb3"/>}{k}</span><Bell tone={v==='LOCAL PASS'?'green':'muted'}>{v}</Bell></div>)}<p>Simulation screens are not evidence of agent operation. Once connected, results must come from real X1 receipts.</p></div>}
      {tab==='Preview'&&<div id="x1-visual-x-tools" className={'x1-tools-drawer'+(inspector?' is-open':'')} aria-hidden={!inspector} inert={!inspector}><Inspector selected={selected} design={design} apply={update} onClose={()=>setInspector(false)}/></div>}
     </div>
     <div className="x1-editor-bottom"><span><StatusDot tone="green"/> LIVE DESIGN PREVIEW · NO BACKEND WRITE</span><div><span>{changes.length} unsaved visual change{changes.length===1?'':'s'}</span><button onClick={()=>setPanel('activity')}><Activity size={14}/> DRAFT ACTIVITY</button></div></div>
    </section>
   </div>
   {notice&&<div className="x1-toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notification"><X size={14}/></button></div>}
  </div>
 </div>;
}