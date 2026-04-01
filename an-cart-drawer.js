jQuery(function($){
'use strict';
var SHIP=400,SCOST=30,PHONE='97249517322',CK='an_cart_v4';
function load(){try{return JSON.parse(sessionStorage.getItem(CK))||{}}catch(e){return{}}}
function save(c){sessionStorage.setItem(CK,JSON.stringify(c))}
function fp(n){return'₪'+Math.round(n)}
$('div.cart.special_cart_with_upgrades').css({display:'none',visibility:'hidden'});

var svg={x:'✕',trash:'🗑',lock:'🔒',shield:'🛡',truck:'🚚',star:'⭐',gift:'🎁',bag:'🛒'};
var CS=[{n:'ספריי ניקוי בלמים',p:29},{n:'מפתח פילטר שמן',p:49},{n:'נוזל קירור ירוק 1L',p:35}];
var dH='<div class="anO" id="anO"></div><div class="anD" id="anD"><div class="anD-hd"><div style="display:flex;align-items:center;gap:8px">'+svg.bag+' <h2>עגלה</h2><span class="cnt" id="anCnt">0</span></div><button class="anD-x" id="anX">'+svg.x+'</button></div><div class="anD-body" id="anBody"><div id="anShip"></div><div class="anD-timer" id="anTmr">⏰ המוצרים שמורים ל-<span id="anTm">14:59</span></div><div id="anList"></div>';
dH+='<div class="anD-cs"><div class="cst">לקוחות שקנו גם רכשו:</div><div class="csc">';
for(var ci=0;ci<CS.length;ci++)dH+='<div class="csi"><div class="csn">'+CS[ci].n+'</div><div class="csp">'+fp(CS[ci].p)+'</div><button class="csa" data-ci="'+ci+'">+ הוסף</button></div>';
dH+='</div></div></div><div class="anD-ft"><div id="anSum"></div><div class="anD-tot"><span>סה״כ</span><span id="anTot">₪0</span></div><button class="anD-go" id="anGo" disabled>המשך לקופה ←</button><div class="anD-sec">'+svg.lock+' הזמנה מאובטחת — SSL 256-bit</div><a class="anD-wa" id="anWa" href="#" target="_blank">לא בטוח? שלח לנו את העגלה בוואטסאפ</a><a class="anD-cont" id="anCont" href="#">← המשך בקניות</a><div class="anD-tb"><div>'+svg.shield+'<span>מאובטח</span></div><div>'+svg.truck+'<span>משלוח מהיר</span></div><div>'+svg.star+'<span>איכות מובטחת</span></div><div>'+svg.gift+'<span>אחריות</span></div></div></div></div>';
dH+='<div class="anSP" id="anSP"><div class="av">👤</div><div><strong id="anSN"></strong><span id="anSP2"></span></div><button class="sx" id="anSX">✕</button></div>';
$('body').append(dH);

// === CORE ===
function refresh(){
  var cart=load(),items=[],sub=0,cnt=0;
  for(var k in cart){if(!cart.hasOwnProperty(k))continue;var it=cart[k];
    items.push({id:k,t:it.t||'מוצר',p:it.p||0,q:it.q||1,i:it.i||'',u:it.u||'#'});
    sub+=(it.p||0)*(it.q||1);cnt+=(it.q||1);
  }
  // Sync from Konimbo jStorage
  if(typeof $.jStorage!=='undefined'){
    var jh=$.jStorage.get('cart_autonahariya');
    if(jh&&typeof jh==='string'){
      $('<table>'+jh+'</table>').find('tr[data-id]').each(function(){
        var $r=$(this),rid=$r.attr('data-id');if(cart[rid])return;
        var t=$.trim($r.find('td.title a').text()).replace(/^\u200f/,'');
        var p=parseFloat(($r.find('td.price_item_x').text()||'0').replace(/[^\d.]/g,''))||0;
        var q=parseInt($r.find('div.quantity').text())||1;
        var img=$r.find('img').attr('src')||'';
        if(!t)return;
        cart[rid]={t:t,p:p,q:q,i:img,u:$r.find('td.title a').attr('href')||'#'};
        items.push({id:rid,t:t,p:p,q:q,i:img,u:$r.find('td.title a').attr('href')||'#'});
        sub+=p*q;cnt+=q;
      });
      save(cart);
    }
  }
  // Sync from #main_cart DOM
  $('#main_cart tr[data-id]').each(function(){
    var $r=$(this),rid=$r.attr('data-id');if(cart[rid])return;
    var t=$.trim($r.find('td.title a').text()).replace(/^\u200f/,'');
    var p=parseFloat(($r.find('td.price_item_x').text()||'0').replace(/[^\d.]/g,''))||0;
    var q=parseInt($r.find('div.quantity').text())||1;
    var img=$r.find('img').attr('src')||'';
    if(!t)return;
    cart[rid]={t:t,p:p,q:q,i:img,u:$r.find('td.title a').attr('href')||'#'};
    items.push({id:rid,t:t,p:p,q:q,i:img,u:$r.find('td.title a').attr('href')||'#'});
    sub+=p*q;cnt+=q;
  });
  save(cart);
  $('#anCnt').text(cnt);$('span.cart_with_items_counter').text(cnt);
  var $l=$('#anList');
  if(!items.length){
    $l.html('<div class="anD-empty">'+svg.bag+'<p>העגלה שלך ריקה</p><span>הוסף מוצרים להתחיל</span></div>');
    $('#anGo').prop('disabled',true);
  }else{
    var h='<div class="anD-items">';
    for(var j=0;j<items.length;j++){
      var it=items[j];
      // Use data-iid attribute (not data-id) to avoid jQuery .data() caching issues
      h+='<div class="anD-it" data-iid="'+it.id+'">';
      h+='<img src="'+(it.i||'')+'" onerror="this.style.display=\'none\'" alt="">';
      h+='<div class="inf"><p class="nm"><a href="'+(it.u||'#')+'">'+it.t+'</a></p>';
      h+='<div class="act"><div class="qs">';
      h+='<button class="qb an-minus" data-iid="'+it.id+'">−</button>';
      h+='<span class="qv">'+it.q+'</span>';
      h+='<button class="qb an-plus" data-iid="'+it.id+'">+</button>';
      h+='</div><span class="pr">'+fp(it.p*it.q)+'</span></div></div>';
      h+='<button class="an-del" data-iid="'+it.id+'">'+svg.trash+'</button>';
      h+='</div>';
    }
    h+='</div>';$l.html(h);$('#anGo').prop('disabled',false);
  }
  var sh=sub>=SHIP?0:SCOST,tot=sub+sh;
  var pct=Math.min(100,(sub/SHIP)*100),diff=Math.max(0,SHIP-sub);
  $('#anShip').html('<div class="anD-ship">'+(sub>=SHIP?'מזל טוב! זכית במשלוח חינם! 🎉':'חסרים לך <b>'+fp(diff)+'</b> למשלוח חינם! 🚚')+'<div class="anD-bar"><div style="width:'+pct+'%"></div></div></div>');
  $('#anSum').html('<div class="anD-sr"><span>סכום ביניים</span><span>'+fp(sub)+'</span></div><div class="anD-sr'+(sh===0?' fr':'')+'"><span>משלוח</span><span class="rv">'+(sh===0?'חינם! 🎉':fp(sh))+'</span></div>');
  $('#anTot').text(fp(tot));
  if(items.length){var wl=['שלום! אשמח לסיים את ההזמנה:',''];for(var w=0;w<items.length;w++)wl.push('• '+items[w].t+' × '+items[w].q+' = '+fp(items[w].p*items[w].q));wl.push('');wl.push('סה״כ: '+fp(tot));$('#anWa').attr('href','https://wa.me/'+PHONE+'?text='+encodeURIComponent(wl.join('\n')))}
}

function anOpen(){refresh();$('#anD').addClass('op');$('#anO').addClass('v');$('body').css('overflow','hidden')}
function anClose(){$('#anD').removeClass('op');$('#anO').removeClass('v');$('body').css('overflow','')}

// === CLOSE ===
$('#anX').on('click',function(e){e.preventDefault();anClose()});
$('#anO').on('click',function(){anClose()});
$('#anCont').on('click',function(e){e.preventDefault();anClose()});
$(document).on('keydown',function(e){if((e.key==='Escape'||e.keyCode===27)&&$('#anD').hasClass('op'))anClose()});

// === CART ICON — AGGRESSIVE INTERCEPT ===
function hijackCartIcon(){
  // Target all possible cart icon elements
  var selectors='#link_order_with_counter a, ul#header_cart_nav a.cart, span.cart_with_items_text, span.cart_with_items_counter, #link_order_with_counter';
  $(selectors).each(function(){
    var el=this;
    // Remove ALL existing handlers
    $(el).off();
    el.onclick=null;
    el.removeAttribute('onclick');
    // Bind our handler
    $(el).on('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if($('#anD').hasClass('op')){anClose()}else{anOpen()}
      return false;
    });
  });
  // Also prevent the href navigation
  $('#link_order_with_counter a.cart').attr('href','javascript:void(0)');
}
hijackCartIcon();
setTimeout(hijackCartIcon,1000);
setTimeout(hijackCartIcon,3000);
setTimeout(hijackCartIcon,6000);

// === ADD TO CART ===
function addFromPage(){
  var id=$('input[name="item_id"]').val()||$('input#item_id').val();
  if(!id)return;id='item_id_'+id;
  var t=$.trim($('h1 span').first().text()).replace(/^\u200f/,'')||$.trim($('#item_current_title').text())||$.trim($('h1').first().text())||'מוצר';
  var pEl=$('#item_show_price .price_value').first();
  var p=0;
  if(pEl.length){p=parseFloat(pEl.attr('content')||pEl.text().replace(/[^\d.]/g,''))||0}
  if(!p){p=parseFloat($('.current_price,.price_value').first().text().replace(/[^\d.]/g,''))||0}
  var img=$('#lightSlider img').first().attr('src')||$('.swiper-slide img').first().attr('src')||'';
  if(img&&img.indexOf('//')==0)img='https:'+img;
  var cart=load();
  if(cart[id]){cart[id].q=(cart[id].q||1)+1}else{cart[id]={t:t,p:p,q:1,i:img,u:location.pathname}}
  save(cart);
}
function afterAdd(){addFromPage();setTimeout(anOpen,500);setTimeout(refresh,1200)}
$(document).on('click','a.commit_to_real',function(){setTimeout(afterAdd,100)});
$(document).on('click','.add_item, div.add_item',function(){setTimeout(afterAdd,100)});
['add_to_cart_from_page','add_to_cart_from_store'].forEach(function(fn){
  if(typeof window[fn]==='function'){
    var orig=window[fn];
    window[fn]=function(){var r=orig.apply(this,arguments);afterAdd();return r}
  }
});
// Watch for .clicked class
setTimeout(function(){
  $('a.commit_to_real').each(function(){
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        if(m.type==='attributes'&&$(m.target).hasClass('clicked')){afterAdd()}
      });
    }).observe(this,{attributes:true});
  });
},2000);

