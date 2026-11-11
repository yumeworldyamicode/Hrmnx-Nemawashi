(function(){
"use strict";
const providers=[
{category:"Design",name:"Figma",kind:"Cloud design",method:"OAuth + REST API",capabilities:["Browse design files","Import frames and images","Read file metadata and comments"],phase:"API integration"},
{category:"Design",name:"Adobe Creative Cloud",kind:"Creative suite",method:"Adobe OAuth + supported APIs",capabilities:["Browse supported cloud assets","Import artwork and references","Export compatible assets"],phase:"API and file support"},
{category:"Design",name:"Canva",kind:"Online design",method:"Canva Connect APIs",capabilities:["Import supported designs","Export promotional assets","Access approved brand content"],phase:"API integration"},
{category:"Design",name:"Penpot",kind:"Open design platform",method:"Supported API and file exchange",capabilities:["Import design references","Exchange SVG assets","Explore project-level workflows"],phase:"API and file support"},
{category:"DAW",name:"Ableton Live",kind:"Desktop DAW",method:"Exported files + optional local companion",capabilities:["Import audio exports","Exchange stems and reference audio","Attach session notes"],phase:"File integration"},
{category:"DAW",name:"FL Studio",kind:"Desktop DAW",method:"Exported files + optional local companion",capabilities:["Import audio exports","Exchange stems and reference audio","Attach production notes"],phase:"File integration"},
{category:"DAW",name:"Logic Pro",kind:"Desktop DAW",method:"Exported files + optional local companion",capabilities:["Import audio exports","Exchange stems and reference audio","Attach session notes"],phase:"File integration"},
{category:"DAW",name:"Studio One",kind:"Desktop DAW",method:"Exported files + optional local companion",capabilities:["Import audio exports","Exchange stems and reference audio","Attach production notes"],phase:"File integration"}
];
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function card(item,index){return '<article class="integration-card"><div class="integration-card-top"><span class="integration-icon">'+(item.category==="Design"?"✳":"♫")+'</span><span class="integration-status">NOT CONNECTED</span></div><p class="integration-category">'+item.category+' / '+item.kind+'</p><h3>'+item.name+'</h3><p class="integration-description">'+item.capabilities[0]+', '+item.capabilities[1].toLowerCase()+'.</p><div class="integration-card-bottom"><span>'+item.phase+'</span><button class="button button-outline integration-details" data-integration="'+index+'">Details ↗</button></div></article>';}
function render(filter="All"){
const list=filter==="All"?providers:providers.filter(p=>p.category===filter);
return '<div class="integrations-intro"><div><p class="eyebrow">CONNECT YOUR CREATIVE TOOLS</p><h2>One workspace.<br>Every workflow.</h2><p class="muted">Bring design references, production files and creative projects into indesign.</p></div><div class="integration-summary"><strong>'+providers.length+'</strong><span>PLANNED CONNECTIONS</span><small>Design + DAW</small></div></div><div class="integration-filters" role="group" aria-label="Filter integrations"><button class="integration-filter '+(filter==="All"?"active":"")+'" data-integration-filter="All">All <span>08</span></button><button class="integration-filter '+(filter==="Design"?"active":"")+'" data-integration-filter="Design">Design <span>04</span></button><button class="integration-filter '+(filter==="DAW"?"active":"")+'" data-integration-filter="DAW">DAW <span>04</span></button></div><div class="integration-grid">'+list.map(p=>card(p,providers.indexOf(p))).join("")+'</div><div class="integration-note"><strong>How connections will work</strong><p>Cloud services will use secure account authorisation. Desktop DAWs will start with supported project and audio file exchange; live synchronisation will only be added where the software supports it.</p><span>Connections are not active yet. No accounts or files have been linked.</span></div>';
}
function showDetails(index){
const item=providers[index];if(!item)return;
const old=document.querySelector(".integration-detail-overlay");if(old)old.remove();
const overlay=document.createElement("div");overlay.className="indesign-dialog-overlay integration-detail-overlay";
overlay.innerHTML='<section class="indesign-dialog integration-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="integration-detail-title"><p class="eyebrow">'+item.category+' INTEGRATION</p><h2 id="integration-detail-title">'+escapeHTML(item.name)+'</h2><p class="muted">'+escapeHTML(item.kind)+'</p><div class="integration-detail-status">NOT CONNECTED · SETUP NOT STARTED</div><h3>Planned capabilities</h3><ul>'+item.capabilities.map(x=>'<li>'+escapeHTML(x)+'</li>').join("")+'</ul><h3>Connection approach</h3><p>'+escapeHTML(item.method)+'</p><p class="integration-detail-warning">This is a planned adapter, not an active connection. We will only show it as connected after authentication or a verified file connection succeeds.</p><div class="dialog-actions"><button class="button button-dark" data-close-integration-details>Close</button></div></section>';
document.body.appendChild(overlay);
overlay.addEventListener("click",e=>{if(e.target===overlay||e.target.closest("[data-close-integration-details]"))overlay.remove();});
}
document.addEventListener("click",e=>{
const filter=e.target.closest("[data-integration-filter]");if(filter){const host=document.getElementById("dashboard-content");if(host)host.innerHTML=render(filter.dataset.integrationFilter);return;}
const detail=e.target.closest("[data-integration]");if(detail)showDetails(Number(detail.dataset.integration));
});
window.indesignIntegrations={render};
})();