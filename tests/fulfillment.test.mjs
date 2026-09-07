import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, validatePayment, verifyPurchase, issueReceipt, readReceipt, sessionMode } from '../backend/fulfillment.mjs';
const id = 'cs_test_abcdefghijklmnopqrstuv';
const key = 'rk_test_fixtureOnlyNotACredential';
function fixture() {
  return [{ id, livemode:false, mode:'payment', status:'complete', payment_status:'paid', payment_link:CATALOG.test.link, currency:'usd', amount_subtotal:900, amount_total:972, total_details:{amount_discount:0}, payment_intent:{status:'succeeded',currency:'usd',livemode:false,amount_received:972,latest_charge:{paid:true,status:'succeeded',refunded:false,amount_refunded:0,disputed:false}} }, {has_more:false,data:[{quantity:1,price:{id:CATALOG.test.price,product:CATALOG.test.product,unit_amount:900,currency:'usd',livemode:false},amount_subtotal:900,amount_discount:0}]}];
}
test('paid $9 purchase plus tax can redeem and download; repeat verification is safe',async()=>{
  const [s,i]=fixture();const request=async url=>({ok:true,json:async()=>url.includes('/line_items')?i:s});
  const p=await verifyPurchase(id,'test',key,request);const token=issueReceipt(p,key,1000000);
  assert.equal(readReceipt(token,key,1000100).sessionId,id);assert.deepEqual(await verifyPurchase(id,'test',key,request),p);
});
for (const [name,change] of Object.entries({unpaid:s=>s.payment_status='unpaid',incomplete:s=>s.status='open',wrongMode:s=>s.livemode=true,wrongProduct:s=>s.payment_link='plink_other',discount:s=>s.total_details.amount_discount=900,underpaid:s=>s.amount_total=0,wrongCurrency:s=>s.currency='eur',refunded:s=>s.payment_intent.latest_charge.refunded=true,partialRefund:s=>s.payment_intent.latest_charge.amount_refunded=1,dispute:s=>s.payment_intent.latest_charge.disputed=true,uncaptured:s=>s.payment_intent.status='requires_capture',missingCharge:s=>s.payment_intent.latest_charge=null,insufficientReceived:s=>s.payment_intent.amount_received=900})) {
  test('denies '+name,()=>{const [s,i]=fixture();change(s);assert.throws(()=>validatePayment(s,i,'test',id));});
}
test('rejects wrong line items, quantities and truncated lists',()=>{for(const change of [i=>i.data[0].price.id='price_wrong',i=>i.data[0].quantity=2,i=>i.has_more=true,i=>i.data=[]]){const[s,i]=fixture();change(i);assert.throws(()=>validatePayment(s,i,'test',id));}});
test('forged, expired, malformed and cross-mode receipts are denied',()=>{
  const token=issueReceipt({sessionId:id,mode:'test'},key,1000000);
  for(const value of [token+'x','',null,'a.b','%2Fetc%2Fpasswd'])assert.throws(()=>readReceipt(value,key,1000100));
  assert.throws(()=>readReceipt(token,key,1600000));assert.throws(()=>readReceipt(token,'wrong',1000000));assert.throws(()=>sessionMode('cs_live_../secret'));
});
test('Stripe outage, invalid JSON, wrong key mode, and 404 fail closed without leaking upstream errors',async()=>{
  for(const request of [async()=>{throw Error(key)},async()=>({ok:false,status:500}),async()=>({ok:false,status:404}),async()=>({ok:true,json:async()=>{throw Error(key)}})])await assert.rejects(verifyPurchase(id,'test',key,request),e=>!e.message.includes(key));
  await assert.rejects(verifyPurchase(id,'test','rk_live_wrong',async()=>{throw Error('should not call')}));
});
