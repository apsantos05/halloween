# Halloween Party 1.0
Landing page e checkout próprio com PIX Copia e Cola. BravoPay processa pagamentos via API. Confirmação consultada no servidor pelo botão Verificar pagamento.

## Visualização e hospedagem
Abra iniciar.bat para a landing page. checkout.html pode ser visualizado sem API, com vendas bloqueadas. A API requer Node/Vercel; servidor Python é apenas prévia visual.
Vercel: build npm run build; saída dist; funções em api/. Apenas arquivos públicos são copiados para dist.

## Configuração pendente no servidor
BRAVOPAY_API_KEY: chave da conta recebedora. Nunca colocar no HTML ou enviar pelo chat.
CHECKOUT_SECRET: segredo aleatório com pelo menos 32 caracteres.
TICKET_PRICE_CENTS: valor em centavos, sem preço padrão.
BRAVOPAY_PRODUCT_ID: opcional.
SALES_OPEN: manter false até configurar e validar a integração real.
Documentação: https://bravopay.club/docs

## Validação e limites
npm test utiliza respostas simuladas, sem cobranças. Chave e preço reais não fornecidos; integração real ainda não validada. Valor controlado no servidor, tentativas com idempotência e consulta autorizada por token assinado.
Esta versão aceita PIX. Cartão na API documentada requer redirecionamento externo.
Não inclui emissão de ingresso digital, controle de lotação, e-mail automático ou check-in. Definir entrega e operação de entrada antes de abrir vendas. A referência permite localizar a compra no painel BravoPay.
Configurar proteção contra abuso na hospedagem antes de liberar tráfego público. Não há consulta automática contínua.
Os dados não são persistidos no navegador. Recarregar perde o formulário e a referência na tela; transações já criadas continuam na BravoPay. Não repetir pagamento de uma compra já paga.
