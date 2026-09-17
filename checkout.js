(() => {
  const $ = id => document.getElementById(id);
  const money = value => (value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  let available=false, token=null, requestId=crypto.randomUUID();
  async function api(action, body) {
    const r=await fetch('/api/checkout?action='+action,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
    const data=await r.json(); if(!r.ok) throw Error(data.error||'Pagamento indisponível.'); return data;
  }
  api('catalog').then(data=>{available=data.available; $('price').textContent=data.priceCents?money(data.priceCents):'A definir'; $('pay').disabled=!available;if(available){$('pay').textContent='GERAR PIX';$('message').textContent='Confira seus dados para continuar.';}}).catch(()=>{$('message').textContent='Vendas indisponíveis no momento. Nenhuma cobrança será gerada.';});
  $('buyer').addEventListener('submit',async event=>{
    event.preventDefault();if(!available)return;
    const fields=Object.fromEntries(new FormData(event.target));
    if(!/^[\p{L}][\p{L}'’-]+(?: [\p{L}'’-]+)+$/u.test(fields.name.trim().replace(/\s+/g,' '))){$('message').textContent='Informe nome e pelo menos um sobrenome.';$('name').focus();return;}
    $('pay').disabled=true;$('message').textContent='Gerando seu PIX…';
    try {const data=await api('create',{...fields,requestId});token=data.token;$('pix').value=data.pix;$('reference').textContent='Referência do pagamento: '+data.id;$('expires').textContent=data.expires?'Válido até '+new Date(data.expires).toLocaleString('pt-BR'):'';$('buyer').hidden=true;$('payment').hidden=false;$('payment').scrollIntoView({behavior:'smooth'});}
    catch(e){$('message').textContent=e.message;$('pay').disabled=false;}
  });
  $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('pix').value);$('payment-status').textContent='Código copiado. Após pagar, clique em Verificar pagamento.';}catch{$('pix').select();$('payment-status').textContent='Selecione e copie o código acima.';}});
  $('check').addEventListener('click',async()=>{
    $('check').disabled=true;
    try{const data=await api('status',{token});const labels={PAID:'Pagamento confirmado. Guarde a referência da compra. As orientações de acesso serão informadas pela organização.',PENDING:'Ainda aguardando a confirmação do pagamento.',EXPIRED:'Este PIX expirou. Recarregue a página para iniciar outra compra.',REFUNDED:'Pagamento reembolsado.',CHARGEBACK:'Pagamento contestado.',FAILED:'Pagamento não concluído.'};$('payment-status').textContent=labels[data.status]||'Pagamento em processamento.';if(data.status==='PAID'||data.status==='EXPIRED'){$('copy').disabled=true;$('pix').hidden=true;}}
    catch(e){$('payment-status').textContent=e.message;}
    finally{setTimeout(()=>{$('check').disabled=false;},10000);}
  });
})();
