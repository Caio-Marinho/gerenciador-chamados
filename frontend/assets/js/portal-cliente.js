/** Portal do cliente: identificação, consulta, filtros e edição de chamados. */
const API_BASE = '/api';

/** @typedef {{ id: number, nome: string }} Cliente */
/** @typedef {{ id: number, prioridade: string }} Prioridade */
/** @typedef {{ id: number, nome: string }} Responsavel */
/**
 * Registro de chamado serializado pela API.
 * @typedef {{ id: number, Titulo: string, Descricao: string, id_prioridade: number,
 *   id_status: number, id_responsavel?: number, data_hora_abertura: string,
 *   data_hora_fechamento: string | null, cliente?: Cliente,
 *   status?: { status: string }, prioridade?: Prioridade,
 *   responsavel?: Responsavel }} ChamadoCliente
 */

/** Dados da sessão atual do portal e das preferências da listagem. */
const estadoCliente = {
    /** @type {Cliente | null} */
    cliente: null,
    /** @type {ChamadoCliente[]} */
    chamados: [],
    /** @type {Prioridade[]} */
    prioridades: [],
    /** @type {Responsavel[]} */
    responsaveis: [],
    filtros: { status: '', prioridade: '', responsavel: '' },
    pesquisa: '',
    ordenacao: { campo: 'id' },
    chamadoModal: null
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formIdentificacao').addEventListener('submit', identificarCliente);
    document.getElementById('pesquisaChamados').addEventListener('input', event => {
        estadoCliente.pesquisa = event.target.value.trim();
        renderizarChamados();
    });
    document.getElementById('abrirFiltros').addEventListener('click', abrirModalFiltros);
    document.getElementById('cancelarFiltros').addEventListener('click', fecharModalFiltros);
    document.getElementById('formFiltros').addEventListener('submit', aplicarFiltros);
    document.getElementById('novoChamado').addEventListener('click', () => abrirModalChamado());
    document.getElementById('trocarCliente').addEventListener('click', trocarCliente);
    document.getElementById('fecharChamado').addEventListener('click', fecharModalChamado);
    document.getElementById('formChamado').addEventListener('submit', salvarChamado);
    document.querySelectorAll('[data-sort]').forEach(botao => {
        botao.addEventListener('click', () => ordenarPor(botao.dataset.sort));
    });

    document.getElementById('tabelaChamados').addEventListener('click', event => {
        const linha = event.target.closest('tr[data-chamado-id]');
        if (linha) abrirModalChamado(Number(linha.dataset.chamadoId));
    });
    document.getElementById('tabelaChamados').addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const linha = event.target.closest('tr[data-chamado-id]');
        if (!linha) return;
        event.preventDefault();
        abrirModalChamado(Number(linha.dataset.chamadoId));
    });

    document.getElementById('modalFiltros').addEventListener('click', event => {
        if (event.target.id === 'modalFiltros') fecharModalFiltros();
    });
    document.getElementById('modalChamado').addEventListener('click', event => {
        if (event.target.id === 'modalChamado') fecharModalChamado();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            fecharModalFiltros();
            fecharModalChamado();
        }
    });

    carregarPrioridades();
    carregarResponsaveis();
    const clienteSalvo = sessionStorage.getItem('clienteAtual');
    if (clienteSalvo) {
        try {
            entrarNoPortal(JSON.parse(clienteSalvo));
        } catch {
            sessionStorage.removeItem('clienteAtual');
        }
    }
});

/** Envia o nome informado e abre o portal com o cliente retornado pela API.
 * @param {SubmitEvent} event
 */
