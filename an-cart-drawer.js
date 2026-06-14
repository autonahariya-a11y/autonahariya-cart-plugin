/**
 * AN Cart Drawer — v9.10.0 (Manual gift meta via data-name/data-image + Gate gift injection by cart threshold)
 * Auto Nahariya — Konimbo Platform
 * Clean professional design, integrated gift-by-cart-value system
 */
if(window._anCartLoaded) { /* Prevent double init from multiple Hybrid files */ }
else {
window._anCartLoaded = true;
(function(){
'use strict';

/* =====================================================================
   CONFIG
   ===================================================================== */
var SHIP   = 400;
var SCOST  = 35;
var PHONE  = '97249517322';
var CK     = 'an_cart_v4';
var DK     = 'an_cart_del';
var GK     = 'an_gift_v1';  /* gift selection storage key */

/* =====================================================================
   GIFT TIERS CONFIG — edit gift names/emojis/values here
   ===================================================================== */
var GIFT_TIERS = [
  { id:'tier1', threshold:400,  label:'מתנה בסיסית', perks:['משלוח חינם','מתנה חינם'], gifts:[
    { id:'g1a', name:'מטלית מיקרופייבר', emoji:'🧽', value:25 },
    { id:'g1b', name:'מפיץ ריח לרכב',   emoji:'🌲', value:29 },
    { id:'g1c', name:'מחזיק מפתחות AN', emoji:'🔑', value:22 }
  ]},
  { id:'tier2', threshold:700,  label:'מתנה משודרגת', perks:['מתנה משודרגת'], gifts:[
    { id:'g2a', name:'מטען USB מהיר',   emoji:'🔌', value:65 },
    { id:'g2b', name:'מארגן תא מטען',   emoji:'📦', value:75 },
    { id:'g2c', name:'ערכת שטיפת רכב', emoji:'🧴', value:70 }
  ]},
  { id:'tier3', threshold:1000, label:'מתנת פרימיום', perks:['מתנת פרימיום'], gifts:[
    { id:'g3a', name:'מצלמת רכב HD',     emoji:'📷', value:180 },
    { id:'g3b', name:'שואב אבק נייד',    emoji:'🌬️', value:165 },
    { id:'g3c', name:'ערכת כלי עבודה', emoji:'🧰', value:190 }
  ]}
];

/* =====================================================================
   PRODUCT-BACKED CONFIG (optional)
   If a #anGiftsConfig element exists in the page (added via Hybrid),
   we parse its <a href="/items/..."> links per tier, fetch each product's
   JSON-LD on the same domain, and replace GIFT_TIERS with real products.
   Cached in localStorage for 24h.

   Expected HTML in Hybrid:
   <div id="anGiftsConfig" style="display:none">
     <div data-tier="tier1" data-label="מתנה בסיסית" data-threshold="400" data-perks="משלוח חינם,מתנה חינם">
       <a href="https://www.autonahariya.co.il/items/123"></a>
       <a href="https://www.autonahariya.co.il/items/124"></a>
       <a href="https://www.autonahariya.co.il/items/125"></a>
     </div>
     <div data-tier="tier2" data-label="מתנה משודרגת" data-threshold="700" data-perks="מתנה משודרגת"> ... </div>
     <div data-tier="tier3" data-label="מתנת פרימיום" data-threshold="1000" data-perks="מתנת פרימיום"> ... </div>
   </div>
   ===================================================================== */
var GIFT_CACHE_KEY = 'an_gift_products_v1';
var GIFT_CACHE_TTL = 24 * 60 * 60 * 1000; /* 24h */

function parseGiftsConfig(){
  var root = document.getElementById('anGiftsConfig');
  if(!root) return null;
  var tiers = [];
  var tierEls = root.querySelectorAll('[data-tier]');
  for(var i=0; i<tierEls.length; i++){
    var el = tierEls[i];
    var links = el.querySelectorAll('a[href*="/items/"]');
    var entries = [];
    for(var j=0; j<links.length && j<6; j++){
      var a = links[j];
      var href = a.getAttribute('href');
      if(!href) continue;
      /* Manual overrides: <a href="..." data-name="..." data-image="...">label</a> */
      var manualName = a.getAttribute('data-name') || (a.textContent || '').trim() || '';
      var manualImage = a.getAttribute('data-image') || '';
      entries.push({ url: href, name: manualName, image: manualImage });
    }
    if(!entries.length) continue;
    var perks = (el.getAttribute('data-perks') || el.getAttribute('data-label') || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
    tiers.push({
      id: el.getAttribute('data-tier') || ('tier' + (i+1)),
      threshold: Number(el.getAttribute('data-threshold')) || 0,
      label: el.getAttribute('data-label') || ('רמה ' + (i+1)),
      perks: perks.length ? perks : [el.getAttribute('data-label') || 'מתנה'],
      _entries: entries
    });
  }
  return tiers.length ? tiers : null;
}

function loadGiftCache(){
  try{
    var raw = localStorage.getItem(GIFT_CACHE_KEY);
    if(!raw) return null;
    var obj = JSON.parse(raw);
    if(!obj || !obj.t || (Date.now() - obj.t) > GIFT_CACHE_TTL) return null;
    return obj.data;
  }catch(e){ return null; }
}
function saveGiftCache(data){
  try{ localStorage.setItem(GIFT_CACHE_KEY, JSON.stringify({t:Date.now(), data:data})); }catch(e){}
}

function fetchProductMeta(url){
  return fetch(url, {credentials:'same-origin'})
    .then(function(r){ return r.text(); })
    .then(function(html){
      var blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g) || [];
      for(var i=0; i<blocks.length; i++){
        var json = blocks[i].replace(/<script[^>]+>/,'').replace(/<\/script>/,'');
        try{
          var data = JSON.parse(json);
          var t = data && data['@type'];
          var isProduct = (t === 'Product') || (Array.isArray(t) && t.indexOf('Product') !== -1);
          if(isProduct){
            var price = 0;
            if(data.offers){
              if(Array.isArray(data.offers)) price = Number(data.offers[0] && data.offers[0].price) || 0;
              else price = Number(data.offers.price) || 0;
            }
            return {
              id: 'p' + ((url.match(/\/items\/(\d+)/) || [,''])[1]),
              name: String(data.name || '').replace(/\s*\|.*/, '').trim(),
              image: data.image || '',
              value: price,
              url: url
            };
          }
        }catch(e){}
      }
      var ogImg = (html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) || [])[1] || '';
      var ogTitle = (html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/) || [])[1] || '';
      return { id:'p'+((url.match(/\/items\/(\d+)/)||[,''])[1]), name:ogTitle, image:ogImg, value:0, url:url };
    })
    .catch(function(){ return null; });
}

function hydrateGiftTiersFromDOM(onReady){
  var configTiers = parseGiftsConfig();
  if(!configTiers){ if(onReady) onReady(false); return; }

  var cached = loadGiftCache();
  if(cached && cached.length === configTiers.length){
    GIFT_TIERS = cached;
    if(onReady) onReady(true);
    setTimeout(function(){ doFetchAndCache(configTiers, function(){}); }, 100);
    return;
  }
  doFetchAndCache(configTiers, onReady);
}

function doFetchAndCache(configTiers, onReady){
  var pending = 0, total = 0;
  for(var i=0; i<configTiers.length; i++) total += configTiers[i]._entries.length;
  if(!total){ if(onReady) onReady(false); return; }

  var built = configTiers.map(function(t){
    return { id:t.id, threshold:t.threshold, label:t.label, perks:t.perks, gifts:[] };
  });

  /* Pre-fill gifts with manual data immediately so render is fast (no waiting on fetch) */
  configTiers.forEach(function(t, ti){
    t._entries.forEach(function(e, gi){
      built[ti].gifts[gi] = {
        id: t.id + '_' + gi,
        name: e.name || 'מתנה ' + (gi+1),
        image: e.image || '',
        value: 0,
        url: e.url,
        emoji: ''
      };
    });
  });

  /* Render with manual data right away */
  GIFT_TIERS = built.map(function(b){ return { id:b.id, threshold:b.threshold, label:b.label, perks:b.perks, gifts:b.gifts.slice() }; });
  if(onReady) onReady(true);

  /* Then enhance with fetched JSON-LD where possible (overrides manual only if more complete) */
  configTiers.forEach(function(t, ti){
    t._entries.forEach(function(e, gi){
      pending++;
      fetchProductMeta(e.url).then(function(p){
        if(p && p.name && !e.name){ built[ti].gifts[gi].name = p.name; }
        if(p && p.image && !e.image){ built[ti].gifts[gi].image = p.image; }
        if(p && p.value){ built[ti].gifts[gi].value = p.value; }
        if(--pending === 0){
          GIFT_TIERS = built;
          saveGiftCache(built);
        }
      }).catch(function(){
        if(--pending === 0){
          GIFT_TIERS = built;
          saveGiftCache(built);
        }
      });
    });
  });
}



/* =====================================================================
   STORAGE HELPERS
   ===================================================================== */
function load(){
  try{ return JSON.parse(sessionStorage.getItem(CK)) || {}; }
  catch(e){ return {}; }
}
function save(c){ sessionStorage.setItem(CK, JSON.stringify(c)); }
function fp(n){ return '\u20aa' + Math.round(n); }
function getDeleted(){try{return JSON.parse(sessionStorage.getItem(DK))||{}}catch(e){return{}}}
function markDeleted(id){var d=getDeleted();d[id]=1;sessionStorage.setItem(DK,JSON.stringify(d))}
function isDeleted(id){return !!getDeleted()[id]}

/* Gift selection helpers */
function loadGift(){try{return JSON.parse(sessionStorage.getItem(GK))||{}}catch(e){return{}}}
function saveGift(g){try{sessionStorage.setItem(GK,JSON.stringify(g))}catch(e){}}
function currentTier(total){
  var c=null;
  for(var i=0;i<GIFT_TIERS.length;i++){ if(total>=GIFT_TIERS[i].threshold) c=GIFT_TIERS[i]; }
  return c;
}
function nextTier(total){
  for(var i=0;i<GIFT_TIERS.length;i++){ if(total<GIFT_TIERS[i].threshold) return GIFT_TIERS[i]; }
  return null;
}

/* =====================================================================
   WAIT FOR jQuery — init only after $ is available
   ===================================================================== */
function waitForJQuery(cb){
  if(typeof window.jQuery !== 'undefined' && typeof window.jQuery.fn !== 'undefined'){
    cb(window.jQuery);
  } else {
    setTimeout(function(){ waitForJQuery(cb); }, 50);
  }
}

/* =====================================================================
   BADGE UPDATE — runs immediately, no drawer open needed
   Fixes Bug #3: badge resets on page load
   ===================================================================== */
function updateBadge(){
  var c = load(), cnt = 0;
  for(var k in c){
    if(c.hasOwnProperty(k)) cnt += (c[k].q || 1);
  }
  /* Update ALL possible badge selectors Konimbo uses */
  var badges = document.querySelectorAll(
    'span.cart_with_items_counter, .cart_count, #cart_count, ' +
    '.header-cart-count, span[class*="cart_counter"], ' +
    '.nah-cart-badge, #anCnt'
  );
  for(var i=0; i<badges.length; i++){
    badges[i].textContent = cnt;
  }
  return cnt;
}

/* Run badge update immediately (before jQuery ready) */
updateBadge();

/* =====================================================================
   CART ICON INTERCEPT — capture phase (fires BEFORE Konimbo handlers)
   Fixes Bug #2: Konimbo overrides our click handler
   ===================================================================== */
function attachCartIconCapture(openFn){
  /* All selectors that might be the cart icon */
  var cartSelectors = [
    '#link_order_with_counter a',
    '#link_order_with_counter a.cart',
    'ul#header_cart_nav a.cart',
    'a.cart[href*="konimbo"]',
    'a.cart[href*="orders"]',
    '#link_order_with_counter',
    /* Mobile: nah-bar custom cart icon */
    '.nah-icon.nah-ct',
    '.nah-ct',
    'a.nah-ct'
  ];

  var attachedSet = [];

  function attachToEl(el){
    if(!el || attachedSet.indexOf(el) !== -1) return;
    attachedSet.push(el);

    /* Remove ALL existing handlers and attributes */
    if(el.tagName === 'A'){
      el.setAttribute('href', 'javascript:void(0)');
    }
    el.removeAttribute('onclick');
    el.onclick = null;
    try { $(el).off('click'); } catch(ex){}

    /* Capture phase — fires BEFORE any bubbling jQuery handlers */
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      openFn();
      return false;
    }, true /* capture = true */);
  }

  function scanAndAttach(){
    for(var si=0; si<cartSelectors.length; si++){
      var els = document.querySelectorAll(cartSelectors[si]);
      for(var ei=0; ei<els.length; ei++){
        attachToEl(els[ei]);
      }
    }
  }

  /* Run now and after delays for dynamically rendered headers */
  scanAndAttach();
  setTimeout(scanAndAttach, 500);
  setTimeout(scanAndAttach, 1500);
  setTimeout(scanAndAttach, 3000);
  setTimeout(scanAndAttach, 6000);
}

