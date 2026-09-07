import { api } from '@appdeploy/client';
const form = document.getElementById('purchaseForm') as HTMLFormElement | null;
const status = document.getElementById('deliveryStatus');
const input = document.getElementById('purchaseReference') as HTMLInputElement | null;
const download = document.getElementById('downloadPlus') as HTMLButtonElement | null;
let receipt = '';
let mode = 'test';
let busy = false;
const messages: Record<string,string> = {invalid_purchase_reference:'Enter the complete purchase reference from your checkout return link.', payment_not_verified:'Payment could not be verified. It may still be processing, or this reference is not eligible. Do not purchase again; retry or contact support.', download_reference_expired:'Download access expired. Verify your purchase again to renew it.', invalid_download_reference:'Download access is invalid. Verify your purchase again.', verification_unavailable:'Payment verification is temporarily unavailable. Please retry shortly; do not purchase again.', delivery_unavailable:'Secure delivery is not available yet. Please keep your purchase reference and try again later.'};
function failure(e: any) { return messages[e?.response?.data?.error] || 'We could not complete that request. Please retry shortly; do not purchase again.'; }
async function redeem() {
  if(busy||!input||!status||!download)return;
  busy=true; download.hidden=true;receipt='';
  try {
    const { data }=await api.post('/api/fulfillment/redeem',{sessionId:input.value.trim()});
    receipt=data.receipt;mode=data.testMode?'test':'live';
    try { sessionStorage.setItem('eePurchaseReference',input.value.trim()); } catch { /* Storage is optional. */ }
    status.textContent=data.testMode?'Sandbox payment verified. No real money was charged. Your download is ready.':'Payment verified. Your download is ready.';
    download.hidden=false;
  } catch(e) { status.textContent=failure(e); } finally { busy=false; }
}
if(form&&input&&download&&status) {
  const reference=new URL(location.href).searchParams.get('session_id');
  if(reference){input.value=reference;history.replaceState(null,'',location.pathname);}
  else {try{input.value=sessionStorage.getItem('eePurchaseReference')||'';}catch{ /* Optional storage. */ }}
  form.addEventListener('submit',e=>{e.preventDefault();void redeem();});
  download.addEventListener('click',async()=>{
    if(busy||!receipt)return;busy=true;download.disabled=true;
    try {
      const {data}=await api.post('/api/fulfillment/download',{receipt,mode});
      const bytes=Uint8Array.from(atob(data.archiveBase64),(c:string)=>c.charCodeAt(0));
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
      if(digest!==data.sha256)throw Error('Archive integrity failed');
      const url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));
      const a=document.createElement('a');a.href=url;a.download='everyday-engine-plus-v1.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      status.textContent='Your download has started. Extract the ZIP and open index.html. Keep a backup copy.';
    } catch(e){status.textContent=failure(e);}finally{busy=false;download.disabled=false;}
  });
  if(reference)void redeem();
}
const commerceStatus=document.getElementById('commerceStatus');
if(commerceStatus)api.get('/api/commerce/status').then(({data})=>{
  if(!data.checkoutEnabled||!data.checkoutUrl)return;
  const url=new URL(data.checkoutUrl);
  if(url.origin!=='https://buy.stripe.com')return;
  commerceStatus.textContent='';const link=document.createElement('a');link.className='offer-link';link.href=url.href;link.textContent=data.testMode?'Test the $9 checkout — sandbox only':'Get Everyday Engine Plus — $9';commerceStatus.append(link);
}).catch(()=>{commerceStatus.textContent='Purchases are temporarily unavailable. Please check back later.';});
