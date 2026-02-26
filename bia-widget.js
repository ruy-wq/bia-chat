// ============================================================
// BIA - TBO CHAT WIDGET v2.0
// Hospedado no GitHub, carregado pelo Framer
// ============================================================

(function () {
  // ⚙️ CONFIGURAÇÃO
  const CFG = {
    API_KEY: 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,
    WEBHOOK: 'https://agtbo.app.n8n.cloud/webhook/tbo-lead-form',
    MODEL: 'claude-haiku-4-5-20251001',
    CALCOM: 'https://cal.com/ruy-lima-cho2u7/reuniao-tbo'
  };

  // 🧠 SYSTEM PROMPT COMPLETO DA BIA
  const SYSTEM_PROMPT = `Você é a Bia, consultora virtual da TBO Lançamentos Imobiliários.

SOBRE A TBO:
- Referência nacional em comunicação, branding e estratégia de vendas para lançamentos imobiliários
- +18 cidades atendidas, R$710MM em VGV gerenciado
- CEO: Ruy Lima
- Serviços: naming, identidade visual, branding, estratégia de lançamento, campanhas de vendas, comunicação 360°, produção audiovisual, estratégia digital
- Diferencial: a TBO cria a NARRATIVA do empreendimento — não faz marketing genérico. Cada projeto recebe uma história única que conecta emocionalmente com o comprador
- Site: wearetbo.com.br

SUA PERSONALIDADE:
- Profissional, acolhedora e consultiva
- Respostas CURTAS: 2-3 frases no máximo
- Faça apenas 1 pergunta por vez
- Sem emojis excessivos (no máximo 1 por mensagem)
- Tom: como uma consultora experiente conversando com um incorporador

SEU OBJETIVO:
Conversar naturalmente e coletar estes 6 dados (NESTA ORDEM de prioridade):
1. Nome do contato
2. Cidade do empreendimento
3. Momento do projeto (tem terreno? projeto aprovado? planejando? quer entender os serviços?)
4. VGV estimado do empreendimento
5. Email profissional
6. WhatsApp

REGRAS DE COLETA:
- Comece se apresentando brevemente e pergunte o nome
- Baseie cada pergunta nas respostas anteriores (demonstre que está ouvindo)
- Se o lead já mencionou algo espontaneamente, NÃO pergunte de novo
- Se não souber o VGV exato, aceite uma faixa ("entre R$10 e R$20 milhões")
- Para email e WhatsApp, explique que é para a equipe entrar em contato com uma proposta personalizada
- Seja natural — não pareça um formulário disfarçado

RESPOSTAS PARA PERGUNTAS FREQUENTES:
- Preço/valores: "Cada projeto recebe uma proposta personalizada baseada no escopo. O Ruy pode detalhar isso com você."
- Portfólio: "Você pode conhecer nossos cases em wearetbo.com.br. Temos projetos em +18 cidades."
- Prazo: "Depende do escopo do projeto. Em geral, a estratégia de lançamento começa meses antes da data de vendas."
- Atendimento presencial: "Atendemos todo o Brasil. A maioria dos projetos começa com reunião virtual."

REGRAS IMPORTANTES:
- NUNCA invente dados, cases ou números
- NUNCA prometa prazos específicos de entrega
- Se perguntarem algo que não sabe, diga que o Ruy (CEO) pode esclarecer na reunião
- Se o lead não for do segmento imobiliário, seja educado mas explique que a TBO é especializada em lançamentos imobiliários

QUANDO TIVER OS 6 DADOS COLETADOS:
Faça um breve resumo dos dados, agradeça, e inclua EXATAMENTE este bloco no final da sua mensagem (o sistema vai detectar e processar automaticamente):

[DADOS_COMPLETOS]
nome:|valor|
email:|valor|
whatsapp:|valor|
cidade:|valor|
momento:|valor|
vgv:|valor|
[/DADOS_COMPLETOS]

Se o lead for QUENTE (tem terreno ou projeto aprovado E VGV acima de R$10 milhões), adicione também o link para agendar: ${CFG.CALCOM}`;

  // ============================================================
  // INJETAR CSS
  // ============================================================
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    #bia-widget * { box-sizing: border-box; margin: 0; padding: 0; }

    #bia-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      font-family: 'DM Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* TOGGLE */
    #bia-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #e8572a;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(232,87,42,0.4), 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      position: relative;
    }
    #bia-toggle:hover {
      transform: scale(1.08);
      background: #ff6b3d;
      box-shadow: 0 6px 32px rgba(232,87,42,0.5);
    }
    #bia-toggle svg { width: 28px; height: 28px; fill: white; }
    #bia-toggle .bia-ic-close { display: none; }
    #bia-toggle.open .bia-ic-chat { display: none; }
    #bia-toggle.open .bia-ic-close { display: block; }

    @keyframes bia-pulse {
      0% { box-shadow: 0 0 0 0 rgba(232,87,42,0.5); }
      70% { box-shadow: 0 0 0 16px rgba(232,87,42,0); }
      100% { box-shadow: 0 0 0 0 rgba(232,87,42,0); }
    }
    #bia-toggle.pulse { animation: bia-pulse 2s ease-out 3; }

    /* WINDOW */
    #bia-window {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 380px;
      height: 560px;
      background: #0a0a0a;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
      opacity: 0;
      transform: translateY(16px) scale(0.95);
      pointer-events: none;
      transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }
    #bia-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* HEADER */
    #bia-header {
      background: #111;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .bia-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e8572a, #ff8a5c);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: white;
      flex-shrink: 0;
    }
    .bia-hinfo h3 {
      font-size: 15px;
      font-weight: 600;
      color: #f5f5f5;
      line-height: 1.2;
    }
    .bia-hinfo p {
      margin-top: 2px;
      font-size: 12px;
      color: #8a8a8a;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .bia-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      display: inline-block;
    }

    /* MESSAGES */
    #bia-msgs {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: #2a2a2a transparent;
    }
    #bia-msgs::-webkit-scrollbar { width: 4px; }
    #bia-msgs::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }

    .bia-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      animation: bia-fadein 0.3s ease-out;
    }
    @keyframes bia-fadein {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .bia-msg.ai {
      background: #1e1e1e;
      color: #f5f5f5;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .bia-msg.user {
      background: #e8572a;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .bia-msg a {
      color: #ff6b3d;
      text-decoration: underline;
    }

    /* TYPING */
    .bia-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      align-self: flex-start;
      background: #1e1e1e;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .bia-typing span {
      width: 7px;
      height: 7px;
      background: #8a8a8a;
      border-radius: 50%;
      animation: bia-bounce 1.4s infinite;
    }
    .bia-typing span:nth-child(2) { animation-delay: 0.2s; }
    .bia-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bia-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* INPUT */
    #bia-input-area {
      padding: 12px 16px;
      background: #111;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    #bia-input {
      flex: 1;
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 14px;
      font-family: 'DM Sans', system-ui, sans-serif;
      color: #f5f5f5;
      outline: none;
      resize: none;
      max-height: 80px;
      line-height: 1.4;
      transition: border-color 0.2s;
    }
    #bia-input::placeholder { color: #8a8a8a; }
    #bia-input:focus { border-color: rgba(232,87,42,0.5); }

    #bia-send {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #e8572a;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    #bia-send:hover { background: #ff6b3d; }
    #bia-send:disabled { opacity: 0.4; cursor: not-allowed; }
    #bia-send svg { width: 18px; height: 18px; fill: white; }

    .bia-footer {
      text-align: center;
      padding: 6px;
      font-size: 10px;
      color: #8a8a8a;
      opacity: 0.5;
      background: #111;
    }

    @media (max-width: 480px) {
      #bia-window {
        width: calc(100vw - 24px);
        height: calc(100vh - 120px);
        right: -12px;
        bottom: 68px;
      }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  // INJETAR HTML
  // ============================================================
  const widget = document.createElement('div');
  widget.id = 'bia-widget';
  widget.innerHTML = `
    <div id="bia-window">
      <div id="bia-header">
        <div class="bia-avatar">B</div>
        <div class="bia-hinfo">
          <h3>Bia · TBO</h3>
          <p><span class="bia-dot"></span> Consultora virtual</p>
        </div>
      </div>
      <div id="bia-msgs"></div>
      <div id="bia-input-area">
        <textarea id="bia-input" placeholder="Digite sua mensagem..." rows="1"></textarea>
        <button id="bia-send" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="bia-footer">TBO Lançamentos Imobiliários</div>
    </div>
    <button id="bia-toggle" class="pulse">
      <svg class="bia-ic-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
      <svg class="bia-ic-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
  `;
  document.body.appendChild(widget);

  // ============================================================
  // LÓGICA DO CHAT
  // ============================================================
  let conversationHistory = [];
  let isProcessing = false;
  let dataSent = false;

  const toggle = document.getElementById('bia-toggle');
  const chatWindow = document.getElementById('bia-window');
  const messagesContainer = document.getElementById('bia-msgs');
  const input = document.getElementById('bia-input');
  const sendBtn = document.getElementById('bia-send');

  // Toggle abrir/fechar
  toggle.addEventListener('click', () => {
    const isOpen = chatWindow.classList.toggle('open');
    toggle.classList.toggle('open');
    toggle.classList.remove('pulse');

    if (isOpen && conversationHistory.length === 0) {
      setTimeout(() => {
        addMessage('ai', 'Olá! Sou a Bia, consultora virtual da TBO Lançamentos Imobiliários. Somos especialistas em criar a narrativa de venda para lançamentos em todo o Brasil. Como posso te ajudar?');
      }, 400);
    }

    if (isOpen) {
      setTimeout(() => input.focus(), 400);
    }
  });

  // Input
  input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim() === '' || isProcessing;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Enviar mensagem
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isProcessing) return;

    addMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    isProcessing = true;

    const typingEl = showTyping();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CFG.API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: CFG.MODEL,
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: conversationHistory
        })
      });

      const data = await response.json();
      typingEl.remove();

      if (data.content && data.content[0] && data.content[0].text) {
        const aiText = data.content[0].text;
        conversationHistory.push({ role: 'assistant', content: aiText });

        const cleanText = extractAndSendData(aiText);
        addMessage('ai', cleanText);
      } else if (data.error) {
        console.error('Erro API Anthropic:', data.error);
        if (data.error.type === 'authentication_error') {
          addMessage('ai', 'Erro de configuração. Por favor, entre em contato pelo site wearetbo.com.br.');
        } else {
          addMessage('ai', 'Desculpe, tive um problema técnico. Pode repetir sua mensagem?');
        }
      } else {
        addMessage('ai', 'Desculpe, tive um problema técnico. Pode repetir sua mensagem?');
      }
    } catch (error) {
      typingEl.remove();
      console.error('Erro de conexão:', error);
      addMessage('ai', 'Desculpe, estou com dificuldade de conexão. Tente novamente em instantes.');
    }

    isProcessing = false;
    sendBtn.disabled = input.value.trim() === '';
  }

  // Extrair dados e enviar para n8n
  function extractAndSendData(text) {
    const match = text.match(/\[DADOS_COMPLETOS\]([\s\S]*?)\[\/DADOS_COMPLETOS\]/);

    if (match && !dataSent) {
      dataSent = true;
      const data = {};

      match[1].trim().split('\n').forEach(line => {
        const parts = line.split(':|');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts[1].replace('|', '').trim();
          data[key] = val;
        }
      });

      const payload = {
        Nome: data.nome || '',
        Email: data.email || '',
        whatsapp: data.whatsapp || '',
        Cidade: data.cidade || '',
        Momento: data.momento || '',
        VGV: data.vgv || '',
        Origem: 'Chat Widget - Bia'
      };

      fetch(CFG.WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        console.log('✅ Lead TBO enviado para n8n:', payload);
      }).catch(err => {
        console.error('❌ Erro ao enviar lead TBO:', err);
      });

      return text.replace(/\[DADOS_COMPLETOS\][\s\S]*?\[\/DADOS_COMPLETOS\]/, '').trim();
    }

    return text;
  }

  // Helpers de UI
  function addMessage(type, text) {
    const msg = document.createElement('div');
    msg.className = `bia-msg ${type}`;
    msg.innerHTML = text.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'bia-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typing;
  }

})();
