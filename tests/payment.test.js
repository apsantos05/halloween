const {test}=require('node:test');const assert=require('node:assert/strict');const handler=require('../api/checkout');
async function call(action,body){let code,result;await handler({method:'POST',query:{action},body},{setHeader(){},status(n){code=n;return this},json(d){result=d}});return {code,result};}
test('closed sales, validation, authoritative price and signed status',async()=>{
process.env.BRAVOPAY_API_KEY='test';process.env.CHECKOUT_SECRET='test-secret-at-least-32-characters-long';process.env.SALES_OPEN='false';assert.equal((await call('create',{})).code,503);
process.env.SALES_OPEN='true';process.env.TICKET_PRICE_CENTS='5000';assert.equal((await call('create',{name:'Maria'})).code,422);
const body={name:'Maria Teste',email:'test@example.com',phone:'12999999999',requestId:'11111111-1111-4111-8111-111111111111',amount_cents:1};const saved=global.fetch;
try{global.fetch=async(url,o)=>{assert.equal(JSON.parse(o.body).amount_cents,5000);assert.ok(o.headers['Idempotency-Key']);return {ok:true,json:async()=>({id:'tx_test',amount_cents:5000,pix:{copy_paste:'test'}})}};
const created=await call('create',body);assert.equal(created.code,200);assert.equal((await call('status',{token:created.result.token+'f'})).code,403);
global.fetch=async()=>({ok:true,json:async()=>({data:[{id:'tx_test',external_reference:'halloween_'+body.requestId,amount_cents:5000,status:'PAID'}]})});assert.equal((await call('status',{token:created.result.token})).result.status,'PAID');
global.fetch=async()=>({ok:false});assert.equal((await call('status',{token:created.result.token})).code,502);
}finally{global.fetch=saved;}});