// === QUANTITY — using data-iid attribute ===
$(document).on('click','.an-plus',function(e){
  e.preventDefault();e.stopPropagation();
  var id=$(this).attr('data-iid');
  var c=load();
  if(c[id]){c[id].q=(c[id].q||1)+1;save(c);refresh()}
});
$(document).on('click','.an-minus',function(e){
  e.preventDefault();e.stopPropagation();
  var id=$(this).attr('data-iid');
  var c=load();
  if(c[id]&&c[id].q>1){c[id].q--;save(c);refresh()}
});

// === DELETE — using data-iid attribute with attr() not data() ===
$(document).on('click','.an-del',function(e){
  e.preventDefault();e.stopPropagation();
  var id=$(this).attr('data-iid');
  if(!id)return;
  // Animate out
  $(this).closest('.anD-it').css({transition:'all 0.3s ease',opacity:0,transform:'translateX(-30px)'});
  setTimeout(function(){
    var c=load();
    delete c[id];
    save(c);
    refresh();
  },350);
});

// === CHECKOUT — sync with Konimbo ===
$(document).on('click','#anGo',function(e){
  e.preventDefault();
  var c=load();
  if(!Object.keys(c).length)return;
  // Build cart rows for Konimbo
  var rows='';
  for(var k in c){
    if(!c.hasOwnProperty(k))continue;
    var it=c[k];
    rows+='<tr data-id="'+k+'"><td><div class="quantity_step_value_in_cart">'+(it.q||1)+'</div><div class="quantity">'+(it.q||1)+'</div></td><td class="img_item"><img src="'+(it.i||'')+'"></td><td class="title"><a href="'+(it.u||'#')+'">'+it.t+'</a></td><td class="delete_btn"><a></a></td><td class="price_item_x">'+(it.p||0)+' ₪</td></tr>';
  }
  // Sync to jStorage
  if(typeof $.jStorage!=='undefined'){$.jStorage.set('cart_autonahariya',rows)}
  // Inject into DOM
  var $mc=$('#main_cart');
  if(!$mc.length){$mc=$('<div id="main_cart"></div>');$('div.cart.special_cart_with_upgrades').append($mc)}
  $mc.html('<table><tbody>'+rows+'</tbody></table>');
  // Serialize with Konimbo
  if(typeof window.set_cart_content==='function'){window.set_cart_content()}
  // Submit form
  var $form=$('form#flying_cart');
  if($form.length&&typeof window.finish_cart_details==='string'&&window.finish_cart_details){
    $form.find('#cart_content').val(window.finish_cart_details).attr('name','cart_content_with_upgrades');
    $form.find('#referer_url').val(location.href);
    $form.find('#request_url').val(location.href);
    anClose();
    setTimeout(function(){$form.submit()},100);
  }else{
    anClose();
    window.location.href='https://secure.konimbo.co.il/orders/autonahariya/new';
  }
});

