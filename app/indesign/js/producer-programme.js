(function(){
"use strict";
const client=window.supabaseClient;
const $=id=>document.getElementById(id);
const status=$("pp-status"),authBox=$("pp-auth"),area=$("pp-submission-area"),closed=$("pp-closed"),select=$("pp-dem-select"),submit=$("pp-submit"),feedback=$("pp-feedback");
let user=null,program=null,dems=[];
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setStatus(open){status.innerHTML='<span class="pp-status-dot '+(open?"is-open":"")+'"></span><span>'+(open?"Applications are open":"Applications are closed")+'</span>';}
function message(node,text){node.hidden=false;node.textContent=text;}
async function load(){
 if(!client){setStatus(false);message(authBox,"The InDesign connection could not be loaded. Please refresh this page.");return;}
 const [{data:sessionData,error:sessionError},{data:programData,error:programError}]=await Promise.all([
  client.auth.getSession(),
  client.from("indesign_producer_programs").select("id,title,description,is_open").eq("slug","open-producer-programme").maybeSingle()
 ]);
 if(sessionError)throw sessionError;
 if(programError)throw programError;
 program=programData;
 setStatus(!!program?.is_open);
 if(!program){message(authBox,"The programme has not been configured yet.");return;}
 if(!sessionData.session?.user){$("pp-account-copy").textContent="Sign in with your KiKi account to submit a DEM. Your account session must be active in this browser.";message(authBox,"No signed-in account was detected. Open KiKi, sign in, then return here in the same browser.");return;}
 user=sessionData.session.user;
 $("pp-account-copy").textContent="Signed in as "+(user.email||"your KiKi account")+". Select a public DEM you own.";
 if(!program.is_open){closed.hidden=false;return;}
 area.hidden=false;
 await loadDems();
 await loadMySubmissions();
}
async function loadDems(){
 const {data,error}=await client.from("indesign_dems").select("id,slug,title,artist,description,created_at").eq("owner_id",user.id).eq("visibility","public").eq("is_public",true).order("created_at",{ascending:false});
 if(error)throw error;
 dems=data||[];
 select.innerHTML='<option value="">Choose a DEM…</option>'+dems.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.title||"Untitled DEM")+' - '+esc(d.artist||"Unknown artist")+'</option>').join("");
 if(!dems.length){select.innerHTML='<option value="">No public DEMs found</option>';feedback.textContent="You do not have a public DEM yet. Create and publish one in InDesign Music, then return here."; }
}
async function loadMySubmissions(){
 const {data,error}=await client.from("indesign_producer_submissions").select("id,dem_id,status,submitted_at").eq("submitter_id",user.id).order("submitted_at",{ascending:false});
 if(error)throw error;
 const rows=data||[];
 $("pp-my-submissions").innerHTML=rows.length?rows.map(s=>{const d=dems.find(x=>x.id===s.dem_id);return '<article class="pp-entry"><strong>'+esc(d?.title||"Submitted DEM")+'</strong><span>'+esc(s.status==="submitted"?"Submitted":"Withdrawn")+' · '+new Date(s.submitted_at).toLocaleDateString()+'</span></article>';}).join(""):'<p class="muted">You have not submitted a DEM yet.</p>';
}
select.addEventListener("change",()=>{submit.disabled=!select.value;});
submit.addEventListener("click",async()=>{
 const dem=dems.find(d=>d.id===select.value);if(!dem||!program?.is_open)return;
 submit.disabled=true;submit.textContent="Submitting…";feedback.textContent="";
 const {error}=await client.from("indesign_producer_submissions").insert({program_id:program.id,dem_id:dem.id,project_id:null,submitter_id:user.id,status:"submitted"});
 if(error){feedback.textContent=error.code==="23505"?"This DEM has already been submitted.":error.message||"Could not submit this DEM.";submit.disabled=false;submit.textContent="Submit to the programme ↗";return;}
 feedback.textContent="Your DEM has been submitted to the Producer Programme.";
 select.value="";submit.textContent="Submitted";await loadMySubmissions();
});
load().catch(error=>{console.error("Producer Programme:",error);setStatus(false);message(authBox,error.message||"Could not load the Producer Programme.");});
})();