(function(){
"use strict";
const bucket="indesign-integration-assets";
const providers=[
 {id:"figma",name:"Figma",category:"Design",assetType:"design",accept:".fig,.svg,.png,.jpg,.jpeg,.pdf,.webp"},
 {id:"adobe",name:"Adobe Creative Cloud",category:"Design",assetType:"design",accept:".psd,.ai,.svg,.png,.jpg,.jpeg,.pdf,.webp"},
 {id:"canva",name:"Canva",category:"Design",assetType:"design",accept:".pdf,.svg,.png,.jpg,.jpeg,.pptx,.mp4,.webp"},
 {id:"penpot",name:"Penpot",category:"Design",assetType:"design",accept:".penpot,.svg,.png,.jpg,.jpeg,.pdf,.webp"},
 {id:"ableton_live",name:"Ableton Live",category:"DAW",assetType:"session",accept:".als,.alp,.wav,.mp3,.aiff,.flac,.m4a,.zip"},
 {id:"fl_studio",name:"FL Studio",category:"DAW",assetType:"session",accept:".flp,.fst,.wav,.mp3,.aiff,.flac,.m4a,.zip"},
 {id:"logic_pro",name:"Logic Pro",category:"DAW",assetType:"session",accept:".logicx,.wav,.mp3,.aiff,.flac,.m4a,.zip"},
 {id:"studio_one",name:"Studio One",category:"DAW",assetType:"session",accept:".song,.project,.wav,.mp3,.aiff,.flac,.m4a,.zip"}
];
let projects=[];
let assets=[];
let initialized=false;

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function client(){return window.supabaseClient;}
function provider(id){return providers.find(p=>p.id===id)||providers[0];}
function formatSize(bytes){
 if(bytes<1024)return bytes+" B";
 if(bytes<1048576)return (bytes/1024).toFixed(1)+" KB";
 return (bytes/1048576).toFixed(1)+" MB";
}
function markup(){
 return '<section class="integration-exchange" id="integration-exchange">'+
 '<div class="integration-exchange-heading"><div><p class="eyebrow">BATCH 2 / FILE EXCHANGE</p><h2>Move creative files into projects.</h2><p class="muted">Exchange supported exports and session files with your indesign projects.</p></div><span class="integration-exchange-count">PRIVATE PROJECT STORAGE</span></div>'+
 '<div class="integration-exchange-form">'+
 '<label>Project<select id="integration-file-project"><option value="">Loading projects…</option></select></label>'+
 '<label>Provider<select id="integration-file-provider">'+providers.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join("")+'</select></label>'+
 '<label class="integration-file-picker">Choose file<input id="integration-file-input" type="file"><span id="integration-file-name">No file selected</span></label>'+
 '<button class="button button-dark" id="integration-file-upload" type="button">Upload to project ↗</button>'+
 '</div><p class="integration-file-hint" id="integration-file-hint">Design tools: upload exported artwork or project files. DAWs: upload supported session files, stems or audio exports. This stores the file in the selected indesign project; it does not remotely open or modify the source application.</p>'+
 '<div class="integration-assets-heading"><h3>Project files</h3><button class="text-button" id="integration-file-refresh" type="button">Refresh ↻</button></div>'+
 '<div class="integration-assets-list" id="integration-assets-list"><p class="muted">Choose a project to view its files.</p></div>'+
 '</section>';
}
function notify(message){
 const toast=document.getElementById("toast");
 if(toast){toast.textContent=message;toast.classList.add("visible");setTimeout(()=>toast.classList.remove("visible"),2800);}
}
async function loadProjects(){
 const c=client();if(!c)throw new Error("Supabase is not available.");
 const {data,error}=await c.from("indesign_projects").select("id,name,type").order("updated_at",{ascending:false});
 if(error)throw error;
 projects=data||[];
 const select=document.getElementById("integration-file-project");
 if(!select)return;
 const previous=select.value;
 select.innerHTML='<option value="">Select a project</option>'+projects.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+esc(p.type)+'</option>').join("");
 if(projects.some(p=>p.id===previous))select.value=previous;
}
async function loadAssets(){
 const c=client(),projectId=document.getElementById("integration-file-project")?.value;
 const host=document.getElementById("integration-assets-list");
 if(!host)return;
 if(!projectId){host.innerHTML='<p class="muted">Choose a project to view its files.</p>';return;}
 host.innerHTML='<p class="muted">Loading project files…</p>';
 const {data,error}=await c.from("indesign_integration_assets")
 .select("id,provider,filename,mime_type,size_bytes,asset_type,created_at,storage_path")
 .eq("project_id",projectId).order("created_at",{ascending:false});
 if(error){host.innerHTML='<p class="muted">Could not load files. Check that Step 9 has been run.</p>';return;}
 assets=data||[];
 if(!assets.length){host.innerHTML='<p class="muted">No exchanged files in this project yet.</p>';return;}
 host.innerHTML=assets.map(a=>'<article class="integration-asset-row"><div class="integration-asset-info"><strong>'+esc(a.filename)+'</strong><span>'+esc(provider(a.provider).name)+' · '+formatSize(Number(a.size_bytes)||0)+' · '+esc(a.asset_type)+'</span></div><div class="integration-asset-actions"><button type="button" class="text-button" data-integration-download="'+esc(a.id)+'">Download</button><button type="button" class="text-button integration-asset-delete" data-integration-delete="'+esc(a.id)+'">Remove</button></div></article>').join("");
}
async function uploadFile(){
 const c=client(),projectId=document.getElementById("integration-file-project")?.value;
 const providerId=document.getElementById("integration-file-provider")?.value;
 const input=document.getElementById("integration-file-input"),file=input?.files?.[0];
 if(!projectId){notify("Choose a project first.");return;}
 if(!file){notify("Choose a file first.");return;}
 if(file.size>500*1024*1024){notify("Files must be 500 MB or smaller.");return;}
 const auth=await c.auth.getUser(),user=auth?.data?.user;
 if(!user){notify("Sign in again to upload project files.");return;}
 const p=provider(providerId);
 const cleanName=file.name.replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,150)||"asset";
 const path=user.id+"/"+projectId+"/"+crypto.randomUUID()+"-"+cleanName;
 const button=document.getElementById("integration-file-upload");
 if(button){button.disabled=true;button.textContent="Uploading…";}
 try{
  const stored=await c.storage.from(bucket).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
  if(stored.error)throw stored.error;
  const extension=(file.name.split(".").pop()||"").toLowerCase();
  const audio=["wav","mp3","aiff","flac","m4a","aac","ogg"].includes(extension);
  const archive=["zip","alp","penpot"].includes(extension);
  const documentFile=["pdf","txt","doc","docx"].includes(extension);
  const assetType=p.category==="DAW"?(audio?"audio":archive?"archive":"session"):(documentFile?"document":"design");
  const {error}=await c.from("indesign_integration_assets").insert({
   project_id:projectId,user_id:user.id,provider:providerId,filename:file.name,
   storage_path:path,mime_type:file.type||"application/octet-stream",size_bytes:file.size,asset_type:assetType
  });
  if(error){await c.storage.from(bucket).remove([path]);throw error;}
  input.value="";
  const label=document.getElementById("integration-file-name");if(label)label.textContent="No file selected";
  notify("File added to the project.");
  await loadAssets();
 }catch(error){console.error("Integration file upload failed:",error);notify(error.message||"Could not upload this file.");}
 finally{if(button){button.disabled=false;button.textContent="Upload to project ↗";}}
}
async function downloadFile(id){
 const asset=assets.find(a=>a.id===id);if(!asset)return;
 const {data,error}=await client().storage.from(bucket).createSignedUrl(asset.storage_path,60);
 if(error){notify("Could not create a download link.");return;}
 const a=document.createElement("a");a.href=data.signedUrl;a.download=asset.filename;a.target="_blank";a.rel="noopener";a.click();
}
async function deleteFile(id){
 const asset=assets.find(a=>a.id===id);if(!asset)return;
 if(!window.confirm("Remove "+asset.filename+" from this project?"))return;
 const c=client();
 const removed=await c.storage.from(bucket).remove([asset.storage_path]);
 if(removed.error){notify("Could not remove the stored file.");return;}
 const result=await c.from("indesign_integration_assets").delete().eq("id",id);
 if(result.error){notify("The file was removed from storage but its record could not be deleted.");return;}
 notify("Project file removed.");await loadAssets();
}
function init(){
 const host=document.getElementById("integration-exchange");
 if(!host||host.dataset.initialized==="true")return;
 host.dataset.initialized="true";
 host.addEventListener("click",async e=>{
  if(e.target.closest("#integration-file-upload")){await uploadFile();return;}
  if(e.target.closest("#integration-file-refresh")){await loadAssets();return;}
  const download=e.target.closest("[data-integration-download]");
  if(download){await downloadFile(download.dataset.integrationDownload);return;}
  const remove=e.target.closest("[data-integration-delete]");
  if(remove){await deleteFile(remove.dataset.integrationDelete);}
 });
 host.addEventListener("change",async e=>{
  if(e.target.id==="integration-file-project")await loadAssets();
  if(e.target.id==="integration-file-provider"){
   const p=provider(e.target.value),file=document.getElementById("integration-file-input");
   if(file)file.accept=p.accept;
  }
  if(e.target.id==="integration-file-input"){
   const label=document.getElementById("integration-file-name");
   if(label)label.textContent=e.target.files?.[0]?.name||"No file selected";
  }
 });
 const select=document.getElementById("integration-file-provider");
 if(select)select.dispatchEvent(new Event("change",{bubbles:true}));
 loadProjects().then(loadAssets).catch(error=>{
  console.error("Integration project file exchange could not initialise:",error);
  const list=document.getElementById("integration-assets-list");
  if(list)list.innerHTML='<p class="muted">Project file exchange is not ready. Check the Step 9 database migration.</p>';
 });
}
window.indesignFileExchange={markup,init,refresh:loadAssets};
})();