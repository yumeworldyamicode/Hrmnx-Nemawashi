import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
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
 const employee_number=String(payload.employee_number||"").trim(),username=String(payload.username||"").trim().toLowerCase(),display_name=String(payload.display_name||"").trim(),email=String(payload.email||"").trim().toLowerCase(),job_title=String(payload.job_title||"").trim(),company_id=payload.company_id||null;
 if(!employee_number||!username||!display_name||!email)return respond({error:"Employee number, username, display name and email are required."},400);
 const emailDomain=email.split("@").pop();if(!["yumeworldyami.net","gmail.com","outlook.com"].includes(emailDomain))return respond({error:"Employee email must use yumeworldyami.net, gmail.com or outlook.com."},400);
 if(!/^[a-z0-9._-]{2,30}$/.test(username))return respond({error:"Username must be 2–30 characters (letters, numbers, dots, underscores or hyphens)."},400);
 const password="shinkiaka"+employee_number;
 const {data:existingEmp}=await admin.from("employees").select("id").eq("employee_number",employee_number).maybeSingle();
 if(existingEmp)return respond({error:"That employee number is already in use."},409);
 const {data:existingProfile}=await admin.from("profiles").select("id").eq("username",username).maybeSingle();
 if(existingProfile)return respond({error:"That username is already in use."},409);
 const {data:created,error:createErr}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username,display_name,is_staff:true,employee_number,must_change_password:true}});
 if(createErr||!created.user)return respond({error:createErr?.message||"Account creation failed"},400);
 const newId=created.user.id;
 const {error:profileInsertErr}=await admin.from("profiles").update({username,display_name,is_staff:true,profile_type:"staff",membership_status:"active"}).eq("id",newId);
 if(profileInsertErr){await admin.auth.admin.deleteUser(newId);return respond({error:"Profile creation failed: "+profileInsertErr.message},500);}
 const {error:empErr}=await admin.from("employees").insert({user_id:newId,employee_number,job_title:job_title||null,company_id,active:true});
 if(empErr){await admin.auth.admin.deleteUser(newId);return respond({error:"Employee record creation failed: "+empErr.message},500);}
 // Welcome email is best-effort: account creation should succeed even if the email provider is temporarily unavailable.
 let email_sent=false, email_error:string|null=null;
 const resendKey=Deno.env.get("RESEND_API_KEY");
 const fromEmail=Deno.env.get("NEMAWASHI_FROM_EMAIL")||"Nemawashi <welcome@hrmnx.site>";
 if(resendKey){
  try{
   const html=`<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:Arial,Helvetica,sans-serif;color:#18181b"><div style="max-width:560px;margin:36px auto;background:#fff;padding:40px 32px"><div style="font-size:26px;margin-bottom:24px">🔑</div><h1 style="font-size:32px;margin:0 0 16px;font-weight:700">You're in.</h1><p style="font-size:15px;line-height:1.7">Hi ${display_name}, your Hrmnx employee account has been created. Welcome to Nemawashi.</p><div style="background:#f4f4f5;padding:20px;margin:24px 0"><p style="margin:0 0 8px;font-size:13px;color:#71717a">Your username</p><p style="margin:0;font-size:18px;font-weight:bold">${username}</p><p style="margin:18px 0 8px;font-size:13px;color:#71717a">Temporary password</p><p style="margin:0;font-size:18px;font-weight:bold">${password}</p></div><p style="font-size:14px;line-height:1.6">Sign in to Nemawashi using your username and temporary password. Please change your password as soon as possible. Keep this email private.</p><p style="font-size:14px;margin-top:28px">Welcome aboard,<br><strong>Hrmnx Entertainment</strong></p></div></body></html>`;
   const mailRes=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({from:fromEmail,to:[email],subject:"🔑 You're in.",html})});
   if(mailRes.ok)email_sent=true;else{const detail=await mailRes.text();email_error="Email provider returned "+mailRes.status+": "+detail;console.error("Welcome email failed",mailRes.status,detail);}
  }catch(mailErr){email_error=mailErr instanceof Error?mailErr.message:"Welcome email error";console.error("Welcome email exception",mailErr);}
 }else{email_error="RESEND_API_KEY is not configured";}
 return respond({success:true,user_id:newId,username,employee_number,initial_password:password,must_change_password:true,email_sent,email_error});
});