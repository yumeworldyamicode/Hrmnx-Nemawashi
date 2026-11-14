(function(){
"use strict";

const logoUrls = {
  figma:"https://cdn.simpleicons.org/figma",
  adobe:"https://cdn.simpleicons.org/adobecreativecloud",
  canva:"https://cdn.simpleicons.org/canva",
  penpot:"https://cdn.simpleicons.org/penpot",
  ableton_live:"https://cdn.simpleicons.org/abletonlive",
  fl_studio:"https://cdn.simpleicons.org/flstudio",
  logic_pro:"https://cdn.simpleicons.org/logicpro",
  studio_one:"https://cdn.simpleicons.org/presonus"
};
const logoFallbacks = {
  figma:"F", adobe:"A", canva:"Canva", penpot:"P",
  ableton_live:"LIVE", fl_studio:"FL", logic_pro:"Logic", studio_one:"S1"
};

const providers = [
  {id:"figma",category:"Design",name:"Figma",kind:"Cloud design",method:"Figma OAuth and REST API",transport:"Cloud API",capabilities:["Browse design files","Import frames and image references","Read supported file metadata and comments"],phase:"Cloud API adapter"},
  {id:"adobe",category:"Design",name:"Adobe Creative Cloud",kind:"Creative suite",method:"Adobe OAuth and supported Creative Cloud APIs",transport:"Cloud API + file exchange",capabilities:["Browse supported cloud assets","Import artwork and references","Export compatible assets"],phase:"API and file adapter"},
  {id:"canva",category:"Design",name:"Canva",kind:"Online design",method:"Canva Connect APIs and approved OAuth scopes",transport:"Cloud API",capabilities:["Import supported designs","Export promotional assets","Access approved brand content"],phase:"Cloud API adapter"},
  {id:"penpot",category:"Design",name:"Penpot",kind:"Open design platform",method:"Supported API and interoperable design files",transport:"API + file exchange",capabilities:["Import design references","Exchange SVG assets","Explore project-level workflows"],phase:"API and file adapter"},
  {id:"ableton_live",category:"DAW",name:"Ableton Live",kind:"Desktop DAW",method:"Project/audio file exchange; optional local companion later",transport:"Desktop files",capabilities:["Import audio exports","Exchange stems and reference audio","Attach session notes"],phase:"File adapter"},
  {id:"fl_studio",category:"DAW",name:"FL Studio",kind:"Desktop DAW",method:"Project/audio file exchange; optional local companion later",transport:"Desktop files",capabilities:["Import audio exports","Exchange stems and reference audio","Attach production notes"],phase:"File adapter"},
  {id:"logic_pro",category:"DAW",name:"Logic Pro",kind:"Desktop DAW",method:"Project/audio file exchange; optional local companion later",transport:"Desktop files",capabilities:["Import audio exports","Exchange stems and reference audio","Attach session notes"],phase:"File adapter"},
  {id:"studio_one",category:"DAW",name:"Studio One",kind:"Desktop DAW",method:"Project/audio file exchange; optional local companion later",transport:"Desktop files",capabilities:["Import audio exports","Exchange stems and reference audio","Attach production notes"],phase:"File adapter"}
];

let connections = {};
let connectionStateLoaded = false;
let connectionLoadPromise = null;
let connectionSchemaUnavailable = false;
let activeFilter = "All";

function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function statusFor(providerId){
  const connection = connections[providerId];
  if(!connection) return {label:connectionSchemaUnavailable ? "DATABASE SETUP NEEDED" : "NOT CONNECTED",state:connectionSchemaUnavailable ? "setup" : "disconnected",account:""};
  const map = {
    pending:{label:"SETUP PENDING",state:"pending"},
    connected:{label:"CONNECTED",state:"connected"},
    expired:{label:"REAUTHORIZE",state:"expired"},
    error:{label:"NEEDS ATTENTION",state:"error"},
    disconnected:{label:"NOT CONNECTED",state:"disconnected"}
  };
  return {...(map[connection.status] || map.disconnected),account:connection.account_label || ""};
}

async function loadConnections(){
  if(connectionLoadPromise) return connectionLoadPromise;
  connectionLoadPromise = (async()=>{
    try{
      const client = window.supabaseClient;
      if(!client) return;
      const auth = await client.auth.getUser();
      const user = auth?.data?.user;
      if(!user) return;
      const result = await client.from("indesign_integration_connections")
        .select("provider,status,account_label,last_synced_at")
        .eq("user_id",user.id);
      if(result.error){
        connectionSchemaUnavailable = true;
        return;
      }
      connections = {};
      (result.data || []).forEach(row=>{connections[row.provider]=row;});
      connectionSchemaUnavailable = false;
      connectionStateLoaded = true;
    }catch(error){
      console.warn("indesign integration status could not be loaded:",error);
    }finally{
      connectionLoadPromise = null;
    }
  })();
  return connectionLoadPromise;
}

function card(item,index){
  const status = statusFor(item.id);
  return '<article class="integration-card" data-provider="'+escapeHTML(item.id)+'">'+
    '<div class="integration-card-top"><span class="integration-icon"><span class="integration-logo-fallback" hidden>'+escapeHTML(logoFallbacks[item.id]||item.name)+'</span><img src="'+logoUrls[item.id]+'" alt="'+escapeHTML(item.name)+' logo" loading="lazy"></span>'+
    '<span class="integration-status" data-status="'+status.state+'">'+status.label+'</span></div>'+
    '<p class="integration-category">'+item.category+' / '+escapeHTML(item.kind)+'</p>'+
    '<h3>'+escapeHTML(item.name)+'</h3>'+
    '<p class="integration-description">'+escapeHTML(item.capabilities[0])+', '+escapeHTML(item.capabilities[1].toLowerCase())+'.</p>'+
    (status.account?'<p class="integration-account">'+escapeHTML(status.account)+'</p>':'')+
    '<div class="integration-card-bottom"><span>'+escapeHTML(item.phase)+'</span>'+
    '<div class="integration-card-actions">'+
    (["figma","adobe","canva"].includes(item.id)?'<button class="button button-dark integration-connect" data-connect-integration="'+escapeHTML(item.id)+'">Connect '+window.HrmnxIcons.svg("external-link")+'</button>':'')+
    '<button class="button button-outline integration-details" data-integration="'+index+'">Details</button></div></div></article>';
}

function render(filter="All",refresh=true){
  activeFilter=filter;
  const list=filter==="All"?providers:providers.filter(p=>p.category===filter);
  const connectedCount=providers.filter(p=>connections[p.id]?.status==="connected").length;
  const html='<div class="integrations-intro"><div><p class="eyebrow">CONNECT YOUR CREATIVE TOOLS</p>'+
    '<h2>One workspace.<br>Every workflow.</h2>'+
    '<p class="muted">Bring design references, production files and creative projects into indesign.</p></div>'+
    '<div class="integration-summary"><strong>'+connectedCount+' / '+providers.length+'</strong>'+
    '<span>CONNECTED TOOLS</span><small>Design + DAW</small></div></div>'+
    '<div class="integration-filters" role="group" aria-label="Filter integrations">'+
    '<button class="integration-filter '+(filter==="All"?"active":"")+'" data-integration-filter="All">All <span>08</span></button>'+
    '<button class="integration-filter '+(filter==="Design"?"active":"")+'" data-integration-filter="Design">Design <span>04</span></button>'+
    '<button class="integration-filter '+(filter==="DAW"?"active":"")+'" data-integration-filter="DAW">DAW <span>04</span></button></div>'+
    '<div class="integration-grid">'+list.map(p=>card(p,providers.indexOf(p))).join("")+'</div>'+
    '<div class="integration-note"><strong>Shared integration foundation</strong>'+
    '<p>Cloud design services will use secure account authorisation. Desktop DAWs will begin with supported project and audio file exchange. Each provider uses the same connection registry, project-linking model and sync history.</p>'+
    '<span>'+(connectionSchemaUnavailable?"The integration database is not ready yet. Run database/step-8-integrations.sql in the Supabase SQL Editor.":connectionStateLoaded?"Connection status is read from your employee account. No OAuth tokens are exposed to this page.":"Checking your integration connection records…")+'</span></div>'+(window.indesignFileExchange ? window.indesignFileExchange.markup() : '');
  if(refresh && !connectionStateLoaded && !connectionSchemaUnavailable){
    loadConnections().then(()=>{
      const host=document.getElementById("dashboard-content");
      const pageTitle=document.getElementById("page-title");
      if(host && pageTitle && pageTitle.textContent==="Integrations"){host.innerHTML=render(activeFilter,false);window.indesignFileExchange?.init();}
    });
  }
  return html;
}

async function connectProvider(provider){
  const client=window.supabaseClient;
  if(!client){window.alert("Supabase is not available. Refresh the page and try again.");return;}
  const button=document.querySelector('[data-connect-integration="'+provider+'"]');
  if(button){button.disabled=true;button.textContent="Connecting…";}
  try{
    const {data,error}=await client.functions.invoke("indesign-oauth-start",{body:{provider}});
    if(error)throw error;
    if(!data?.authorization_url)throw new Error(data?.error||"The provider did not return an authorisation link.");
    window.location.assign(data.authorization_url);
  }catch(error){
    console.error("indesign provider connection could not start:",error);
    const message=error?.context?.error||error?.message||"Could not start the secure connection.";
    const toast=document.getElementById("toast");
    if(toast){toast.textContent=message;toast.classList.add("visible");}
    else window.alert(message);
    if(button){button.disabled=false;button.innerHTML='Connect '+window.HrmnxIcons.svg("external-link");}
  }
}

function showDetails(index){
  const item=providers[index];
  if(!item)return;
  const status=statusFor(item.id);
  const old=document.querySelector(".integration-detail-overlay");
  if(old)old.remove();
  const overlay=document.createElement("div");
  overlay.className="indesign-dialog-overlay integration-detail-overlay";
  overlay.innerHTML='<section class="indesign-dialog integration-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="integration-detail-title">'+
    '<p class="eyebrow">'+item.category+' INTEGRATION</p><h2 id="integration-detail-title">'+escapeHTML(item.name)+'</h2>'+
    '<p class="muted">'+escapeHTML(item.kind)+'</p>'+
    '<div class="integration-detail-status" data-status="'+status.state+'">'+status.label+(status.account?" · "+escapeHTML(status.account):"")+'</div>'+
    '<h3>Planned capabilities</h3><ul>'+item.capabilities.map(x=>'<li>'+escapeHTML(x)+'</li>').join("")+'</ul>'+
    '<h3>Connection approach</h3><p>'+escapeHTML(item.method)+'</p>'+
    '<p class="integration-detail-warning">The account/API connection is not active yet. This provider will only be marked connected after a real authorisation or verified connection succeeds.</p>'+
    '<div class="dialog-actions"><button class="button button-dark" data-close-integration-details>Close</button></div></section>';
  document.body.appendChild(overlay);
  overlay.addEventListener("click",e=>{
    if(e.target===overlay||e.target.closest("[data-close-integration-details]"))overlay.remove();
  });
}

document.addEventListener("error",e=>{
  const image=e.target;
  if(image instanceof HTMLImageElement && image.matches(".integration-icon img")){
    image.hidden=true;
    const fallback=image.previousElementSibling;
    if(fallback)fallback.hidden=false;
  }
},true);

document.addEventListener("click",e=>{
  const filter=e.target.closest("[data-integration-filter]");
  if(filter){
    const host=document.getElementById("dashboard-content");
    if(host){host.innerHTML=render(filter.dataset.integrationFilter,false);window.indesignFileExchange?.init();}
    return;
  }
  const connect=e.target.closest("[data-connect-integration]");
  if(connect){connectProvider(connect.dataset.connectIntegration);return;}
  const detail=e.target.closest("[data-integration]");
  if(detail)showDetails(Number(detail.dataset.integration));
});

window.indesignIntegrations={
  render,
  refresh:async()=>{
    await loadConnections();
    const host=document.getElementById("dashboard-content");
    if(host){host.innerHTML=render(activeFilter,false);window.indesignFileExchange?.init();}
  },
  providers:providers.map(({id,category,name,kind,transport,capabilities})=>({id,category,name,kind,transport,capabilities:[...capabilities]}))
};
})();