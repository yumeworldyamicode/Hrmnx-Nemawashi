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
  function updateLoginIcon(){ const label=document.querySelector('.login-desktop-icon .icon-label'); if(label) label.textContent=sessionUser?'sign-out.js':'log-in.html'; }
  async function openWizard(){
    try { await currentUser(); } catch {}
    const body=el('div','wizard-shell');
    const status=el('p','wizard-error');
    const progress=el('div','wizard-progress');const bar=el('span');progress.append(bar);
    const panel=el('div','tempacc-step-slide');
    const nav=el('div','wizard-nav');
    const values={email:'',password:'',username:'',display:'',bio:'',avatar:null,banner:null};
    let step=sessionUser?2:0; let busy=false;
    const steps=[
      {title:'Create your KiKi login',desc:'Use the email and password you want to use for your existing KiKi account.',field:'email',type:'email',placeholder:'Email address'},
      {title:'Choose a password',desc:'Use at least 8 characters. This signs you into the same KiKi account system.',field:'password',type:'password',placeholder:'Password (at least 8 characters)'},
      {title:'Choose your username',desc:'This becomes your public KiKi profile address.',field:'username',type:'text',placeholder:'username'},
      {title:'What should people call you?',desc:'Your display name can be different from your username.',field:'display',type:'text',placeholder:'Display name'},
      {title:'Write your bio',desc:'Tell people a little about yourself. You can leave this blank.',field:'bio',type:'textarea',placeholder:'Your bio…'},
      {title:'Choose a profile picture',desc:'Optional. Square images work best, and your picture will be cropped into a circle.',field:'avatar',type:'file',placeholder:'Choose profile picture'},
      {title:'Choose a banner',desc:'Optional. A wide image works best for your profile banner.',field:'banner',type:'file',placeholder:'Choose banner'},
      {title:'Ready to save?',desc:'Your profile will be saved to KiKi’s existing Supabase profiles table.',field:'review',type:'review'}
    ];
    function draw(){
      const d=steps[step];bar.style.width=`${Math.round((step+1)/steps.length*100)}%`;panel.className='tempacc-step-slide';panel.innerHTML='';
      panel.append(el('h2','',d.title),el('p','music-description',d.desc));
      let input=null;
      if(d.type==='email'||d.type==='password'||d.type==='text'||d.type==='textarea'){
        input=document.createElement(d.type==='textarea'?'textarea':'input');input.className='wizard-field';input.placeholder=d.placeholder;input.value=values[d.field]||'';input.autocomplete=d.field==='email'?'email':d.field==='password'?'new-password':d.field==='username'?'username':'name';if(d.type==='email')input.required=true;if(d.field==='password'){input.minLength=8;input.required=true;}if(d.field==='username')input.maxLength=24;if(d.field==='display')input.maxLength=80;if(d.field==='bio')input.maxLength=1000;
        input.addEventListener('input',()=>values[d.field]=input.value);panel.append(input);
      } else if(d.type==='file'){
        const up=uploadInput(d.placeholder,'image/*');up.input.accept='image/*';up.input.onchange=()=>{values[d.field]=up.input.files[0]||null;preview.textContent=values[d.field]?.name||'No file selected';};const preview=el('p','music-description',values[d.field]?.name||'No file selected');panel.append(up.wrap,preview);
      } else if(d.type==='review'){
        panel.append(el('div','tempacc-review-line',`Username: @${values.username}`),el('div','tempacc-review-line',`Display name: ${values.display}`),el('div','tempacc-review-line',`Profile picture: ${values.avatar?.name||'Not added'}`),el('div','tempacc-review-line',`Banner: ${values.banner?.name||'Not added'}`));
      }
      status.textContent='';nav.innerHTML='';
      nav.append(button('Cancel',()=>body.closest('.tempacc-window')?.remove(),'tempacc-secondary'));
      if(step> (sessionUser?2:0))nav.append(button('Back',()=>{if(busy)return;saveCurrent();step--;draw();},'tempacc-secondary'));
      nav.append(button(step===steps.length-1?'Save my KiKi profile':step===1&&!sessionUser?'Create login & continue':'Continue',next,'tempacc-primary'));
      if(input) {input.focus();if(d.type==='email')input.value=values.email;}
    }
    function saveCurrent(){const d=steps[step];const inp=panel.querySelector('.wizard-field');if(inp)values[d.field]=inp.value;}
    async function next(){if(busy)return;saveCurrent();const d=steps[step];
      if(d.field==='email'&&!sessionUser&&!/^\S+@\S+\.\S+$/.test(values.email)){status.textContent='Enter a valid email address.';return;}
      if(d.field==='password'&&!sessionUser){if((values.password||'').length<8){status.textContent='Your password must contain at least 8 characters.';return;}busy=true;status.textContent='Creating your KiKi login…';try{const {data,error}=await db.auth.signUp({email:values.email.trim(),password:values.password,options:{emailRedirectTo:location.href.split('?')[0]}});if(error)throw error;if(data.session){sessionUser=data.user;hideWelcome();step=2;busy=false;draw();return;}status.textContent='Check your email to verify your KiKi login. After verification, open log-in.html and sign in, then reopen start.html to finish your profile.';busy=false;return;}catch(e){status.textContent=e.message||'Unable to create your login.';busy=false;return;}}
      if(d.field==='username'&&!/^[a-z0-9._]{3,24}$/.test((values.username||'').trim().replace(/^@/,'').toLowerCase())){status.textContent='Use 3–24 lowercase letters, numbers, dots or underscores.';return;}
      if(d.field==='display'&&!values.display.trim()){status.textContent='Please enter a display name.';return;}
      if(step<steps.length-1){panel.classList.add('is-leaving');setTimeout(()=>{step++;draw();},160);return;}
      busy=true;status.textContent='Saving profile…';try{
        if(!sessionUser)await currentUser();if(!sessionUser)throw new Error('Please log in first.');
        const uname=values.username.trim().replace(/^@/,'').toLowerCase();
        const {data:dupe,error:dupeError}=await db.from('profiles').select('id').eq('username',uname).neq('id',sessionUser.id).maybeSingle();if(dupeError)throw dupeError;if(dupe)throw new Error('That username is already taken.');
        let avatar_url=null,banner_url=null;if(values.avatar)avatar_url=await fileUrl(values.avatar,'avatars');if(values.banner)banner_url=await fileUrl(values.banner,'banners');
        const payload={id:sessionUser.id,username:uname,display_name:values.display.trim(),bio:(values.bio||'').trim(),profile_type:'user'};if(avatar_url)payload.avatar_url=avatar_url;if(banner_url)payload.banner_url=banner_url;
        const {error}=await db.from('profiles').upsert(payload,{onConflict:'id'});if(error)throw error;
        document.querySelectorAll('.tempacc-window').forEach(w=>w.remove());hideWelcome();await openProfile(uname);msg('KiKi profile saved');
      }catch(e){status.textContent=`Could not save profile: ${e.message||e}. If this is an RLS error, apply the updated tempacc-migration.sql policies.`;}finally{busy=false;}
    }
    body.append(progress,panel,status,nav);openWindow('start.html — KiKi profile setup',body,true);draw();
  }
  async function openOwnProfile(){
    const u=await currentUser(); if(!u)return openLoginWindow();
    const {data,error}=await db.from('profiles').select('username').eq('id',u.id).maybeSingle();
    if(error) throw error; if(!data?.username) return openWizard(); return openProfile(data.username);
  }
  async function openProfile(username){
    hideWelcome(); currentTab='posts';
    const body=el('div','wizard-shell profile-window-content'); body.append(el('p','music-description','Loading KiKi profile…'));
    const w=openWindow('KiKi profile',body,true);w.dataset.kind='account';const fsButton=$('#fullScreenMenuButton');if(fsButton)fsButton.classList.add('is-visible');
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
      const tabs=el('div','tempacc-tabs');[['posts','Posts'],['opinions','Opinions'],['reposts','Reposts'],...(profile.music_tab_enabled?[['music','Music']]:[])].forEach(([id,label])=>{const b=button(label,()=>{currentTab=id;renderTab();},`tempacc-tab ${currentTab===id?'active':''}`);b.dataset.tab=id;tabs.append(b);});body.append(tabs);
      const actions=el('div','tempacc-profile-actions'); if(sessionUser?.id===profile.id){actions.append(button('＋ Create post',()=>openPostComposer(profile),'tempacc-primary'),button('＋ Write opinion',()=>openOpinionComposer(profile),'tempacc-secondary'),button('Edit profile',()=>openEditProfile(profile),'tempacc-secondary'),button(profile.music_tab_enabled?'Manage music':'Add music tab',()=>openMusicSettings(profile),'tempacc-secondary'));}body.append(actions);
      const content=el('div','tempacc-tab-panel');body.append(content);
      function renderTab(){
        tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));content.innerHTML='';
        const mediaMap=new Map();(media||[]).forEach(m=>{if(!mediaMap.has(String(m.post_id)))mediaMap.set(String(m.post_id),[]);mediaMap.get(String(m.post_id)).push(m);});
        const list=(posts||[]).slice().sort((a,b)=>Number(!!b.is_pinned)-Number(!!a.is_pinned));
        const isMediaPost=post=>((mediaMap.get(String(post.id))||[]).length>0)||!!post.image_url||post.media_type==='video';
        const mediaFor=post=>{const assets=mediaMap.get(String(post.id))||[];if(assets.length)return assets;if(post.image_url)return [{url:post.image_url,media_type:post.media_type||'image',position:0}];return [];};
        const renderCard=(post,opinion=false)=>{
          const card=el('article',opinion?'tempacc-opinion-card':'tempacc-post-card');card.tabIndex=0;card.setAttribute('role','button');
          if(post.is_pinned)card.append(el('span','pin-tag','Pinned'));
          if(opinion){const bunny=makeOpinionBunny();const head=el('div','tempacc-opinion-bunny');head.append(bunny,el('span','',`@${profile.username} · ${new Date(post.created_at).toLocaleDateString()}`));card.append(head);card.append(el('p','',post.content||post.title||''));}
          else {card.append(el('h3','',post.title||'Post'));if(post.content)card.append(el('p','',post.content));const assets=mediaFor(post);if(assets.length){const gallery=el('div','tempacc-post-gallery');assets.forEach(asset=>{const node=el(asset.media_type==='video'?'video':'img');node.src=asset.url;if(node.tagName==='VIDEO'){node.controls=true;node.playsInline=true;}else node.alt='Post media';gallery.append(node);});card.append(gallery);}}
          const actions=el('div','tempacc-post-actions');actions.append(button('♡ Like',()=>openPostDetail(post,mediaFor(post),profile),'tempacc-secondary'),button('Comment',()=>openPostDetail(post,mediaFor(post),profile),'tempacc-secondary'),button('Share',async()=>{const url=`${location.origin}${location.pathname}?post=${encodeURIComponent(post.id)}`;try{await navigator.clipboard.writeText(url);msg('Post link copied');}catch{msg(url);}},'tempacc-secondary'));
          if(sessionUser?.id===profile.id){actions.append(button('Repost',()=>repost(post),'tempacc-secondary'),button(post.is_pinned?'Unpin':'Pin',()=>togglePin(post),'tempacc-secondary'),button('Delete',()=>deletePost(post),'tempacc-secondary'));}
          card.append(actions);card.addEventListener('click',e=>{if(e.target.closest('button')||e.target.closest('video'))return;openPostDetail(post,mediaFor(post),profile);});card.addEventListener('keydown',e=>{if(e.key==='Enter')openPostDetail(post,mediaFor(post),profile);});return card;
        };
        if(currentTab==='posts'||currentTab==='opinions'){
          if(postError){content.append(el('p','music-description','Could not load posts: '+postError.message));return;}
          const filtered=list.filter(p=>currentTab==='posts'?isMediaPost(p):!isMediaPost(p));
          if(!filtered.length){content.append(el('div','empty-posts',currentTab==='posts'?'No photo or video posts yet.':'No opinions yet.'));return;}
          filtered.forEach(post=>content.append(renderCard(post,currentTab==='opinions')));
        } else if(currentTab==='reposts'){
          if(repostError){content.append(el('p','music-description','Reposts are not available until the migration is applied.'));return;}if(!reposts?.length){content.append(el('div','empty-posts','No reposts yet.'));return;}content.append(el('p','music-description','Loading reposts…'));(async()=>{try{const ids=reposts.map(r=>r.post_id);const {data:shared,error}=await db.from('posts').select('id,title,content,image_url,created_at,media_type,is_pinned').in('id',ids);if(error)throw error;content.innerHTML='';(shared||[]).forEach(post=>content.append(renderCard(post,!isMediaPost(post))));if(!shared?.length)content.append(el('div','empty-posts','The original posts are no longer available.'));}catch(e){content.innerHTML='';content.append(el('p','music-description',e.message||String(e)));}})();
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
  function makeOpinionBunny(){
    const poses=[
      '<path d="M24 23V4h7v17M35 21V2h7v21" fill="#666d76"/><path d="M27 7v10M38 5v11" stroke="#d8b9c9" stroke-width="3"/><ellipse cx="35" cy="34" rx="18" ry="14" fill="#707781"/><circle cx="24" cy="31" r="3" fill="#424750"/><circle cx="43" cy="31" r="3" fill="#424750"/><path d="M32 37l3 2 3-2" stroke="#424750" fill="none" stroke-width="2"/>',
      '<path d="M21 23V4h7v19M34 22V7h7v15" fill="#666d76"/><path d="M24 7v10M37 10v9" stroke="#d8b9c9" stroke-width="3"/><ellipse cx="35" cy="35" rx="17" ry="13" fill="#707781"/><path d="M23 31q3 -3 6 0M40 31q3 -3 6 0" stroke="#424750" stroke-width="2" fill="none"/><circle cx="35" cy="36" r="2" fill="#d8b9c9"/>',
      '<path d="M20 23V3h7v22M33 22V1h7v22" fill="#666d76"/><path d="M23 6v12M36 5v12" stroke="#d8b9c9" stroke-width="3"/><ellipse cx="35" cy="36" rx="18" ry="12" fill="#707781"/><path d="M23 33h5M41 33h5" stroke="#424750" stroke-width="2"/><ellipse cx="35" cy="38" rx="3" ry="2" fill="#d8b9c9"/>'
    ];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56" shape-rendering="crispEdges">${poses[Math.floor(Math.random()*poses.length)]}<ellipse cx="22" cy="46" rx="7" ry="4" fill="#e4e5e8"/><ellipse cx="43" cy="46" rx="7" ry="4" fill="#e4e5e8"/><circle cx="52" cy="39" r="4" fill="#e4e5e8"/></svg>`;
    const img=el('img');img.src='data:image/svg+xml,'+encodeURIComponent(svg);img.alt='Pixel bunny';return img;
  }
  async function openPostDetail(post,assets,profile){
    const body=el('div','wizard-shell tempacc-post-detail');
    body.append(el('h2','',post.title||'Post'),el('p','music-description',`@${profile.username} · ${new Date(post.created_at||Date.now()).toLocaleString()}`));
    if(post.content)body.append(el('p','',post.content));
    const gallery=el('div','tempacc-post-gallery');(assets||[]).forEach(a=>{const node=el(a.media_type==='video'?'video':'img');node.src=a.url;if(node.tagName==='VIDEO'){node.controls=true;node.playsInline=true;}else node.alt='Post media';gallery.append(node);});if(gallery.children.length)body.append(gallery);
    const actions=el('div','tempacc-post-actions');const likeBtn=button('♡ Like',async()=>{if(!sessionUser){openLoginWindow();return;}try{const {data:existing,error:readError}=await db.from('post_likes').select('post_id').eq('post_id',post.id).eq('user_id',sessionUser.id).maybeSingle();if(readError)throw readError;if(existing){const {error}=await db.from('post_likes').delete().eq('post_id',post.id).eq('user_id',sessionUser.id);if(error)throw error;likeBtn.textContent='♡ Like';}else{const {error}=await db.from('post_likes').insert({post_id:post.id,user_id:sessionUser.id});if(error)throw error;likeBtn.textContent='♥ Liked';}await refreshCounts();}catch(e){msg('Like failed: '+(e.message||e));}},'tempacc-secondary');
    const share=button('Share / copy link',async()=>{const url=`${location.origin}${location.pathname}?post=${encodeURIComponent(post.id)}`;try{if(navigator.share)await navigator.share({title:post.title||'KiKi post',url});else{await navigator.clipboard.writeText(url);msg('Post link copied');}}catch(e){if(e.name!=='AbortError')msg(url);}},'tempacc-secondary');actions.append(likeBtn,share);body.append(actions);
    const counts=el('p','music-description','Loading likes and comments…');body.append(counts);const commentsWrap=el('div','tempacc-comments');body.append(el('h3','','Comments'),commentsWrap);
    const input=document.createElement('textarea');input.className='wizard-field';input.placeholder='Write a comment…';input.maxLength=2000;
    const send=button('Comment',async()=>{if(!sessionUser){openLoginWindow();return;}const content=input.value.trim();if(!content)return;send.disabled=true;try{const {error}=await db.from('post_comments').insert({post_id:post.id,user_id:sessionUser.id,content});if(error)throw error;input.value='';await loadComments();}catch(e){msg('Comment failed: '+(e.message||e));}finally{send.disabled=false;}});body.append(input,send);
    async function refreshCounts(){try{const [{count:likes},{data:mine},{count:commentCount}]=await Promise.all([db.from('post_likes').select('*',{count:'exact',head:true}).eq('post_id',post.id),sessionUser?db.from('post_likes').select('post_id').eq('post_id',post.id).eq('user_id',sessionUser.id).maybeSingle():Promise.resolve({data:null}),db.from('post_comments').select('*',{count:'exact',head:true}).eq('post_id',post.id)]);counts.textContent=`${likes||0} likes · ${commentCount||0} comments`;likeBtn.textContent=mine?'♥ Liked':'♡ Like';}catch{counts.textContent='Likes and comments';}}
    async function loadComments(){commentsWrap.innerHTML='';try{const {data,error}=await db.from('post_comments').select('id,content,user_id,created_at').eq('post_id',post.id).order('created_at',{ascending:true});if(error)throw error;if(!data?.length){commentsWrap.append(el('p','music-description','Be the first to comment.'));return;}for(const c of data){let username='KiKi user';try{const {data:p}=await db.from('profiles').select('username,display_name').eq('id',c.user_id).maybeSingle();if(p)username='@'+(p.username||p.display_name);}catch{}const row=el('div','tempacc-comment');row.append(el('strong','',username),el('p','',c.content));commentsWrap.append(row);}}catch(e){commentsWrap.append(el('p','music-description','Comments unavailable: '+(e.message||e)));}}
    await refreshCounts();await loadComments();openWindow('Post · KiKi',body,true);
  }
  async function openOpinionComposer(profile){
    if(!sessionUser)return openLoginWindow();const body=el('div','wizard-shell');body.append(el('h2','','Write an opinion'),el('p','music-description','Opinions are text-first, like a short social post. Photo and video posts belong in Posts.'));
    const text=document.createElement('textarea');text.className='wizard-field';text.placeholder='What is on your mind?';text.maxLength=5000;const count=el('p','music-description','0 / 5000');text.addEventListener('input',()=>count.textContent=`${text.value.length} / 5000`);const status=el('p','wizard-error');const publish=button('Publish opinion',async()=>{const content=text.value.trim();if(!content){status.textContent='Write something before publishing.';return;}publish.disabled=true;try{const {error}=await db.from('posts').insert({author_id:sessionUser.id,artist_id:null,title:'',content,image_url:null,is_staff_post:false,media_type:'text'});if(error)throw error;document.querySelectorAll('.tempacc-window').forEach(w=>w.remove());await openProfile(profile.username);msg('Opinion published');}catch(e){status.textContent='Could not publish opinion: '+(e.message||e);}finally{publish.disabled=false;}});body.append(text,count,status,publish,button('Cancel',()=>body.closest('.tempacc-window')?.remove(),'tempacc-secondary'));openWindow('Write an opinion',body,true);
  }
  async function openFeed(){
    const body=el('div','wizard-shell tempacc-feed');body.append(el('h2','','KiKi feed'),el('p','music-description','Browse media posts and text-first opinions from the KiKi community.'));
    const tabs=el('div','tempacc-tabs');const panel=el('div','tempacc-tab-panel');body.append(tabs,panel);let kind='posts';let all=[],media=[];
    function draw(){panel.innerHTML='';tabs.innerHTML='';[['posts','Posts'],['opinions','Opinions']].forEach(([id,label])=>{const b=button(label,()=>{kind=id;draw();},`tempacc-tab ${kind===id?'active':''}`);tabs.append(b);});const filtered=all.filter(p=>{const has=(media.filter(m=>String(m.post_id)===String(p.id)).length>0)||!!p.image_url||p.media_type==='video';return kind==='posts'?has:!has;});if(!filtered.length){panel.append(el('div','empty-posts',kind==='posts'?'No media posts in the feed yet.':'No opinions in the feed yet.'));return;}filtered.forEach(post=>{const author=post.profiles||{};const profile={id:post.author_id,username:author.username||'user',display_name:author.display_name||author.username||'KiKi user'};const assets=media.filter(m=>String(m.post_id)===String(post.id));if(!assets.length&&post.image_url)assets.push({url:post.image_url,media_type:post.media_type||'image'});const card=el('article',kind==='opinions'?'tempacc-opinion-card':'tempacc-post-card');if(kind==='opinions'){const head=el('div','tempacc-opinion-bunny');head.append(makeOpinionBunny(),el('span','',`@${profile.username} · ${new Date(post.created_at).toLocaleDateString()}`));card.append(head,el('p','',post.content||''));}else{card.append(el('h3','',post.title||'Post'),el('small','',`@${profile.username}`),el('p','',post.content||''));const gallery=el('div','tempacc-post-gallery');assets.forEach(a=>{const n=el(a.media_type==='video'?'video':'img');n.src=a.url;if(n.tagName==='VIDEO')n.controls=true;else n.alt='Post media';gallery.append(n);});if(gallery.children.length)card.append(gallery);}card.append(button('View · Like · Comment · Share',()=>openPostDetail(post,assets,profile),'tempacc-secondary'));panel.append(card);});}
    try{const [{data:posts,error},{data:med,error:me}]=await Promise.all([db.from('posts').select('id,author_id,title,content,image_url,created_at,media_type,is_pinned,profiles!posts_author_id_fkey(username,display_name,avatar_url)').order('created_at',{ascending:false}).limit(60),db.from('kiki_post_media').select('post_id,url,media_type,position').order('position')]);if(error)throw error;if(me)media=med||[];all=posts||[];draw();}catch(e){panel.append(el('p','music-description','Feed could not load: '+(e.message||e)));}openWindow('feed.html',body,true);
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
  window.openLoginWindow=openLoginWindow; window.openWizard=openWizard; window.openProfile=openProfile; window.openPostComposer=openPostComposer; window.openFeed=openFeed;
  const start=$('#startButton');if(start)start.onclick=()=>{hideWelcome();openWizard();};
  const rec=$('#recommendedButton');if(rec)rec.onclick=async()=>{const body=el('div','wizard-shell');body.append(el('h2','','Recommended KiKi accounts'));try{const {data,error}=await db.from('profiles').select('id,username,display_name,avatar_url,profile_type').order('display_name').limit(100);if(error)throw error;const priority=['seiun','seiunsecret','harmonia','osako’s diary',"osako's diary",'hoshi','kiki'];const score=p=>{const n=(p.display_name||'').toLowerCase(),u=(p.username||'').toLowerCase();for(let i=0;i<priority.length;i++)if(n===priority[i]||u===priority[i]||n.includes(priority[i]))return i;return 99;};const rows=(data||[]).sort((a,b)=>score(a)-score(b)||(a.display_name||'').localeCompare(b.display_name||''));const seen=new Set();for(const name of ['SEIUN','seiunsecret','Harmonia',"Osako's Diary",'HOSHI','KiKi']){const p=rows.find(x=>!seen.has(x.id)&&score(x)<99&&((x.display_name||'').toLowerCase().includes(name.toLowerCase())||(x.username||'').toLowerCase()===name.toLowerCase()));if(p){seen.add(p.id);appendRecommended(p);}else{const row=el('div','recommended-row');const av=el('div','recommended-avatar',name[0]);const text=el('div','grow');text.append(el('strong','',name),el('small','','Official KiKi account'));row.append(av,text,button('Open',()=>openProfile(name.toLowerCase().replace(/[^a-z0-9._]/g,'')),'small-button'));body.append(row);}}rows.filter(p=>!seen.has(p.id)).forEach(appendRecommended);function appendRecommended(p){const row=el('div','recommended-row');if(p.avatar_url){const im=el('img','recommended-avatar');im.src=p.avatar_url;im.alt='';row.append(im);}else row.append(el('div','recommended-avatar',(p.display_name||p.username||'?')[0].toUpperCase()));const text=el('div','grow');text.append(el('strong','',p.display_name||p.username),el('small','',`@${p.username} · ${p.profile_type||'user'}`));row.append(text,button('Open',()=>openProfile(p.username),'small-button'));body.append(row);}}catch(e){body.append(el('p','music-description','Could not load accounts: '+(e.message||e)));}openWindow('recommended accounts',body,true);};
  const desktop=$('#desktopItems');if(desktop&&typeof icon==='function'){desktop.innerHTML='';desktop.append(icon('start.html','file',0,0,openWizard));desktop.append(icon('feed.html','file',0,80,openFeed));desktop.append(icon('recommended accounts','folder',0,160,()=>$('#recommendedButton')?.click()));const login=icon('log-in.html','file',0,240,()=>sessionUser?signOutImmediately():openLoginWindow());login.classList.add('login-desktop-icon');desktop.append(login);updateLoginIcon();}
  // Pixel-art sleeping bunny family, drawn on a low-resolution grid for crisp edges.
  function drawBunnyFamily(){
    const canvas=$('#bunnyCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');let dpr=1;
    function resize(){dpr=Math.min(window.devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);}
    const palettes=[{fur:'#626872',shade:'#454b54',light:'#e7e8eb',pink:'#cda9bc'},{fur:'#777d86',shade:'#535963',light:'#f0f0f1',pink:'#d8b8c9'},{fur:'#555b64',shade:'#3e444c',light:'#e0e3e7',pink:'#c59fb4'}];
    const sprites=[
      [ // upright sleepy bunny
        '....##....##....','....##....##....','....##....##....','....#p....p#....','....#p....p#....','....##....##....','.....########...','....##########..','...############.','...############.','...##..##..####.','...##..##..####.','...############.','....##########..','.....########...','......######....','....##########..','...############.','...###....###...','..####....####..'
      ],
      [ // curled up bunny, ears tipped to the side
        '.....##.........','....###.........','...###..........','...##p..........','..###p..........','..########......','.############...','##############..','###############.','###..##...######','##...##....#####','###############.','.#############..','..###########...','...#########....','....#######.....','.....#####......','....###.###.....','...###...###....','..###.....###...'
      ],
      [ // little sitting bunny with one ear angled
        '......####......','......####......','......##p#......','......##p#......','.....######.....','....########....','...##########...','...##########...','..############..','..############..','..##..####..##...','..##..####..##...','..############..','...##########...','....########....','....########....','...##########...','..############..','..###......###...','..##........##...'
      ]
    ];
    function drawSprite(x,y,scale,variant){const pal=palettes[variant%palettes.length],grid=sprites[variant%sprites.length];const cell=Math.max(1,Math.floor(scale));for(let row=0;row<grid.length;row++){const line=grid[row];for(let col=0;col<line.length;col++){const ch=line[col];if(ch==='.')continue;ctx.fillStyle=ch==='p'?pal.pink:pal.fur;if(ch==='#')ctx.fillStyle=pal.fur;ctx.fillRect(Math.round(x+col*cell),Math.round(y+row*cell),cell,cell);}}
      // face details: sleepy curved eyes, nose, cheek pixels, paws and tail
      const c=cell;ctx.fillStyle=pal.shade;ctx.fillRect(Math.round(x+7*c),Math.round(y+10*c),2*c,c);ctx.fillRect(Math.round(x+12*c),Math.round(y+10*c),2*c,c);ctx.fillStyle=pal.pink;ctx.fillRect(Math.round(x+10*c),Math.round(y+12*c),c,c);ctx.fillStyle=pal.light;ctx.fillRect(Math.round(x+5*c),Math.round(y+18*c),3*c,c);ctx.fillRect(Math.round(x+13*c),Math.round(y+18*c),3*c,c);ctx.fillRect(Math.round(x+17*c),Math.round(y+15*c),2*c,2*c);
    }
    function draw(){const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);const scale=Math.max(2,Math.min(3.2,Math.floor(r.width/460)));const base=r.height-4;const x=Math.max(12,Math.min(r.width*.24,r.width-230));drawSprite(x,base-20*scale,scale,0);drawSprite(x+54*scale,base-18*scale,Math.max(2,scale-1),1);drawSprite(x+102*scale,base-20*scale,Math.max(2,scale-1),2);const t=performance.now()/1000;ctx.fillStyle='rgba(75,82,92,.88)';ctx.font='600 12px Inter, sans-serif';ctx.fillText('z',x+20*scale,base-22*scale-Math.sin(t*1.3)*4);ctx.font='600 16px Inter, sans-serif';ctx.fillText('Z',x+55*scale,base-28*scale-Math.sin(t*1.05)*5);ctx.font='600 10px Inter, sans-serif';ctx.fillText('z',x+92*scale,base-22*scale-Math.sin(t*1.6)*3);requestAnimationFrame(draw);}
    window.addEventListener('resize',resize);resize();requestAnimationFrame(draw);
  }
  async function signOutImmediately(){
    try{const client=window.tempaccSupabase||db;if(window.runTempaccSignOut){const result=await window.runTempaccSignOut();if(result?.error)throw result.error;}else{const {error}=await client.auth.signOut();if(error)throw error;}sessionUser=null;showWelcome();updateLoginIcon();document.querySelectorAll('.tempacc-window').forEach(w=>w.remove());const loginIcon=document.querySelector('.login-desktop-icon .icon-label');if(loginIcon)loginIcon.textContent='log-in.html';msg('Signed out.');}catch(e){msg('Could not sign out: '+(e.message||e));}
  }
  window.tempaccSignOut=signOutImmediately;
  const fsButton=$('#fullScreenMenuButton');if(fsButton)fsButton.addEventListener('click',()=>{const windows=[...document.querySelectorAll('.tempacc-window')];const target=windows.sort((a,b)=>(Number(b.style.zIndex)||0)-(Number(a.style.zIndex)||0))[0];if(!target)return;target.classList.toggle('is-fullscreen');fsButton.textContent=target.classList.contains('is-fullscreen')?'Exit full screen':'Full screen';});
  document.querySelectorAll('.menu-item[data-menu]').forEach(b=>{if(b.dataset.menu==='Help')b.onclick=()=>msg('Open Help for KiKi tempacc.');});
  const params=new URL(location.href).searchParams;const requestedPost=params.get('post');
  drawBunnyFamily();
  (async()=>{try{
    await refreshSession();
    const query=params.get('username');
    if(sessionUser){hideWelcome();if(query)await openProfile(query);else if(!requestedPost)await openOwnProfile();}
    else if(query)await openProfile(query);
    if(requestedPost){const {data:post,error}=await db.from('posts').select('id,author_id,title,content,image_url,media_type,created_at,is_pinned').eq('id',requestedPost).maybeSingle();if(error)throw error;if(post){const {data:author}=await db.from('profiles').select('id,username,display_name').eq('id',post.author_id).maybeSingle();const {data:assets}=await db.from('kiki_post_media').select('url,media_type,position').eq('post_id',String(post.id)).order('position');await openPostDetail(post,assets||[],author||{username:'user'});}}
  }catch(e){console.warn('tempacc session check:',e.message||e);}})();
})();
