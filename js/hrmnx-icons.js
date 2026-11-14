(function(){
"use strict";
const p={
home:'<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>',
message:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8v.5Z"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
building:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21v-4h6v4M8 7h2m4 0h2M8 11h2m4 0h2"/>',
shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
sparkles:'<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>',
music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
folder:'<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/>',
board:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
brainstorm:'<path d="M9 18h6m-5 4h4"/><path d="M8.5 14.5a7 7 0 1 1 7 0c-.9.6-1.5 1.4-1.5 2.5h-4c0-1.1-.6-1.9-1.5-2.5Z"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="m19 13 2 1-2 4-2-1-2 1v2h-5v-2l-2-1-2 1-2-4 2-1v-2l-2-1 2-4 2 1 2-1V4h5v2l2 1 2-1 2 4-2 1v2Z"/>',
arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
chevron:'<path d="m9 18 6-6-6-6"/>',
back:'<path d="m15 18-6-6 6-6M9 12h12"/>',
image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
play:'<path d="m8 5 12 7-12 7V5Z"/>',
check:'<path d="m5 12 4 4L19 6"/>',
close:'<path d="m18 6-12 12M6 6l12 12"/>',
edit:'<path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/>',
trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
upload:'<path d="M12 16V4m-4 4 4-4 4 4"/><path d="M4 16v4h16v-4"/>',
download:'<path d="M12 4v12m-4-4 4 4 4-4"/><path d="M4 20h16"/>',
layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
heart:'<path d="M20.8 8.8c0 5.1-8.8 10-8.8 10s-8.8-4.9-8.8-10A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z"/>'
};
window.HrmnxIcons={svg:(name,cls="")=>'<svg class="hrmnx-icon '+cls+'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[name]||p.sparkles)+'</svg>'};

function replacePlaceholders(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())if(/\\$\\{window\\.HrmnxIcons\\.svg\\("[a-z-]+"\\)\\}/.test(walker.currentNode.nodeValue))nodes.push(walker.currentNode);
 nodes.forEach(node=>{
  const template=document.createElement("template");
  template.innerHTML=node.nodeValue.replace(/\\$\\{window\\.HrmnxIcons\\.svg\\("([a-z-]+)"\\)\\}/g,(_,name)=>window.HrmnxIcons.svg(name));
  node.replaceWith(template.content);
 });
}
replacePlaceholders(document.documentElement);
new MutationObserver(records=>records.forEach(record=>{
 record.addedNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE)replacePlaceholders(node.parentNode);else if(node.nodeType===Node.ELEMENT_NODE)replacePlaceholders(node);});
})).observe(document.documentElement,{childList:true,subtree:true});
})();