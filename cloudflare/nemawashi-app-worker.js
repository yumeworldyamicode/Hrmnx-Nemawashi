export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/github/publish" && request.method === "POST") {
      return handlePublish(request, env);
    }

    if (url.pathname.startsWith("/app/")) {
      return fetch("https://yumeworldyamicode.github.io/Hrmnx-Nemawashi/public-app.html", request);
    }

    return fetch(request);
  }
};

async function handlePublish(request, env) {
  try {
    const body = await request.json();
    if (!body || !body.repository || !body.basePath || !body.files) {
      return json({ error: "Missing repository, basePath or files." }, 400);
    }

    const repo = body.repository;
    const token = env.GITHUB_TOKEN;
    if (!token) return json({ error: "GITHUB_TOKEN is not configured on the Worker." }, 500);

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    };

    const branch = env.GITHUB_BRANCH || "main";
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {headers});
    if (!refRes.ok) return json({error:"Could not read GitHub branch."}, 502);
    const ref = await refRes.json();
    const parentSha = ref.object.sha;

    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${parentSha}?recursive=1`, {headers});
    const tree = treeRes.ok ? await treeRes.json() : {tree:[]};

    const blobs=[];
    for (const [name,content] of Object.entries(body.files)) {
      const blobRes=await fetch(`https://api.github.com/repos/${repo}/git/blobs`,{
        method:"POST",headers,
        body:JSON.stringify({content,encoding:"utf-8"})
      });
      if(!blobRes.ok) return json({error:"Failed to create GitHub blob for "+name},502);
      const blob=await blobRes.json();
      blobs.push({path:`${body.basePath.replace(/\\/+$/,"")}/${name.replace(/^\\/+/, "")}`,mode:"100644",type:"blob",sha:blob.sha});
    }

    const treeCreate=await fetch(`https://api.github.com/repos/${repo}/git/trees`,{
      method:"POST",headers,
      body:JSON.stringify({base_tree:parentSha,tree:blobs})
    });
    if(!treeCreate.ok) return json({error:"Failed to create GitHub tree."},502);
    const newTree=await treeCreate.json();

    const commitRes=await fetch(`https://api.github.com/repos/${repo}/git/commits`,{
      method:"POST",headers,
      body:JSON.stringify({message:body.message||"Publish website",tree:newTree.sha,parents:[parentSha]})
    });
    if(!commitRes.ok) return json({error:"Failed to create GitHub commit."},502);
    const commit=await commitRes.json();

    const updateRes=await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,{
      method:"PATCH",headers,
      body:JSON.stringify({sha:commit.sha,force:false})
    });
    if(!updateRes.ok) return json({error:"Failed to update GitHub branch."},502);

    return json({ok:true,commit:commit.sha,path:body.basePath});
  } catch (e) {
    return json({error:e?.message||"Unexpected Worker error."},500);
  }
}

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
}
