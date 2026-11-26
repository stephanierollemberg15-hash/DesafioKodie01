/**
 * database.js - Módulo de Persistência SQLite
 * 
 * Este módulo utiliza o driver nativo 'node:sqlite' (disponível no Node.js moderno),
 * eliminando a necessidade de compilação ou dependências externas como sqlite3.
 * Ele cria automaticamente o arquivo 'data.sqlite' e a tabela 'analyses'.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do arquivo de banco de dados SQLite na pasta 'backend'
const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new DatabaseSync(dbPath);

// Criação automática da tabela de análises se ela ainda não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_text TEXT NOT NULL,
    categoria TEXT,
    prioridade TEXT,
    departamento TEXT,
    sentimento TEXT,
    resumo TEXT,
    pontos_chave TEXT,
    acao_recomendada TEXT,
    resposta_sugerida TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/**
 * Salva o resultado de uma triagem no SQLite.
 * 
 * @param {string} inputText - Texto original recebido do cliente/usuário.
 * @param {object} result - Objeto estruturado retornado pela IA.
 * @returns {number|bigint} ID do registro inserido no banco de dados.
 */
export function saveAnalysis(inputText, result) {
  const stmt = db.prepare(`
    INSERT INTO analyses (
      input_text, categoria, prioridade, departamento,
      sentimento, resumo, pontos_chave, acao_recomendada,
      resposta_sugerida
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Se pontos_chave for um array, converte para string JSON para salvar no SQLite
  const pontosChaveStr = Array.isArray(result.pontos_chave)
    ? JSON.stringify(result.pontos_chave)
    : (result.pontos_chave || '[]');

  const info = stmt.run(
    inputText,
    result.categoria || 'Outro',
    result.prioridade || 'Média',
    result.departamento || 'Geral',
    result.sentimento || 'Neutro',
    result.resumo || '',
    pontosChaveStr,
    result.acao_recomendada || '',
    result.resposta_sugerida || ''
  );

  return info.lastInsertRowid;
}
