/**
 * server.js - Servidor Express da Aplicação (Versão Light)
 * 
 * Nesta versão, o fluxo principal roda 100% pelo n8n:
 * 1. O Frontend envia a mensagem para o n8n (via /api/webhook-relay para evitar CORS)
 * 2. O n8n recebe o Webhook e chama este Backend em: POST /api/analyze
 * 3. O Backend consulta o Gemini e salva o histórico no SQLite
 * 4. O n8n recebe o resultado da IA, decide o SLA via Switch e responde
 * 5. O Frontend exibe o resultado final com a orquestração do n8n
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzeText } from './gemini.js';
import { saveAnalysis } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';

// Middlewares essenciais
app.use(cors());
app.use(express.json());

// Serve os arquivos do frontend estaticamente (HTML, CSS, JS)
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

/**
 * ROTA 1: Healthcheck
 * Usada para checar se a API está online.
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend KODIE Desafio 1 (Versão Light) está online!',
    n8nWebhookConfigured: Boolean(DEFAULT_WEBHOOK_URL),
    timestamp: new Date().toISOString()
  });
});

/**
 * ROTA 2: Configurações Públicas
 * Informa ao frontend a URL do Webhook do n8n configurada no .env
 */
app.get('/api/config', (req, res) => {
  res.json({
    n8nWebhookUrl: DEFAULT_WEBHOOK_URL
  });
});

/**
 * ROTA 3: Relay para o n8n (Evita bloqueio de CORS no navegador)
 * O frontend chama este endpoint, que repassa a mensagem diretamente para o n8n.
 */
app.post('/api/webhook-relay', async (req, res) => {
  try {
    const { text, webhookUrl } = req.body;
    const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma URL de Webhook do n8n configurada no .env (N8N_WEBHOOK_URL).'
      });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'O campo "text" é obrigatório.'
      });
    }

    console.log(`[Relay -> n8n] Disparando fluxo no n8n: ${targetUrl}`);

    const startTime = Date.now();
    const n8nResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text.trim(),
        source: 'frontend-light',
        timestamp: new Date().toISOString()
      })
    });

    const elapsed = Date.now() - startTime;
    const contentType = n8nResponse.headers.get('content-type') || '';
    
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await n8nResponse.json();
    } else {
      responseData = await n8nResponse.text();
    }

    if (!n8nResponse.ok) {
      console.warn(`[Relay -> n8n] Resposta de erro do n8n (HTTP ${n8nResponse.status}):`, responseData);
      return res.status(n8nResponse.status).json({
        success: false,
        error: typeof responseData === 'string' ? responseData : (responseData.message || 'Erro retornado pelo n8n'),
        data: responseData
      });
    }

    console.log(`[Relay <- n8n] Fluxo executado com sucesso em ${elapsed}ms`);
    return res.json({
      success: true,
      elapsed,
      data: responseData
    });

  } catch (error) {
    console.error('[Relay] Erro ao comunicar com o n8n:', error.message);
    return res.status(502).json({
      success: false,
      error: `Não foi possível conectar ao n8n: ${error.message}. Certifique-se de que o n8n está ativo e o webhook registrado.`
    });
  }
});

/**
 * ROTA 4: Análise Direta com Gemini + SQLite
 * Endpoint chamado pelo nó HTTP Request do n8n: "3. Chamar API Express (Gemini)"
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'O campo "text" é obrigatório e deve conter uma mensagem.'
      });
    }

    console.log(`[API Express] n8n acionou a API. Analisando com Gemini (${text.length} chars)...`);

    // 1. Chama a IA para classificar
    const analysis = await analyzeText(text.trim());

    // 2. Salva silenciosamente no banco SQLite local
    let analysisId = null;
    try {
      analysisId = saveAnalysis(text.trim(), analysis);
      console.log(`[SQLite] Análise salva com sucesso. ID: ${analysisId}`);
    } catch (dbErr) {
      console.warn(`[SQLite] Aviso: Falha ao salvar no banco: ${dbErr.message}`);
    }

    // 3. Retorna os dados estruturados para o nó do n8n continuar o fluxo
    return res.json({
      success: true,
      id: analysisId,
      data: analysis
    });

  } catch (error) {
    console.error('[API Express] Erro ao processar:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao processar a análise com IA.'
    });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log('='.repeat(55));
  console.log(`🚀 KODIE Desafio 1 - Versão Light rodando com sucesso!`);
  console.log(`📡 API Backend:       http://localhost:${PORT}`);
  console.log(`🌐 Interface Web:     http://localhost:${PORT}`);
  console.log(`⚡ Modo de Execução:  100% via n8n (Webhook Relay)`);
  console.log(`🔗 Webhook n8n:       ${DEFAULT_WEBHOOK_URL || '(não configurado no .env)'}`);
  console.log('='.repeat(55));
});
