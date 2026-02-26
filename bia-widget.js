/**
 * Bia Widget - TBO Lançamentos Imobiliários
 * Consultora virtual com IA para qualificação de leads
 * 
 * SEGURANÇA: Usa proxy n8n para chamadas à API (chave NÃO exposta no frontend)
 */

(function() {
    'use strict';

    // =====================================================
    // CONFIGURAÇÃO — SEM API KEY (seguro!)
    // =====================================================
    const CFG = {
        PROXY_URL: 'https://agtbo.app.n8n.cloud/webhook/bia-proxy',
        WEBHOOK: 'https://agtbo.app.n8n.cloud/webhook/tbo-lead-form',
        MODEL: 'claude-haiku-4-5-20251001',
        CALCOM: 'https://cal.com/ruy-lima-cho2u7/reuniao-tbo'
    };

    // =====================================================
    // SYSTEM PROMPT
    // =====================================================
    const SYSTEM_PROMPT = `Você é a Bia, consultora virtual da TBO Lançamentos Imobiliários. Você é simpática, profissional e objetiva.

SEU OBJETIVO: Coletar 6 informações do visitante de forma natural e conversacional:
1. Nome completo
2. Cidade/estado onde atua
3. Momento do projeto (tem terreno? está buscando? já tem projeto aprovado?)
4. VGV estimado do empreendimento (Valor Geral de Vendas)
5. E-mail profissional
6. WhatsApp (com DDD)

REGRAS IMPORTANTES:
- Seja natural, NÃO pareça um formulário. Colete as informações ao longo da conversa.
- Faça UMA ou no máximo DUAS perguntas por vez.
- Quando tiver TODAS as 6 informações, confirme os dados com o visitante.
- Após confirmação, informe que um consultor da TBO entrará em contato.
- Se o lead parecer quente (VGV acima de R$30M ou projeto em fase avançada), ofereça o link para agendar reunião: ${CFG.CALCOM}
- Sobre a TBO: Somos especialistas em comunicação e lançamento de empreendimentos imobiliários. Atuamos em +18 cidades com portfólio de R$710MM em VGV.
- Se perguntarem algo que você não sabe sobre a TBO, diga que um consultor poderá dar mais detalhes.
- Responda SEMPRE em português brasileiro.
- Mantenha respostas curtas (2-3 frases no máximo).

FORMATO DE DADOS COLETADOS (use internamente):
Quando tiver todos os dados, inclua no final da sua mensagem (invisível ao usuário) o seguinte bloco:
[LEAD_DATA]
{"nome":"","cidade":"","momento":"","vgv":"","email":"","whatsapp":""}
[/LEAD_DATA]`;

    // =====================================================
    // ESTADO DO CHAT
    // =====================================================
    let chatMessages = [];
    let isOpen = false;
    let isLoading = false;
    let leadSent = false;

    // =====================================================
    // ESTILOS
    // =====================================================
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #bia-toggle {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            #bia-toggle:hover {
                transform: scale(1.08);
                box-shadow: 0 6px 28px rgba(0,0,0,0.4);
            }
            #bia-toggle svg {
                width: 28px;
                height: 28px;
                fill: white;
            }
            #bia-window {
                position: fixed;
                bottom: 96px;
                right: 24px;
                width: 380px;
                height: 520px;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.18);
                z-index: 99998;
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #bia-window.bia-open {
                display: flex;
            }
            #bia-header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            #bia-header-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255,255,255,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            #bia-header-info h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
            }
            #bia-header-info p {
                margin: 2px 0 0;
                font-size: 12px;
                opacity: 0.8;
            }
            #bia-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .bia-msg {
                max-width: 82%;
                padding: 10px 14px;
                border-radius: 16px;
                font-size: 14px;
                line-height: 1.5;
                word-wrap: break-word;
            }
            .bia-msg-bot {
                background: #f0f0f5;
                color: #1a1a2e;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
            }
            .bia-msg-user {
                background: #1a1a2e;
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            .bia-typing {
                align-self: flex-start;
                background: #f0f0f5;
                padding: 12px 18px;
                border-radius: 16px;
                display: flex;
                gap: 5px;
            }
            .bia-typing span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #999;
                animation: biaBounce 1.4s infinite ease-in-out;
            }
            .bia-typing span:nth-child(1) { animation-delay: 0s; }
            .bia-typing span:nth-child(2) { animation-delay: 0.2s; }
            .bia-typing span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes biaBounce {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                40% { transform: scale(1); opacity: 1; }
            }
            #bia-input-area {
                padding: 12px 16px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 8px;
                align-items: center;
            }
            #bia-input {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 24px;
                padding: 10px 16px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
                font-family: inherit;
            }
            #bia-input:focus {
                border-color: #1a1a2e;
            }
            #bia-send {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #1a1a2e;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.2s;
            }
            #bia-send:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            #bia-send svg {
                width: 18px;
                height: 18px;
                fill: white;
            }
            @media (max-width: 440px) {
                #bia-window {
                    width: calc(100vw - 16px);
                    height: calc(100vh - 120px);
                    right: 8px;
                    bottom: 88px;
                    border-radius: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // =====================================================
    // HTML DO WIDGET
    // =====================================================
    function createWidget() {
        // Botão flutuante
        const toggle = document.createElement('button');
        toggle.id = 'bia-toggle';
        toggle.setAttribute('aria-label', 'Abrir chat com Bia');
        toggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`;
        toggle.onclick = toggleChat;
        document.body.appendChild(toggle);

        // Janela do chat
        const win = document.createElement('div');
        win.id = 'bia-window';
        win.innerHTML = `
            <div id="bia-header">
                <div id="bia-header-avatar">👩‍💼</div>
                <div id="bia-header-info">
                    <h3>Bia — TBO</h3>
                    <p>Consultora Virtual</p>
                </div>
            </div>
            <div id="bia-messages"></div>
            <div id="bia-input-area">
                <input id="bia-input" type="text" placeholder="Digite sua mensagem..." autocomplete="off" />
                <button id="bia-send" aria-label="Enviar">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        `;
        document.body.appendChild(win);

        // Event listeners
        document.getElementById('bia-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        document.getElementById('bia-send').addEventListener('click', sendMessage);

        // Mensagem de boas-vindas
        setTimeout(() => {
            addMessage('bot', 'Olá! Sou a Bia, consultora virtual da TBO Lançamentos. 😊 Como posso ajudar você hoje?');
        }, 500);
    }

    // =====================================================
    // FUNÇÕES DO CHAT
    // =====================================================
    function toggleChat() {
        isOpen = !isOpen;
        const win = document.getElementById('bia-window');
        if (isOpen) {
            win.classList.add('bia-open');
            document.getElementById('bia-input').focus();
        } else {
            win.classList.remove('bia-open');
        }
    }

    function addMessage(role, text) {
        const container = document.getElementById('bia-messages');
        const div = document.createElement('div');
        div.className = `bia-msg bia-msg-${role === 'bot' ? 'bot' : 'user'}`;
        
        // Remove LEAD_DATA block from visible text
        const cleanText = text.replace(/\[LEAD_DATA\][\s\S]*?\[\/LEAD_DATA\]/g, '').trim();
        div.textContent = cleanText;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
        const container = document.getElementById('bia-messages');
        const div = document.createElement('div');
        div.className = 'bia-typing';
        div.id = 'bia-typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('bia-typing-indicator');
        if (el) el.remove();
    }

    async function sendMessage() {
        const input = document.getElementById('bia-input');
        const text = input.value.trim();
        if (!text || isLoading) return;

        // Mostra mensagem do usuário
        addMessage('user', text);
        input.value = '';
        isLoading = true;
        document.getElementById('bia-send').disabled = true;

        // Adiciona ao histórico
        chatMessages.push({ role: 'user', content: text });

        showTyping();

        try {
            // =====================================================
            // CHAMADA VIA PROXY N8N (sem API key no frontend!)
            // =====================================================
            const response = await fetch(CFG.PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: CFG.MODEL,
                    max_tokens: 512,
                    system: SYSTEM_PROMPT,
                    messages: chatMessages
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Erro ${response.status}`);
            }

            const data = await response.json();
            const reply = data.content?.[0]?.text || data.reply || 'Desculpe, tive um problema. Pode repetir?';

            hideTyping();

            // Adiciona resposta ao histórico
            chatMessages.push({ role: 'assistant', content: reply });
            addMessage('bot', reply);

            // Verifica se tem dados de lead na resposta
            checkForLeadData(reply);

        } catch (err) {
            hideTyping();
            console.error('[Bia] Erro:', err);
            addMessage('bot', 'Desculpe, estou com dificuldades técnicas. Tente novamente em instantes.');
        } finally {
            isLoading = false;
            document.getElementById('bia-send').disabled = false;
            document.getElementById('bia-input').focus();
        }
    }

    // =====================================================
    // DETECÇÃO E ENVIO DE LEAD
    // =====================================================
    function checkForLeadData(text) {
        if (leadSent) return;

        const match = text.match(/\[LEAD_DATA\]([\s\S]*?)\[\/LEAD_DATA\]/);
        if (!match) return;

        try {
            const data = JSON.parse(match[1].trim());
            
            // Verifica se todos os campos estão preenchidos
            const required = ['nome', 'cidade', 'momento', 'vgv', 'email', 'whatsapp'];
            const allFilled = required.every(k => data[k] && data[k].trim() !== '');
            
            if (allFilled) {
                sendLeadToWebhook(data);
            }
        } catch (e) {
            console.error('[Bia] Erro ao parsear lead data:', e);
        }
    }

    async function sendLeadToWebhook(data) {
        if (leadSent) return;
        leadSent = true;

        try {
            await fetch(CFG.WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'bia-widget',
                    timestamp: new Date().toISOString(),
                    lead: data
                })
            });
            console.log('[Bia] Lead enviado com sucesso');
        } catch (err) {
            console.error('[Bia] Erro ao enviar lead:', err);
            leadSent = false; // permite retry
        }
    }

    // =====================================================
    // INICIALIZAÇÃO
    // =====================================================
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                injectStyles();
                createWidget();
            });
        } else {
            injectStyles();
            createWidget();
        }
    }

    init();
})();
