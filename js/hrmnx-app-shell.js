/* Hrmnx shared footer and app version metadata */
document.addEventListener("DOMContentLoaded",function(){
 var app=document.body.dataset.hrmnxApp||(location.pathname.indexOf("/app/indesign/")>=0?"indesign":"nemawashi");
 document.body.dataset.hrmnxApp=app;
 if(!document.body.dataset.hrmnxVersion)document.body.dataset.hrmnxVersion="1.1.0";
 if(!document.querySelector(".hrmnx-copyright")){
  var existing=document.querySelector("footer");
  var mark=document.createElement("span");mark.className="hrmnx-copyright";mark.textContent="© 2026 Hrmnx Entertainment";
  mark.style.cssText="display:block;padding:12px;text-align:center;color:#9295a0;font:10px Helvetica,Arial,sans-serif";
  if(existing)existing.appendChild(mark);
  else{var footer=document.createElement("footer");footer.appendChild(mark);(document.querySelector("main")||document.body).appendChild(footer);}
 }
});