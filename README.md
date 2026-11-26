# 🚀 KODIE Desafio 1 — Starter Kit Didático (Versão Light)

> **Triagem e Classificação Inteligente de Mensagens Corporativas com IA (Google Gemini), Persistência SQLite e Orquestração 100% via n8n.**

Este projeto é uma versão limpa, simplificada e didática, desenvolvida como o ponto de partida (*starter kit*) ideal para os alunos da formação KODIE.

---

## ⚡ Como funciona a Arquitetura (100% via n8n):

```text
[Frontend Web]
      │
      ▼ (POST /api/webhook-relay)
[Backend Express] ──── (Encaminha Webhook) ────► [n8n Workflow]
                                                       │
                                            (1. Webhook Recebido)
                                            (2. Normalizar Entrada)
                                                       │
[Backend Express (/api/analyze)] ◄─── (3. HTTP Request) ┘
      │
      ├─► [Google Gemini AI] (Extrai Categoria, Prioridade, Resumo, Resposta)
      └─► [SQLite Local] (Salva automaticamente no banco data.sqlite)
      │
      ▼ (Retorna JSON com a análise)
[n8n Workflow]
      │
      ├─► (4. Switch de Prioridade: Crítica/Alta vs Padrão)
      ├─► (5/6. Atribui SLA: 30 minutos ou 4 horas)
      │
      ▼ (7. Respond to Webhook)
[Frontend Web] (Exibe o resultado com badges dinâmicos e SLA calculado pelo n8n)
```

---

## 📁 Onde estão os arquivos do n8n?

Todo o fluxo do n8n está localizado na pasta **`n8n/`**:
- 📄 **`n8n/workflow_didatico.json`**: Arquivo JSON pronto para importar no n8n.
- 📖 **`n8n/README.md`**: Guia rápido de 2 passos para importar e ativar o fluxo.

---

## 🏁 Como Rodar em 3 Passos Simples

### Passo 1: Configurar a Chave e o Webhook do n8n (`backend/.env`)
Abra o arquivo `backend/.env` e configure sua chave do Gemini e a URL do Webhook do seu n8n:
```env
PORT=3001
GEMINI_API_KEY=sua_chave_gemini_aqui
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/seu-id
```

### Passo 2: Iniciar a Aplicação
No seu terminal (pode ser na raiz do projeto ou na pasta `backend`):
```bash
npm start
```

### Passo 3: Testar no Navegador
Abra no seu navegador:
👉 **[http://localhost:3001](http://localhost:3001)**

1. Clique em um dos botões de exemplo (ex: *🚨 Falha Crítica no Sistema*).
2. Clique em **⚡ Enviar para o n8n**.
3. O fluxo é disparado no n8n, passa pelo Gemini, grava no SQLite e retorna à tela com o SLA definido!

---

## 🧪 Estrutura de Pastas

```text
DESAFIO-1-light/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express com /api/webhook-relay e /api/analyze
│   │   ├── gemini.js          # Serviço do Gemini (@google/generative-ai) com JSON Schema
│   │   └── database.js        # SQLite nativo (node:sqlite)
│   ├── .env.example           # Exemplo de configuração
│   ├── .env                   # Variáveis de ambiente locais
│   └── package.json           # Dependências essenciais do backend
├── frontend/
│   ├── index.html             # Tela única limpa focada em n8n
│   ├── style.css              # Estilos modernos e minimalistas
│   └── app.js                 # Envio direto para o fluxo do n8n
├── n8n/
│   ├── workflow_didatico.json # Fluxo oficial com nós 1 a 7 numerados
│   └── README.md              # Como importar no n8n
├── .gitignore
└── README.md                  # Este guia
```
