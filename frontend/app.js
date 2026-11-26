/**
 * app.js - Lógica do Frontend (Starter Kit Didático)
 * 
 * Nesta versão, o envio é feito 100% via n8n:
 * Frontend ➔ Backend (/api/webhook-relay) ➔ n8n Webhook ➔ Backend Express (/api/analyze) ➔ n8n ➔ Frontend
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos da Interface
  const messageInput = document.getElementById('messageInput');
  const btnSubmit = document.getElementById('btnSubmit');
  const loadingState = document.getElementById('loadingState');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const resultSection = document.getElementById('resultSection');

  // Badges e campos de resultado
  const badgeCategoria = document.getElementById('badgeCategoria');
  const badgePrioridade = document.getElementById('badgePrioridade');
  const badgeDepartamento = document.getElementById('badgeDepartamento');
  const badgeSLA = document.getElementById('badgeSLA');
  const txtResumo = document.getElementById('txtResumo');
  const listPontosChave = document.getElementById('listPontosChave');
  const txtAcao = document.getElementById('txtAcao');
  const txtResposta = document.getElementById('txtResposta');
  const btnCopyResponse = document.getElementById('btnCopyResponse');

  // Botões de Exemplo
  const btnExCobranca = document.getElementById('btnExCobranca');
  const btnExFalha = document.getElementById('btnExFalha');
  const btnExDuvida = document.getElementById('btnExDuvida');

  // Exemplos pré-definidos para teste rápido dos alunos
  const EXEMPLOS = {
    cobranca: `Prezados, identifiquei uma cobrança duplicada de R$ 1.250,00 na minha fatura com vencimento para amanhã. Exijo o estorno imediato ou vou acionar o Procon e cancelar todas as contas da minha empresa com vocês. Aguardo retorno urgente.`,
    falha: `URGENTE! Nosso servidor de produção caiu após a atualização das 14h. Nossos clientes não conseguem logar nem finalizar compras no carrinho. Estamos tendo prejuízo por minuto. Preciso de suporte técnico imediato nível 1!`,
    duvida: `Olá! Gostaria de entender melhor a diferença entre o Plano Profissional e o Plano Enterprise. Vocês oferecem desconto para faturamento anual e suporte dedicado por telefone? Obrigado!`
  };

  btnExCobranca.addEventListener('click', () => {
    messageInput.value = EXEMPLOS.cobranca;
    messageInput.focus();
  });

  btnExFalha.addEventListener('click', () => {
    messageInput.value = EXEMPLOS.falha;
    messageInput.focus();
  });

  btnExDuvida.addEventListener('click', () => {
    messageInput.value = EXEMPLOS.duvida;
    messageInput.focus();
  });

  // Copiar resposta sugerida
  btnCopyResponse.addEventListener('click', async () => {
    const textToCopy = txtResposta.innerText;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = btnCopyResponse.innerText;
      btnCopyResponse.innerText = '✅ Copiado!';
      setTimeout(() => {
        btnCopyResponse.innerText = originalText;
      }, 2000);
    } catch {
      alert('Não foi possível copiar o texto automaticamente.');
    }
  });

  // Submissão do formulário: Envia SEMPRE para o n8n via relay
  btnSubmit.addEventListener('click', async () => {
    const text = messageInput.value.trim();

    if (!text) {
      showError('Por favor, digite ou selecione uma mensagem de exemplo antes de enviar ao n8n.');
      return;
    }

    // Atualiza interface para estado de carregamento
    hideError();
    resultSection.classList.add('hidden');
    loadingState.classList.remove('hidden');
    btnSubmit.disabled = true;

    try {
      // Dispara para o relay do backend, que repassa para o Webhook do n8n
      const response = await fetch('/api/webhook-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Erro retornado pelo fluxo do n8n.');
      }

      // O n8n retorna o objeto com { data: { ... }, sla: "..." }
      renderResults(json.data);

    } catch (err) {
      console.error(err);
      showError(err.message || 'Falha ao conectar com o n8n. Verifique se o fluxo está ativo.');
    } finally {
      loadingState.classList.add('hidden');
      btnSubmit.disabled = false;
    }
  });

  // Função para aplicar os dados retornados pelo n8n
  function renderResults(n8nPayload) {
    // Normaliza caso os dados da IA venham em n8nPayload.data ou diretamente
    const aiData = n8nPayload.data || n8nPayload;
    const sla = n8nPayload.sla || n8nPayload.sla_atendimento || (
      (aiData.prioridade === 'Crítica' || aiData.prioridade === 'Alta') 
        ? '30 minutos (Urgente)' 
        : '4 horas (Padrão)'
    );

    badgeCategoria.innerText = aiData.categoria || 'Geral';
    badgeDepartamento.innerText = aiData.departamento || 'Atendimento';

    // Prioridade e cor dinâmica
    const prioridade = aiData.prioridade || 'Média';
    badgePrioridade.innerText = prioridade;
    badgePrioridade.className = 'badge badge-priority ' + getPriorityClass(prioridade);

    // SLA definido pelo nó Switch do n8n
    badgeSLA.innerText = sla;

    // Resumo e textos
    txtResumo.innerText = aiData.resumo || 'Sem resumo fornecido.';
    txtAcao.innerText = aiData.acao_recomendada || 'Sem ação recomendada.';
    txtResposta.innerText = aiData.resposta_sugerida || 'Sem resposta sugerida.';

    // Lista de pontos chave
    listPontosChave.innerHTML = '';
    const pontos = Array.isArray(aiData.pontos_chave) ? aiData.pontos_chave : [aiData.pontos_chave];
    
    if (pontos.length > 0 && pontos[0]) {
      pontos.forEach(ponto => {
        const li = document.createElement('li');
        li.innerText = ponto;
        listPontosChave.appendChild(li);
      });
    } else {
      listPontosChave.innerHTML = '<li>Nenhum ponto chave destacado.</li>';
    }

    // Exibe o card de resultados
    resultSection.classList.remove('hidden');
  }

  function getPriorityClass(priority) {
    const p = String(priority).toLowerCase();
    if (p.includes('crítica') || p.includes('critica')) return 'priority-critica';
    if (p.includes('alta')) return 'priority-alta';
    if (p.includes('baixa')) return 'priority-baixa';
    return 'priority-media';
  }

  function showError(msg) {
    errorMessage.innerText = msg;
    errorAlert.classList.remove('hidden');
  }

  function hideError() {
    errorAlert.classList.add('hidden');
  }
});
