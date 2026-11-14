(function(){
"use strict";
const client=window.supabaseClient,$=id=>document.getElementById(id);
const status=$("pw-status"),app=$("pw-app"),authRequired=$("pw-auth-required"),closed=$("pw-closed"),list=$("pw-project-list"),editor=$("pw-editor");
let user=null,program=null,projects=[],active=null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defaults=()=>[{id:"ideas",title:"Song ideas",items:[]},{id:"production",title:"Production",items:[]},{id:"lyrics",title:"Lyrics & topline",items:[]},{id:"arrangement",title:"Arrangement",items:[]}];
function normalise(project){if(!project.content||typeof project.content!=="object")project.content={};project.content.mode="music";if(!project.content.music||typeof project.content.music!=="object")project.content.music={};if(!Array.isArray(project.content.music.sections))project.content.music.sections=defaults();project.content.music.sections.forEach((s,i)=>{if(!s.id)s.id="section-"+i;if(!Array.isArray(s.items))s.items=[];});return project;}
function setStatus(text){status.textContent=text;}
async function init(){
 if(!client)throw new Error("The InDesign connection could not be loaded.");
 const [{data:s,error:se},{data:p,error:pe}]=await Promise.all([client.auth.getSession(),client.from("indesign_producer_programs").select("id,title,is_open").eq("slug","open-producer-programme").maybeSingle()]);
 if(se)throw se;if(pe)throw pe;program=p;
 if(!s.session?.user){status.hidden=true;authRequired.hidden=false;return;}
 user=s.session.user;
 if(!program){setStatus("The Producer Programme has not been configured yet.");return;}
 if(!program.is_open){status.hidden=true;closed.hidden=false;return;}
 status.hidden=true;app.hidden=false;await loadProjects();
}
async function loadProjects(){
 const {data,error}=await client.from("indesign_projects").select("id,owner_id,name,type,description,content,producer_program_id,created_at,updated_at").eq("owner_id",user.id).eq("producer_program_id",program.id).eq("type","brainstorm").order("updated_at",{ascending:false});
 if(error)throw error;projects=(data||[]).map(normalise);renderList();
}
function renderList(){
 editor.hidden=true;list.hidden=false;$("pw-heading").textContent="Your projects";
 list.innerHTML=projects.length?projects.map(p=>'<article class="pw-project-card"><div><span class="pw-project-kind">MUSIC BRAINSTORM</span><h3>'+esc(p.name)+'</h3><small>Updated '+new Date(p.updated_at||p.created_at).toLocaleDateString()+'</small></div><button class="button button-outline" data-open="'+esc(p.id)+'">Open project ↗</button></article>').join(""):'<div class="pw-empty"><strong>No Music Brainstorms yet.</strong><p>Create your first project to start developing an idea.</p></div>';
}
async function createProject(){
 const name=$("pw-new-name")?.value.trim()||"";
 if(!name){$("pw-new-name")?.focus();return;}
 const content={mode:"music",music:{projectName:name,daw:"",bpm:"",key:"",contributors:"",sections:defaults()},comeback:{sections:[]}};
 const {data,error}=await client.from("indesign_projects").insert({owner_id:user.id,name,type:"brainstorm",description:"Producer Programme Music Brainstorm",content,producer_program_id:program.id}).select("id,owner_id,name,type,description,content,producer_program_id,created_at,updated_at").single();
 if(error){setStatus(error.message||"Could not create your project. Check that database steps 12 and 13 have been run.");return;}
 active=normalise(data);projects.unshift(active);renderEditor();
}
function renderCreateForm(){
 const existing=$("pw-create-form");if(existing){existing.remove();return;}
 const form=document.createElement("div");form.id="pw-create-form";form.className="pw-create-form";
 form.innerHTML='<label for="pw-new-name">Project name</label><input id="pw-new-name" maxlength="120" placeholder="e.g. Midnight Bloom" autocomplete="off"><div><button class="button button-dark" id="pw-confirm-create">Create Music Brainstorm</button><button class="button button-outline" id="pw-cancel-create">Cancel</button></div>';
 $("pw-project-list").prepend(form);$("pw-new-name").focus();
}
function renderEditor(){
 if(!active)return;normalise(active);list.hidden=true;editor.hidden=false;$("pw-heading").textContent=active.name;
 const m=active.content.music,sections=m.sections;
 editor.innerHTML='<div class="pw-editor-top"><button class="pw-back" id="pw-back">← All projects</button><div><span class="pw-project-kind">OFFICIAL PROGRAMME PROJECT</span><h2>'+esc(active.name)+'</h2></div><button class="button button-dark" id="pw-save">Save changes</button></div>'+
 '<div class="pw-meta"><label>Project title<input data-meta="projectName" value="'+esc(m.projectName||active.name)+'"></label><label>DAW<input data-meta="daw" value="'+esc(m.daw||'')+'" placeholder="e.g. Ableton Live"></label><label>BPM<input data-meta="bpm" value="'+esc(m.bpm||'')+'" inputmode="numeric" placeholder="e.g. 124"></label><label>Key<input data-meta="key" value="'+esc(m.key||'')+'" placeholder="e.g. F minor"></label><label class="pw-wide">Contributors<input data-meta="contributors" value="'+esc(m.contributors||'')+'" placeholder="Names or roles"></label></div>'+
 '<div class="pw-section-heading"><div><span class="eyebrow">IDEA BOARD</span><h3>Develop your sound.</h3></div><button class="button button-outline" id="pw-add-section">＋ Add section</button></div>'+
 sections.map((s,i)=>'<section class="pw-section" data-section="'+i+'"><header><input data-section-title="'+i+'" aria-label="Section title" value="'+esc(s.title)+'"><button class="pw-remove-section" data-remove-section="'+i+'" aria-label="Remove section">×</button></header><div class="pw-ideas">'+(s.items.length?s.items.map((item,j)=>'<article class="pw-idea"><textarea data-idea="'+i+':'+j+'" rows="2" aria-label="Idea">'+esc(item.text||"")+'</textarea><button data-remove-idea="'+i+':'+j+'" aria-label="Remove idea">×</button></article>').join(""):'<p class="pw-no-ideas">Add an idea, note or production direction.</p>')+'</div><div class="pw-add-idea"><input data-new-idea="'+i+'" placeholder="Write an idea…"><button class="button button-outline" data-add-idea="'+i+'">Add idea</button></div></section>').join("")+
 '<p class="pw-save-state" id="pw-save-state">Changes are saved when you select “Save changes”.</p>';
}
function collectEditor(){
 const m=active.content.music;
 document.querySelectorAll("[data-meta]").forEach(el=>m[el.dataset.meta]=el.value.trim());
 const sections=m.sections;
 document.querySelectorAll("[data-section-title]").forEach(el=>{const s=sections[Number(el.dataset.sectionTitle)];if(s)s.title=el.value.trim()||"Untitled section";});
 document.querySelectorAll("[data-idea]").forEach(el=>{const [si,ii]=el.dataset.idea.split(":").map(Number);if(sections[si]?.items[ii])sections[si].items[ii].text=el.value;});
}
async function save(){
 collectEditor();active.name=active.content.music.projectName||active.name;
 const {data,error}=await client.from("indesign_projects").update({name:active.name,content:active.content,updated_at:new Date().toISOString()}).eq("id",active.id).eq("owner_id",user.id).select().single();
 if(error){$("pw-save-state").textContent=error.message||"Could not save changes.";return;}
 active=normalise(data);projects=projects.map(p=>p.id===data.id?active:p);$("pw-save-state").textContent="Saved just now.";
}
document.addEventListener("click",async event=>{
 if(event.target.closest("#pw-create")){renderCreateForm();return;}
 if(event.target.closest("#pw-confirm-create")){await createProject();return;}
 if(event.target.closest("#pw-cancel-create")){$("pw-create-form")?.remove();return;}
 const open=event.target.closest("[data-open]");if(open){active=projects.find(p=>p.id===open.dataset.open);renderEditor();return;}
 if(event.target.closest("#pw-back")){collectEditor();await save();renderList();return;}
 if(event.target.closest("#pw-save")){await save();return;}
 if(event.target.closest("#pw-add-section")){collectEditor();active.content.music.sections.push({id:"section-"+Date.now(),title:"New section",items:[]});renderEditor();return;}
 const add=event.target.closest("[data-add-idea]");if(add){collectEditor();const i=Number(add.dataset.addIdea),field=document.querySelector('[data-new-idea="'+i+'"]'),value=field?.value.trim();if(!value)return;active.content.music.sections[i].items.push({text:value});renderEditor();return;}
 const removeIdea=event.target.closest("[data-remove-idea]");if(removeIdea){collectEditor();const [i,j]=removeIdea.dataset.removeIdea.split(":").map(Number);active.content.music.sections[i]?.items.splice(j,1);renderEditor();return;}
 const removeSection=event.target.closest("[data-remove-section]");if(removeSection){collectEditor();active.content.music.sections.splice(Number(removeSection.dataset.removeSection),1);renderEditor();return;}
});
$("pw-create").addEventListener("click",()=>{if(!$("pw-create-form"))renderCreateForm();});
$("pw-project-list").addEventListener("keydown",event=>{if(event.key==="Enter"&&event.target.id==="pw-new-name"){event.preventDefault();createProject();}});
init().catch(error=>{console.error("Producer workspace:",error);setStatus(error.message||"Could not load the Music Brainstorm workspace.");});
})();