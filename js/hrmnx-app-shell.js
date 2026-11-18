/* Shared Hrmnx copyright footer and version/update dialog. */
(function(){
"use strict";
var SUPABASE_URL="https://bftgnubawqwvpbqkldpm.supabase.co";
var SUPABASE_KEY="sb_publishable_Uoky_Y8iSnzCu0wOa5_y-w_McGOJcJ4";
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
function footer(){
 if(document.querySelector(".hrmnx-copyright"))return;
 var existing=document.querySelector("footer"),mark=document.createElement("span");
 mark.className="hrmnx-copyright";mark.textContent="© 2026 Hrmnx Entertainment";
 mark.style.cssText="display:block;padding:12px;text-align:center;color:#9295a0;font:10px Helvetica,Arial,sans-serif";
 if(existing)existing.appendChild(mark);
 else{var f=document.createElement("footer");f.appendChild(mark);(document.querySelector("main")||document.body).appendChild(f);}
}
function updateStyles(){
 if(document.getElementById("hrmnx-update-styles"))return;
 var s=document.createElement("style");s.id="hrmnx-update-styles";
 s.textContent=".hrmnx-update-overlay{position:fixed;inset:0;background:rgba(17,19,29,.55);z-index:100000;display:grid;place-items:center;padding:20px;opacity:0;transition:opacity .2s}.hrmnx-update-overlay.visible{opacity:1}.hrmnx-update-card{position:relative;background:#fff;color:#171923;width:min(480px,100%);padding:30px;font-family:Helvetica,Arial,sans-serif;box-shadow:0 18px 65px rgba(0,0,0,.18)}.hrmnx-update-brand{font-size:10px;letter-spacing:1.5px;color:#748fe8;font-weight:700}.hrmnx-update-card h2{font-size:25px;margin:14px 0 8px}.hrmnx-update-card p{font-size:12px;line-height:1.7;color:#696d78;white-space:pre-line}.hrmnx-update-version{font-size:10px;color:#8b8e99;margin-top:14px}.hrmnx-update-actions{display:flex;justify-content:flex-end;margin-top:20px}.hrmnx-update-actions button{background:#171923;color:#fff;border:0;padding:11px 18px;font-size:11px;cursor:pointer}.hrmnx-update-close{position:absolute;right:13px;top:12px;border:0;background:transparent;color:#777;font-size:20px;cursor:pointer}";
 document.head.appendChild(s);
}
async function checkUpdate(app,version){
 try{
  var url=SUPABASE_URL+"/rest/v1/hrmnx_app_releases?app_slug=eq."+encodeURIComponent(app)+"&is_published=eq.true&select=version,title,summary,released_at&order=released_at.desc&limit=1";
  var response=await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY}});
  if(!response.ok)return;var list=await response.json(),release=list&&list[0];if(!release)return;
  var key="hrmnx-update-seen-"+app,seen="";try{seen=localStorage.getItem(key)||"";}catch(e){}
  if(seen===release.version)return;
  updateStyles();var overlay=document.createElement("div");overlay.className="hrmnx-update-overlay";
  overlay.innerHTML='<section class="hrmnx-update-card" role="dialog" aria-modal="true" aria-labelledby="hrmnx-update-title"><button class="hrmnx-update-close" type="button" aria-label="Close">×</button><span class="hrmnx-update-brand">HRMNX / '+esc(app.toUpperCase())+'</span><h2 id="hrmnx-update-title">'+esc(release.title||"What's new")+'</h2><p>'+esc(release.summary||"This app has received an update.")+'</p><div class="hrmnx-update-version">APP VERSION '+esc(version)+" · RELEASE "+esc(release.version)+'</div><div class="hrmnx-update-actions"><button type="button">Continue</button></div></section>';
  var dismiss=function(){try{localStorage.setItem(key,release.version);}catch(e){}overlay.remove();};
  overlay.querySelector(".hrmnx-update-close").onclick=dismiss;overlay.querySelector(".hrmnx-update-actions button").onclick=dismiss;
  overlay.addEventListener("click",function(e){if(e.target===overlay)dismiss();});
  document.body.appendChild(overlay);requestAnimationFrame(function(){overlay.classList.add("visible");});
 }catch(e){console.warn("Hrmnx update check unavailable",e);}
}
document.addEventListener("DOMContentLoaded",function(){
 var app=document.body.dataset.hrmnxApp||(location.pathname.indexOf("/app/indesign/")>=0?"indesign":"nemawashi");
 var version=document.body.dataset.hrmnxVersion||"1.0.0";
 document.body.dataset.hrmnxApp=app;document.body.dataset.hrmnxVersion=version;
 footer();checkUpdate(app,version);
});
})();