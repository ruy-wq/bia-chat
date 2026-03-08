/**
 * Bia Widget v3 - TBO Lançamentos Imobiliários
 * Chatbot com IA para qualificação de leads
 * Hospedado via GitHub Pages: https://ruy-wq.github.io/bia-chat/bia-widget.js
 */
(function() {
'use strict';

const CFG = {
  WEBHOOK: 'https://agtbo.app.n8n.cloud/webhook/tbo-lead-form',
  WHATSAPP: '5541996696918',
  CALCOM: 'https://cal.com/ruy-lima-cho2u7/reuniao-tbo',
  AVATAR: 'https://ruy-wq.github.io/bia-chat/bia-avatar.png'
};

const SYSTEM_PROMPT = `Você é a **Bia**, assistente virtual da **TBO Lançamentos Imobiliários** — agência estratégica de comunicação especializada em lançamentos imobiliários que atua em +18 cidades brasileiras e já gerenciou mais de R$810 milhões em VGV.

## SEU PAPEL
Pré-atendimento inteligente de leads pelo site. Objetivos:
1. Acolher com empatia e profissionalismo
2. Entender a necessidade do visitante
3. Qualificar coletando dados estratégicos naturalmente
4. Encaminhar para o próximo passo

## DADOS PARA COLETAR (naturalmente, nunca como formulário)
- Nome
- Email
- Telefone/WhatsApp
- Cidade do empreendimento
- VGV estimado (valor geral de vendas)
- Momento do projeto (conceituação, projeto arquitetônico aprovado, lançamento, pós-lançamento)

IMPORTANTE: Colete ao longo da conversa de forma natural. Nunca peça todos de uma vez. Comece pelo nome.

## SERVIÇOS DA TBO
1. **Marketing & Inteligência** — diagnóstico, plano de marketing, campanha online/offline, influenciadores
2. **Branding & Enxoval de Vendas** — naming, identidade visual, storytelling, book de vendas, folder, landing page
3. **Renderização 3D** — modelagem, imagens estáticas, foto inserção, plantas humanizadas, 360°, tour virtual
4. **Produções Audiovisuais** — filme institucional, teaser, acompanhamento de obra
5. **Gamificação** — plataforma interativa de vendas, personalização de ambientes

## DIFERENCIAIS
- Especialização exclusiva em lançamentos imobiliários
- Nasceu da arquitetura (3D) e expandiu estrategicamente
- Centralização: branding + render + mídia + audiovisual em um só lugar
- +18 praças no Brasil, +R$810M em VGV gerenciado

## REGRAS
1. Tom profissional mas acolhedor. Linguagem do mercado imobiliário.
2. Respostas concisas (2-4 frases). Nunca paredes de texto.
3. Sempre sugira próximo passo com quick replies.
4. Se não souber algo técnico, ofereça conectar com especialista.
5. Use **negrito** para destaques importantes.
6. Quando o lead pedir para falar com humano ou agendar: sugira o agendamento.

## FORMATO DE RESPOSTA
Responda SEMPRE e SOMENTE em JSON válido, sem markdown code blocks:
{"message": "Sua resposta aqui", "quick_replies": ["Opção 1", "Opção 2"], "lead_data": {"nome": "", "email": "", "telefone": "", "cidade": "", "vgv": "", "momento": ""}, "classificacao": "quente|morno|frio|indefinido", "transfer_to_human": false}

## CLASSIFICAÇÃO
- **quente**: Empreendimento definido + cidade + prazo curto (<3 meses) + VGV > R$10M
- **morno**: Interesse real, pesquisando ativamente
- **frio**: Curiosidade inicial, sem projeto definido

## COBERTURA
A TBO atende em TODO o Brasil, qualquer cidade ou estado. Não há restrição geográfica.
Quando sugerir exemplos de cidades, priorize: Curitiba, Florianópolis, São Paulo, Brasília, Balneário Camboriú.`;

// State
let isOpen = false, isTyping = false, chatHistory = [], leadData = {}, leadSaved = false;
const sid = 'bia_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Helpers
function fmt(t) { return t ? t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') : ''; }
function scr() { const m = document.getElementById('bia-m'); setTimeout(function() { m.scrollTop = m.scrollHeight; }, 50); }

// Inject CSS
var style = document.createElement('style');
style.textContent = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');#bia-t{position:fixed;bottom:28px;right:28px;z-index:99999;width:68px;height:68px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(145deg,#c9a84c,#8b6f2a);box-shadow:0 8px 32px rgba(201,168,76,.35);display:flex;align-items:center;justify-content:center;transition:all .4s;animation:bp 3s ease-in-out infinite;overflow:hidden;padding:0}#bia-t:hover{transform:scale(1.08)}#bia-t img{width:100%;height:100%;object-fit:cover;border-radius:50%}#bia-t .x{display:none;color:#08080f;font-size:24px;font-weight:700}#bia-t.open img{display:none}#bia-t.open .x{display:block}#bia-bd{position:absolute;top:-2px;right:-2px;width:22px;height:22px;border-radius:50%;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;border:2px solid #08080f}@keyframes bp{0%,100%{box-shadow:0 8px 32px rgba(201,168,76,.35),0 0 0 0 rgba(201,168,76,.25)}50%{box-shadow:0 8px 32px rgba(201,168,76,.35),0 0 0 14px rgba(201,168,76,0)}}#bia-w{position:fixed;bottom:110px;right:28px;z-index:99998;width:400px;max-height:620px;height:calc(100vh - 150px);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;background:#0d0d18;border:1px solid rgba(201,168,76,.12);box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 60px rgba(201,168,76,.04),inset 0 1px 0 rgba(255,255,255,.03);transform:translateY(20px) scale(.95);opacity:0;pointer-events:none;transition:all .45s cubic-bezier(.4,0,.2,1);backdrop-filter:blur(20px)}#bia-w.v{transform:translateY(0) scale(1);opacity:1;pointer-events:all}#bia-cv{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.4}#bia-h{position:relative;z-index:2;padding:20px 22px;background:linear-gradient(180deg,rgba(201,168,76,.08),transparent);border-bottom:1px solid rgba(201,168,76,.12);display:flex;align-items:center;gap:14px}#bia-h::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);opacity:.3}.ba{width:50px;height:50px;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(201,168,76,.3),0 0 0 2px rgba(201,168,76,.2);position:relative;flex-shrink:0}.ba img{width:100%;height:100%;object-fit:cover}.ba::after{content:'';position:absolute;bottom:-1px;right:-1px;width:14px;height:14px;border-radius:50%;background:#4ade80;border:2.5px solid #0d0d18;box-shadow:0 0 8px rgba(74,222,128,.5)}.bi h3{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:#f0ece2;letter-spacing:.3px}.bi span{font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;color:#c9a84c;opacity:.7;letter-spacing:.5px;text-transform:uppercase;margin-top:3px;display:block}#bia-x{margin-left:auto;width:34px;height:34px;border-radius:10px;border:none;background:rgba(255,255,255,.04);color:rgba(240,236,226,.55);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s}#bia-x:hover{background:rgba(255,255,255,.08);color:#f0ece2}#bia-m{flex:1;overflow-y:auto;padding:18px 16px 10px;display:flex;flex-direction:column;gap:14px;position:relative;z-index:2;scroll-behavior:smooth}#bia-m::-webkit-scrollbar{width:3px}#bia-m::-webkit-scrollbar-thumb{background:rgba(201,168,76,.15);border-radius:4px}.mr{display:flex;gap:10px;align-items:flex-end;animation:ms .4s both}.mr.u{justify-content:flex-end}.ma{width:30px;height:30px;border-radius:10px;overflow:hidden;flex-shrink:0}.ma img{width:100%;height:100%;object-fit:cover;border-radius:10px}.mb{max-width:80%;padding:13px 17px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;line-height:1.6}.mr:not(.u) .mb{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:18px 18px 18px 6px;color:#f0ece2}.mr.u .mb{background:linear-gradient(145deg,#c9a84c,#8b6f2a);border-radius:18px 18px 6px 18px;color:#08080f;font-weight:500;box-shadow:0 4px 16px rgba(201,168,76,.25)}.qr{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px;padding-left:40px}.qb{padding:8px 16px;border-radius:22px;border:1px solid rgba(201,168,76,.35);background:rgba(201,168,76,.05);color:#c9a84c;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .25s;white-space:nowrap}.qb:hover{background:rgba(201,168,76,.12);border-color:#c9a84c;transform:translateY(-1px);box-shadow:0 4px 12px rgba(201,168,76,.15)}.wab{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:14px;margin-top:8px;margin-left:40px;background:linear-gradient(145deg,#25d366,#128c7e);color:#fff;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;transition:all .25s;box-shadow:0 4px 16px rgba(37,211,102,.25)}.wab:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,211,102,.35)}.ms-sys{text-align:center;padding:10px 18px;background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.12);border-radius:12px;font-size:12.5px;color:#c9a84c;font-family:'Plus Jakarta Sans',sans-serif;animation:ms .4s both}.td{padding:14px 20px;border-radius:18px 18px 18px 6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);display:flex;gap:5px;align-items:center}.td span{width:7px;height:7px;border-radius:50%;background:#c9a84c;animation:tb 1.3s ease-in-out infinite}.td span:nth-child(2){animation-delay:.15s}.td span:nth-child(3){animation-delay:.3s}@keyframes tb{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-5px)}}@keyframes ms{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}#bia-ia{position:relative;z-index:2;padding:14px 16px 18px;border-top:1px solid rgba(201,168,76,.12);background:rgba(0,0,0,.25);display:flex;gap:10px;align-items:center}#bia-i{flex:1;padding:13px 18px;border-radius:14px;border:1px solid rgba(201,168,76,.12);background:rgba(255,255,255,.03);color:#f0ece2;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color .25s,box-shadow .25s}#bia-i::placeholder{color:rgba(240,236,226,.35);font-weight:300}#bia-i:focus{border-color:rgba(201,168,76,.35);box-shadow:0 0 0 3px rgba(201,168,76,.06)}#bia-s{width:48px;height:48px;border-radius:14px;border:none;background:rgba(255,255,255,.04);color:rgba(240,236,226,.55);cursor:default;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all .3s;flex-shrink:0}#bia-s.a{background:linear-gradient(145deg,#c9a84c,#8b6f2a);color:#08080f;cursor:pointer;box-shadow:0 4px 16px rgba(201,168,76,.3)}#bia-s.a:hover{transform:scale(1.05);box-shadow:0 6px 20px rgba(201,168,76,.4)}.pb{text-align:center;padding:6px;font-size:10px;color:rgba(240,236,226,.55);font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:.5px;position:relative;z-index:2;background:rgba(0,0,0,.15)}.pb b{color:#c9a84c;font-weight:600}@media(max-width:480px){#bia-w{width:calc(100vw - 16px);right:8px;bottom:100px;max-height:calc(100vh - 120px);border-radius:16px}#bia-t{bottom:20px;right:20px;width:60px;height:60px}}";
document.head.appendChild(style);

// Inject HTML
var wrap = document.createElement('div');
wrap.innerHTML = '<button id="bia-t"><img src="' + CFG.AVATAR + '" alt="Bia"><span class="x">\u2715</span><span id="bia-bd">1</span></button><div id="bia-w"><canvas id="bia-cv"></canvas><div id="bia-h"><div class="ba"><img src="' + CFG.AVATAR + '" alt="Bia"></div><div class="bi"><h3>Bia</h3><span>Assistente TBO Lançamentos</span></div><button id="bia-x">\u2715</button></div><div id="bia-m"></div><div id="bia-ia"><input id="bia-i" type="text" placeholder="Digite sua mensagem..." autocomplete="off"><button id="bia-s">\u27A4</button></div><div class="pb">Powered by <b>TBO Lançamentos Imobiliários</b></div></div>';
document.body.appendChild(wrap);

// Particles
function initParticles() {
  var c = document.getElementById('bia-cv'), ctx = c.getContext('2d'), ps = [];
  function resize() { c.width = c.offsetWidth; c.height = c.offsetHeight; }
  resize(); window.addEventListener('resize', resize);
  for (var i = 0; i < 25; i++) ps.push({ x: Math.random()*c.width, y: Math.random()*c.height, vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3, r: Math.random()*2+.5, o: Math.random()*.3+.1 });
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ps.forEach(function(p) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > c.width) p.vx *= -1; if (p.y < 0 || p.y > c.height) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle = 'rgba(201,168,76,' + p.o + ')'; ctx.fill(); });
    for (var i = 0; i < ps.length; i++) for (var j = i+1; j < ps.length; j++) { var dx = ps[i].x-ps[j].x, dy = ps[i].y-ps[j].y, d = Math.sqrt(dx*dx+dy*dy); if (d < 120) { ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.strokeStyle = 'rgba(201,168,76,' + (.06*(1-d/120)) + ')'; ctx.lineWidth = .5; ctx.stroke(); } }
    requestAnimationFrame(draw);
  })();
}

