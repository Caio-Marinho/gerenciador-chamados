/** Endereço da API encaminhada pelo Nginx. */
const API_BASE = '/api';

/** @typedef {{ id: number, nome: string }} Responsavel */
/** @typedef {{ id: number, prioridade: string }} Prioridade */
/** @typedef {{ id: number, status: string }} StatusChamado */
/** @typedef {'id' | 'cliente' | 'titulo' | 'status' | 'prioridade' | 'responsavel' | 'data' | 'fechamento'} CampoOrdenacao */
/**
 * Representação do chamado retornado pela API, incluindo seus relacionamentos.
 * @typedef {{ id: number, Titulo: string, Descricao: string, id_status: number,
 *   id_prioridade: number, id_responsavel: number, data_hora_abertura: string,
 *   data_hora_fechamento: string | null,
 *   cliente?: { nome: string }, status?: StatusChamado,
 *   prioridade?: Prioridade, responsavel?: Responsavel }} Chamado
 */

/** Estado da tela de atendimento mantido em memória durante a sessão. */
const estadoAtendimento = {
    /** @type {Chamado[]} */ chamados: [],
    /** @type {Responsavel[]} */ responsaveis: [],
    /** @type {Prioridade[]} */ prioridades: [],
    /** @type {StatusChamado[]} */ status: [],
    /** @type {Chamado | null} */ chamadoAtual: null,
    /** Filtros combináveis aplicados à fila atual. */
    filtros: { status: '', prioridade: '', cliente: '' },
    /** Texto de busca aplicado à fila atual. */
    pesquisa: '',
    /** Campo da tabela; a ordenação é sempre crescente.
     * @type {{ campo: CampoOrdenacao }}
     */
    ordenacao: { campo: 'id' }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('responsavelAtual').addEventListener('change', carregarFila);
    document.getElementById('pesquisaFila').addEventListener('input', event => {
        estadoAtendimento.pesquisa = event.target.value.trim();
        renderizarFila();
    });
    document.getElementById('abrirFiltrosFila').addEventListener('click', abrirModalFiltros);
    document.getElementById('cancelarFiltrosFila').addEventListener('click', fecharModalFiltros);
    document.getElementById('limparFiltrosFila').addEventListener('click', limparFiltros);
    document.getElementById('formFiltrosFila').addEventListener('submit', aplicarFiltros);
    document.getElementById('formAtendimento').addEventListener('submit', salvarAtualizacao);
    document.getElementById('cancelarAtendimento').addEventListener('click', fecharModal);
    document.querySelectorAll('[data-sort]').forEach(botao => {
        botao.addEventListener('click', () => ordenarPor(botao.dataset.sort));
    });

    // Delegação de eventos: a linha continua acionável após cada renderização.
    document.getElementById('tabelaFila').addEventListener('click', event => {
        const linha = event.target.closest('tr[data-chamado-id]');
        if (linha) abrirModal(Number(linha.dataset.chamadoId));
    });
    document.getElementById('tabelaFila').addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const linha = event.target.closest('tr[data-chamado-id]');
        if (!linha) return;
        event.preventDefault();
        abrirModal(Number(linha.dataset.chamadoId));
    });
    document.getElementById('modalAtendimento').addEventListener('click', event => {
        if (event.target.id === 'modalAtendimento') fecharModal();
    });
    document.getElementById('modalFiltrosFila').addEventListener('click', event => {
        if (event.target.id === 'modalFiltrosFila') fecharModalFiltros();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            fecharModal();
            fecharModalFiltros();
        }
    });

    carregarOpcoes();
});

/** Carrega os dados de referência usados pelos seletores da página. */
async function carregarOpcoes() {
    try {
        const [responsaveis, prioridades, status] = await Promise.all([
            buscarLista('/responsavel'),
            buscarLista('/prioridade'),
            buscarLista('/status')
        ]);
        estadoAtendimento.responsaveis = responsaveis;
        estadoAtendimento.prioridades = prioridades;
        estadoAtendimento.status = status;
        preencherOpcoes('responsavelAtual', responsaveis, 'Selecione seu nome', 'nome');
        preencherOpcoes('atendimentoResponsavel', responsaveis, 'Selecione um responsável', 'nome');
        preencherOpcoes('atendimentoPrioridade', prioridades, 'Selecione uma prioridade', 'prioridade');
        preencherOpcoes('atendimentoStatus', status, 'Selecione um status', 'status');
        preencherFiltrosFila();
    } catch (erro) {
        document.getElementById('totalFila').textContent = 'Não foi possível carregar as opções';
        console.error(erro);
    }
}

