(() => {
  'use strict';
  // Contagem para o começo do DIA, pois o horário da festa ainda não foi informado.
  const eventDay = new Date('2026-10-31T00:00:00-03:00').getTime();
  function updateCountdown() {
    const remaining = Math.max(0, eventDay - Date.now());
    const total = Math.floor(remaining / 1000);
    const values = { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60 };
    Object.entries(values).forEach(([id, value]) => { document.getElementById(id).textContent = String(value).padStart(2, '0'); });
    if (!remaining) document.getElementById('count-note').textContent = '31 de outubro de 2026 · Halloween Party 1.0';
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();
