/* Hrmnx shared footer and app version metadata */
document.addEventListener("DOMContentLoaded",function(){
 var app=document.body.dataset.hrmnxApp||(location.pathname.indexOf("/app/indesign/")>=0?"indesign":"nemawashi");
 document.body.dataset.hrmnxApp=app;
 if(!document.body.dataset.hrmnxVersion)document.body.dataset.hrmnxVersion="1.1.0";
 if(!document.querySelector(".hrmnx-copyright")){var f=document.createElement("footer");f.className="hrmnx-copyright";f.textContent="© 2026 Hrmnx Entertainment";f.style.cssText="padding:18px;text-align:center;color:#9295a0;font:10px Helvetica,Arial,sans-serif";(document.querySelector("main")||document.body).appendChild(f);}
});