async function identificarCliente(event) {
    event.preventDefault();
    const nome = document.getElementById('nomeCliente').value.trim();
    const erro = document.getElementById('erroIdentificacao');
    erro.classList.add('hidden');

    try {
        const resposta = await fetch(`${API_BASE}/clientes/identificar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        });
        if (!resposta.ok) throw new Error('Não foi possível identificar o cliente.');
        entrarNoPortal(await resposta.json());
    } catch (falha) {
        erro.textContent = falha.message;
        erro.classList.remove('hidden');
    }
}

/** Persiste o cliente nesta aba e carrega sua área do portal.
 * @param {Cliente} cliente
 */
function entrarNoPortal(cliente) {
    estadoCliente.cliente = cliente;
    sessionStorage.setItem('clienteAtual', JSON.stringify(cliente));
    document.getElementById('identificacaoCliente').classList.add('hidden');
    document.getElementById('areaCliente').classList.remove('hidden');
    document.getElementById('nomeClienteAtivo').textContent = cliente.nome;
    carregarChamadosCliente();
}

/** Limpa a sessão atual e retorna ao formulário de identificação. */
function trocarCliente() {
    estadoCliente.cliente = null;
    estadoCliente.chamados = [];
    sessionStorage.removeItem('clienteAtual');
    document.getElementById('areaCliente').classList.add('hidden');
    document.getElementById('identificacaoCliente').classList.remove('hidden');
    document.getElementById('nomeCliente').focus();
}

async function carregarPrioridades() {
    try {
        const resposta = await fetch(`${API_BASE}/prioridade`);
        if (!resposta.ok) throw new Error('Erro ao carregar prioridades');
        estadoCliente.prioridades = await resposta.json();
    } catch (erro) {
        console.error('Erro ao carregar prioridades:', erro);
    }
}

async function carregarResponsaveis() {
    try {
        const resposta = await fetch(`${API_BASE}/responsavel`);
        if (!resposta.ok) throw new Error('Erro ao carregar responsaveis');
        estadoCliente.responsaveis = await resposta.json();
    } catch (erro) {
        console.error('Erro ao carregar prioridades:', erro);
    }
}

/** Busca os chamados do cliente ativo e prepara a listagem. */
async function carregarChamadosCliente() {
    const tabela = document.getElementById('tabelaChamados');
    tabela.innerHTML = '<tr><td colspan="7">Carregando seus chamados...</td></tr>';

    try {
        const resposta = await fetch(`${API_BASE}/clientes/${estadoCliente.cliente.id}/chamados`);
        if (!resposta.ok) throw new Error('Não foi possível carregar seus chamados.');
        estadoCliente.chamados = await resposta.json();
        preencherOpcoesFiltros();
        renderizarChamados();
    } catch (erro) {
        tabela.innerHTML = '<tr><td colspan="7">Não foi possível carregar seus chamados.</td></tr>';
        document.getElementById('totalChamados').textContent = 'Falha ao carregar';
        console.error(erro);
    }
}

/** Extrai um campo do chamado, inclusive os valores de relacionamentos.
 * @param {ChamadoCliente} chamado
 * @param {string} campo
 */
function obterCampo(chamado, campo) {
    if (campo === 'status') return chamado.status?.status ?? '';
    if (campo === 'prioridade') return chamado.prioridade?.prioridade ?? '';
    if (campo === 'responsavel') return chamado.responsavel?.nome ?? '';
    if (campo === 'titulo') return chamado.Titulo ?? '';
    if (campo === 'data') return chamado.data_hora_abertura ?? '';
    if (campo === 'fechamento') return chamado.data_hora_fechamento ?? '';
    return chamado[campo] ?? '';
}

/** Monta as opções dos seletores com os valores presentes na lista atual. */
function preencherOpcoesFiltros() {
    preencherSelect('filtroStatus', 'status', 'Todos');
    preencherSelect('filtroPrioridade', 'prioridade', 'Todas');
    preencherSelect('filtroResponsavel', 'responsavel', 'Todos');
}

/** Preenche um seletor sem duplicar valores e preserva o filtro selecionado.
 * @param {string} id
 * @param {string} campo
 * @param {string} padrao
 */
function preencherSelect(id, campo, padrao) {
    const select = document.getElementById(id);
    const valores = [...new Set(estadoCliente.chamados.map(chamado => obterCampo(chamado, campo)).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    select.replaceChildren(new Option(padrao, ''));
    valores.forEach(valor => select.add(new Option(valor, valor)));
    select.value = estadoCliente.filtros[campo];
}

/** Aplica pesquisa, filtros e ordenação à cópia local dos chamados. */
function obterChamadosVisiveis() {
    const termo = normalizar(estadoCliente.pesquisa);
    return estadoCliente.chamados.filter(chamado => {
        const filtrosAtendidos = Object.entries(estadoCliente.filtros).every(([campo, valor]) => (
            !valor || obterCampo(chamado, campo) === valor
        ));
        const texto = [chamado.id, chamado.Titulo, chamado.Descricao, obterCampo(chamado, 'status'),
            obterCampo(chamado, 'prioridade'), obterCampo(chamado, 'responsavel'), obterCampo(chamado, 'data'),
            obterCampo(chamado, 'fechamento')].join(' ');
        return filtrosAtendidos && (!termo || normalizar(texto).includes(termo));
    }).sort((a, b) => {
        const campo = estadoCliente.ordenacao.campo;
        const valorA = obterCampo(a, campo);
        const valorB = obterCampo(b, campo);
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

/** Remove acentos e diferenças de caixa para a pesquisa textual.
 * @param {unknown} valor
 * @returns {string}
 */
function normalizar(valor) {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

/** Renderiza a tabela e atualiza contagem, filtros e indicadores de ordenação. */
function renderizarChamados() {
    const chamados = obterChamadosVisiveis();
    const tabela = document.getElementById('tabelaChamados');
    tabela.replaceChildren();

    if (!chamados.length) {
        const linha = document.createElement('tr');
        const celula = document.createElement('td');
        celula.colSpan = 7;
        celula.textContent = estadoCliente.chamados.length
            ? 'Nenhum chamado corresponde aos filtros.'
            : 'Você ainda não tem chamados.';
        linha.appendChild(celula);
        tabela.appendChild(linha);
    }

    chamados.forEach(chamado => {
        const linha = document.createElement('tr');
        linha.dataset.chamadoId = chamado.id;
        linha.tabIndex = 0;
        linha.setAttribute('aria-label', `Abrir chamado ${chamado.id}: ${chamado.Titulo}`);
        [chamado.id, chamado.Titulo, obterCampo(chamado, 'status') || '-',
            obterCampo(chamado, 'prioridade') || '-', obterCampo(chamado, 'responsavel') || '-',
            formatarData(obterCampo(chamado, 'data')),
            formatarData(obterCampo(chamado, 'fechamento'))].forEach(valor => {
            const celula = document.createElement('td');
            celula.textContent = valor;
            linha.appendChild(celula);
        });
        tabela.appendChild(linha);
    });

    document.getElementById('totalChamados').textContent = `${chamados.length} de ${estadoCliente.chamados.length} chamados`;
    renderizarFiltrosRapidos();
    renderizarFiltrosAtivos();
    atualizarIndicadoresOrdenacao();
}

/** Cria balões de acesso rápido para os status e prioridades já presentes.
 * Os dois grupos podem ser combinados entre si e com os filtros avançados.
 */
function renderizarFiltrosRapidos() {
    const container = document.getElementById('filtrosRapidos');
    container.replaceChildren();
    [
        { campo: 'status', rotulo: 'Status' },
        { campo: 'prioridade', rotulo: 'Prioridade' }
    ].forEach(({ campo, rotulo }) => {
        const valores = [...new Set(estadoCliente.chamados
            .map(chamado => obterCampo(chamado, campo))
            .filter(Boolean))]
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
            balao.setAttribute('aria-pressed', String(estadoCliente.filtros[campo] === valor));
            balao.addEventListener('click', () => {
                estadoCliente.filtros[campo] = estadoCliente.filtros[campo] === valor ? '' : valor;
                const selectId = campo === 'status' ? 'filtroStatus' : 'filtroPrioridade';
                document.getElementById(selectId).value = estadoCliente.filtros[campo];
                renderizarChamados();
            });
            grupo.appendChild(balao);
        });
        container.appendChild(grupo);
    });
}

/** Formata a data da API para exibição no padrão local.
 * @param {string | null | undefined} valor
 * @returns {string}
 */
function formatarData(valor) {
    if (!valor) return '-';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
}

/** Exibe filtros aplicados como botões que permitem removê-los individualmente. */
function renderizarFiltrosAtivos() {
    const container = document.getElementById('filtrosAtivos');
    container.replaceChildren();
    const rotulos = { status: 'Status', prioridade: 'Prioridade', responsavel: 'Responsável' };
    Object.entries(estadoCliente.filtros).forEach(([campo, valor]) => {
        if (!valor) return;
        const etiqueta = document.createElement('button');
        etiqueta.type = 'button';
        etiqueta.className = 'filter-chip';
        etiqueta.textContent = `${rotulos[campo]}: ${valor} ×`;
        etiqueta.setAttribute('aria-label', `Remover filtro ${rotulos[campo]}: ${valor}`);
        etiqueta.addEventListener('click', () => {
            estadoCliente.filtros[campo] = '';
            document.getElementById(`filtro${campo[0].toUpperCase()}${campo.slice(1)}`).value = '';
            renderizarChamados();
        });
        container.appendChild(etiqueta);
    });

    if (estadoCliente.pesquisa) {
        const busca = document.createElement('button');
        busca.type = 'button';
        busca.className = 'filter-chip';
        busca.textContent = `Busca: ${estadoCliente.pesquisa} ×`;
        busca.setAttribute('aria-label', `Limpar busca: ${estadoCliente.pesquisa}`);
        busca.addEventListener('click', () => {
            estadoCliente.pesquisa = '';
            document.getElementById('pesquisaChamados').value = '';
            renderizarChamados();
        });
        container.appendChild(busca);
    }
}

function abrirModalFiltros() {
    document.getElementById('modalFiltros').classList.remove('hidden');
    document.getElementById('filtroStatus').focus();
}

function fecharModalFiltros() {
    document.getElementById('modalFiltros').classList.add('hidden');
}

/** Lê os campos do modal e aplica os filtros selecionados.
 * @param {SubmitEvent} event
 */
function aplicarFiltros(event) {
    event.preventDefault();
    estadoCliente.filtros = {
        status: document.getElementById('filtroStatus').value,
        prioridade: document.getElementById('filtroPrioridade').value,
        responsavel: document.getElementById('filtroResponsavel').value
    };
    fecharModalFiltros();
    renderizarChamados();
}

/** Seleciona a coluna a ordenar; a direção permanece crescente.
 * @param {string} campo
 */
function ordenarPor(campo) {
    estadoCliente.ordenacao = { campo };
    renderizarChamados();
}

/** Sincroniza ícones e atributos ARIA com a ordenação selecionada. */
function atualizarIndicadoresOrdenacao() {
    document.querySelectorAll('[data-sort]').forEach(botao => {
        const ativo = botao.dataset.sort === estadoCliente.ordenacao.campo;
        botao.closest('th').setAttribute('aria-sort', ativo ? 'ascending' : 'none');
        botao.querySelector('span').textContent = ativo ? '↑' : '↕';
    });
}

/** Abre o formulário para criar um chamado ou consultar/editar um existente.
 * @param {number | null} [chamadoId]
 */
function abrirModalChamado(chamadoId = null) {
    const chamado = chamadoId === null
        ? null
        : estadoCliente.chamados.find(item => item.id === chamadoId);
    if (chamadoId !== null && !chamado) return;

    estadoCliente.chamadoModal = chamado;
    const editavel = !chamado || chamado.status?.status?.toLowerCase() === 'aberto';
    document.getElementById('tituloModalChamado').textContent = chamado
        ? `Chamado #${chamado.id}`
        : 'Novo chamado';
    document.getElementById('chamadoCliente').value = estadoCliente.cliente.nome;
    document.getElementById('chamadoTitulo').value = chamado?.Titulo ?? '';
    document.getElementById('chamadoDescricao').value = chamado?.Descricao ?? '';
    document.getElementById('chamadoStatus').textContent = chamado?.status?.status ?? 'Aberto';
    document.getElementById('chamadoAbertura').textContent = chamado
        ? formatarData(chamado.data_hora_abertura)
        : 'Após o envio';
    document.getElementById('chamadoFechamento').textContent = chamado?.data_hora_fechamento
        ? formatarData(chamado.data_hora_fechamento)
        : 'Ainda não encerrado';
    document.getElementById('detalhesChamado').classList.toggle('hidden', !chamado);
    document.getElementById('avisoSomenteLeitura').classList.toggle('hidden', editavel);
    document.getElementById('chamadoTitulo').readOnly = !editavel;
    document.getElementById('chamadoDescricao').readOnly = !editavel;
    document.getElementById('chamadoPrioridade').disabled = !editavel;
    document.getElementById('salvarChamado').classList.toggle('hidden', !editavel);
    preencherPrioridades(chamado?.id_prioridade ?? '');
    preencherResponsaveis(chamado?.id_responsavel ?? '');
    document.getElementById('modalChamado').classList.remove('hidden');
    if (editavel) document.getElementById('chamadoTitulo').focus();
}

function preencherPrioridades(selecionada) {
    const select = document.getElementById('chamadoPrioridade');
    select.replaceChildren(new Option('Selecione uma prioridade...', ''));
    estadoCliente.prioridades.forEach(prioridade => {
        select.add(new Option(prioridade.prioridade, prioridade.id));
    });
    select.value = selecionada ? String(selecionada) : '';
}

/** Preenche o seletor de responsáveis e restaura a opção do chamado.
 * @param {number | string} selecionada
 */
function preencherResponsaveis(selecionada) {
    const select = document.getElementById('chamadoResponsavel');
    select.replaceChildren(new Option('Selecione um responsável...', ''));
    estadoCliente.responsaveis.forEach(responsavel => {
        select.add(new Option(responsavel.nome, responsavel.id));
    });
    select.value = selecionada ? String(selecionada) : '';
}

document.getElementById('indicarAuto').addEventListener('change', function () {
    if (this.checked) {
        document.getElementById('chamadoResponsavel').disabled = true;
    } else {
        document.getElementById('chamadoResponsavel').disabled = false;
    }
})

/** Fecha o modal de chamado e limpa o formulário e a seleção atual. */
function fecharModalChamado() {
    document.getElementById('modalChamado').classList.add('hidden');
    document.getElementById('formChamado').reset();
    estadoCliente.chamadoModal = null;
}

/** Monta os dados do formulário e envia a criação ou alteração à API.
 * @param {SubmitEvent} event
 */
async function salvarChamado(event) {
    event.preventDefault();
    
    const idPrioridade = document.getElementById('chamadoPrioridade').value;
    const idResponsavel = document.getElementById('chamadoResponsavel').value;
    const atribuirAuto = document.getElementById('indicarAuto')?.checked ?? false;

    const dados = {
        Titulo: document.getElementById('chamadoTitulo').value.trim(),
        Descricao: document.getElementById('chamadoDescricao').value.trim(),
        id_prioridade: idPrioridade ? Number(idPrioridade) : null,
        id_responsavel: (atribuirAuto || !idResponsavel) ? null : Number(idResponsavel),
        atribuir_auto: atribuirAuto
    };

    const edicao = Boolean(estadoCliente.chamadoModal);
    const url = edicao
        ? `${API_BASE}/clientes/${estadoCliente.cliente.id}/chamados/${estadoCliente.chamadoModal.id}`
        : `${API_BASE}/cadastrar`;

    if (edicao) {
        await enviarChamado(url, 'PATCH', dados);
    } else {
        await enviarChamado(url, 'POST', {
            ...dados,
            id_cliente: estadoCliente.cliente.id
        });
    }
}

/** Executa a requisição de persistência do chamado e trata erros HTTP.
 * @param {string} url
 * @param {string} metodo
 * @param {object} dados
 */
async function enviarChamado(url, metodo, dados) {
    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!resposta.ok) {
            const corpo = await resposta.json();
            throw new Error(corpo.detail || 'Não foi possível salvar o chamado.');
        }
        fecharModalChamado();
        await carregarChamadosCliente();
    } catch (erro) {
        alert(erro.message);
    }
}
