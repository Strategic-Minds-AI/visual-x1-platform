import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Bot, BrainCircuit, ChartNoAxesCombined, CheckCircle2, DatabaseZap, Globe2, Headphones, Menu, Phone, Search, ShieldCheck, Sparkles, Workflow, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import '@/styles/x1-v2-experience.css';
import '@/styles/x1-motion.css';
// Byte-exact port of X1's apps/strategic-minds-v2/src/V2Experience.jsx at commit
// 0994f0393619777cb701b9a6193c3d340bc706ba. Two adaptations only:
//   1. the two stylesheet imports point at the ported CSS files,
//   2. the /v2-assets/ URLs point at the same artwork bundled through Vite,
//      because this host does not serve public/ (see src/assets/x1).
// Everything else — markup, classes, copy, phone numbers, Eden flow — is source.
import emblemArt from '@/assets/x1/silver-emblem.png';
import wordmarkArt from '@/assets/x1/chrome-wordmark.png';
import earthArt from '@/assets/x1/connected-earth.jpg';
import edenPortraitArt from '@/assets/x1/eden-skye-original.avif';

const EDEN_PHONE='tel:+18665711174';
const BUSINESS_PHONE='tel:+17722090266';
const EMAIL='jeremy@strategicmindsai.com';
const SERVICES=[
 {icon:BrainCircuit,title:'AI Strategy & Consulting',copy:'Practical AI opportunities, systems architecture and implementation plans.'},
 {icon:Workflow,title:'Custom AI Systems & Automation',copy:'Connect people, processes and tools in intelligent workflows.'},
 {icon:Bot,title:'AI Agents & Assistants',copy:'Supervised agents and assistants for repeatable business tasks.'},
 {icon:Headphones,title:'AI Reception & Lead Systems',copy:'Improve inquiry capture, call routing, qualification and follow-up.'},
 {icon:Globe2,title:'AI-Powered Websites',copy:'Original, compelling websites and measurable customer experiences.'},
 {icon:DatabaseZap,title:'Data & Intelligence',copy:'Make operational data useful for confident business decisions.'},
 {icon:Search,title:'SEO · AEO · GEO',copy:'Build genuinely useful content for search and AI-assisted discovery.'},
 {icon:ChartNoAxesCombined,title:'Digital Growth',copy:'Research, experimentation and attribution for stronger outcomes.'}
];
const STEPS=[
 {field:'business',label:'Business or industry',title:'Tell Eden about your business.',placeholder:'For example: Residential construction'},
 {field:'goal',label:'Your highest priority',title:'What should AI help you with first?',options:['Capture and qualify leads','Automate repetitive tasks','Build an AI website','Create AI agents','Organize business data','Explore my opportunities']},
 {field:'market',label:'Service area or market',title:'Where are you hoping to grow?',placeholder:'For example: South Florida'},
 {field:'notes',label:'A final thought (optional)',title:'What else would you like Eden to know?',placeholder:'A challenge, an idea or a dream',optional:true}
];
function eventV2(action,variant,extra={}) {
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('smai:v2-interaction',{detail:{action,variant,...extra}}));
}
function PreviewHead({variant}) {
 useEffect(()=>{
  const title=document.title; document.title='Strategic Minds AI | Intelligence in Motion';
  const prior=document.querySelector('meta[name="robots"]');
  const meta=prior||document.createElement('meta'); const old=prior?.content;
  if(!prior){meta.name='robots';document.head.appendChild(meta);}
  meta.content='noindex,nofollow,noarchive';
  return()=>{document.title=title;if(prior)meta.content=old;else meta.remove();};
 },[variant]);
 return null;
}
function Call({eden=false,variant,small=false}) {
 return <a className={'v2-call '+(eden?'v2-call-eden':'v2-call-now')+(small?' v2-call-small':'')}
 href={eden?EDEN_PHONE:BUSINESS_PHONE}
 aria-label={eden?'Call Eden Skye at 866-571-1174':'Call Strategic Minds AI at 772-209-0266'}
 title={eden?'866-571-1174':'772-209-0266'}
 onClick={()=>eventV2(eden?'eden_phone_click':'business_phone_click',variant)}>
 {eden?<Sparkles size={16}/>:<Phone size={16}/>}<span>{eden?'CALL EDEN':'CALL NOW'}</span></a>;
}
function Navigation({variant}) {
 const [open,setOpen]=useState(false);
 const pages=[
 ['HOME','/v2/b'],['SERVICES','/v2/b#services'],['SOLUTIONS','/v2/b#services'],
 ['INDUSTRIES','/v2/b#services'],['PRICING','/pricing'],
 ['PORTAL','/portal'],['CONTACT','/v2/c#onboarding']
 ];
 return <header className="v2-header"><div className="v2-header-grid">
  <Link className="v2-header-s" to="/v2/b" aria-label="Strategic Minds AI home"><img src={emblemArt} alt="Metallic Strategic Minds S"/></Link>
  <Call eden variant={variant}/>
  <div className="v2-nav-shell">
   <button type="button" className="v2-menu" aria-label={open?'Close navigation':'Open navigation'}
    aria-controls="v2-links" aria-expanded={open} onClick={()=>setOpen(x=>!x)}>
    <span>EXPLORE</span>{open?<X size={20}/>:<Menu size={20}/>}</button>
   <nav id="v2-links" className={'v2-nav-links'+(open?' v2-nav-open':'')} aria-label="Main navigation">
   {pages.map(([name,href],i)=><a key={name} href={href} aria-current={i===0?'page':undefined}
    onClick={()=>{setOpen(false);eventV2('navigation',variant,{target:name});}}>{name}</a>)}
   </nav>
  </div>
  <Call variant={variant}/>
 </div></header>;
}
function Brand({small=false}) {
 return <div className={'v2-brand'+(small?' v2-brand-small':'')}>
  <div className="v2-emblem-stage"><img src={emblemArt} alt="Metallic Strategic Minds AI S emblem" width="370" height="360" className="v2-emblem"/><span className="v2-emblem-glint" aria-hidden="true"/></div>
  <img src={wordmarkArt} alt="Strategic Minds AI" width="1065" height="78" className="v2-wordmark"/>
  <span className="v2-tagline"><i aria-hidden="true"/>INTELLIGENCE IN MOTION<i aria-hidden="true"/></span>
 </div>;
}
function Earth() {return <div className="v2-earth" aria-hidden="true">
  <img src={earthArt} alt="" width="1254" height="306"/>
  <svg className="v2-network" viewBox="0 0 1254 306" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path className="v2-network-track" d="M104 230 Q276 56 464 205"/>
    <path className="v2-network-flow" d="M104 230 Q276 56 464 205"/>
    <path className="v2-network-track" d="M464 205 Q670 25 860 181"/>
    <path className="v2-network-flow" d="M464 205 Q670 25 860 181"/>
    <path className="v2-network-track" d="M860 181 Q1011 35 1171 232"/>
    <path className="v2-network-flow" d="M860 181 Q1011 35 1171 232"/>
    <path className="v2-network-track" d="M261 253 Q599 81 1015 253"/>
    <path className="v2-network-flow" d="M261 253 Q599 81 1015 253"/>
    <circle className="v2-network-beacon" cx="104" cy="230" r="3.6"/>
    <circle className="v2-network-beacon" cx="464" cy="205" r="4"/>
    <circle className="v2-network-beacon" cx="860" cy="181" r="3.8"/>
    <circle className="v2-network-beacon" cx="1171" cy="232" r="3"/>
  </svg>
</div>;}
function Cta({variant,label='START YOUR AI TRANSFORMATION'}) {
 return <Link to="/v2/eden#onboarding" className="v2-main-cta"
  onClick={()=>eventV2('onboarding_cta',variant)}>
  <span>{label}</span><span className="v2-cta-arrow"><ArrowRight size={18}/></span></Link>;
}
function Hero({variant,expanded=false}) {
 return <section className={'v2-hero v2-earth-hero'+(expanded?' v2-earth-hero-expanded':'')}>
  <div className="v2-nebula" aria-hidden="true"/>
  <Earth/>
  <div className="v2-hero-center">
   <Brand/>
   {expanded?<div className="v2-hero-statement"><h1>Build Smarter.<span>Grow Faster.</span></h1><Cta variant={variant}/></div>
   :<div className="v2-hero-statement v2-hero-statement-short">
    <h1 className="v2-visually-hidden">Strategic Minds AI. Intelligence in Motion. Build Smarter. Grow Faster.</h1>
    <Cta variant={variant} label="BUILD SMARTER.  GROW FASTER."/></div>}
  </div>
  {expanded&&<a href="#services" className="v2-down-link">EXPLORE OUR SOLUTIONS <ArrowRight size={16}/></a>}
 </section>;
}
function ServiceCards({variant}) {
 return <section className="v2-section v2-services" id="services"><div className="v2-wrap">
  <div className="v2-heading"><p className="v2-eyebrow">WHAT WE BUILD</p><h2>AI systems for <em>real business growth.</em></h2>
  <p>Build a better customer experience, simplify operations and discover what's possible with practical AI.</p></div>
  <div className="v2-card-grid">{SERVICES.map(({icon:Icon,title,copy},i)=>
   <a className="v2-service-card" id={i===6?'visibility':undefined} key={title} href="/v2/c#onboarding"
     onClick={()=>eventV2('service_selected',variant,{service:title})}>
    <span className="v2-card-icon"><Icon size={34} strokeWidth={1.45}/></span>
    <h3>{title}</h3><p>{copy}</p><span className="v2-card-arrow"><ArrowUpRight size={19}/></span>
   </a>
  )}</div>
 </div></section>;
}
function LongPage({variant}) {
 return <><Hero variant={variant} expanded/><ServiceCards variant={variant}/>
  <section className="v2-section v2-reach"><div className="v2-wrap v2-reach-grid">
   <div><p className="v2-eyebrow">INTELLIGENCE WITHOUT BORDERS</p>
    <h2>Designed for today.<em>Built for what's next.</em></h2>
    <p>From intelligent workflows and discovery to scalable systems, explore solutions designed around your business, not a generic template.</p>
    <a className="v2-alt-cta" href="/v2/c#onboarding" onClick={()=>eventV2('growth_cta',variant)}>EXPLORE YOUR OPPORTUNITY <ArrowRight size={18}/></a>
   </div><img src={earthArt} alt="Glowing global connectivity across Earth" width="1254" height="306" loading="lazy"/>
  </div></section>
  <section className="v2-section v2-process" id="process"><div className="v2-wrap">
   <div className="v2-heading"><p className="v2-eyebrow">OUR APPROACH</p>
    <h2>Discover. Design. <em>Build. Improve.</em></h2></div>
   <div className="v2-process-grid">{[['01','Discover','Find your highest-value opportunity.'],['02','Architect','Select a practical system and milestones.'],['03','Validate','Build a real preview and verify outcomes.'],['04','Improve','Measure performance and refine.']].map(([n,t,copy])=><div key={n}><span>{n}</span><h3>{t}</h3><p>{copy}</p></div>)}</div>
  </div></section>
  <section className="v2-last-cta"><p className="v2-eyebrow">INTELLIGENCE IN MOTION</p><h2>Make your next idea <em>intelligent.</em></h2>
   <div className="v2-last-buttons"><Call eden variant={variant}/><Cta variant={variant}/></div></section>
 </>;
}
function Onboarding({variant}) {
 const BLANK={business:'',goal:'',market:'',notes:'',name:'',email:''};
 const [step,setStep]=useState(0),[data,setData]=useState(BLANK),[done,setDone]=useState(false);
 const [sending,setSending]=useState(false),[sent,setSent]=useState(false),[sendError,setSendError]=useState('');
 const q=STEPS[step],value=data[q.field]||'',ok=q.optional||value.trim().length>0;
 const emailOk=/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(data.email.trim());
 const body=['Strategic Minds AI - voluntary discovery request','','Business or industry: '+data.business,
  'AI priority: '+data.goal,'Target market: '+data.market,'Notes: '+(data.notes||'No additional notes')].join('\n');
 const mailto='mailto:'+EMAIL+'?subject='+encodeURIComponent('Strategic Minds AI | New discovery request')+'&body='+encodeURIComponent(body);
 const send=async()=>{
  if(!emailOk||sending)return;
  setSending(true);setSendError('');
  try{
   const res=await base44.functions.invoke('edenIntake',{full_name:data.name.trim(),email:data.email.trim(),
    business:data.business,goal:data.goal,market:data.market,notes:data.notes,source:window.location.href});
   const d=res.data||{};
   if(d.ok)setSent(true);else setSendError(d.error||'Your brief could not be sent.');
  }catch(e){setSendError(e?.response?.data?.error||e?.message||'Your brief could not be sent.');}
  setSending(false);
 };
 return <section className="v2-section v2-onboarding" id="onboarding"><div className="v2-wrap">
  <div className="v2-onboarding-panel"><div className="v2-heading"><p className="v2-eyebrow">START WITH EDEN</p>
   <h2>Your AI discovery journey.</h2><p>Four simple questions. No overwhelming forms.</p></div>
   <div className="v2-steps" aria-label="Onboarding progress">{STEPS.map((s,i)=><span key={s.field} className={i<=step?'is-current':''}/>)}</div>
   {!done?<form onSubmit={e=>{e.preventDefault();if(!ok)return;
      eventV2('onboarding_step',variant,{step:step+1});
      if(step===STEPS.length-1)setDone(true);else setStep(x=>x+1);}}>
    <p className="v2-step-count">QUESTION {step+1} OF 4</p><h3>{q.title}</h3>
    <label htmlFor={'v2-field-'+q.field}>{q.label}</label>
    {q.options?<select id={'v2-field-'+q.field} value={value}
      onChange={e=>setData({...data,[q.field]:e.target.value})}>
      <option value="">Choose one</option>{q.options.map(v=><option key={v}>{v}</option>)}</select>
     :<input id={'v2-field-'+q.field} value={value} type="text" autoComplete="off"
       maxLength={180} placeholder={q.placeholder} onChange={e=>setData({...data,[q.field]:e.target.value})}/>}
    <div className="v2-form-actions">{step>0&&<button type="button" className="v2-quiet" onClick={()=>setStep(s=>s-1)}>BACK</button>}
     <button type="submit" className="v2-alt-cta" disabled={!ok}>{step===3?'REVIEW MY ANSWERS':'CONTINUE'} <ArrowRight size={17}/></button></div>
   </form>
   :sent?<div className="v2-finished" role="status"><CheckCircle2 size={34}/><h3>Your brief is with our team.</h3>
     <p>Thank you{data.name?', '+data.name:''}. Eden passed your answers to Strategic Minds AI, and we will reply to {data.email}.</p>
     <div className="v2-form-actions"><button type="button" className="v2-quiet" onClick={()=>{setData(BLANK);setStep(0);setDone(false);setSent(false)}}>START AGAIN</button></div>
    </div>
   :<div className="v2-finished" role="status"><CheckCircle2 size={34}/><h3>Your discovery brief is ready.</h3>
     <p><strong>Business:</strong> {data.business}</p><p><strong>Goal:</strong> {data.goal}</p><p><strong>Market:</strong> {data.market}</p>
     <label htmlFor="v2-field-name">Your name</label>
     <input id="v2-field-name" value={data.name} type="text" maxLength={120} autoComplete="name" placeholder="Your name" onChange={e=>setData({...data,name:e.target.value})}/>
     <label htmlFor="v2-field-email">Email for our reply</label>
     <input id="v2-field-email" value={data.email} type="email" maxLength={180} autoComplete="email" placeholder="you@company.com" onChange={e=>setData({...data,email:e.target.value})}/>
     {sendError?<p className="v2-send-error" role="alert">{sendError}</p>:null}
     <div className="v2-form-actions"><button type="button" className="v2-quiet" onClick={()=>{setStep(0);setDone(false)}}>EDIT</button>
      <button type="button" className="v2-alt-cta" disabled={!emailOk||sending} onClick={send}>{sending?'SENDING…':'SEND MY BRIEF'} <ArrowRight size={17}/></button></div>
     <p className="v2-send-fallback">Prefer email? <a href={mailto} onClick={()=>eventV2('open_discovery_email',variant)}>Open a draft instead</a>.</p>
    </div>}
   <p className="v2-privacy"><ShieldCheck size={15}/> Your answers are sent to our team only when you press send.</p>
  </div>
 </div></section>;
}
function EdenPage({variant}) {
 return <><section className="v2-hero v2-eden-hero">
  <div className="v2-nebula" aria-hidden="true"/>
  <div className="v2-wrap v2-eden-grid">
   <div className="v2-eden-copy"><Brand small/>
    <p className="v2-eyebrow"><span className="v2-green-dot"/> MEET YOUR AI WELCOME HOST</p>
    <h1>Meet Eden Skye.<em>Let's talk about what's possible.</em></h1>
    <p>Eden is the AI onboarding guide for Strategic Minds AI. A few thoughtful questions can be the start of something extraordinary.</p>
    <div className="v2-eden-actions"><a href="#onboarding" className="v2-main-cta"
      onClick={()=>eventV2('eden_onboarding_start',variant)}>START WITH EDEN <span className="v2-cta-arrow"><ArrowRight size={18}/></span></a>
      <Call eden variant={variant}/></div>
    <p className="v2-eden-note"><ShieldCheck size={17}/> Eden is an AI assistant. Live HeyGen video is not yet active in this preview.</p>
   </div>
   <figure className="v2-eden-figure"><img src={edenPortraitArt} alt="Eden Skye with dark brown hair, glasses and a futuristic black jacket" width="900" height="1100"/>
    <figcaption><span className="v2-green-dot"/> EDEN SKYE <small>AI ONBOARDING SPECIALIST</small></figcaption>
   </figure>
  </div></section>
  <Onboarding variant={variant}/>
  <ServiceCards variant={variant}/>
  <section className="v2-last-cta"><h2>Ready when you are.</h2><div className="v2-last-buttons"><Call eden variant={variant}/><a href="#onboarding" className="v2-alt-cta">START YOUR DISCOVERY <ArrowRight size={18}/></a></div></section>
 </>;
}
export default function V2Experience({forceVariant}){
 const {variant:route}=useParams(),variant=forceVariant||(route==='b'?'b':route==='c'||route==='eden'?'c':'a');
 return <div className={'v2-page v2-variant-'+variant}>
   <PreviewHead variant={variant}/><a href="#main-content" className="v2-skip">Skip to content</a>
   <Navigation variant={variant}/>
   <main id="main-content">{variant==='a'?<Hero variant="a"/>:variant==='b'?<LongPage variant="b"/>:<EdenPage variant="c"/>}</main>
   <footer className="v2-footer"><strong>STRATEGIC MINDS AI</strong><span>INTELLIGENCE IN MOTION</span><Link to="/pricing">PRICING</Link><Link to="/portal">CLIENT PORTAL</Link>
    <p><a href={'mailto:'+EMAIL}>{EMAIL}</a> · <a href={BUSINESS_PHONE}>(772) 209-0266</a></p></footer>
 </div>;
}