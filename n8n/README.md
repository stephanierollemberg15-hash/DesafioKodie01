# 🔄 Guia de Importação do Fluxo no n8n

Este diretório contém o fluxo didático de automação do Desafio 1 (`workflow_didatico.json`).

---

## 🚀 Como Importar no n8n em 2 Passos:

### Passo 1: Abrir o n8n
1. Acesse sua instância do n8n no navegador (ex: `http://localhost:5678` ou sua URL do n8n).
2. Clique no menu superior direito (ícone `...` ou botão **Add Workflow**).

### Passo 2: Importar o Arquivo
1. Selecione a opção **Import from File** (ou arraste o arquivo `workflow_didatico.json` para dentro da tela).
2. O fluxo aparecerá com os nós numerados didaticamente:
   - `1. Receber Mensagem (Webhook)`
   - `2. Normalizar Entrada (Edit Fields)`
   - `3. Chamar API Express (Gemini)`
   - `4. Decidir Prioridade (Switch)`
   - `5. Definir SLA Urgente (30 min)`
   - `6. Definir SLA Normal (4 horas)`
   - `7. Responder ao Frontend (Respond to Webhook)`
3. Clique em **Save** (Salvar) e ative o botão **Active** (Ativo) no topo direito.

---

### ⚙️ Dica de Conexão com o Backend:
- Se o seu n8n estiver rodando localmente na mesma máquina, o nó **3. Chamar API Express (Gemini)** chamará:
  `http://localhost:3001/api/analyze`
- Se o seu n8n estiver rodando via Docker, use:
  `http://host.docker.internal:3001/api/analyze`
