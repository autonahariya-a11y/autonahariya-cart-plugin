/**
 * AN Cart Drawer — v5.0
 * Auto Nahariya — Konimbo Platform
 * Fixes: delete btn, cart icon capture, badge persist, add-to-cart observer, checkout sync
 */
(function(){
'use strict';

/* =====================================================================
   CONFIG
   ===================================================================== */
var SHIP   = 400;
var SCOST  = 30;
var PHONE  = '97249517322';
var CK     = 'an_cart_v4';
var DK     = 'an_cart_del';
var TE_KEY = 'an_te';
var TIMER_DURATION = 899000; // ~15 min

var CS = [
  {n:'ספריי ניקוי בלמים', p:29},
  {n:'מפתח פילטר שמן',     p:49},
  {n:'נוזל קירור ירוק 1L', p:35}
];

/* 50 real product names for social proof */
var RP = [
  'שמן מנוע Total Quartz 9000 5W-30',
  'שמן מנוע Castrol EDGE 5W-30',
  'שמן מנוע Castrol EDGE 5W-40',
  'שמן מנוע Lublan 5W-30',
  'שמן מנוע Mobil 1 0W-40',
  'מצת NGK ILZKR6F11',
  'מצת Bosch Super Plus',
  'פילטר שמן MANN HU815/2X',
  'פילטר שמן Bosch P7123',
  'פילטר מזגן לפורד טרנזיט',
  'פילטר מזגן לרנו קולאוס',
  'פילטר אוויר לפג\'ו 307',
  'פילטר אוויר לג\'יפ קומפס',
  'בולמי תא מטען לרנו מגאן',
  'בולמי תא מטען להונדה CRV',
  'תוסף ניקוי סעפת דיזל GAT',
  'תוסף ניקוי מנוע EUROLUB',
  'תוסף מפחית עישון GAT',
  'תוסף ניקוי מערכת דיזל GAT',
  'תוסף ניקוי מסנן חלקיקים GAT',
  'פלאש ניקוי רדיאטור GAT',
  'תוסף שמן קרמי GAT',
  'תוסף אטימת נזילות GAT',
  'מטען מצבר NOCO GENIUS1',
  'מטען מצבר Lemania 12V',
  'נורות H7 Philips WhiteVision',
  'נורות H4 Philips WhiteVision',
  'נורות LED H7 Osram',
  'בוסטר התנעה NOCO GB20 500A',
  'בוסטר התנעה Roher Pro 1600A',
  'בוסטר התנעה Roher Pro 2500A',
  'שמן גיר אוטומט Aisin',
  'שמן גיר 75W90',
  'נוזל בלמים DOT4',
  'נוזל קירור ירוק 4L',
  'נוזל קירור אדום 4L',
  'נוזל קירור כחול 4L',
  'נוזל שמשות מרוכז',
  'ספריי ניקוי בלמים',
  'מפתח פילטר שמן',
  'רפידות בלם קדמיות Brembo',
  'רפידות בלם אחוריות TRW',
  'דיסקיות בלם Zimmermann',
  'שמן מנוע 10W-40',
  'שמן מנוע 15W-40',
  'שמן מנוע 20W-50',
  '3 תרסיסים ניקוי צמיגים Bono',
  'פילטר שמן טויוטה מקורי',
  'סט מצמד LUK',
  'שמן הגה כוח Febi'
];

var CT = [
  'נהריה','חיפה','עכו','כרמיאל','קריית אתא','קריית ביאליק','קריית מוצקין',
  'נשר','שלומי','מעלות-תרשיחא','צפת','טבריה','עפולה','נצרת',
  'תל אביב','ראשון לציון','פתח תקווה','רמת גן','נתניה','הרצליה',
  'רחובות','כפר סבא','רעננה','חולון','בת ים','יבנה',
  'באר שבע','אשדוד','אשקלון','אילת','דימונה','קרית גת','ערד','ירוחם'
];

var TMS = [
  'ממש עכשיו','לפני דקה','לפני 2 דקות','לפני 3 דקות','לפני 5 דקות',
  'לפני 8 דקות','לפני 10 דקות','לפני 12 דקות','לפני 15 דקות',
  'לפני 18 דקות','לפני 25 דקות','לפני חצי שעה'
];

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
    '.header-cart-count, span[class*="cart_counter"]'
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
    '#link_order_with_counter'
  ];

  var attached = {};

  function attachToEl(el){
    if(!el || attached[el]) return;
    attached[el] = true;

    /* Set href to void to prevent navigation */
    if(el.tagName === 'A'){
      el.setAttribute('href', 'javascript:void(0)');
    }

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
  dH +=     '<div class="anD-timer" id="anTmr">⏰ המוצרים שמורים ל-<span id="anTm">14:59</span></div>';
  dH +=     '<div id="anList"></div>';
  /* Cross-sell */
  dH +=     '<div class="anD-cs">';
  dH +=       '<div class="cst">לקוחות שקנו גם רכשו:</div>';
  dH +=       '<div class="csc">';
  for(var ci=0; ci<CS.length; ci++){
    dH += '<div class="csi">';
    dH +=   '<div class="csn">' + CS[ci].n + '</div>';
    dH +=   '<div class="csp">' + fp(CS[ci].p) + '</div>';
    dH +=   '<button class="csa" type="button" data-ci="' + ci + '">+ הוסף</button>';
    dH += '</div>';
  }
  dH +=       '</div>';
  dH +=     '</div>';
  dH +=   '</div>'; /* /anD-body */
  dH +=   '<div class="anD-ft">';
  dH +=     '<div id="anSum"></div>';
  dH +=     '<div class="anD-tot"><span>סה״כ</span><span id="anTot">₪0</span></div>';
  dH +=     '<button class="anD-go" id="anGo" type="button" disabled>המשך לקופה ←</button>';
  dH +=     '<a class="anD-wa" id="anWa" href="#" target="_blank">לא בטוח? שלח לנו את העגלה בוואטסאפ</a>';
  dH +=   '</div>'; /* /anD-ft */
  dH += '</div>'; /* /anD */
  /* Social proof popup */
  dH += '<div class="anSP" id="anSP">';
  dH +=   '<div class="av">👤</div>';
  dH +=   '<div><strong id="anSN"></strong><span id="anSP2"></span></div>';
  dH +=   '<button class="sx" id="anSX" type="button">✕</button>';
  dH += '</div>';

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
    $('span.cart_with_items_counter, .cart_count, #cart_count').text(cnt);
    updateBadge();

    /* Build item list HTML */
    var $l = $('#anList');
    if(!items.length){
      $l.html('<div class="anD-empty">🛒<p>העגלה שלך ריקה</p><span>הוסף מוצרים להתחיל</span></div>');
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

    /* Shipping bar */
    var sh = sub >= SHIP ? 0 : SCOST;
    var tot = sub + sh;
    var pct = Math.min(100, (sub / SHIP) * 100);
    var diff = Math.max(0, SHIP - sub);
    $('#anShip').html(
      '<div class="anD-ship">' +
      (sub >= SHIP
        ? 'מזל טוב! זכית במשלוח חינם! 🎉'
        : 'חסרים לך <b>' + fp(diff) + '</b> למשלוח חינם! 🚚') +
      '<div class="anD-bar"><div style="width:' + pct + '%"></div></div></div>'
    );

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

  function afterAdd(){
    addFromPage();
    setTimeout(anOpen, 400);
    setTimeout(refresh, 1000);
  }

  /* jQuery delegated — standard click */
  $(document).on('click', 'a.commit_to_real', function(){
    setTimeout(afterAdd, 150);
  });
  $(document).on('click', '.add_item, div.add_item', function(){
    setTimeout(afterAdd, 150);
  });

  /* Patch global Konimbo add-to-cart functions */
  ['add_to_cart_from_page', 'add_to_cart_from_store', 'add_item_to_cart'].forEach(function(fn){
    if(typeof window[fn] === 'function'){
      var orig = window[fn];
      window[fn] = function(){
        var r = orig.apply(this, arguments);
        setTimeout(afterAdd, 300);
        return r;
      };
    }
  });

  /* MutationObserver on body — watch for .clicked class on a.commit_to_real
     AND for dynamically injected buttons (Fixes Bug #4 fully)            */
  var _observerAttached = {};

  function attachObserverToBtn(btn){
    if(!btn || _observerAttached[btn]) return;
    _observerAttached[btn] = true;
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        if(m.type === 'attributes' && m.attributeName === 'class'){
          if(m.target.classList && m.target.classList.contains('clicked')){
            afterAdd();
          }
        }
      });
    }).observe(btn, {attributes:true, attributeFilter:['class']});
  }

  /* Watch entire document for dynamically injected a.commit_to_real */
  new MutationObserver(function(muts){
    muts.forEach(function(m){
      for(var i=0; i<m.addedNodes.length; i++){
        var node = m.addedNodes[i];
        if(node.nodeType !== 1) continue;
        if(node.matches && node.matches('a.commit_to_real')){ attachObserverToBtn(node); }
        var sub = node.querySelectorAll ? node.querySelectorAll('a.commit_to_real') : [];
        for(var j=0; j<sub.length; j++){ attachObserverToBtn(sub[j]); }
      }
    });
  }).observe(document.body, {childList:true, subtree:true});

  /* Also attach to already-present buttons */
  setTimeout(function(){
    $('a.commit_to_real').each(function(){ attachObserverToBtn(this); });
  }, 1000);
  setTimeout(function(){
    $('a.commit_to_real').each(function(){ attachObserverToBtn(this); });
  }, 3000);

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

    /* 1. Sync to jStorage */
    if(typeof $.jStorage !== 'undefined'){
      $.jStorage.set('cart_autonahariya', rows);
    }

    /* 2. Ensure #main_cart exists and inject rows */
    var $mc = $('#main_cart');
    if(!$mc.length){
      $mc = $('<div id="main_cart" style="display:none"></div>');
      $('body').append($mc);
    }
    $mc.html('<table><tbody>' + rows + '</tbody></table>');

    /* 3. Call Konimbo set_cart_content() to serialize */
    if(typeof window.set_cart_content === 'function'){
      window.set_cart_content();
    }

    /* 4. Submit form#flying_cart if present, else redirect */
    var $form = $('form#flying_cart');
    if($form.length){
      /* Populate cart_content if not already done by set_cart_content */
      var cc = $form.find('#cart_content');
      if(cc.length && !cc.val()){
        /* Build simple serialized cart as fallback */
        var cartStr = '';
        for(var ck in c){
          if(!c.hasOwnProperty(ck)) continue;
          cartStr += ck + ':' + (c[ck].q||1) + ';';
        }
        cc.val(cartStr);
      }
      $form.find('#referer_url').val(location.href);
      $form.find('#request_url').val(location.href);
      anClose();
      setTimeout(function(){ $form.submit(); }, 100);
    } else {
      anClose();
      window.location.href = 'https://secure.konimbo.co.il/orders/autonahariya/new';
    }
  });

  /* ----------------------------------------------------------------
     CROSS-SELL
     ---------------------------------------------------------------- */
  $(document).on('click', '.csa:not(.ad)', function(e){
    e.preventDefault(); e.stopPropagation();
    var idx = parseInt($(this).attr('data-ci'), 10);
    var p = CS[idx];
    if(!p) return;
    var id = 'cs_' + idx;
    var c = load();
    if(c[id]){ c[id].q++; }
    else { c[id] = {t:p.n, p:p.p, q:1, i:'', u:'#'}; }
    save(c);
    $(this).text('✓ נוסף!').addClass('ad');
    refresh();
  });

  /* ----------------------------------------------------------------
     TIMER — sessionStorage persisted, resets without deleting items
     ---------------------------------------------------------------- */
  var timerEnd = parseInt(sessionStorage.getItem(TE_KEY), 10) || 0;
  if(!timerEnd || timerEnd <= Date.now()){
    timerEnd = Date.now() + TIMER_DURATION;
    sessionStorage.setItem(TE_KEY, timerEnd);
  }
  setInterval(function(){
    var remaining = timerEnd - Date.now();
    if(remaining <= 0){
      /* Reset timer — DO NOT clear cart items */
      timerEnd = Date.now() + TIMER_DURATION;
      sessionStorage.setItem(TE_KEY, timerEnd);
      remaining = TIMER_DURATION;
    }
    var m = Math.floor(remaining / 60000);
    var s = Math.floor((remaining % 60000) / 1000);
    $('#anTm').text((m<10?'0':'') + m + ':' + (s<10?'0':'') + s);
  }, 1000);

  /* ----------------------------------------------------------------
     SOCIAL PROOF
     ---------------------------------------------------------------- */
  function showSocialProof(){
    var city = CT[Math.floor(Math.random() * CT.length)];
    var prod = RP[Math.floor(Math.random() * RP.length)];
    var time = TMS[Math.floor(Math.random() * TMS.length)];
    $('#anSN').text('מישהו מ' + city);
    $('#anSP2').text('רכש ' + prod + ' ' + time);
    $('#anSP').addClass('v');
    clearTimeout(window._anSPT);
    window._anSPT = setTimeout(function(){ $('#anSP').removeClass('v'); }, 5000);
  }
  setTimeout(function(){
    showSocialProof();
    setInterval(showSocialProof, 25000);
  }, 8000);
  $('#anSX').on('click', function(){ $('#anSP').removeClass('v'); });

  /* ----------------------------------------------------------------
     INITIAL RENDER
     Badge is already updated above, now also update drawer counter
     ---------------------------------------------------------------- */
  refresh();

}); /* end waitForJQuery */

})(); /* end IIFE */