// Toggle
function toggle() {
  isOpen = !isOpen;
  var w = document.getElementById('bia-w'), t = document.getElementById('bia-t'), bd = document.getElementById('bia-bd');
  if (isOpen) {
    w.classList.add('v'); t.classList.add('open');
    if (bd) bd.style.display = 'none';
    if (!document.getElementById('bia-m').children.length) setTimeout(function() { addBot('Olá! Sou a **Bia**, assistente virtual da **TBO Lançamentos Imobiliários** \ud83c\udfd7\ufe0f\n\nComo posso te ajudar hoje?', ['Conhecer serviços', 'Tenho um empreendimento', 'Agendar reunião', 'Falar com especialista']); }, 500);
    setTimeout(function() { document.getElementById('bia-i').focus(); }, 500);
  } else { w.classList.remove('v'); t.classList.remove('open'); }
}

// Messages
function addUser(text) {
  var el = document.createElement('div');
  el.className = 'mr u';
  el.innerHTML = '<div class="mb">' + fmt(text) + '</div>';
  document.getElementById('bia-m').appendChild(el); scr();
}

function addBot(text, qr, transfer) {
  var el = document.createElement('div');
  var html = '<div class="mr"><div class="ma"><img src="' + CFG.AVATAR + '" alt="Bia"></div><div class="mb">' + fmt(text) + '</div></div>';
  if (qr && qr.length) { html += '<div class="qr">' + qr.map(function(r) { return '<button class="qb" onclick="window._biaQR(\'' + r.replace(/'/g, "\\'") + '\')">' + r + '</button>'; }).join('') + '</div>'; }
  if (transfer) { html += '<a class="wab" href="https://wa.me/' + CFG.WHATSAPP + '?text=' + encodeURIComponent('Olá! Vim pelo site da TBO e gostaria de mais informações.') + '" target="_blank" rel="noopener">\ud83d\udcac Falar pelo WhatsApp</a>'; }
  el.innerHTML = html;
  document.getElementById('bia-m').appendChild(el); scr();
}

function showTyping() {
  isTyping = true;
  var el = document.createElement('div'); el.id = 'bia-tp'; el.className = 'mr';
  el.innerHTML = '<div class="ma"><img src="' + CFG.AVATAR + '" alt="Bia"></div><div class="td"><span></span><span></span><span></span></div>';
  document.getElementById('bia-m').appendChild(el); scr();
}
function hideTyping() { isTyping = false; var el = document.getElementById('bia-tp'); if (el) el.remove(); }

function upd() {
  var b = document.getElementById('bia-s'), v = document.getElementById('bia-i').value.trim();
  if (v && !isTyping) b.classList.add('a'); else b.classList.remove('a');
}

// Quick Reply
window._biaQR = function(text) {
  if (text.indexOf('gendar') > -1) window.open(CFG.CALCOM, '_blank');
  window._biaSendMsg(text);
};

// Send
window._biaSend = function() {
  var inp = document.getElementById('bia-i'), text = inp.value.trim();
  if (!text || isTyping) return;
  inp.value = ''; upd();
  window._biaSendMsg(text);
};

window._biaSendMsg = async function(text) {
  addUser(text); showTyping();
  chatHistory.push({ role: 'user', content: text });
  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': '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', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: SYSTEM_PROMPT, messages: chatHistory })
    });
    var data = await res.json();
    var raw = data.content && data.content[0] && data.content[0].text ? data.content[0].text : '{"message":"Desculpe, pode repetir?","quick_replies":["Tentar novamente"]}';
    var p;
    try { var m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { message: raw, quick_replies: [] }; }
    catch(e) { p = { message: raw, quick_replies: ['Tentar novamente'] }; }
    if (p.lead_data) {
      Object.entries(p.lead_data).forEach(function(entry) { var k = entry[0], v = entry[1]; if (v && typeof v === 'string' && v.trim()) leadData[k] = v; });
      if (leadData.nome || leadData.email || leadData.telefone) saveLead(p.classificacao);
    }
    chatHistory.push({ role: 'assistant', content: raw });
    hideTyping();
    addBot(p.message || raw, p.quick_replies || [], p.transfer_to_human);
    if (p.transfer_to_human) setTimeout(function() { var el = document.createElement('div'); el.className = 'ms-sys'; el.textContent = 'Conectando com especialista TBO...'; document.getElementById('bia-m').appendChild(el); scr(); }, 1200);
  } catch(e) {
    hideTyping();
    addBot('Ops! Problema de conexão. Fale pelo WhatsApp?', ['WhatsApp TBO', 'Tentar novamente'], true);
  }
};

async function saveLead(c) {
  if (leadSaved) return;
  try {
    await fetch(CFG.WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Nome: leadData.nome || '', Email: leadData.email || '', whatsapp: leadData.telefone || '', Cidade: leadData.cidade || '', Momento: leadData.momento || '', VGV: leadData.vgv || '', classificacao: c || 'indefinido', origem: 'chatbot-bia', session_id: sid }) });
    if (leadData.email || leadData.telefone) leadSaved = true;
  } catch(e) {}
}

// Events
document.getElementById('bia-t').addEventListener('click', toggle);
document.getElementById('bia-x').addEventListener('click', toggle);
document.getElementById('bia-s').addEventListener('click', window._biaSend);
var inp = document.getElementById('bia-i');
inp.addEventListener('input', upd);
inp.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window._biaSend(); } });
initParticles();

})();