/** Busca uma coleção da API e valida a resposta HTTP.
 * @template T
 * @param {string} caminho Caminho iniciado por `/`.
 * @returns {Promise<T[]>}
 */
async function buscarLista(caminho) {
    const resposta = await fetch(`${API_BASE}${caminho}`);
    if (!resposta.ok) throw new Error(`Falha ao carregar ${caminho}`);
    return resposta.json();
}

/** Preenche um seletor HTML com os registros de referência.
 * @param {string} id Identificador do elemento select.
 * @param {Array<{id: number, [campo: string]: string | number}>} itens Opções retornadas pela API.
 * @param {string} padrao Texto da opção inicial.
 * @param {string} campoTexto Campo usado como rótulo.
 */
function preencherOpcoes(id, itens, padrao, campoTexto) {
    const select = document.getElementById(id);
    select.replaceChildren(new Option(padrao, ''));
    itens.forEach(item => select.add(new Option(item[campoTexto], item.id)));
}

/** Atualiza os filtros com status, prioridades e clientes disponíveis na fila. */
function preencherFiltrosFila() {
    preencherFiltroSelect('filtroStatusFila', estadoAtendimento.status.map(item => item.status), 'Todos');
    preencherFiltroSelect('filtroPrioridadeFila', estadoAtendimento.prioridades.map(item => item.prioridade), 'Todas');
    const clientes = [...new Set(estadoAtendimento.chamados
        .map(chamado => chamado.cliente?.nome)
        .filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (estadoAtendimento.filtros.cliente && !clientes.includes(estadoAtendimento.filtros.cliente)) {
        estadoAtendimento.filtros.cliente = '';
    }
    preencherFiltroSelect('filtroClienteFila', clientes, 'Todos');
}

/** Preenche um seletor textual e preserva a seleção se ela ainda estiver disponível.
 * @param {string} id
 * @param {string[]} valores
 * @param {string} padrao
 */
function preencherFiltroSelect(id, valores, padrao) {
    const chaves = {
        filtroStatusFila: 'status',
        filtroPrioridadeFila: 'prioridade',
        filtroClienteFila: 'cliente'
    };
    const select = document.getElementById(id);
    const selecionado = select.value || estadoAtendimento.filtros[chaves[id]];
    select.replaceChildren(new Option(padrao, ''));
    valores.forEach(valor => select.add(new Option(valor, valor)));
    select.value = valores.includes(selecionado) ? selecionado : '';
}

/** Busca os chamados do responsável atualmente selecionado. */
async function carregarFila() {
    const responsavelId = document.getElementById('responsavelAtual').value;
    const tabela = document.getElementById('tabelaFila');
    if (!responsavelId) {
        estadoAtendimento.chamados = [];
        tabela.innerHTML = '<tr><td colspan="8">Selecione seu nome para carregar os chamados.</td></tr>';
        document.getElementById('totalFila').textContent = 'Selecione seu nome';
        atualizarIndicadoresOrdenacao();
        renderizarFiltrosRapidos();
        renderizarFiltrosAtivos();
        return;
    }

    tabela.innerHTML = '<tr><td colspan="8">Carregando sua fila...</td></tr>';
    try {
        const resposta = await fetch(`${API_BASE}/responsavel/${responsavelId}/chamados`);
        if (!resposta.ok) throw new Error('Não foi possível carregar sua fila.');
        estadoAtendimento.chamados = await resposta.json();
        preencherFiltrosFila();
        renderizarFila();
    } catch (erro) {
        tabela.innerHTML = '<tr><td colspan="8">Não foi possível carregar os chamados.</td></tr>';
        document.getElementById('totalFila').textContent = 'Falha ao carregar';
        console.error(erro);
    }
}

/** Retorna o valor de ordenação solicitado, incluindo dados relacionais.
 * @param {Chamado} chamado
 * @param {CampoOrdenacao} campo
 * @returns {string | number}
 */
function obterValorOrdenacao(chamado, campo) {
    const valores = {
        id: chamado.id,
        cliente: chamado.cliente?.nome ?? '',
        titulo: chamado.Titulo ?? '',
        status: chamado.status?.status ?? '',
        prioridade: chamado.prioridade?.prioridade ?? '',
        responsavel: chamado.responsavel?.nome ?? '',
        data: chamado.data_hora_abertura ?? '',
        fechamento: chamado.data_hora_fechamento ?? ''
    };
    return valores[campo] ?? '';
}

/** Retorna uma cópia ordenada da fila, sem alterar a resposta original da API.
 * @returns {Chamado[]}
 */
function obterChamadosOrdenados() {
    const { campo } = estadoAtendimento.ordenacao;
    const termo = normalizar(estadoAtendimento.pesquisa);
    const filtrados = estadoAtendimento.chamados.filter(chamado => {
        const filtrosAtendidos = Object.entries(estadoAtendimento.filtros).every(([chave, valor]) => {
            if (!valor) return true;
            if (chave === 'status') return chamado.status?.status === valor;
            if (chave === 'prioridade') return chamado.prioridade?.prioridade === valor;
            return chamado.cliente?.nome === valor;
        });
        const textoChamado = [
            chamado.id,
            chamado.Titulo,
            chamado.Descricao,
            chamado.cliente?.nome,
            chamado.status?.status,
            chamado.prioridade?.prioridade,
            chamado.responsavel?.nome,
            chamado.data_hora_abertura,
            chamado.data_hora_fechamento
        ].join(' ');
        return filtrosAtendidos && (!termo || normalizar(textoChamado).includes(termo));
    });

    return filtrados.sort((a, b) => {
        const valorA = obterValorOrdenacao(a, campo);
        const valorB = obterValorOrdenacao(b, campo);
        let comparacao;

        if (campo === 'id') {
            comparacao = Number(valorA) - Number(valorB);
        } else if (campo === 'data' || campo === 'fechamento') {
            const instanteA = valorA ? new Date(valorA).getTime() : Number.POSITIVE_INFINITY;
            const instanteB = valorB ? new Date(valorB).getTime() : Number.POSITIVE_INFINITY;
            comparacao = instanteA - instanteB;
        } else {
            comparacao = String(valorA).localeCompare(String(valorB), 'pt-BR', { numeric: true });
        }
        return comparacao;
    });
}

/** Normaliza texto para buscas sem diferenciar acentos ou caixa.
 * @param {unknown} valor
 * @returns {string}
 */
function normalizar(valor) {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

/** Renderiza as linhas da fila na ordem selecionada. */
function renderizarFila() {
    const tabela = document.getElementById('tabelaFila');
    const chamados = obterChamadosOrdenados();
    tabela.replaceChildren();
    if (!chamados.length) {
        const mensagem = estadoAtendimento.chamados.length
            ? 'Nenhum chamado corresponde à busca e aos filtros.'
            : 'Não há chamados atribuídos a este responsável.';
        tabela.innerHTML = `<tr><td colspan="8">${mensagem}</td></tr>`;
    }

    chamados.forEach(chamado => {
        const linha = document.createElement('tr');
        linha.dataset.chamadoId = chamado.id;
        linha.tabIndex = 0;
        linha.setAttribute('aria-label', `Abrir chamado ${chamado.id}: ${chamado.Titulo}`);
        [
            chamado.id,
            chamado.cliente?.nome ?? '-',
            chamado.Titulo ?? '-',
            chamado.status?.status ?? '-',
            chamado.prioridade?.prioridade ?? '-',
            chamado.responsavel?.nome ?? '-',
            formatarData(chamado.data_hora_abertura),
            formatarData(chamado.data_hora_fechamento)
        ].forEach(valor => {
            const celula = document.createElement('td');
            celula.textContent = valor;
            linha.appendChild(celula);
        });
        tabela.appendChild(linha);
    });

    document.getElementById('totalFila').textContent = `${chamados.length} de ${estadoAtendimento.chamados.length} chamados`;
    atualizarIndicadoresOrdenacao();
    renderizarFiltrosRapidos();
    renderizarFiltrosAtivos();
}

/** Cria filtros em balões para status e prioridades encontrados na fila. */
function renderizarFiltrosRapidos() {
    const container = document.getElementById('filtrosRapidosFila');
    container.replaceChildren();
    [
        { campo: 'status', rotulo: 'Status', seletor: 'filtroStatusFila' },
        { campo: 'prioridade', rotulo: 'Prioridade', seletor: 'filtroPrioridadeFila' }
    ].forEach(({ campo, rotulo, seletor }) => {
        const valores = [...new Set(estadoAtendimento.chamados
            .map(chamado => obterValorOrdenacao(chamado, campo))
            .filter(Boolean))]
            .map(String)
            .sort((a, b) => a.localeCompare(b, 'pt-BR'));
        const grupo = document.createElement('div');
        grupo.className = 'quick-filter-group';
        const legenda = document.createElement('span');
        legenda.className = 'quick-filter-label';
        legenda.textContent = `${rotulo}:`;
        grupo.appendChild(legenda);

        [['', 'Todos'], ...valores.map(valor => [valor, valor])].forEach(([valor, texto]) => {
            const balao = document.createElement('button');
            balao.type = 'button';
            balao.className = 'filter-chip';
            balao.textContent = texto;
            balao.setAttribute('aria-pressed', String(estadoAtendimento.filtros[campo] === valor));
            balao.addEventListener('click', () => {
                estadoAtendimento.filtros[campo] = estadoAtendimento.filtros[campo] === valor ? '' : valor;
                document.getElementById(seletor).value = estadoAtendimento.filtros[campo];
                renderizarFila();
            });
            grupo.appendChild(balao);
        });
        container.appendChild(grupo);
    });
}

/** Renderiza balões removíveis para os filtros e termos de busca aplicados. */
function renderizarFiltrosAtivos() {
    const container = document.getElementById('filtrosAtivosFila');
    const rotulos = { status: 'Status', prioridade: 'Prioridade', cliente: 'Cliente' };
    container.replaceChildren();

    Object.entries(estadoAtendimento.filtros).forEach(([campo, valor]) => {
        if (!valor) return;
        adicionarBalaoFiltro(container, `${rotulos[campo]}: ${valor}`, () => {
            estadoAtendimento.filtros[campo] = '';
            const seletores = {
                status: 'filtroStatusFila',
                prioridade: 'filtroPrioridadeFila',
                cliente: 'filtroClienteFila'
            };
            document.getElementById(seletores[campo]).value = '';
            renderizarFila();
        });
    });

    if (estadoAtendimento.pesquisa) {
        adicionarBalaoFiltro(container, `Busca: ${estadoAtendimento.pesquisa}`, () => {
            estadoAtendimento.pesquisa = '';
            document.getElementById('pesquisaFila').value = '';
            renderizarFila();
        });
    }
}

/** Cria um balão acionável que remove seu filtro associado.
 * @param {HTMLElement} container
 * @param {string} texto
 * @param {() => void} aoRemover
 */
function adicionarBalaoFiltro(container, texto, aoRemover) {
    const balao = document.createElement('button');
    balao.type = 'button';
    balao.className = 'filter-chip';
    balao.textContent = `${texto} ×`;
    balao.setAttribute('aria-label', `Remover filtro ${texto}`);
    balao.addEventListener('click', aoRemover);
    container.appendChild(balao);
}

/** Abre o modal de filtros e posiciona o foco no primeiro campo. */
function abrirModalFiltros() {
    document.getElementById('modalFiltrosFila').classList.remove('hidden');
    document.getElementById('filtroStatusFila').focus();
}

/** Fecha o modal sem aplicar alterações ainda não confirmadas. */
function fecharModalFiltros() {
    document.getElementById('modalFiltrosFila').classList.add('hidden');
}

/** Aplica os filtros selecionados e atualiza a tabela.
 * @param {SubmitEvent} event
 */
function aplicarFiltros(event) {
    event.preventDefault();
    estadoAtendimento.filtros = {
        status: document.getElementById('filtroStatusFila').value,
        prioridade: document.getElementById('filtroPrioridadeFila').value,
        cliente: document.getElementById('filtroClienteFila').value
    };
    fecharModalFiltros();
    renderizarFila();
}

/** Limpa a busca e todos os filtros ativos. */
function limparFiltros() {
    estadoAtendimento.filtros = { status: '', prioridade: '', cliente: '' };
    estadoAtendimento.pesquisa = '';
    document.getElementById('pesquisaFila').value = '';
    document.getElementById('filtroStatusFila').value = '';
    document.getElementById('filtroPrioridadeFila').value = '';
    document.getElementById('filtroClienteFila').value = '';
    fecharModalFiltros();
    renderizarFila();
}

/** Formata a data de abertura no padrão local; mantém o valor original se inválido.
 * @param {string | null | undefined} valor
 * @returns {string}
 */
function formatarData(valor) {
    if (!valor) return '-';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
}

/** Seleciona a coluna a ordenar; a direção permanece crescente.
 * @param {CampoOrdenacao} campo
 */
function ordenarPor(campo) {
    estadoAtendimento.ordenacao = { campo };
    renderizarFila();
}

/** Atualiza os ícones e atributos acessíveis dos cabeçalhos ordenáveis. */
function atualizarIndicadoresOrdenacao() {
    document.querySelectorAll('[data-sort]').forEach(botao => {
        const ativo = botao.dataset.sort === estadoAtendimento.ordenacao.campo;
        botao.closest('th').setAttribute('aria-sort', ativo ? 'ascending' : 'none');
        botao.querySelector('span').textContent = ativo ? '↑' : '↕';
    });
}

/** Abre o formulário para atualizar o chamado selecionado.
 * @param {number} chamadoId
 */
function abrirModal(chamadoId) {
    const chamado = estadoAtendimento.chamados.find(item => item.id === chamadoId);
    if (!chamado) return;
    estadoAtendimento.chamadoAtual = chamado;
    document.getElementById('atendimentoCliente').value = chamado.cliente?.nome ?? '-';
    document.getElementById('atendimentoTitulo').value = chamado.Titulo ?? '';
    document.getElementById('atendimentoDescricao').value = chamado.Descricao ?? '';
    document.getElementById('atendimentoStatus').value = String(chamado.id_status);
    document.getElementById('atendimentoPrioridade').value = String(chamado.id_prioridade);
    document.getElementById('atendimentoResponsavel').value = String(chamado.id_responsavel);
    document.getElementById('atendimentoAbertura').textContent = formatarData(chamado.data_hora_abertura);
    document.getElementById('atendimentoFechamento').textContent = chamado.data_hora_fechamento
        ? formatarData(chamado.data_hora_fechamento)
        : 'Ainda não encerrado';
    document.getElementById('modalAtendimento').classList.remove('hidden');
    document.getElementById('atendimentoStatus').focus();
}

/** Fecha o modal e limpa o chamado selecionado. */
function fecharModal() {
    document.getElementById('modalAtendimento').classList.add('hidden');
    estadoAtendimento.chamadoAtual = null;
}

/** Envia as mudanças do formulário e recarrega a fila após salvar.
 * @param {SubmitEvent} event
 */
async function salvarAtualizacao(event) {
    event.preventDefault();
    const chamado = estadoAtendimento.chamadoAtual;
    if (!chamado) return;

    const dados = {
        id_status: Number(document.getElementById('atendimentoStatus').value),
        id_prioridade: Number(document.getElementById('atendimentoPrioridade').value),
        id_responsavel: Number(document.getElementById('atendimentoResponsavel').value)
    };

    try {
        const resposta = await fetch(`${API_BASE}/responsavel/chamados/${chamado.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(erro.detail || 'Não foi possível atualizar o chamado.');
        }
        fecharModal();
        await carregarFila();
    } catch (erro) {
        alert(erro.message);
    }
}