/* =====================================================================
   DELETE HANDLER — global native listener for maximum reliability
   Fixes Bug #1: SVG intercepts click even with pointer-events:none
   ===================================================================== */
function attachDeleteHandler(deleteFn){
  /* Native capture-phase listener on document — always fires */
  document.addEventListener('click', function(e){
    var target = e.target;

    /* Walk up the DOM to find .an-del */
    var btn = null;
    var cur = target;
    while(cur && cur !== document.body){
      if(cur.classList && cur.classList.contains('an-del')){
        btn = cur;
        break;
      }
      cur = cur.parentNode;
    }
    if(!btn) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();

    var id = btn.getAttribute('data-iid');
    if(!id) return;
    deleteFn(id, btn);
  }, true /* capture */);
}

/* =====================================================================
   MAIN PLUGIN — runs inside jQuery ready
   ===================================================================== */
waitForJQuery(function($){

  /* Hide old Konimbo mini-cart */
  $('div.cart.special_cart_with_upgrades').css({display:'none', visibility:'hidden'});

  /* ----------------------------------------------------------------
     BUILD DRAWER HTML
     ---------------------------------------------------------------- */
  var SVG_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="pointer-events:none!important;display:block"><polyline points="3 6 5 6 21 6" style="pointer-events:none!important"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" style="pointer-events:none!important"/></svg>';

  var dH = '';
  dH += '<div class="anO" id="anO"></div>';
  dH += '<div class="anD" id="anD">';
  dH +=   '<div class="anD-hd">';
  dH +=     '<div style="display:flex;align-items:center;gap:8px">';
  dH +=       '<span style="font-size:18px">🛒</span>';
  dH +=       '<h2>עגלה</h2>';
  dH +=       '<span class="cnt" id="anCnt">0</span>';
  dH +=     '</div>';
  dH +=     '<button class="anD-x" id="anX" type="button">✕</button>';
  dH +=   '</div>';
  dH +=   '<div class="anD-body" id="anBody">';
  dH +=     '<div id="anShip"></div>';
  dH +=     '<div id="anList"></div>';
  dH +=   '</div>'; /* /anD-body */
  dH +=   '<div class="anD-ft">';
  dH +=     '<div id="anSum"></div>';
  dH +=     '<div class="anD-tot"><span>סה״כ</span><span id="anTot">₪0</span></div>';
  dH +=     '<button class="anD-go" id="anGo" type="button" disabled>המשך לקופה ←</button>';
  dH +=     '<a class="anD-wa" id="anWa" href="#" target="_blank">לא בטוח? שלח לנו את העגלה בוואטסאפ</a>';
  dH +=   '</div>'; /* /anD-ft */
  dH += '</div>'; /* /anD */

  $('body').append(dH);

  /* ----------------------------------------------------------------
     CORE REFRESH
     ---------------------------------------------------------------- */
  function refresh(){
    var cart = load();
    var items = [], sub = 0, cnt = 0;

    /* Collect items already in sessionStorage */
    for(var k in cart){
      if(!cart.hasOwnProperty(k)) continue;
      var it = cart[k];
      items.push({id:k, t:it.t||'מוצר', p:it.p||0, q:it.q||1, i:it.i||'', u:it.u||'#'});
      sub += (it.p||0) * (it.q||1);
      cnt += (it.q||1);
    }

    /* Sync from Konimbo jStorage (server-side cart) */
    if(typeof $.jStorage !== 'undefined'){
      var jh = $.jStorage.get('cart_autonahariya');
      if(jh && typeof jh === 'string'){
        try {
          $('<table>' + jh + '</table>').find('tr[data-id]').each(function(){
            var $r = $(this), rid = $r.attr('data-id');
            if(cart[rid] || isDeleted(rid)) return;
            var t = $.trim($r.find('td.title a').text()).replace(/^\u200f/, '');
            var p = parseFloat(($r.find('td.price_item_x').text()||'0').replace(/[^\d.]/g,'')) || 0;
            var q = parseInt($r.find('div.quantity').text()) || 1;
            var img = $r.find('img').attr('src') || '';
            if(!t) return;
            cart[rid] = {t:t, p:p, q:q, i:img, u:$r.find('td.title a').attr('href')||'#'};
            items.push({id:rid, t:t, p:p, q:q, i:img, u:cart[rid].u});
            sub += p*q; cnt += q;
          });
          save(cart);
        } catch(e){}
      }
    }

    /* Sync from #main_cart DOM */
    $('#main_cart tr[data-id]').each(function(){
      var $r = $(this), rid = $r.attr('data-id');
      if(cart[rid] || isDeleted(rid)) return;
      var t = $.trim($r.find('td.title a').text()).replace(/^\u200f/, '');
      var p = parseFloat(($r.find('td.price_item_x').text()||'0').replace(/[^\d.]/g,'')) || 0;
      var q = parseInt($r.find('div.quantity').text()) || 1;
      var img = $r.find('img').attr('src') || '';
      if(!t) return;
      cart[rid] = {t:t, p:p, q:q, i:img, u:$r.find('td.title a').attr('href')||'#'};
      items.push({id:rid, t:t, p:p, q:q, i:img, u:cart[rid].u});
      sub += p*q; cnt += q;
    });
    save(cart);

    /* Update counter in drawer and ALL header badges */
    $('#anCnt').text(cnt);
    $('span.cart_with_items_counter, .cart_count, #cart_count, .nah-cart-badge').text(cnt);
    updateBadge();

    /* Build item list HTML */
    var $l = $('#anList');
    if(!items.length){
      $l.html('<div class="anD-empty"><div class="ico">🛒</div><h3>העגלה שלך ריקה</h3><p>הוסף מוצרים כדי להתחיל</p></div>');
      $('#anGo').prop('disabled', true);
    } else {
      var h = '<div class="anD-items">';
      for(var j=0; j<items.length; j++){
        var item = items[j];
        /* CRITICAL: inline onclick on delete button as BACKUP for native listener */
        var delOnclick = 'window._anDel&&window._anDel(\'' + item.id.replace(/'/g,"\\'") + '\',this)';
        h += '<div class="anD-it" data-iid="' + item.id + '">';
        h +=   '<img src="' + (item.i||'') + '" onerror="this.style.display=\'none\'" alt="" style="pointer-events:none!important">';
        h +=   '<div class="inf">';
        h +=     '<p class="nm"><a href="' + (item.u||'#') + '" style="pointer-events:auto">' + item.t + '</a></p>';
        h +=     '<div class="act">';
        h +=       '<div class="qs">';
        h +=         '<button class="qb an-minus" type="button" data-iid="' + item.id + '">−</button>';
        h +=         '<span class="qv">' + item.q + '</span>';
        h +=         '<button class="qb an-plus" type="button" data-iid="' + item.id + '">+</button>';
        h +=       '</div>';
        h +=       '<span class="pr">' + fp(item.p * item.q) + '</span>';
        /* Delete button: ALL child elements have pointer-events:none, button has onclick backup */
        h +=       '<button class="an-del" type="button" data-iid="' + item.id + '" onclick="' + delOnclick + '">';
        h +=         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="pointer-events:none!important;display:block"><polyline points="3 6 5 6 21 6" style="pointer-events:none!important"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" style="pointer-events:none!important"/></svg>';
        h +=       '</button>';
        h +=     '</div>';
        h +=   '</div>';
        h += '</div>';
      }
      h += '</div>';
      $l.html(h);
      $('#anGo').prop('disabled', false);
    }

    /* Shipping cost (still needed for summary calculation) */
    var sh = sub >= SHIP ? 0 : SCOST;
    var tot = sub + sh;

    /* Gift strip — unified shipping + gift progress */
    renderGiftStrip(sub);

    /* Summary */
    $('#anSum').html(
      '<div class="anD-sr"><span>סכום ביניים</span><span>' + fp(sub) + '</span></div>' +
      '<div class="anD-sr' + (sh === 0 ? ' fr' : '') + '"><span>משלוח</span>' +
      '<span class="rv">' + (sh === 0 ? 'חינם! 🎉' : fp(sh)) + '</span></div>'
    );
    $('#anTot').text(fp(tot));

    /* WhatsApp link */
    if(items.length){
      var wl = ['שלום! אשמח לסיים את ההזמנה:', ''];
      for(var w=0; w<items.length; w++){
        wl.push('• ' + items[w].t + ' × ' + items[w].q + ' = ' + fp(items[w].p * items[w].q));
      }
      wl.push(''); wl.push('סה״כ: ' + fp(tot));
      $('#anWa').attr('href', 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(wl.join('\n')));
    }
  }

  /* ----------------------------------------------------------------
     OPEN / CLOSE
     ---------------------------------------------------------------- */
  function anOpen(){
    refresh();
    $('#anD').addClass('op');
    $('#anO').addClass('v');
    $('body').css('overflow', 'hidden');
  }
  function anClose(){
    $('#anD').removeClass('op');
    $('#anO').removeClass('v');
    $('body').css('overflow', '');
  }

  /* ----------------------------------------------------------------
     CLOSE HANDLERS
     ---------------------------------------------------------------- */
  $('#anX').on('click', function(e){
    e.preventDefault(); e.stopPropagation();
    anClose();
  });
  $('#anO').on('click', function(){
    anClose();
  });
  /* ESC key closes drawer */
  $(document).on('keydown.anCart', function(e){
    if(e.key === 'Escape' && $('#anD').hasClass('op')){ anClose(); }
  });
  $('#anCont').on('click', function(e){
    e.preventDefault(); e.stopPropagation();
    anClose();
  });
  $(document).on('keydown', function(e){
    if((e.key === 'Escape' || e.keyCode === 27) && $('#anD').hasClass('op')){
      anClose();
    }
  });

  /* ----------------------------------------------------------------
     CART ICON INTERCEPT — attach capture phase handlers
     Fixes Bug #2
     ---------------------------------------------------------------- */
  attachCartIconCapture(function(){
    if($('#anD').hasClass('op')){ anClose(); } else { anOpen(); }
  });

  /* ----------------------------------------------------------------
     DELETE HANDLER — exposed globally + capture phase
     Fixes Bug #1
     ---------------------------------------------------------------- */
  function doDelete(id, triggerEl){
    if(!id) return;
    /* Mark as deleted so refresh won't re-add from jStorage */
    markDeleted(id);
    /* Also remove from jStorage and #main_cart DOM */
    try{
      if(typeof $.jStorage!=='undefined'){
        var jh=$.jStorage.get('cart_autonahariya');
        if(jh&&typeof jh==='string'){
          var $t=$('<table>'+jh+'</table>');
          $t.find('tr[data-id="'+id+'"]').remove();
          $.jStorage.set('cart_autonahariya',$t.html());
        }
      }
      $('#main_cart tr[data-id="'+id+'"]').remove();
    }catch(e){}
    /* Animate row out */
    var $row = $(triggerEl).closest('.anD-it');
    if(!$row.length) $row = $('[data-iid="' + id + '"]');
    $row.css({transition:'opacity 0.3s, max-height 0.4s', opacity:0, 'max-height':0, padding:0, 'border-bottom':'none', overflow:'hidden'});
    setTimeout(function(){
      var c = load();
      delete c[id];
      save(c);
      refresh();
    }, 350);
  }

  /* Global function for inline onclick backup */
  window._anDel = doDelete;

  /* Attach native capture-phase delete listener */
  attachDeleteHandler(doDelete);

  /* Also jQuery delegated as tertiary fallback */
  $(document).on('click', '.an-del', function(e){
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var id = $(this).attr('data-iid');
    doDelete(id, this);
  });

  /* ----------------------------------------------------------------
     QUANTITY HANDLERS
     ---------------------------------------------------------------- */
  $(document).on('click', '.an-plus', function(e){
    e.preventDefault(); e.stopPropagation();
    var id = $(this).attr('data-iid');
    var c = load();
    if(c[id]){ c[id].q = (c[id].q || 1) + 1; save(c); refresh(); }
  });
  $(document).on('click', '.an-minus', function(e){
    e.preventDefault(); e.stopPropagation();
    var id = $(this).attr('data-iid');
    var c = load();
    if(c[id] && c[id].q > 1){ c[id].q--; save(c); refresh(); }
  });

  /* ----------------------------------------------------------------
     ADD TO CART — product page capture
     Fixes Bug #4
     ---------------------------------------------------------------- */
  function getProductFromPage(){
    /* Item ID */
    var idEl = document.querySelector('input[name="item_id"]') ||
               document.querySelector('input#item_id');
    if(!idEl || !idEl.value) return null;
    var id = 'item_id_' + idEl.value;

    /* Title */
    var t = '';
    var titleEl = document.querySelector('#item_current_title') ||
                  document.querySelector('h1 span') ||
                  document.querySelector('h1');
    if(titleEl) t = titleEl.textContent.replace(/^\u200f/, '').trim();
    if(!t) t = 'מוצר';

    /* Price */
    var p = 0;
    var priceEl = document.querySelector('#item_show_price .price_value') ||
                  document.querySelector('.current_price') ||
                  document.querySelector('.price_value');
    if(priceEl){
      p = parseFloat((priceEl.getAttribute('content') || priceEl.textContent).replace(/[^\d.]/g,'')) || 0;
    }

    /* Image */
    var img = '';
    var imgEl = document.querySelector('#lightSlider img') ||
                document.querySelector('.swiper-slide img') ||
                document.querySelector('.item_image img');
    if(imgEl){
      img = imgEl.getAttribute('src') || '';
      if(img && img.indexOf('//') === 0) img = 'https:' + img;
    }

    return {id:id, t:t, p:p, i:img, u:location.pathname};
  }

  function addFromPage(){
    var prod = getProductFromPage();
    if(!prod) return;
    var c = load();
    if(c[prod.id]){ c[prod.id].q = (c[prod.id].q || 1) + 1; }
    else { c[prod.id] = {t:prod.t, p:prod.p, q:1, i:prod.i, u:prod.u}; }
    save(c);
  }

  var isMobile = window.innerWidth <= 768;

  /* Small "added to cart" confirmation toast */
  $('body').append('<div id="anAdded" style="position:fixed;top:12px;left:50%;transform:translate(-50%,-80px);background:#28a745;color:#fff;padding:10px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:10000001;transition:transform .4s cubic-bezier(.4,0,.2,1);direction:rtl;font-family:inherit;box-shadow:0 4px 15px rgba(40,167,69,.3);">\u2713 \u05e0\u05d5\u05e1\u05e3 \u05dc\u05e2\u05d2\u05dc\u05d4</div>');
  function showAddedToast(){
    $('#anAdded').css('transform','translate(-50%,0)');
    setTimeout(function(){$('#anAdded').css('transform','translate(-50%,-80px)')},2200);
  }

  var _addDebounce = null;
  function afterAdd(){
    /* Debounce — prevent double-add from multiple handlers firing */
    if(_addDebounce) return;
    _addDebounce = true;
    setTimeout(function(){ _addDebounce = null; }, 800);

    addFromPage();
    if(isMobile){
      setTimeout(function(){ refresh(); updateBadge(); showAddedToast(); }, 400);
    } else {
      setTimeout(function(){ refresh(); updateBadge(); anOpen(); }, 400);
    }
    setTimeout(refresh, 1000);
  }

  /* Track whether user actually clicked add-to-cart */
  var _userClickedAdd = false;

  /* Mark click on ANY real add-to-cart button across all page types */
  $(document).on('click', 'a.commit_to_real, #big_cart_now, .fixed_buy_now, .buyNow.to_cart a', function(){
    _userClickedAdd = true;
  });
  /* Category page: .add_item.quantity a (the "הוסף לסל" button in grid) */
  $(document).on('click', '.cart-add-btn .add_item.quantity a, .grid .add_item.quantity a', function(){
    _userClickedAdd = true;
    setTimeout(function(){
      refresh(); updateBadge();
      if(isMobile){ showAddedToast(); } else { anOpen(); }
      _userClickedAdd = false;
    }, 500);
  });

  /* Safe afterAdd — only fires if user actually clicked */
  function safeAfterAdd(){
    if(!_userClickedAdd) return;
    _userClickedAdd = false;
    afterAdd();
  }

  /* jQuery delegated — all add-to-cart buttons */
  $(document).on('click', 'a.commit_to_real, #big_cart_now, .fixed_buy_now', function(){
    setTimeout(safeAfterAdd, 150);
  });

  /* Patch global Konimbo add-to-cart — only if user clicked the button */
  ['add_to_cart_from_page', 'add_to_cart_from_store'].forEach(function(fn){
    if(typeof window[fn] === 'function'){
      var orig = window[fn];
      window[fn] = function(){
        var r = orig.apply(this, arguments);
        setTimeout(safeAfterAdd, 300);
        return r;
      };
    }
  });

  /* Watch for .clicked class added by Konimbo after successful add-to-cart */
  var _observedBtns = [];
  function attachObserverToBtn(btn){
    if(!btn || _observedBtns.indexOf(btn) !== -1) return;
    _observedBtns.push(btn);
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        if(m.type === 'attributes' && m.attributeName === 'class'){
          if(_userClickedAdd && m.target.classList && m.target.classList.contains('clicked')){
            safeAfterAdd();
          }
        }
      });
    }).observe(btn, {attributes:true, attributeFilter:['class']});
  }

  /* Attach to existing and future a.commit_to_real buttons */
  setTimeout(function(){ $('a.commit_to_real').each(function(){ attachObserverToBtn(this); }); }, 1500);
  setTimeout(function(){ $('a.commit_to_real').each(function(){ attachObserverToBtn(this); }); }, 4000);

  /* ----------------------------------------------------------------
     CHECKOUT — sync with Konimbo jStorage + DOM + form submit
     Fixes Bug #5
     ---------------------------------------------------------------- */
  function buildKonimboRows(c){
    var rows = '';
    for(var k in c){
      if(!c.hasOwnProperty(k)) continue;
      var it = c[k];
      rows += '<tr data-id="' + k + '">';
      rows += '<td><div class="quantity_step_value_in_cart">' + (it.q||1) + '</div>';
      rows += '<div class="quantity">' + (it.q||1) + '</div></td>';
      rows += '<td class="img_item"><img src="' + (it.i||'') + '"></td>';
      rows += '<td class="title"><a href="' + (it.u||'#') + '">' + it.t + '</a></td>';
      rows += '<td class="delete_btn"><a></a></td>';
      rows += '<td class="price_item_x">' + (it.p||0) + ' \u20aa</td>';
      rows += '</tr>';
    }
    return rows;
  }

  $(document).on('click', '#anGo', function(e){
    e.preventDefault(); e.stopPropagation();
    var c = load();
    if(!Object.keys(c).length) return;

    var rows = buildKonimboRows(c);

    /* Add the selected gift as a phantom row so Konimbo sees it as a line item */
    try {
      var giftKey = getSelectedGiftItemKey();
      if(giftKey){
        var giftLabel = buildGiftLabel(getCartTotal()) || 'מתנה חינם';
        rows += '<tr data-id="' + giftKey + '">' +
                '<td><div class="quantity_step_value_in_cart">1</div><div class="quantity">1</div></td>' +
                '<td class="img_item"></td>' +
                '<td class="title"><a href="#">🎁 ' + giftLabel + '</a></td>' +
                '<td class="delete_btn"><a></a></td>' +
                '<td class="price_item_x">0 \u20aa</td>' +
                '</tr>';
      }
    } catch(ex){}

    /* 1. Sync to jStorage */
    try{
      if(typeof $.jStorage !== 'undefined'){
        $.jStorage.set('cart_autonahariya', rows);
      }
    }catch(ex){}

    /* 2. Temporarily show old cart so set_cart_content can read it */
    var $oldCart = $('div.cart.special_cart_with_upgrades');
    $oldCart.css({display:'block',visibility:'visible',position:'absolute',left:'-9999px',opacity:0});

    /* 3. Inject rows into the REAL #main_cart inside div.cart */
    var $mc = $oldCart.find('#main_cart');
    if(!$mc.length) $mc = $('#main_cart');
    if(!$mc.length){
      $mc = $('<div id="main_cart"></div>');
      $oldCart.append($mc);
    }
    $mc.html('<table><tbody>' + rows + '</tbody></table>');

    /* 4. Build cart_content string manually (Konimbo format: item_id_XXX=>QTY•) */
    var cartDetails = '';
    for(var ck in c){
      if(!c.hasOwnProperty(ck)) continue;
      cartDetails += ck + '=>' + (c[ck].q||1) + '\u2022';
    }
    /* Inject the selected gift as a real line-item (qty=1) so it appears in checkout */
    try {
      var giftItemKey = getSelectedGiftItemKey();
      if(giftItemKey && cartDetails.indexOf(giftItemKey + '=>') === -1){
        cartDetails += giftItemKey + '=>1\u2022';
      }
    } catch(ex){}
    var encoded = encodeURI(cartDetails);

    /* 5. Also try Konimbo's own function */
    try{
      if(typeof window.set_cart_content === 'function'){
        window.set_cart_content();
        if(window.finish_cart_details) encoded = window.finish_cart_details;
      }
    }catch(ex){}

    /* 6. Submit form */
    var $form = $('form#flying_cart');
    if($form.length){
      $form.find('#cart_content').val(encoded).attr('name','cart_content_with_upgrades');
      $form.find('#referer_url').val(location.href);
      $form.find('#request_url').val(location.href);
      /* Inject the selected gift into customer_note so it reaches the order */
      injectGiftIntoCustomerNote();
      anClose();
      /* Re-hide old cart */
      $oldCart.css({display:'none',visibility:'hidden',position:'',left:'',opacity:''});
      setTimeout(function(){ $form.submit(); }, 100);
    } else {
      $oldCart.css({display:'none',visibility:'hidden',position:'',left:'',opacity:''});
      anClose();
      window.location.href = 'https://secure.konimbo.co.il/orders/autonahariya/new';
    }
  });

  /* =====================================================================
     GIFT TIERS SYSTEM — renderGiftStrip + details + handlers
     ===================================================================== */
  var giftExpanded = false;
  var giftUserToggled = false;
  var lastTierId = null;

  var ICONS = {
    truck: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    gift:  '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>',
    trophy:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    chev:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    aL:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    aR:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
  };
  var TIER_ICONS = { tier1: ICONS.truck, tier2: ICONS.gift, tier3: ICONS.trophy };

  function renderGiftStrip(total){
    var cur = currentTier(total);
    var nxt = nextTier(total);
    var maxTh = GIFT_TIERS[GIFT_TIERS.length - 1].threshold;
    var pct = Math.min(100, (total / maxTh) * 100);
    var curId = cur ? cur.id : null;

    /* Auto-expand on tier upgrade */
    if(curId && curId !== lastTierId && !giftUserToggled){
      giftExpanded = true;
    }
    lastTierId = curId;

    var l1, l2;
    if(!cur && !nxt){
      l1 = 'הוסף מוצרים לעגלה';
      l2 = 'הוסיפו ' + fp(GIFT_TIERS[0].threshold) + ' למשלוח חינם ומתנה';
    } else if(!cur && nxt){
      l1 = 'הטבות לעגלה';
      l2 = 'הוסיפו ' + fp(nxt.threshold - total) + ' למשלוח חינם ומתנה';
    } else if(cur && nxt){
      l1 = cur.perks.join(' · ');
      l2 = 'עוד ' + fp(nxt.threshold - total) + ' לשדרוג ל' + nxt.label;
    } else {
      l1 = 'משלוח חינם · מתנת פרימיום';
      l2 = 'זכית בכל ההטבות 🎉';
    }

    var markersHTML = '';
    for(var mi=0; mi<GIFT_TIERS.length; mi++){
      var t = GIFT_TIERS[mi];
      var reached = total >= t.threshold;
      var rightPct = (t.threshold / maxTh) * 100;
      markersHTML += '<div class="ang-marker' + (reached ? ' reached' : '') +
                     '" style="right:' + rightPct + '%">' + TIER_ICONS[t.id] + '</div>';
    }

    var summaryHTML =
      '<button class="ang-summary" type="button" aria-expanded="' + (giftExpanded ? 'true' : 'false') + '">' +
        '<div class="ang-text">' +
          '<div class="ang-l1">' + l1 + '</div>' +
          '<div class="ang-l2">' + l2 + '</div>' +
        '</div>' +
        '<span class="ang-chev">' + ICONS.chev + '</span>' +
      '</button>' +
      '<div class="ang-progress">' +
        '<div class="ang-track">' +
          '<div class="ang-fill" style="width:' + pct + '% !important;background:#3b82f6 !important;background-image:linear-gradient(90deg,#2563eb 0%,#3b82f6 50%,#60a5fa 100%) !important;"></div>' +
          '<div class="ang-markers">' + markersHTML + '</div>' +
        '</div>' +
      '</div>';

    var detailsHTML = giftExpanded ? renderGiftDetails(total, cur, nxt) : '';

    $('#anShip')
      .addClass('ang-strip')
      .toggleClass('expanded', giftExpanded)
      .html(summaryHTML + detailsHTML);

    syncGiftToCheckoutForm(total);
  }

  function renderGiftDetails(total, cur, nxt){
    var sel = loadGift();

    if(!cur){
      var firstThr = GIFT_TIERS[0].threshold;
      var remain = Math.max(0, firstThr - total);
      var lockedCards = '';
      for(var i=0; i<GIFT_TIERS.length; i++){
        var tt = GIFT_TIERS[i];
        lockedCards += '<div class="ang-locked-tier">' +
                         '<div class="ang-lt-label">' + tt.label + '</div>' +
                         '<div class="ang-lt-th">' + fp(tt.threshold) + '+</div>' +
                       '</div>';
      }
      return '<div class="ang-details">' +
               '<div class="ang-d-title">המתנות שלך ממתינות</div>' +
               '<p class="ang-d-sub">הוסיפו עוד <strong>' + fp(remain) + '</strong> לעגלה כדי לפתוח מתנה ראשונה.</p>' +
               '<div class="ang-locked-grid">' + lockedCards + '</div>' +
             '</div>';
    }

    var selectedGiftId = sel[cur.id];
    var giftsHTML = '';
    for(var gi=0; gi<cur.gifts.length; gi++){
      var g = cur.gifts[gi];
      var isSel = (selectedGiftId === g.id);
      var visual = g.image
        ? '<div class="ang-g-img"><img src="' + g.image + '" alt="" loading="lazy"></div>'
        : '<div class="ang-g-emoji">' + (g.emoji || '🎁') + '</div>';
      var valueLine = '';
      giftsHTML += '<button class="ang-card' + (isSel ? ' selected' : '') + '" type="button" ' +
                    'data-tier="' + cur.id + '" data-gift="' + g.id + '">' +
                     visual +
                     '<div class="ang-g-name">' + g.name + '</div>' +
                     valueLine +
                   '</button>';
    }

    var hint = '';
    if(nxt){
      hint = '<div class="ang-upgrade">' +
               '<div class="ang-u-text">' +
                 '<strong>שדרוג ל' + nxt.label + '</strong>' +
                 '<span>עוד ' + fp(nxt.threshold - total) + ' ותוכל לבחור מתנה משודרגת</span>' +
               '</div>' +
             '</div>';
    }

    var title = selectedGiftId ? 'המתנה שבחרת' : 'בחרו מתנה אחת מ' + cur.label;
    var subT = selectedGiftId
      ? 'תוכלו להחליף בכל רגע · המתנה תתווסף להזמנה בקופה'
      : 'המתנה תתווסף להזמנה אוטומטית בקופה';

    return '<div class="ang-details">' +
             '<div class="ang-d-title">' + title + '</div>' +
             '<p class="ang-d-sub">' + subT + '</p>' +
             '<div class="ang-carousel-wrap">' +
               '<button class="ang-nav prev" type="button" aria-label="הקודם">' + ICONS.aR + '</button>' +
               '<div class="ang-carousel">' + giftsHTML + '</div>' +
               '<button class="ang-nav next" type="button" aria-label="הבא">' + ICONS.aL + '</button>' +
             '</div>' +
             hint +
           '</div>';
  }

  /* Build the human-readable gift label that goes into the order note */
  function buildGiftLabel(total){
    var cur = currentTier(total);
    var sel = loadGift();
    if(!cur || !sel[cur.id]) return '';
    var picked = null;
    for(var i=0; i<cur.gifts.length; i++){
      if(cur.gifts[i].id === sel[cur.id]){ picked = cur.gifts[i]; break; }
    }
    if(!picked) return '';
    var prefix = picked.emoji ? (picked.emoji + ' ') : '🎁 ';
    var label = prefix + picked.name + ' (' + cur.label + ' — חינם)';
    if(picked.url) label += ' ' + picked.url;
    return label;
  }

  function syncGiftToCheckoutForm(total){
    var label = buildGiftLabel(total);
    var $form = $('form#flying_cart');
    if(!$form.length) return;
    /* Legacy named field (kept for backward compatibility) */
    var $hidden = $form.find('input[name="customer_note_gift"]');
    if(!$hidden.length){
      $hidden = $('<input type="hidden" name="customer_note_gift">').appendTo($form);
    }
    $hidden.val(label);
    /* Cache for cross-page recovery */
    try{
      if(label) localStorage.setItem('anGift_pending', label);
      else      localStorage.removeItem('anGift_pending');
    }catch(e){}
  }

  /* Inject the gift label into Konimbo's customer_note (the order-note field that
     actually reaches the merchant). Konimbo recognises a few names; we cover all
     of them and also append a prefix so the original note (if any) is preserved. */
  function injectGiftIntoCustomerNote(){
    var label = '';
    try {
      label = buildGiftLabel(getCartTotal());
      if(!label) label = localStorage.getItem('anGift_pending') || '';
    } catch(e){}
    if(!label) return;

    var giftLine = 'מתנה נבחרת: ' + label;
    var $form = $('form#flying_cart');
    if(!$form.length) return;

    /* Try every known Konimbo note-field name */
    var noteNames = ['customer_note', 'order_note', 'note', 'cart_note', 'comments'];
    var injected = false;
    for(var i=0; i<noteNames.length; i++){
      var $f = $form.find('[name="' + noteNames[i] + '"]');
      if($f.length){
        var existing = ($f.val() || '').trim();
        var combined = existing ? (existing + '\n' + giftLine) : giftLine;
        $f.val(combined);
        injected = true;
      }
    }
    /* If no note field exists, create a customer_note hidden field */
    if(!injected){
      $('<input type="hidden" name="customer_note">').val(giftLine).appendTo($form);
    }
  }

  /* Returns Konimbo item_id key (e.g. 'item_id_3374415') for the selected gift, or '' if none. */
  function getSelectedGiftItemKey(){
    try {
      var total = getCartTotal();
      var cur  = currentTier(total);
      var sel  = loadGift();
      if(!cur || !sel[cur.id]) return '';
      var picked = null;
      for(var i=0; i<cur.gifts.length; i++){
        if(cur.gifts[i].id === sel[cur.id]){ picked = cur.gifts[i]; break; }
      }
      if(!picked || !picked.url) return '';
      var m = picked.url.match(/\/items\/(\d+)/);
      if(!m) return '';
      return 'item_id_' + m[1];
    } catch(e){ return ''; }
  }

  /* Helper: compute cart total from internal storage (used for note injection) */
  function getCartTotal(){
    var c = load();
    var sub = 0;
    for(var k in c){
      if(c.hasOwnProperty(k) && !isDeleted(k)){
        sub += (Number(c[k].p) || 0) * (Number(c[k].q) || 1);
      }
    }
    return sub;
  }

  /* Delegated event handlers — bound once, survive re-renders */
  $(document).on('click', '.ang-summary', function(){
    giftExpanded = !giftExpanded;
    giftUserToggled = true;
    refresh();
  });

  $(document).on('click', '.ang-card', function(){
    var $c = $(this);
    var tierId = $c.attr('data-tier');
    var giftId = $c.attr('data-gift');
    var sel = loadGift();
    if(sel[tierId] === giftId) delete sel[tierId];
    else sel[tierId] = giftId;
    saveGift(sel);
    refresh();
  });

  $(document).on('click', '.ang-nav.prev', function(){
    var car = $(this).siblings('.ang-carousel')[0];
    if(car) car.scrollBy({ left: 140, behavior: 'smooth' });
  });
  $(document).on('click', '.ang-nav.next', function(){
    var car = $(this).siblings('.ang-carousel')[0];
    if(car) car.scrollBy({ left: -140, behavior: 'smooth' });
  });

  /* Gentle prompt: if eligible but no gift picked, offer to pick before checkout */
  $(document).on('click', '#anGo', function(e){
    var c = load();
    var sub = 0;
    for(var k in c){
      if(c.hasOwnProperty(k) && !isDeleted(k)){
        sub += (Number(c[k].p) || 0) * (Number(c[k].q) || 1);
      }
    }
    var cur = currentTier(sub);
    if(!cur) return;
    var sel = loadGift();
    if(sel[cur.id]) return;
    var msg = 'אתה זכאי למתנה חינם! לבחור מתנה לפני המשך לקופה?';
    if(!confirm(msg)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    giftExpanded = true; giftUserToggled = true;
    refresh();
  });


  /* ----------------------------------------------------------------
     INITIAL RENDER
     Badge is already updated above, now also update drawer counter
     ---------------------------------------------------------------- */
  refresh();

  /* Hydrate gift tiers from #anGiftsConfig if present (after first render) */
  hydrateGiftTiersFromDOM(function(ok){
    if(ok) refresh();
  });

}); /* end waitForJQuery */

})(); /* end IIFE */
} /* end double-init guard */
