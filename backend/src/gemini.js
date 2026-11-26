/**
 * gemini.js - Serviço de Integração com Google Gemini
 * 
 * Este módulo utiliza o pacote oficial @google/generative-ai para enviar
 * a mensagem do usuário ao Gemini e receber uma resposta 100% estruturada em JSON.
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instrução de Sistema (Prompt de Engenharia) para orientar a IA
const SYSTEM_INSTRUCTION = `
Você é um assistente sênior especialista em triagem, atendimento ao cliente e classificação operacional de mensagens corporativas.
Sua tarefa é analisar o texto recebido e retornar EXCLUSIVAMENTE um objeto JSON válido, sem blocos markdown adicionais, sem preâmbulo e sem explicações externas.

Estrutura JSON obrigatória:
{
  "categoria": "Dúvida" | "Reclamação" | "Solicitação" | "Financeiro" | "Elogio" | "Outro",
  "prioridade": "Baixa" | "Média" | "Alta" | "Crítica",
  "departamento": "Suporte Técnico" | "Financeiro" | "Atendimento ao Cliente" | "Vendas" | "Operações" | "Diretoria",
  "sentimento": "Positivo" | "Neutro" | "Negativo" | "Urgente",
  "resumo": "Resumo executivo claro e direto em 1 ou 2 frases destacando o ponto central.",
  "pontos_chave": [
    "Item ou argumento principal 1",
    "Item ou argumento principal 2"
  ],
  "acao_recomendada": "Ação prática recomendada para o operador que receber este chamado.",
  "resposta_sugerida": "Uma sugestão de resposta profissional, empática e personalizada para enviar ao cliente/remetente."
}

Regras para atribuição de prioridade:
- "Crítica": Envolve ameaça de processo judicial, prejuízo financeiro iminente, sistema central inoperante ou clientes extremamente exaltados.
- "Alta": Reclamações graves, cobranças indevidas, clientes cancelando serviço ou prazos contratuais vencidos.
- "Média": Dúvidas operacionais importantes ou solicitações comuns de suporte.
- "Baixa": Dúvidas simples, informativos gerais ou elogios.
`;

/**
 * Envia um texto para o modelo Gemini e retorna o objeto JSON analisado.
 * 
 * @param {string} text - Mensagem corporativa enviada para triagem.
 * @returns {Promise<object>} Objeto com a triagem estruturada.
 */
export async function analyzeText(text) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Chave GEMINI_API_KEY não configurada no arquivo backend/.env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Lista de modelos ordenados para fallback automático caso algum esteja ocupado
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelsToTry = [
    preferredModel,
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest'
  ].filter((model, idx, self) => self.indexOf(model) === idx);

  const prompt = `Analise a seguinte mensagem corporativa:\n\n"""\n${text}\n"""`;

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      // Configura o modelo com o formato de saída JSON obrigatório
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const response = await model.generateContent(prompt);
      const rawText = response.response.text();

      // Realiza o parse do JSON retornado pela IA
      try {
        return JSON.parse(rawText);
      } catch {
        // Remove eventuais blocos de código markdown que o modelo possa ter inserido
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err) {
      // Se a chave for declarada inválida, interrompe imediatamente
      if (err.message && err.message.includes('API_KEY_INVALID')) {
        throw new Error('Chave da API do Google Gemini é inválida. Verifique o seu .env');
      }

      console.warn(`[Gemini] Tentativa com o modelo "${modelName}" falhou: ${err.message}. Tentando fallback...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Não foi possível obter resposta do Google Gemini.');
}
