const crypto = require('node:crypto');
const base = 'https://bravopay.club/api/v1';
const sign = text => crypto.createHmac('sha256', process.env.CHECKOUT_SECRET || '').update(text).digest('hex');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  const price = Number(process.env.TICKET_PRICE_CENTS);
  const ready = process.env.SALES_OPEN === 'true' && Number.isSafeInteger(price) && price >= 500 && !!process.env.BRAVOPAY_API_KEY && (process.env.CHECKOUT_SECRET || '').length >= 32;
  const action = req.query?.action;
  const send = (code, body) => res.status(code).json(body);
  if (req.method === 'GET' && action === 'catalog') return send(200,{available:ready,priceCents:Number.isSafeInteger(price)&&price>=500?price:null});
  if (req.method !== 'POST') return send(405,{error:'Método não permitido.'});
  if (!['create','status'].includes(action)) return send(404,{error:'Recurso não encontrado.'});
  if (!process.env.BRAVOPAY_API_KEY || !process.env.CHECKOUT_SECRET) return send(503,{error:'Vendas ainda indisponíveis.'});
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const headers = {Authorization:`Bearer ${process.env.BRAVOPAY_API_KEY}`,'Content-Type':'application/json'};
    if (action === 'status') {
      const [data, signature] = String(body.token || '').split('.');
      if (!data || !signature || signature.length!==64 || !/^[a-f0-9]+$/.test(signature) || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(sign(data)))) return send(403,{error:'Consulta não autorizada.'});
      const order = JSON.parse(Buffer.from(data,'base64url').toString());
      if (order.until < Date.now()) return send(403,{error:'Consulta expirada. Consulte a organização com a referência do pedido.'});
      const response = await fetch(`${base}/transactions?external_reference=${encodeURIComponent(order.ref)}&limit=1`,{headers,signal:AbortSignal.timeout(15000)});
      if (!response.ok) throw Error('provider');
      const result = await response.json();
      const tx = result.data?.find(item=>item.id===order.id && item.external_reference===order.ref && item.amount_cents===order.amount);
      if (!tx) throw Error('notfound');
      return send(200,{status:tx.status});
    }
    if (!ready) return send(503,{error:'As vendas ainda não abriram.'});
    const customer = {name:String(body.name||'').trim().replace(/\s+/g,' '),email:String(body.email||'').trim(),phone:String(body.phone||'').replace(/\D/g,'')};
    if (!/^[\p{L}][\p{L}'’-]+(?: [\p{L}'’-]+)+$/u.test(customer.name)||customer.name.length>120) return send(422,{error:'Informe seu nome e pelo menos um sobrenome.'});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)||customer.email.length>180||!/^\d{10,13}$/.test(customer.phone)) return send(422,{error:'Confira seu e-mail e celular com DDD.'});
    if (!/^[a-f0-9-]{36}$/.test(body.requestId||'')) return send(422,{error:'Atualize a página e tente novamente.'});
    const ref = 'halloween_'+body.requestId;
    headers['Idempotency-Key'] = sign(ref);
    const response = await fetch(`${base}/transactions`,{method:'POST',headers,signal:AbortSignal.timeout(20000),body:JSON.stringify({amount_cents:price,method:'pix',customer,description:'Ingresso individual Halloween Party 1.0 — 31/10/2026',external_reference:ref,expires_in:1800,...(process.env.BRAVOPAY_PRODUCT_ID?{product_id:process.env.BRAVOPAY_PRODUCT_ID}:{})})});
    if (!response.ok) throw Error('provider');
    const tx = await response.json();
    if (!tx.id||!tx.pix?.copy_paste||tx.amount_cents!==price) throw Error('response');
    const data = Buffer.from(JSON.stringify({id:tx.id,ref,amount:price,until:Date.now()+86400000})).toString('base64url');
    return send(200,{id:tx.id,token:data+'.'+sign(data),pix:tx.pix.copy_paste,expires:tx.pix.expires_at});
  } catch { return send(502,{error:'Não foi possível consultar o pagamento. Tente novamente em instantes; não faça um segundo pagamento.'}); }
};