// === CROSS-SELL ===
$(document).on('click','.csa:not(.ad)',function(e){
  e.preventDefault();
  var idx=$(this).data('ci'),p=CS[idx];if(!p)return;
  var id='cs_'+idx,c=load();
  if(c[id]){c[id].q++}else{c[id]={t:p.n,p:p.p,q:1,i:'',u:'#'}}
  save(c);$(this).text('✓ נוסף!').addClass('ad');refresh();
});

// === TIMER ===
var TE=parseInt(sessionStorage.getItem('an_te'))||0,TT=899000;
if(!TE||TE<=Date.now()){TE=Date.now()+TT;sessionStorage.setItem('an_te',TE)}
setInterval(function(){var r=TE-Date.now();if(r<=0){TE=Date.now()+TT;sessionStorage.setItem('an_te',TE);r=TT}var m=Math.floor(r/60000),s=Math.floor((r%60000)/1000);$('#anTm').text((m<10?'0':'')+m+':'+(s<10?'0':'')+s)},1000);

// === SOCIAL PROOF ===
var RP=['שמן מנוע Total Quartz 9000 5W-30','שמן מנוע Castrol EDGE 5W-30','שמן מנוע Castrol EDGE 5W-40','שמן מנוע Lublan 5W-30','מצת NGK ILZKR6F11','פילטר שמן MANN HU815/2X','פילטר מזגן לפורד טרנזיט','פילטר מזגן לרנו קולאוס','פילטר אוויר לפג\'ו 307','פילטר אוויר לג\'יפ קומפס','בולמי תא מטען לרנו מגאן','תוסף ניקוי סעפת דיזל GAT','תוסף ניקוי מנוע EUROLUB','תוסף מפחית עישון GAT','תוסף ניקוי מערכת דיזל GAT','תוסף ניקוי מסנן חלקיקים GAT','פלאש ניקוי רדיאטור GAT','תוסף שמן קרמי GAT','מטען מצבר NOCO GENIUS1','נורות H7 Philips WhiteVision','נורות H4 Philips WhiteVision','בוסטר התנעה NOCO GB20 500A','בוסטר התנעה Roher Pro 1600A','בוסטר התנעה Roher Pro 2500A','מטען מצבר Lemania 12V','שמן גיר אוטומט','שמן גיר 75W90','נוזל בלמים DOT4','נוזל קירור ירוק 4L','נוזל קירור אדום 4L','נוזל שמשות מרוכז','ספריי ניקוי בלמים','מפתח פילטר שמן','סט מצמד','סט טיימינג','רפידות בלם קדמיות','רפידות בלם אחוריות','דיסקיות בלם','שמן מנוע 10W-40','שמן מנוע 15W-40','שמן מנוע 20W-50','3 תרסיסים לניקוי צמיגים Bono','מפתח רינג פתוח','פילטר שמן טויוטה מקורי','נוזל קירור כחול 4L','תוסף אטימת נזילות GAT','בולמי תא מטען להונדה CRV','שמן הגה כוח'];
var CT=['נהריה','חיפה','עכו','כרמיאל','קריית אתא','קריית ביאליק','קריית מוצקין','נשר','שלומי','מעלות-תרשיחא','צפת','טבריה','עפולה','נצרת','תל אביב','ראשון לציון','פתח תקווה','רמת גן','נתניה','הרצליה','רחובות','כפר סבא','רעננה','חולון','בת ים','יבנה','באר שבע','אשדוד','אשקלון','אילת','דימונה','קרית גת','ערד','ירוחם'];
var TMS=['ממש עכשיו','לפני דקה','לפני 2 דקות','לפני 3 דקות','לפני 5 דקות','לפני 8 דקות','לפני 10 דקות','לפני 12 דקות','לפני 15 דקות','לפני 18 דקות','לפני 25 דקות','לפני חצי שעה'];
function sp(){$('#anSN').text('מישהו מ'+CT[Math.floor(Math.random()*CT.length)]);$('#anSP2').text('רכש '+RP[Math.floor(Math.random()*RP.length)]+' '+TMS[Math.floor(Math.random()*TMS.length)]);$('#anSP').addClass('v');clearTimeout(window._spt);window._spt=setTimeout(function(){$('#anSP').removeClass('v')},5000)}
setTimeout(function(){sp();setInterval(sp,25000)},8000);
$('#anSX').on('click',function(){$('#anSP').removeClass('v')});

refresh();
});
