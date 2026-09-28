/**
 * Script legado de listagem geral, mantido para referência.
 * As páginas HTML atuais usam `portal-cliente.js` e `responsavel.js`.
 */
const API_BASE = '/api';

const estado = {
    chamados: [],
    filtros: { status: '', prioridade: '', responsavel: '' },
    pesquisa: '',
    ordenacao: { campo: 'id', direcao: 'asc' }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pesquisaChamados').addEventListener('input', event => {
        estado.pesquisa = event.target.value.trim();
        renderizarChamados();
    });

    document.getElementById('abrirFiltros').addEventListener('click', abrirModalFiltros);
    document.getElementById('cancelarFiltros').addEventListener('click', fecharModalFiltros);
    document.getElementById('formFiltros').addEventListener('submit', aplicarFiltros);
    document.querySelectorAll('[data-sort]').forEach(botao => {
        botao.addEventListener('click', () => ordenarPor(botao.dataset.sort));
    });

    const modal = document.getElementById('modalFiltros');
    modal.addEventListener('click', event => {
        if (event.target === modal) fecharModalFiltros();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') fecharModalFiltros();
    });

    carregarChamados();
});

async function carregarChamados() {
    const tabela = document.getElementById('tabelaTodosChamados');

    try {
        const resposta = await fetch(`${API_BASE}/listar`);
        if (!resposta.ok) throw new Error('Erro ao buscar chamados');

        const dados = await resposta.json();
        estado.chamados = Array.isArray(dados) ? dados : [];
        preencherOpcoesFiltros();
        renderizarChamados();
    } catch (erro) {
        console.error('Erro ao carregar chamados:', erro);
        tabela.innerHTML = '<tr><td colspan="6">Não foi possível carregar os chamados.</td></tr>';
        document.getElementById('totalChamados').textContent = 'Falha ao carregar';
    }
}

function preencherOpcoesFiltros() {
    preencherSelect('filtroStatus', 'status', 'Todos');
    preencherSelect('filtroPrioridade', 'prioridade', 'Todas');
    preencherSelect('filtroResponsavel', 'responsavel', 'Todos');
}

function preencherSelect(id, campo, textoPadrao) {
    const select = document.getElementById(id);
    const valores = [...new Set(estado.chamados.map(chamado => obterCampo(chamado, campo)).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    select.replaceChildren(new Option(textoPadrao, ''));
    valores.forEach(valor => select.add(new Option(valor, valor)));
}

function obterCampo(chamado, campo) {
    if (campo === 'status') return chamado.status?.status ?? '';
    if (campo === 'prioridade') return chamado.prioridade?.prioridade ?? '';
    if (campo === 'responsavel') return chamado.responsavel?.nome ?? '';
    if (campo === 'titulo') return chamado.Titulo ?? '';
    if (campo === 'data') return chamado.data_hora_abertura ?? '';
    return chamado[campo] ?? '';
}

function obterChamadosVisiveis() {
    const termo = normalizar(estado.pesquisa);
    const chamados = estado.chamados.filter(chamado => {
        const atendeFiltros = Object.entries(estado.filtros).every(([campo, valor]) => (
            !valor || obterCampo(chamado, campo) === valor
        ));
        const textoChamado = [
            chamado.id,
            chamado.Titulo,
            chamado.Descricao,
            obterCampo(chamado, 'status'),
            obterCampo(chamado, 'prioridade'),
            obterCampo(chamado, 'responsavel'),
            obterCampo(chamado, 'data')
        ].join(' ');

        return atendeFiltros && (!termo || normalizar(textoChamado).includes(termo));
    });

    return chamados.sort((a, b) => {
        const valorA = obterCampo(a, estado.ordenacao.campo);
        const valorB = obterCampo(b, estado.ordenacao.campo);
        const comparacao = estado.ordenacao.campo === 'id'
            ? Number(valorA) - Number(valorB)
            : String(valorA).localeCompare(String(valorB), 'pt-BR', { numeric: true });

        return estado.ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
}

function normalizar(valor) {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function renderizarChamados() {
    const chamados = obterChamadosVisiveis();
    const tabela = document.getElementById('tabelaTodosChamados');
    tabela.replaceChildren();

    if (chamados.length === 0) {
        const linha = document.createElement('tr');
        const celula = document.createElement('td');
        celula.colSpan = 6;
        celula.textContent = estado.chamados.length ? 'Nenhum chamado corresponde aos filtros.' : 'Nenhum chamado encontrado.';
        linha.appendChild(celula);
        tabela.appendChild(linha);
    } else {
        chamados.forEach(chamado => {
            const linha = document.createElement('tr');
            [
                chamado.id ?? '-',
                chamado.Titulo ?? '-',
                obterCampo(chamado, 'status') || '-',
                obterCampo(chamado, 'prioridade') || '-',
                obterCampo(chamado, 'responsavel') || '-',
                formatarData(obterCampo(chamado, 'data'))
            ].forEach(valor => {
                const celula = document.createElement('td');
                celula.textContent = valor;
                linha.appendChild(celula);
            });
            tabela.appendChild(linha);
        });
    }

    document.getElementById('totalChamados').textContent = `${chamados.length} de ${estado.chamados.length} chamados`;
    renderizarFiltrosAtivos();
    atualizarIndicadoresOrdenacao();
}

function formatarData(valor) {
    if (!valor) return '-';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
}

function renderizarFiltrosAtivos() {
    const container = document.getElementById('filtrosAtivos');
    container.replaceChildren();

    Object.entries(estado.filtros).forEach(([campo, valor]) => {
        if (!valor) return;
        const etiqueta = document.createElement('button');
        etiqueta.type = 'button';
        etiqueta.className = 'filter-chip';
        etiqueta.setAttribute('aria-label', `Remover filtro ${campo}: ${valor}`);
        etiqueta.textContent = `${campo}: ${valor}  x`;
        etiqueta.addEventListener('click', () => {
            estado.filtros[campo] = '';
            document.getElementById(`filtro${campo[0].toUpperCase()}${campo.slice(1)}`).value = '';
            renderizarChamados();
        });
        container.appendChild(etiqueta);
    });
}

function aplicarFiltros(event) {
    event.preventDefault();
    estado.filtros = {
        status: document.getElementById('filtroStatus').value,
        prioridade: document.getElementById('filtroPrioridade').value,
        responsavel: document.getElementById('filtroResponsavel').value
    };
    fecharModalFiltros();
    renderizarChamados();
}

function ordenarPor(campo) {
    if (estado.ordenacao.campo === campo) {
        estado.ordenacao.direcao = estado.ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    } else {
        estado.ordenacao = { campo, direcao: 'asc' };
    }
    renderizarChamados();
}

function atualizarIndicadoresOrdenacao() {
    document.querySelectorAll('[data-sort]').forEach(botao => {
        const th = botao.closest('th');
        const ativo = botao.dataset.sort === estado.ordenacao.campo;
        th.setAttribute('aria-sort', ativo ? (estado.ordenacao.direcao === 'asc' ? 'ascending' : 'descending') : 'none');
        botao.querySelector('span').textContent = ativo ? (estado.ordenacao.direcao === 'asc' ? '↑' : '↓') : '↕';
    });
}

function abrirModalFiltros() {
    const modal = document.getElementById('modalFiltros');
    modal.classList.remove('hidden');
    document.getElementById('filtroStatus').focus();
}

function fecharModalFiltros() {
    document.getElementById('modalFiltros').classList.add('hidden');
}
