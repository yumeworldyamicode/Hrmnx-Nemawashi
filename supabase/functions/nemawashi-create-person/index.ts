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
 if(!/^[a-z0-9._-]{2,30}$/.test(username))return respond({error:"Username must be 2–30 characters (letters, numbers, dots, underscores or hyphens)."},400);
 const password="shinkiaka"+employee_number;
 const {data:existingEmp}=await admin.from("employees").select("id").eq("employee_number",employee_number).maybeSingle();
 if(existingEmp)return respond({error:"That employee number is already in use."},409);
 const {data:existingProfile}=await admin.from("profiles").select("id").eq("username",username).maybeSingle();
 if(existingProfile)return respond({error:"That username is already in use."},409);
 const {data:created,error:createErr}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username,display_name,is_staff:true,employee_number,must_change_password:true}});
 if(createErr||!created.user)return respond({error:createErr?.message||"Account creation failed"},400);
 const newId=created.user.id;
 const {error:profileInsertErr}=await admin.from("profiles").upsert({id:newId,username,display_name,is_staff:true,profile_type:"staff",membership_status:"active"},{onConflict:"id"});
 if(profileInsertErr){await admin.auth.admin.deleteUser(newId);return respond({error:"Profile creation failed: "+profileInsertErr.message},500);}
 const {error:empErr}=await admin.from("employees").insert({user_id:newId,employee_number,job_title:job_title||null,company_id,active:true});
 if(empErr){await admin.auth.admin.deleteUser(newId);return respond({error:"Employee record creation failed: "+empErr.message},500);}
 return respond({success:true,user_id:newId,username,employee_number,initial_password:password,must_change_password:true});
});