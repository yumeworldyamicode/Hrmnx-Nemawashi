import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const clean=(v:any)=>String(v||"").trim();
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return respond({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return respond({error:"Server configuration missing"},500);
 const auth=req.headers.get("Authorization");if(!auth)return respond({error:"Sign in required"},401);
 const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}});
 const {data:{user},error:authErr}=await caller.auth.getUser();if(authErr||!user)return respond({error:"Invalid session"},401);
 const admin=createClient(url,service);
 const {data:callerProfile,error:profileErr}=await admin.from("profiles").select("is_staff").eq("id",user.id).single();
 if(profileErr||!callerProfile?.is_staff)return respond({error:"Staff administrator access required"},403);
 let payload:any;try{payload=await req.json()}catch{return respond({error:"Invalid JSON"},400)}
 const employee_number=clean(payload.employee_number),username=clean(payload.username).toLowerCase(),display_name=clean(payload.display_name),email=clean(payload.email).toLowerCase(),job_title=clean(payload.job_title),company_id=payload.company_id||null;
 if(!employee_number||!username||!display_name||!email)return respond({error:"Employee number, username, display name and email are required."},400);
 if(!/^[a-z0-9._-]{2,30}$/.test(username))return respond({error:"Username must be 2–30 characters (letters, numbers, dots, underscores or hyphens)."},400);
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!["yumeworldyami.net","gmail.com","outlook.com"].includes(email.split("@").pop()||""))return respond({error:"Use a valid email on yumeworldyami.net, gmail.com or outlook.com."},400);
 const {data:empNumber}=await admin.from("employees").select("id").eq("employee_number",employee_number).maybeSingle();
 if(empNumber)return respond({error:"That employee number is already in use."},409);
 const {data:usernameProfile}=await admin.from("profiles").select("id,username,display_name").eq("username",username).maybeSingle();
 let emailMatches:any[]=[];
 for(let page=1;page<=10;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:100});if(error)break;const matches=(data?.users||[]).filter((u:any)=>u.email?.toLowerCase()===email);emailMatches=emailMatches.concat(matches);if((data?.users||[]).length<100)break;}
 const ids=[...new Set([usernameProfile?.id,...emailMatches.map((u:any)=>u.id)].filter(Boolean))];
 const {data:employeeMatches}=await admin.from("employees").select("user_id,employee_number").in("user_id",ids.length?ids:["00000000-0000-0000-0000-000000000000"]);
 const candidates=await Promise.all(ids.map(async(id:string)=>{
  const authUser=emailMatches.find((u:any)=>u.id===id)||await (async()=>{const {data}=await admin.auth.admin.getUserById(id);return data?.user||null})();
  const {data:p}=await admin.from("profiles").select("username,display_name").eq("id",id).maybeSingle();
  const emp=(employeeMatches||[]).find((e:any)=>e.user_id===id);
  return {id,email:authUser?.email||null,username:p?.username||authUser?.user_metadata?.username||null,display_name:p?.display_name||authUser?.user_metadata?.display_name||null,already_employee:!!emp,employee_number:emp?.employee_number||null};
 }));
 if(candidates.length&&!payload.resolution)return respond({error:"An account conflict was detected.",conflict:true,candidates},409);
 if(payload.resolution==="attach_existing"){
  const selected=clean(payload.existing_user_id);
  if(!selected||!candidates.some((c:any)=>c.id===selected))return respond({error:"Choose a detected existing account to attach."},400);
  if(candidates.find((c:any)=>c.id===selected)?.already_employee)return respond({error:"This account is already attached to an employee record."},409);
  const {error:upd}=await admin.from("profiles").update({is_staff:true,profile_type:"staff",membership_status:"active"}).eq("id",selected);
  if(upd)return respond({error:"Could not update existing profile: "+upd.message},500);
  const {error:insert}=await admin.from("employees").insert({user_id:selected,employee_number,job_title:job_title||null,company_id,active:true});
  if(insert)return respond({error:"Employee record creation failed: "+insert.message},500);
  return respond({success:true,attached_existing:true,user_id:selected,username,employee_number,email_sent:false,email_error:"Existing account attached. No welcome email or password reset was sent."});
 }
 if(payload.resolution&&payload.resolution!=="alternative_account")return respond({error:"Unsupported conflict resolution."},400);
 if(candidates.length)return respond({error:"Choose the existing account or change username/email to create an alternative account.",conflict:true,candidates},409);
 const randomBytes=crypto.getRandomValues(new Uint8Array(18)),tempPassword="Nw!"+Array.from(randomBytes).map(b=>b.toString(16).padStart(2,"0")).join("");
 const {data:created,error:createErr}=await admin.auth.admin.createUser({email,password:tempPassword,email_confirm:true,user_metadata:{username,display_name,is_staff:true,employee_number,must_change_password:true}});
 if(createErr||!created.user)return respond({error:createErr?.message||"Account creation failed"},400);
 const newId=created.user.id;
 const {error:profileUpdateErr}=await admin.from("profiles").update({username,display_name,is_staff:true,profile_type:"staff",membership_status:"active"}).eq("id",newId);
 if(profileUpdateErr){await admin.auth.admin.deleteUser(newId);return respond({error:"Profile creation failed: "+profileUpdateErr.message},500);}
 const {error:empErr}=await admin.from("employees").insert({user_id:newId,employee_number,job_title:job_title||null,company_id,active:true});
 if(empErr){await admin.auth.admin.deleteUser(newId);return respond({error:"Employee record creation failed: "+empErr.message},500);}
 let email_sent=false,email_error:string|null=null;const resendKey=Deno.env.get("RESEND_API_KEY"),fromEmail=Deno.env.get("NEMAWASHI_FROM_EMAIL")||"Nemawashi <welcome@hrmnx.site>";
 if(resendKey){try{
  const safe=(s:string)=>s.replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
  const html=`<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:Arial,Helvetica,sans-serif;color:#18181b"><div style="max-width:560px;margin:36px auto;background:#fff;padding:40px 32px"><h1 style="font-size:32px;margin:0 0 16px;font-weight:700">You're in.</h1><p style="font-size:15px;line-height:1.7">Hi ${safe(display_name)}, your Hrmnx employee account has been created. Welcome to Nemawashi.</p><div style="background:#f4f4f5;padding:20px;margin:24px 0"><p style="margin:0 0 8px;font-size:13px;color:#71717a">Your username</p><p style="margin:0;font-size:18px;font-weight:bold">${safe(username)}</p><p style="margin:18px 0 8px;font-size:13px;color:#71717a">Temporary password</p><p style="margin:0;font-size:18px;font-weight:bold">${tempPassword}</p></div><p style="font-size:14px;line-height:1.6">Sign in using your username and temporary password. Change it immediately and keep this email private.</p><p>Welcome aboard,<br><strong>Hrmnx Entertainment</strong></p></div></body></html>`;
  const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({from:fromEmail,to:[email],subject:"🔑 You're in.",html})});if(mail.ok)email_sent=true;else email_error="Email provider returned "+mail.status+": "+await mail.text();
 }catch(e){email_error=e instanceof Error?e.message:"Welcome email error";}}else email_error="RESEND_API_KEY is not configured";
 return respond({success:true,user_id:newId,username,employee_number,initial_password:tempPassword,must_change_password:true,email_sent,email_error});
});