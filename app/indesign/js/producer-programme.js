(function(){
"use strict";
const client=window.supabaseClient;
const $=id=>document.getElementById(id);
const status=$("pp-status"),authBox=$("pp-auth"),loginForm=$("pp-login-form"),loginButton=$("pp-login"),signoutButton=$("pp-signout"),area=$("pp-submission-area"),closed=$("pp-closed");
let user=null,program=null;
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setStatus(open){status.innerHTML='<span class="pp-status-dot '+(open?"is-open":"")+'"></span><span>'+(open?"Applications are open":"Applications are closed")+'</span>';}
function message(node,text){node.hidden=false;node.textContent=text;}
async function load(){
 if(!client){setStatus(false);message(authBox,"The InDesign connection could not be loaded. Please refresh this page.");return;}
 const [{data:sessionData,error:sessionError},{data:programData,error:programError}]=await Promise.all([
  client.auth.getSession(),
  client.from("indesign_producer_programs").select("id,title,description,is_open").eq("slug","open-producer-programme").maybeSingle()
 ]);
 if(sessionError)throw sessionError;if(programError)throw programError;
 program=programData;setStatus(!!program?.is_open);
 if(!program){message(authBox,"The programme has not been configured yet.");return;}
 if(!sessionData.session?.user){$("pp-account-copy").textContent="Sign in using the email and password associated with your KiKi account.";loginForm.hidden=false;return;}
 user=sessionData.session.user;loginForm.hidden=true;authBox.hidden=true;signoutButton.hidden=false;
 $("pp-account-copy").textContent="Signed in as "+(user.email||"your KiKi account")+". Your official programme workspace is ready.";
 if(!program.is_open){closed.hidden=false;return;}
 area.hidden=false;
 await loadMySubmissions();
}
async function loadMySubmissions(){
 const {data,error}=await client.from("indesign_producer_submissions").select("id,dem_id,status,submitted_at,indesign_dems(title,artist)").eq("submitter_id",user.id).order("submitted_at",{ascending:false});
 if(error)throw error;
 const rows=data||[];
 $("pp-my-submissions").innerHTML=rows.length?rows.map(s=>'<article class="pp-entry"><strong>'+esc(s.indesign_dems?.title||"Submitted DEM")+'</strong><span>'+esc(s.indesign_dems?.artist||"")+' · '+esc(s.status==="submitted"?"Submitted":"Withdrawn")+' · '+new Date(s.submitted_at).toLocaleDateString()+'</span></article>').join(""):'<p class="muted">Your programme submissions will appear here after you publish a public DEM from your programme workspace.</p>';
}
loginForm.addEventListener("submit",async event=>{event.preventDefault();loginButton.disabled=true;loginButton.textContent="Connecting…";authBox.hidden=true;const email=$("pp-email").value.trim(),password=$("pp-password").value;const {data,error}=await client.auth.signInWithPassword({email,password});loginButton.disabled=false;loginButton.textContent="Continue with KiKi ↗";if(error){message(authBox,"We could not sign in with those details. Check your KiKi account email and password, then try again.");return;}user=data.user;loginForm.hidden=true;await load();});
signoutButton.addEventListener("click",async()=>{await client.auth.signOut();user=null;area.hidden=true;signoutButton.hidden=true;loginForm.hidden=false;$("pp-account-copy").textContent="Sign in using the email and password associated with your KiKi account.";});
load().catch(error=>{console.error("Producer Programme:",error);setStatus(false);message(authBox,error.message||"Could not load the Producer Programme.");});
})();