(function(){
  const app=document.getElementById('app');
  const path=location.pathname.replace(/\/+$/,'');
  const match=path.match(/\/app\/([^/]+)(?:\/(.*))?$/i);
  const slug=match?decodeURIComponent(match[1]):'';
  const pageSlug=match&&match[2]?decodeURIComponent(match[2]).replace(/^\/+|\/+$/g,''):'';

  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function attr(v){return esc(v);}
  function safeHex(v,f){return /^#[0-9a-f]{6}$/i.test(String(v||''))?v:f;}
  function rgba(h,o){h=String(h||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return `rgba(0,0,0,${o})`;return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${o})`;}
  function buildCSS(t){
    const shadow=`${Number(t.shadowX)||0}px ${Number(t.shadowY)||20}px ${Number(t.shadowBlur)||40}px ${rgba(t.shadowColor||'#000000',Number(t.shadowOpacity??.25))}`;
    return `*{box-sizing:border-box}body{margin:0;background:${t.backgroundGradient||safeHex(t.background,'#fff')};color:${safeHex(t.text,'#111')};font-family:'${String(t.font||'Inter').replaceAll("'",'')}',system-ui,sans-serif;font-size:${Number(t.bodySize)||16}px;text-align:${t.textAlign||'left'}}.site-nav{border-bottom:${Number(t.borderWidth)||0}px solid ${safeHex(t.borderColor,'#ddd')};box-shadow:${shadow};background:rgba(255,255,255,.04);backdrop-filter:blur(14px)}.nav-inner{min-height:70px;padding:0 6%;display:flex;align-items:center;justify-content:space-between;max-width:${Number(t.maxWidth)||1440}px;margin:auto}.brand-link{font-weight:800;color:inherit;text-decoration:none}.nav-links{display:flex;gap:22px}.nav-links a{color:inherit;text-decoration:none}.announcement{padding:10px 18px;text-align:center;background:${safeHex(t.announcement?.background,'#8f6cff')};color:${safeHex(t.announcement?.color,'#fff')}}.hero{min-height:430px;padding:80px 8%;display:flex;flex-direction:column;justify-content:center;background:${t.backgroundGradient||safeHex(t.background,'#fff')}}.hero h1,.heading h2{font-family:'${String(t.headingFont&&t.headingFont!=='inherit'?t.headingFont:t.font||'Inter').replaceAll("'",'')}',sans-serif}.hero h1{max-width:850px;font-size:${Number(t.headingSize)||56}px;line-height:.98;color:${safeHex(t.heading,'#111')}}.hero p{max-width:680px;line-height:1.7}.cta-button{display:inline-block;padding:13px 22px;border-radius:${Number(t.borderRadius)||10}px;color:${safeHex(t.buttonText,'#fff')};background:${t.buttonGradient||safeHex(t.primary,'#8f6cff')};box-shadow:${shadow};text-decoration:none}.heading{padding:${Number(t.sectionSpacing)||60}px 8% 15px}.heading h2{font-size:${Number(t.headingSize)||56}px;color:${safeHex(t.heading,'#111')}}.text{padding:10px 8% ${Number(t.sectionSpacing)||45}px}.text p{max-width:760px;line-height:1.8}.image{padding:25px 8%}.image img{width:100%;max-height:600px;object-fit:cover;border-radius:${Number(t.borderRadius)||10}px}.custom-public{width:100%}.shop-block{max-width:${Number(t.maxWidth)||1440}px;margin:auto;padding:${Number(t.sectionSpacing)||60}px 6%}.shop-grid{display:grid;grid-template-columns:repeat(var(--columns,4),minmax(0,1fr));gap:20px}.shop-card{border:${Number(t.borderWidth)||1}px solid ${safeHex(t.borderColor,'#ddd')};border-radius:${Number(t.borderRadius)||16}px;overflow:hidden;box-shadow:${shadow};background:rgba(255,255,255,.03)}.shop-card img{width:100%;aspect-ratio:1;object-fit:cover;display:block}.shop-card-content{padding:17px}.shop-card a{color:inherit;text-decoration:none}.review-card{padding:20px;border:${Number(t.borderWidth)||1}px solid ${safeHex(t.borderColor,'#ddd')};border-radius:${Number(t.borderRadius)||16}px;box-shadow:${shadow}}footer{padding:35px 6%;text-align:${t.footer?.alignment||'center'};border-top:1px solid ${safeHex(t.borderColor,'#ddd')}}@media(max-width:800px){.shop-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nav-links{gap:10px;font-size:13px}}@media(max-width:520px){.shop-grid{grid-template-columns:1fr}}`;
  }
  function showError(title,message){
    app.innerHTML=`<div class="error"><h1>${esc(title)}</h1><p>${esc(message)}</p></div>`;
  }

  async function main(){
    if(!slug){showError('Nemawashi Website','No website path was supplied.');return;}
    const siteResult=await supabaseClient.from('websites').select('*').eq('slug',slug).eq('status','published').maybeSingle();
    if(siteResult.error||!siteResult.data){console.error('Nemawashi public website lookup failed:',siteResult.error);showError('Website not found','This Nemawashi website does not exist or has not been published yet.');return;}
    const site=siteResult.data;
    const [themeResult,pagesResult]=await Promise.all([
      supabaseClient.from('website_themes').select('*').eq('website_id',site.id).maybeSingle(),
      supabaseClient.from('website_pages').select('*').eq('website_id',site.id).order('position')
    ]);
    const pages=pagesResult.data||[];
    const page=(pageSlug?pages.find(p=>p.slug===pageSlug):null)||pages.find(p=>p.is_homepage)||pages[0];
    if(!page){showError('This website has no pages yet.','Publish at least one page from the Nemawashi App Builder.');return;}
    const sectionResult=await supabaseClient.from('website_sections').select('*').eq('page_id',page.id).order('position');
    const sections=sectionResult.data||[];
    const ids=sections.map(s=>s.id);
    let elements=[];
    if(ids.length){const r=await supabaseClient.from('website_elements').select('*').in('section_id',ids).order('position');elements=r.data||[];}
    const theme=themeResult.data?.settings||{};
    let body='';
    for(const section of sections){
      const sectionElements=elements.filter(e=>e.section_id===section.id).sort((a,b)=>a.position-b.position);
      for(const e of sectionElements){
        const s=e.settings||{};
        if(e.type==='hero') body+=`<section class="hero"><h1>${esc(s.heading||'')}</h1><p>${esc(s.text||'')}</p>${s.buttonText?`<a class="cta-button" href="${attr(s.buttonUrl||'#')}">${esc(s.buttonText)}</a>`:''}</section>`;
        else if(e.type==='heading') body+=`<section class="heading"><h2>${esc(s.text||'')}</h2></section>`;
        else if(e.type==='text') body+=`<section class="text"><p>${esc(s.text||'')}</p></section>`;
        else if(e.type==='button') body+=`<section class="text"><a class="cta-button" href="${attr(s.url||'#')}">${esc(s.text||'Button')}</a></section>`;
        else if(e.type==='image'&&s.src) body+=`<section class="image"><img src="${attr(s.src)}" alt="${attr(s.alt||'')}"></section>`;
        else if(e.type==='spacer') body+=`<div style="height:${Number(s.height)||90}px"></div>`;
        else if(e.type==='custom') body+=`<section class="custom-public">${s.html||''}<style>${s.css||''}</style><script>${s.js||''}<\/script></section>`;
        else if(e.type.startsWith('shop-')) body+=await renderShopElement(e,s,site);
        else if(e.type==='announcement') body+=`<div class="announcement">${esc(s.text||'')}</div>`;
      }
    }
    const nav=theme.navigation||{};
    const navHtml=page.settings?.showNav==='no'?'':`<nav class="site-nav"><div class="nav-inner"><a class="brand-link" href="/app/${attr(site.slug)}">${esc(site.name)}</a><div class="nav-links">${(nav.links||[]).map(l=>`<a href="${attr(l.url||'#')}">${esc(l.label||'')}</a>`).join('')}</div></div></nav>`;
    const ann=theme.announcement?.enabled?`<div class="announcement">${esc(theme.announcement.text||'')}</div>`:'';
    const footer=page.settings?.showFooter==='no'||theme.footer?.enabled===false?'':`<footer>© ${esc(theme.footer?.year||new Date().getFullYear())} ${esc(theme.footer?.company||'Hrmnx Entertainment')}. ${esc(theme.footer?.text||'All rights reserved.')}</footer>`;
    const fontUrl=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.font||'Inter').replace(/%20/g,'+')}:wght@400;500;600;700&display=swap`;
    const headingFont=theme.headingFont&&theme.headingFont!=='inherit'?`https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.headingFont).replace(/%20/g,'+')}:wght@400;500;600;700&display=swap`:'';
    document.title=site.name;
    document.head.insertAdjacentHTML('beforeend',`<link href="${fontUrl}" rel="stylesheet">${headingFont?`<link href="${headingFont}" rel="stylesheet">`:''}<style>${buildCSS(theme)}</style>`);
    app.innerHTML=ann+navHtml+body+footer;
  }
  async function renderShopElement(e,s,site){
    const table=s.source||'products';
    const result=await supabaseClient.from(table).select('*').limit(Number(s.limit)||8);
    const arr=result.data||[];
    if(result.error) return `<section class="shop-block"><h2>${esc(s.title||'Shop')}</h2><p>This shop block is waiting for its configured Supabase source.</p></section>`;
    if(e.type==='shop-products'||e.type==='shop-artists'||e.type==='shop-releases'){
      const nf=s.nameField||'name', im=s.imageField||'image_url';
      return `<section class="shop-block"><div class="eyebrow">HRMNX SHOP</div><h2>${esc(s.title||'Shop')}</h2><div class="shop-grid" style="--columns:${Math.max(1,Math.min(6,Number(s.columns)||4))}">${arr.map(r=>`<article class="shop-card">${r[im]?`<img src="${attr(r[im])}" alt="">`:''}<div class="shop-card-content"><strong>${esc(r[nf]??'Untitled')}</strong>${e.type==='shop-releases'&&r[s.dateField||'release_date']?`<div>${esc(r[s.dateField||'release_date'])}</div>`:''}</div></article>`).join('')||'<p>No items are available yet.</p>'}</div></section>`;
    }
    if(e.type==='shop-reviews') return `<section class="shop-block"><div class="eyebrow">REVIEWS</div><h2>${esc(s.title||'Reviews')}</h2><div class="shop-grid" style="--columns:2">${arr.map(r=>`<article class="review-card"><strong>${esc(r[s.authorField||'display_name']||'Guest')}</strong><div>★ ${esc(r[s.ratingField||'rating']??'')}</div><p>${esc(r[s.textField||'content']||'')}</p></article>`).join('')||'<p>No reviews yet.</p>'}</div></section>`;
    const r=arr[0]||{};
    return `<section class="shop-block"><article class="shop-card"><div class="shop-card-content"><h1>${esc(r[s.nameField||'name']||s.title||'Product')}</h1><p>${esc(r[s.descriptionField||'description']||'')}</p><strong>${esc(r[s.priceField||'price']??'')}</strong></div></article></section>`;
  }
  main().catch(error=>{console.error('Nemawashi public website error:',error);showError('Nemawashi could not load this website.','Please try again later.');});
})();
