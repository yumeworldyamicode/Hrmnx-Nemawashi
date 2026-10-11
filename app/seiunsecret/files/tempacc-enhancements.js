/* KiKi tempacc — Supabase-backed second pass.
   Uses KiKi's existing profiles/posts/artists/releases/release_tracks tables.
   Extra capabilities rely on the companion SQL migration. */
(() => {
  const SUPABASE_URL = 'https://bftgnubawqwvpbqkldpm.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Uoky_Y8iSnzCu0wOa5_y-w_McGOJcJ4';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.tempaccSupabase = db;
  let sessionUser = null;
  let activeProfile = null;
  let currentTab = 'posts';
  const $ = s => document.querySelector(s);
  const welcome = $('.tempacc-welcome');
  const hideWelcome = () => { if (welcome) welcome.classList.add('welcome-faded'); };
  const showWelcome = () => { if (welcome) welcome.classList.remove('welcome-faded'); };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const button = (label, fn, cls='tempacc-primary') => { const b=el('button',cls,label); b.type='button'; b.onclick=fn; return b; };
  const msg = text => { if (typeof toastMsg === 'function') toastMsg(text); else { const t=$('#toast'); if(t){t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);} } };
  const currentUser = async () => { const {data,error}=await db.auth.getUser(); if(error) throw error; sessionUser=data.user; return sessionUser; };
  const fileUrl = async (file, folder) => {
    const ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase();
    const path=`${sessionUser.id}/${folder}/${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}.${ext}`;
    const {error}=await db.storage.from('kiki-tempacc-media').upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(error) throw error;
    return db.storage.from('kiki-tempacc-media').getPublicUrl(path).data.publicUrl;
  };
  const uploadInput = (label, accept='image/*') => {
    const wrap=el('label','tempacc-upload-field'); wrap.append(el('span','',label));
    const input=el('input'); input.type='file'; input.accept=accept; wrap.append(input); return {wrap,input};
  };
  const addFilePreview = (input, target, multi=false) => input.addEventListener('change',()=>{
    target.innerHTML=''; [...input.files].forEach(file=>{ const line=el('div','tempacc-file-preview',file.name); target.append(line); });
  });
  const openWindow = (title, body, wide=true) => win(title, body, wide);
  const profileByUsername = async username => {
    const {data,error}=await db.from('profiles').select('id,username,display_name,avatar_url,banner_url,bio,is_staff,profile_type,artist_id,music_tab_enabled').eq('username',username).maybeSingle();
    if(error) throw error; return data;
  };
  async function openLoginWindow() {
    const body=el('div','wizard-shell');
    body.append(el('h2','','Log in to KiKi'),el('p','music-description','Use your existing KiKi account. You do not need to create a second account for tempacc.'));
    const email=document.createElement('input'); email.className='wizard-field'; email.type='email'; email.placeholder='Email address'; email.autocomplete='email'; email.required=true;
    const pass=document.createElement('input'); pass.className='wizard-field'; pass.type='password'; pass.placeholder='Password'; pass.autocomplete='current-password'; pass.required=true;
    const status=el('p','wizard-error'); const submit=button('Log in',async()=>{
      status.textContent='Signing in…'; submit.disabled=true;
      try { const {error}=await db.auth.signInWithPassword({email:email.value.trim(),password:pass.value}); if(error) throw error;
        await refreshSession(); document.querySelectorAll('.tempacc-window').forEach(w=>w.remove()); msg('Logged in to KiKi');
        const u=new URL(location.href).searchParams.get('username'); if(u) await openProfile(u); else if(sessionUser) await openOwnProfile();
      } catch(e){status.textContent=e.message||'Unable to log in.';} finally{submit.disabled=false;}
    });
    const signup=button('Create a KiKi account',async()=>{
      if(!email.value.trim()||pass.value.length<8){status.textContent='Enter an email and a password with at least 8 characters.';return;}
      status.textContent='Creating account…'; signup.disabled=true;
      try { const {data,error}=await db.auth.signUp({email:email.value.trim(),password:pass.value,options:{emailRedirectTo:location.href.split('?')[0]}}); if(error)throw error;
        status.textContent=data.session?'Account created. Continue with profile setup.':'Account created. Check your email to verify it, then log in.';
        if(data.session){await refreshSession(); document.querySelectorAll('.tempacc-window').forEach(w=>w.remove()); await openWizard();}
      } catch(e){status.textContent=e.message||'Unable to sign up.';} finally{signup.disabled=false;}
    },'tempacc-secondary');
    body.append(email,pass,status,submit,signup,button('Cancel',()=>body.closest('.tempacc-window')?.remove(),'tempacc-secondary'));
    openWindow('log-in.html',body,false);
  }
  async function refreshSession(){ await currentUser(); if(sessionUser) hideWelcome(); else showWelcome(); updateLoginIcon(); }
  function updateLoginIcon(){ const label=document.querySelector('.login-desktop-icon .icon-label'); if(label) label.textContent=sessionUser?'my KiKi account':'log-in.html'; }
  async function openWizard(){
    try { if(!sessionUser) await currentUser(); } catch{}
    if(!sessionUser){ msg('Log in or create a KiKi account first.'); await openLoginWindow(); return; }
    try { const {data:known}=await db.from('profiles').select('username').eq('id',sessionUser.id).maybeSingle(); if(known?.username){await openProfile(known.username);return;} } catch {}
    let existing=null; try { existing=await profileByUsername((await currentUser())?.user_metadata?.username||''); } catch{}
    const body=el('div','wizard-shell'); body.append(el('h2','','Set up your tempacc'),el('p','music-description','This updates your KiKi profile, so it will be the same profile when KiKi launches publicly.'));
    const username=document.createElement('input'); username.className='wizard-field'; username.placeholder='Username (3–24 characters)'; username.autocomplete='username';
    const display=document.createElement('input'); display.className='wizard-field'; display.placeholder='Display name';
    const bio=document.createElement('textarea'); bio.className='wizard-field'; bio.placeholder='Bio'; bio.maxLength=1000;
    const avatar=uploadInput('Profile picture'); const banner=uploadInput('Profile banner'); const previews=el('div','tempacc-file-list'); addFilePreview(avatar.input,previews); addFilePreview(banner.input,previews);
    const status=el('p','wizard-error'); const submit=button('Save my KiKi profile',async()=>{
      const uname=username.value.trim().replace(/^@/,'').toLowerCase();
      if(!/^[a-z0-9._]{3,24}$/.test(uname)){status.textContent='Use 3–24 letters, numbers, dots or underscores.';return;}
      if(!display.value.trim()){status.textContent='Please enter a display name.';return;}
      submit.disabled=true; status.textContent='Saving profile…';
      try {
        const {data:dupe,error:dupeError}=await db.from('profiles').select('id').eq('username',uname).neq('id',sessionUser.id).maybeSingle(); if(dupeError) throw dupeError; if(dupe){status.textContent='That username is already taken.';submit.disabled=false;return;}
        let avatar_url=null,banner_url=null;
        if(avatar.input.files[0]) avatar_url=await fileUrl(avatar.input.files[0],'avatars');
        if(banner.input.files[0]) banner_url=await fileUrl(banner.input.files[0],'banners');
        const payload={id:sessionUser.id,username:uname,display_name:display.value.trim(),bio:bio.value.trim(),profile_type:'user'};
        if(avatar_url) payload.avatar_url=avatar_url; if(banner_url) payload.banner_url=banner_url;
        const {error}=await db.from('profiles').upsert(payload,{onConflict:'id'}); if(error) throw error;
        document.querySelectorAll('.tempacc-window').forEach(w=>w.remove()); hideWelcome(); await openProfile(uname); msg('KiKi profile saved');
      } catch(e){status.textContent=`Could not save profile: ${e.message||e}. Check the SQL migration and Supabase policies.`;}
      finally{submit.disabled=false;}
    });
    body.append(username,display,bio,avatar.wrap,banner.wrap,previews,status,submit,button('Cancel',()=>body.closest('.tempacc-window')?.remove(),'tempacc-secondary'));
    openWindow('start.html — profile setup',body,true);
  }
  async function openOwnProfile(){
    const u=await currentUser(); if(!u)return openLoginWindow();
    const {data,error}=await db.from('profiles').select('username').eq('id',u.id).maybeSingle();
    if(error) throw error; if(!data?.username) return openWizard(); return openProfile(data.username);
  }
  async function openProfile(username){
    hideWelcome(); currentTab='posts';
    const body=el('div','wizard-shell profile-window-content'); body.append(el('p','music-description','Loading KiKi profile…'));
    const w=openWindow('KiKi profile',body,true);
    try {
      const profile=await profileByUsername(String(username||'').replace(/^@/,'')); if(!profile){body.innerHTML='';body.append(el('h2','','Profile not found'),el('p','music-description','No KiKi profile matches this username.'));return;}
      activeProfile=profile;
      const [{data:posts,error:postError},{data:links,error:linkError},{data:media,error:mediaError},{data:reposts,error:repostError},{data:favorites,error:favError},{data:fandoms,error:fandomError}]=await Promise.all([
        db.from('posts').select('id,title,content,image_url,created_at,is_pinned,media_type').eq('author_id',profile.id).order('created_at',{ascending:false}),
        db.from('kiki_profile_links').select('label,url').eq('profile_id',profile.id),
        db.from('kiki_post_media').select('post_id,url,media_type,position').order('position'),
        db.from('kiki_post_reposts').select('post_id,created_at').eq('profile_id',profile.id).order('created_at',{ascending:false}),
        db.from('kiki_profile_music_favorites').select('*').eq('profile_id',profile.id).order('created_at',{ascending:false}),
        db.from('kiki_profile_artist_fandoms').select('artist_id,artist_name').eq('profile_id',profile.id)
      ]);
      body.innerHTML='';
      if(profile.banner_url){const banner=el('div','tempacc-profile-banner');banner.style.backgroundImage=`url("${String(profile.banner_url).replace(/"/g,'%22')}")`;body.append(banner);}
      const head=el('div','tempacc-profile-head'); const avatar=el('img','tempacc-profile-avatar'); avatar.alt=''; if(profile.avatar_url)avatar.src=profile.avatar_url;else avatar.src='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#e8e8e8"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="#666">${esc((profile.display_name||profile.username||'?')[0].toUpperCase())}</text></svg>`);
      const identity=el('div','tempacc-profile-identity');identity.append(el('h2','',profile.display_name||profile.username),el('p','profile-username',`@${profile.username}`),el('p','profile-bio',profile.bio||''));
      head.append(avatar,identity); if(sessionUser?.id===profile.id)head.append(button('Edit profile',()=>openEditProfile(profile),'tempacc-secondary')); body.append(head);
      if(links?.length){const social=el('div','tempacc-social-links');links.forEach(link=>{const a=el('a','',link.label||link.url);a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';social.append(a);});body.append(social);}
      if(profile.music_tab_enabled && fandoms?.length){for(const fan of fandoms){const {count}=await db.from('kiki_profile_artist_fandoms').select('profile_id',{count:'exact',head:true}).eq('artist_id',String(fan.artist_id));const announcement=el('div','tempacc-music-announcement');announcement.textContent=`This person is 1 of ${count ?? 'many'} fans of ${fan.artist_name}!`;body.append(announcement);}}
      if(profile.profile_type==='artist' && profile.artist_id){const {count}=await db.from('kiki_profile_artist_fandoms').select('profile_id',{count:'exact',head:true}).eq('artist_id',String(profile.artist_id));const fanCount=el('div','tempacc-music-announcement');fanCount.textContent=`${count ?? 0} KiKi fan${count===1?'':'s'} of this artist`;body.append(fanCount);}
      const tabs=el('div','tempacc-tabs');[['posts','Posts'],['reposts','Reposts'],['music','Music']].forEach(([id,label])=>tabs.append(button(label,()=>{currentTab=id;renderTab();},`tempacc-tab ${currentTab===id?'active':''}`)));body.append(tabs);
      const actions=el('div','tempacc-profile-actions'); if(sessionUser?.id===profile.id){actions.append(button('＋ Create post',()=>openPostComposer(profile),'tempacc-primary'),button('Edit profile',()=>openEditProfile(profile),'tempacc-secondary'),button(profile.music_tab_enabled?'Manage music':'Add music tab',()=>openMusicSettings(profile),'tempacc-secondary'));}body.append(actions);
      const content=el('div','tempacc-tab-panel');body.append(content);
      function renderTab(){tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.textContent.toLowerCase()===currentTab);});content.innerHTML='';
        if(currentTab==='posts'){
          if(postError){content.append(el('p','music-description','Could not load posts: '+postError.message));return;}
          const mediaMap=new Map();(media||[]).forEach(m=>{if(!mediaMap.has(String(m.post_id)))mediaMap.set(String(m.post_id),[]);mediaMap.get(String(m.post_id)).push(m);});
          const list=(posts||[]).slice().sort((a,b)=>Number(!!b.is_pinned)-Number(!!a.is_pinned)); if(!list.length){content.append(el('div','empty-posts','No posts yet.'));return;}
          list.forEach(post=>{const card=el('article','tempacc-post-card');if(post.is_pinned)card.append(el('span','pin-tag','Pinned'));card.append(el('h3','',post.title||'Post'),el('p','',post.content||''));const assets=mediaMap.get(String(post.id))||[];if(assets.length){const gallery=el('div','tempacc-post-gallery');assets.forEach(asset=>{if(asset.media_type==='video'){const v=el('video');v.src=asset.url;v.controls=true;gallery.append(v);}else{const im=el('img');im.src=asset.url;im.alt='Post media';gallery.append(im);}});card.append(gallery);}else if(post.image_url){if(post.media_type==='video'){const v=el('video');v.src=post.image_url;v.controls=true;card.append(v);}else{const im=el('img');im.src=post.image_url;im.alt='Post media';card.append(im);}}
            const meta=el('small','',new Date(post.created_at).toLocaleString());card.append(meta);if(sessionUser?.id===profile.id){const tools=el('div','tempacc-post-tools');tools.append(button(post.is_pinned?'Unpin':'Pin',()=>togglePin(post),'tempacc-secondary'),button('Repost',()=>repost(post),'tempacc-secondary'),button('Delete',()=>deletePost(post),'tempacc-secondary'));card.append(tools);}content.append(card);});
        } else if(currentTab==='reposts'){
          if(repostError){content.append(el('p','music-description','Reposts are not available until the migration is applied.'));return;}if(!reposts?.length){content.append(el('div','empty-posts','No reposts yet.'));return;}content.append(el('p','music-description','Loading reposts…'));(async()=>{try{const ids=reposts.map(r=>r.post_id);const {data:shared,error}=await db.from('posts').select('id,title,content,image_url,created_at,media_type').in('id',ids);if(error)throw error;content.innerHTML='';(shared||[]).forEach(post=>{const card=el('article','tempacc-post-card');card.append(el('small','',`Reposted · ${new Date((reposts.find(r=>r.post_id===String(post.id))||{}).created_at||post.created_at).toLocaleString()}`),el('h3','',post.title||'Post'),el('p','',post.content||''));if(post.image_url){const mediaNode=el(post.media_type==='video'?'video':'img');mediaNode.src=post.image_url;if(mediaNode.tagName==='VIDEO')mediaNode.controls=true;else mediaNode.alt='Post media';card.append(mediaNode);}content.append(card);});if(!shared?.length)content.append(el('div','empty-posts','The original posts are no longer available.'));}catch(e){content.innerHTML='';content.append(el('p','music-description',e.message||String(e)));}})();
        } else {
          if(!profile.music_tab_enabled){content.append(el('div','empty-posts','This music tab is optional and has not been enabled.'),...(sessionUser?.id===profile.id?[button('Set up my music tab',()=>openMusicSettings(profile))]:[]));return;}
          if(favError){content.append(el('p','music-description','Music favorites need the tempacc SQL migration.'));return;}if(!favorites?.length){content.append(el('div','empty-posts','No favorite music added yet.'));}favorites.forEach(f=>{const card=el('div','tempacc-music-card');if(f.cover_url){const im=el('img');im.src=f.cover_url;im.alt='';card.append(im);}const info=el('div','grow');info.append(el('strong','',f.title||'Untitled'),el('small','',`${f.artist_name||'Hrmnx Entertainment'} · ${f.catalog_item_type}`));card.append(info);if(f.is_pinned)card.append(el('span','pin-tag','Pinned'));if(sessionUser?.id===profile.id)card.append(button(f.is_pinned?'Unpin':'Pin',async()=>{try{const {error}=await db.from('kiki_profile_music_favorites').update({is_pinned:!f.is_pinned}).eq('id',f.id).eq('profile_id',profile.id);if(error)throw error;await openProfile(profile.username);}catch(e){msg(e.message||String(e));}},'tempacc-secondary'));content.append(card);});if(fandoms?.length)content.prepend(el('p','tempacc-music-announcement',`This person is one of the fans of ${fandoms.map(f=>f.artist_name).join(', ')}!`));if(sessionUser?.id===profile.id)content.append(button('Search catalog',()=>openMusicCatalog(profile),'tempacc-primary'));
        }
      }
      renderTab();
    } catch(e){body.innerHTML='';body.append(el('h2','','Could not open profile'),el('p','music-description',e.message||String(e)));}
    return w;
  }
  async function openEditProfile(profile){
    const body=el('div','wizard-shell');body.append(el('h2','','Edit profile'));
    const username=document.createElement('input');username.className='wizard-field';username.value=profile.username||'';username.placeholder='Username';
    const display=document.createElement('input');display.className='wizard-field';display.value=profile.display_name||'';display.placeholder='Display name';
    const bio=document.createElement('textarea');bio.className='wizard-field';bio.value=profile.bio||'';bio.placeholder='Bio';
    const avatar=uploadInput('Change profile picture');const banner=uploadInput('Change banner');const links=el('div','');const linkInputs=[];
    try{const {data}=await db.from('kiki_profile_links').select('label,url').eq('profile_id',profile.id);(data||[]).forEach(x=>addLink(x.label,x.url));}catch{}
    function addLink(label='',url=''){const row=el('div','tempacc-link-edit');const l=document.createElement('input');l.className='wizard-field';l.placeholder='Social name';l.value=label;const u=document.createElement('input');u.className='wizard-field';u.placeholder='https://…';u.value=url;row.append(l,u);links.append(row);linkInputs.push([l,u]);}
    const status=el('p','wizard-error');const save=button('Save changes',async()=>{save.disabled=true;status.textContent='Saving…';try{
      const uname=username.value.trim().replace(/^@/,'').toLowerCase();if(!/^[a-z0-9._]{3,24}$/.test(uname))throw new Error('Username must be 3–24 letters, numbers, dots or underscores.');
      const {data:dupe,error:de}=await db.from('profiles').select('id').eq('username',uname).neq('id',profile.id).maybeSingle();if(de)throw de;if(dupe)throw new Error('That username is already taken.');
      const patch={username:uname,display_name:display.value.trim(),bio:bio.value.trim()};if(avatar.input.files[0])patch.avatar_url=await fileUrl(avatar.input.files[0],'avatars');if(banner.input.files[0])patch.banner_url=await fileUrl(banner.input.files[0],'banners');
      const {error}=await db.from('profiles').update(patch).eq('id',profile.id);if(error)throw error;
      const {error:delError}=await db.from('kiki_profile_links').delete().eq('profile_id',profile.id);if(delError)throw delError;
      const rows=linkInputs.map(([l,u])=>({profile_id:profile.id,label:l.value.trim(),url:u.value.trim()})).filter(x=>x.label&&/^https?:\/\//i.test(x.url));if(rows.length){const {error:insError}=await db.from('kiki_profile_links').insert(rows);if(insError)throw insError;}
      document.querySelectorAll('.tempacc-window').forEach(x=>x.remove());await openProfile(uname);msg('Profile updated');
    }catch(e){status.textContent=e.message||String(e);}finally{save.disabled=false;}});
    body.append(username,display,bio,avatar.wrap,banner.wrap,el('h3','','Social links'),links,button('＋ Add social link',()=>addLink(),'tempacc-secondary'),status,save);openWindow('Edit profile',body,true);
  }
  async function openPostComposer(profile){
    if(!sessionUser){return openLoginWindow();}
    const body=el('div','wizard-shell post-composer');body.append(el('h2','','Create a post'),el('p','music-description','Choose photos for a swipeable carousel or one video. You can reorder photos before publishing.'));
    const title=document.createElement('input');title.className='wizard-field';title.placeholder='Add a title (optional)';title.maxLength=120;
    const caption=document.createElement('textarea');caption.className='wizard-field';caption.placeholder='Write a caption…';caption.maxLength=5000;
    const media=uploadInput('Add photos or a video','image/*,video/*');media.input.multiple=true;
    const preview=el('div','tempacc-composer-preview');const status=el('p','wizard-error');let chosen=[];
    media.input.addEventListener('change',()=>{chosen=[...media.input.files];preview.innerHTML='';const hasVideo=chosen.some(f=>f.type.startsWith('video/'));if(hasVideo&&(chosen.length>1||!chosen[0].type.startsWith('video/'))){status.textContent='A video post can contain one video. Choose either one video or multiple photos.';return;}status.textContent='';chosen.forEach((f,i)=>{const tile=el('div','tempacc-preview-tile');const img=el(f.type.startsWith('video/')?'video':'img');if(img.tagName==='VIDEO')img.controls=true;img.src=URL.createObjectURL(f);tile.append(img,el('small','',f.name));if(!hasVideo){tile.append(button('←',()=>{if(i>0){[chosen[i-1],chosen[i]]=[chosen[i],chosen[i-1]];drawPreview();}},'tempacc-secondary'),button('→',()=>{if(i<chosen.length-1){[chosen[i+1],chosen[i]]=[chosen[i],chosen[i+1]];drawPreview();}},'tempacc-secondary'));}preview.append(tile);});});
    function drawPreview(){preview.innerHTML='';chosen.forEach((f,i)=>{const tile=el('div','tempacc-preview-tile');const node=el(f.type.startsWith('video/')?'video':'img');if(node.tagName==='VIDEO')node.controls=true;node.src=URL.createObjectURL(f);tile.append(node,el('small','',`${i+1}. ${f.name}`));if(!f.type.startsWith('video/'))tile.append(button('←',()=>{if(i>0){[chosen[i-1],chosen[i]]=[chosen[i],chosen[i-1]];drawPreview();}},'tempacc-secondary'),button('→',()=>{if(i<chosen.length-1){[chosen[i+1],chosen[i]]=[chosen[i],chosen[i+1]];drawPreview();}},'tempacc-secondary'));preview.append(tile);});}
    const publish=button('Next',()=>{if(!chosen.length){status.textContent='Choose at least one photo or video.';return;}if(chosen.some(f=>f.size>100*1024*1024)){status.textContent='Each file must be smaller than 100 MB.';return;}publishReview();});
    function publishReview(){body.innerHTML='';body.append(el('h2','','Review your post'),el('p','music-description','Check your media and caption before publishing.'),el('strong','',title.value.trim()||'Photo post'),el('p','',caption.value),preview,status);const go=button('Publish',async()=>{go.disabled=true;status.textContent='Uploading media…';try{
        const uploaded=[];for(let i=0;i<chosen.length;i++){const f=chosen[i];uploaded.push({url:await fileUrl(f,'posts'),media_type:f.type.startsWith('video/')?'video':'image',position:i});}
        const postPayload={author_id:sessionUser.id,artist_id:null,title:title.value.trim()||'Photo post',content:caption.value.trim(),image_url:uploaded[0]?.url||null,is_staff_post:false,media_type:uploaded[0]?.media_type||'image'};
        const {data:post,error}=await db.from('posts').insert(postPayload).select('id').single();if(error)throw error;
        const mediaRows=uploaded.map(x=>({post_id:String(post.id),owner_id:sessionUser.id,url:x.url,media_type:x.media_type,position:x.position}));const {error:mediaError}=await db.from('kiki_post_media').insert(mediaRows);if(mediaError)throw mediaError;
        document.querySelectorAll('.tempacc-window').forEach(x=>x.remove());await openProfile(profile.username);msg('Post published');
      }catch(e){status.textContent=`Publish failed: ${e.message||e}. Check the media table, storage bucket, and post permissions.`;go.disabled=false;}});body.append(go,button('Back to edit',()=>{body.innerHTML='';body.append(el('h2','','Create a post'),title,caption,media.wrap,preview,status,publish);drawPreview();},'tempacc-secondary'));}
    body.append(title,caption,media.wrap,preview,status,publish,button('Cancel',()=>body.closest('.tempacc-window')?.remove(),'tempacc-secondary'));openWindow('Create post',body,true);
  }
  async function togglePin(post){try{const {data:rows,error:readError}=await db.from('posts').select('id').eq('author_id',sessionUser.id).eq('is_pinned',true);if(readError)throw readError;if(!post.is_pinned&&(rows||[]).length>=3)throw new Error('You can pin up to three posts.');const {error}=await db.from('posts').update({is_pinned:!post.is_pinned}).eq('id',post.id).eq('author_id',sessionUser.id);if(error)throw error;await openProfile(activeProfile.username);}catch(e){msg(e.message||String(e));}}
  async function repost(post){try{const {error}=await db.from('kiki_post_reposts').upsert({profile_id:sessionUser.id,post_id:String(post.id)},{onConflict:'profile_id,post_id'});if(error)throw error;msg('Reposted');}catch(e){msg('Repost failed: '+(e.message||e));}}
  async function deletePost(post){if(!confirm('Delete this post?'))return;try{const {error}=await db.from('posts').delete().eq('id',post.id).eq('author_id',sessionUser.id);if(error)throw error;await db.from('kiki_post_media').delete().eq('post_id',String(post.id));await openProfile(activeProfile.username);msg('Post deleted');}catch(e){msg(e.message||String(e));}}
  async function openMusicSettings(profile){
    const body=el('div','wizard-shell');body.append(el('h2','','Your Hrmnx music tab'),el('p','music-description','This is optional. When enabled, it appears on your profile and you can add favorite artists, albums, and songs from the KiKi catalog.'));
    const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=!!profile.music_tab_enabled;const row=el('label','tempacc-check-row');row.append(toggle,el('span','','Show the Music tab on my profile'));body.append(row);
    const status=el('p','wizard-error');const artistsWrap=el('div','tempacc-catalog-results');const chosenArtists=new Set();try{const [{data:artists},{data:mine}]=await Promise.all([db.from('artists').select('id,name,slug').order('name'),db.from('kiki_profile_artist_fandoms').select('artist_id').eq('profile_id',profile.id)]);(mine||[]).forEach(x=>chosenArtists.add(String(x.artist_id)));(artists||[]).forEach(a=>{const row=el('label','tempacc-check-row');const cb=el('input');cb.type='checkbox';cb.checked=chosenArtists.has(String(a.id));cb.onchange=()=>cb.checked?chosenArtists.add(String(a.id)):chosenArtists.delete(String(a.id));row.append(cb,el('span','',`I’m a fan of ${a.name}`));row.dataset.artistId=String(a.id);row.dataset.artistName=a.name;artistsWrap.append(row);});}catch(e){artistsWrap.append(el('p','music-description','Artist list unavailable: '+(e.message||e)));}
    body.append(el('h3','','Artists you are a fan of'),artistsWrap,status,button('Save music settings',async()=>{try{const {error}=await db.from('profiles').update({music_tab_enabled:toggle.checked}).eq('id',profile.id);if(error)throw error;const {error:delError}=await db.from('kiki_profile_artist_fandoms').delete().eq('profile_id',profile.id);if(delError)throw delError;const rows=[...artistsWrap.querySelectorAll('label')].filter(row=>row.querySelector('input').checked).map(row=>({profile_id:profile.id,artist_id:row.dataset.artistId,artist_name:row.dataset.artistName}));if(rows.length){const {error:insError}=await db.from('kiki_profile_artist_fandoms').insert(rows);if(insError)throw insError;}document.querySelectorAll('.tempacc-window').forEach(x=>x.remove());await openProfile(profile.username);msg(toggle.checked?'Music tab enabled':'Music tab hidden');}catch(e){status.textContent=e.message||String(e);}},'tempacc-primary'),button('Choose favorite music',()=>openMusicCatalog(profile),'tempacc-secondary'));openWindow('Music tab settings',body,false);
  }
  async function openMusicCatalog(profile){
    const body=el('div','wizard-shell');body.append(el('h2','','Search catalog'),el('p','music-description','Search releases from the existing KiKi/Hrmnx catalog.'));
    const search=document.createElement('input');search.className='wizard-field';search.placeholder='Search releases…';const results=el('div','tempacc-catalog-results');body.append(search,results);let catalog=[];
    try{const {data,error}=await db.from('releases').select('id,title,type,cover_url,artist_id,release_date').order('release_date',{ascending:false});if(error)throw error;const ids=[...new Set((data||[]).map(x=>x.artist_id).filter(Boolean))];let names={};if(ids.length){const {data:artists}=await db.from('artists').select('id,name').in('id',ids);(artists||[]).forEach(a=>names[String(a.id)]=a.name);}catalog=(data||[]).map(r=>({...r,artist_name:names[String(r.artist_id)]||'Hrmnx Entertainment'}));}catch(e){results.append(el('p','music-description','Catalog could not be loaded: '+(e.message||e)));}
    async function addFavorite(item,type='album',trackNumber=null){try{const {error}=await db.from('kiki_profile_music_favorites').insert({profile_id:profile.id,catalog_item_type:type,release_id:String(item.id),track_id:trackNumber===null?null:String(trackNumber),title:type==='song'?item.trackTitle:item.title,artist_name:item.artist_name,cover_url:item.cover_url||null});if(error)throw error;msg('Added to favorite music');}catch(e){msg('Could not add favorite: '+(e.message||e));}}
    function render(){results.innerHTML='';const q=search.value.toLowerCase().trim();const filtered=catalog.filter(x=>(x.title+' '+x.artist_name+' '+x.type).toLowerCase().includes(q)).slice(0,40);if(!filtered.length)results.append(el('p','music-description','No matching releases.'));filtered.forEach(item=>{const row=el('div','tempacc-catalog-row');if(item.cover_url){const img=el('img');img.src=item.cover_url;img.alt='';row.append(img);}const info=el('div','grow');info.append(el('strong','',item.title),el('small','',`${item.artist_name} · ${item.type||'Release'}`));row.append(info,button('＋ Favorite album',()=>addFavorite(item,'album'),'tempacc-secondary'));const songs=el('div','tempacc-track-results');const showSongs=button('Show songs',async()=>{showSongs.disabled=true;try{const {data:tracks,error}=await db.from('release_tracks').select('track_number,title').eq('release_id',item.id).order('track_number',{ascending:true});if(error)throw error;songs.innerHTML='';(tracks||[]).forEach(track=>{const tr=el('div','tempacc-catalog-row');const tinfo=el('div','grow');tinfo.append(el('strong','',track.title),el('small','',`Track ${track.track_number}`));tr.append(tinfo,button('＋ Favorite song',()=>addFavorite({...item,trackTitle:track.title},'song',track.track_number),'tempacc-secondary'));songs.append(tr);});if(!tracks?.length)songs.append(el('small','', 'No tracks found for this release.'));}catch(e){songs.append(el('small','',e.message||String(e)));}},'tempacc-secondary');row.append(showSongs);results.append(row,songs);});}
    search.addEventListener('input',render);render();openWindow('Search catalog',body,true);
  }
  // Replace the first prototype's local-only entry points with database-backed ones.
  window.openLoginWindow=openLoginWindow; window.openWizard=openWizard; window.openProfile=openProfile; window.openPostComposer=openPostComposer;
  const start=$('#startButton');if(start)start.onclick=()=>{hideWelcome();openWizard();};
  const rec=$('#recommendedButton');if(rec)rec.onclick=async()=>{const body=el('div','wizard-shell');body.append(el('h2','','Recommended KiKi accounts'));try{const {data,error}=await db.from('profiles').select('username,display_name,avatar_url,profile_type').order('display_name').limit(50);if(error)throw error;(data||[]).forEach(p=>{const row=el('div','recommended-row');if(p.avatar_url){const im=el('img','recommended-avatar');im.src=p.avatar_url;row.append(im);}const text=el('div','grow');text.append(el('strong','',p.display_name||p.username),el('small','',`@${p.username} · ${p.profile_type||'user'}`));row.append(text,button('Open',()=>openProfile(p.username),'small-button'));body.append(row);});}catch(e){body.append(el('p','music-description','Could not load accounts: '+(e.message||e)));}openWindow('recommended accounts',body,true);};
  const desktop=$('#desktopItems');if(desktop&&typeof icon==='function'){desktop.innerHTML='';desktop.append(icon('start.html','file',0,0,openWizard));desktop.append(icon('recommended accounts','folder',0,106,()=>$('#recommendedButton')?.click()));const login=icon('log-in.html','file',0,212,()=>sessionUser?openOwnProfile():openLoginWindow());login.classList.add('login-desktop-icon');desktop.append(login);updateLoginIcon();}
  // A better recognizable pixel bunny sprite: upright ears, round face, folded paws and sleeping poses.
  function drawBunnyFamily(){const canvas=$('#bunnyCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');let dpr=1;function resize(){dpr=Math.min(devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);}function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}function bunny(x,y,s,variant=0){const fur=['#626872','#737985','#4e545e'][variant%3],shadow='#3e434b',inner='#d8c7d4',white='#f1f1f3';
      // ears, with pink inner pixels
      rect(x+3*s,y,2*s,6*s,fur);rect(x+8*s,y-2*s,2*s,8*s,fur);rect(x+4*s,y+2*s,s,3*s,inner);rect(x+9*s,y+1*s,s,4*s,inner);
      // head and cheeks
      rect(x+2*s,y+5*s,9*s,2*s,fur);rect(x+s,y+7*s,11*s,5*s,fur);rect(x+2*s,y+12*s,9*s,2*s,fur);rect(x+3*s,y+14*s,7*s,s,shadow);
      // eyes shut, nose, cheeks
      rect(x+3*s,y+8*s,2*s,s,shadow);rect(x+8*s,y+8*s,2*s,s,shadow);rect(x+6*s,y+10*s,s,s,inner);rect(x+2*s,y+10*s,s,s,'#b88b9d');rect(x+10*s,y+10*s,s,s,'#b88b9d');
      // body, tail and little tucked paws
      rect(x+3*s,y+15*s,7*s,3*s,fur);rect(x+2*s,y+17*s,9*s,3*s,fur);rect(x+s,y+18*s,2*s,2*s,white);rect(x+10*s,y+18*s,2*s,2*s,white);rect(x+5*s,y+16*s,3*s,s,shadow);rect(x+11*s,y+16*s,2*s,2*s,white);
    }
    function draw(){const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);const t=performance.now()/1000;const s=Math.max(2,Math.min(3.2,r.width/420));const y=Math.max(18,r.height-68);const x=Math.max(12,r.width*.23);bunny(x,y,s,0);bunny(x+48*s,y+7*s,s*.84,1);bunny(x+90*s,y+3*s,s*.72,2);
      ctx.fillStyle='rgba(85,91,99,.82)';ctx.font='600 12px Inter, sans-serif';ctx.fillText('z',x+20*s,y-9-Math.sin(t*1.7)*4);ctx.font='600 16px Inter, sans-serif';ctx.fillText('Z',x+52*s,y-22-Math.sin(t*1.25)*5);ctx.font='600 10px Inter, sans-serif';ctx.fillText('z',x+88*s,y-9-Math.sin(t*1.5)*3);requestAnimationFrame(draw);}
    window.addEventListener('resize',resize);resize();requestAnimationFrame(draw);
  }
  drawBunnyFamily();
  (async()=>{try{await refreshSession();if(sessionUser){hideWelcome();const query=new URL(location.href).searchParams.get('username');if(query)await openProfile(query);else await openOwnProfile();}else{const query=new URL(location.href).searchParams.get('username');if(query)await openProfile(query);}}catch(e){console.warn('tempacc session check:',e.message||e);}})();
})();
