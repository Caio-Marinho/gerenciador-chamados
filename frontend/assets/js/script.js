/**
 * Script legado de cadastro/listagem geral, não carregado pelas páginas atuais.
 * O fluxo atual do cliente está implementado em `portal-cliente.js`.
 */
const API_BASE = '/api';

let listaResponsaveis = [];
let listaPrioridades = [];

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    carregarChamados();
    carregarResponsaveis();
    carregarPrioridades();
});

// ============================================================
// CHAMADOS
// ============================================================

async function carregarChamados() {


    try {

        const resposta = await fetch(`${API_BASE}/listar`);

        if (!resposta.ok) {
            throw new Error('Erro ao buscar chamados');
        }

        const dados = await resposta.json();

        console.log("Chamados retornados pela API:", dados);

        renderizarTabela(dados);

    } catch (erro) {

        console.error("Erro ao carregar chamados:", erro);

        const tabela = document.getElementById('tabelaChamados');

        tabela.innerHTML = `
        <tr>
            <td colspan="5">
                Não foi possível carregar os chamados.
            </td>
        </tr>
    `;
    }


}

// ============================================================
// RENDERIZA TABELA A PARTIR DO RETORNO DA API
// ============================================================

function renderizarTabela(chamados) {

    const tabela = document.getElementById('tabelaChamados');

    if (!Array.isArray(chamados) || chamados.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5">
                    Nenhum chamado encontrado.
                </td>
            </tr>
        `;

        return;
    }

    tabela.innerHTML = '';

    chamados.forEach(chamado => {
        const linha = document.createElement('tr');
        const valores = [
            chamado.id ?? '-',
            chamado.Titulo ?? '-',
            chamado.Descricao ?? '-',
            obterNomePrioridade(chamado),
            obterNomeResponsavel(chamado)
        ];

        valores.forEach(valor => {
            const celula = document.createElement('td');
            celula.textContent = valor;
            linha.appendChild(celula);
        });

        tabela.appendChild(linha);
    });
}

// ============================================================
// RESPONSÁVEIS
// ============================================================

async function carregarResponsaveis() {


    try {

        const resposta = await fetch(`${API_BASE}/responsavel`);

        if (!resposta.ok) {
            throw new Error('Erro ao buscar responsáveis');
        }

        listaResponsaveis = await resposta.json();

        console.log(
            "Responsáveis retornados pela API:",
            listaResponsaveis
        );

        popularSelectResponsaveis();

    } catch (erro) {

        console.error(
            "Não foi possível carregar os responsáveis:",
            erro
        );

        listaResponsaveis = [];

        popularSelectResponsaveis();
    }


}

function popularSelectResponsaveis() {


    const select = document.getElementById('responsavel');

    select.innerHTML = '';

    const opcaoPadrao = document.createElement('option');

    opcaoPadrao.value = '';

    opcaoPadrao.textContent =
        'Selecione um responsável...';

    select.appendChild(opcaoPadrao);


    listaResponsaveis.forEach(responsavel => {

        const option = document.createElement('option');

        option.value = responsavel.id;

        option.textContent =
            responsavel.nome;

        select.appendChild(option);
    });


}

// ============================================================
// PRIORIDADES
// ============================================================

async function carregarPrioridades() {


    try {

        const resposta = await fetch(`${API_BASE}/prioridade`);

        if (!resposta.ok) {
            throw new Error('Erro ao buscar prioridades');
        }

        listaPrioridades = await resposta.json();

        console.log(
            "Prioridades retornadas pela API:",
            listaPrioridades
        );

        popularSelectPrioridades();

    } catch (erro) {

        console.error(
            "Não foi possível carregar as prioridades:",
            erro
        );

        listaPrioridades = [];

        popularSelectPrioridades();
    }


}

function popularSelectPrioridades() {


    const select = document.getElementById('prioridade');

    select.innerHTML = '';

    const opcaoPadrao = document.createElement('option');

    opcaoPadrao.value = '';

    opcaoPadrao.textContent =
        'Selecione uma prioridade...';

    opcaoPadrao.selected = true;

    select.appendChild(opcaoPadrao);


    listaPrioridades.forEach(prioridade => {

        const option = document.createElement('option');

        option.value = prioridade.id;

        option.textContent =
            prioridade.prioridade;

        select.appendChild(option);
    });


}

// ============================================================
// AUXILIARES PARA EXIBIR RESPONSÁVEL
// ============================================================

function obterNomeResponsavel(chamado) {


    /*
     * Se a API já retornar o nome:
     *
     * {
     *     id_responsavel: 1,
     *     responsavel: "João"
     * }
     *
     * usamos diretamente.
     */


    /*
     * Caso a API retorne apenas o ID:
     *
     * {
     *     id_responsavel: 1
     * }
     *
     * procuramos na lista carregada de responsáveis.
     */
    


    return chamado.responsavel?.nome ?? '-';


}

// ============================================================
// AUXILIARES PARA EXIBIR PRIORIDADE
// ============================================================

function obterNomePrioridade(chamado) {


    /*
     * Caso a API já retorne:
     *
     * prioridade: "Alta"
     *
     */


    /*
     * Caso retorne somente:
     *
     * id_prioridade: 2
     *
     */


    return chamado.prioridade?.prioridade ?? '-';


}

// ============================================================
// MODAL
// ============================================================

function abrirModal() {


    document
        .getElementById('modalChamado')
        .classList
        .remove('hidden');


}

function fecharModal() {


    document
        .getElementById('modalChamado')
        .classList
        .add('hidden');

    document
        .getElementById('formChamado')
        .reset();

    document
        .getElementById('responsavel')
        .disabled = false;


}

// ============================================================
// ATRIBUIÇÃO AUTOMÁTICA
// ============================================================

function toggleResponsavel() {


    const checkbox =
        document.getElementById('atribuirAutomatico');

    const selectResponsavel =
        document.getElementById('responsavel');


    if (checkbox.checked) {

        selectResponsavel.value = '';

        selectResponsavel.disabled = true;

    } else {

        selectResponsavel.disabled = false;
    }


}

// ============================================================
// CADASTRO
// ============================================================

async function salvarChamado(event) {


    event.preventDefault();


    const titulo =
        document.getElementById('titulo').value.trim();

    const descricao =
        document.getElementById('descricao').value.trim();

    const prioridade =
        document.getElementById('prioridade').value;

    const selectResponsavel =
        document.getElementById('responsavel');

    const atribuirAuto =
        document
            .getElementById('atribuirAutomatico')
            .checked;


    /*
     * Payload enviado para o backend.
     */

    const dadosChamado = {

        Titulo: titulo,

        Descricao: descricao,

        id_prioridade:
            prioridade
                ? Number(prioridade)
                : null,

        id_responsavel:
            atribuirAuto
                ? null
                : (
                    selectResponsavel.value
                        ? Number(selectResponsavel.value)
                        : null
                ),

        atribuir_auto: atribuirAuto
    };


    console.log(
        "Payload enviado:",
        dadosChamado
    );


    try {

        const resposta = await fetch(`${API_BASE}/cadastrar`, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(dadosChamado)
        });


        if (!resposta.ok) {

            const erro =
                await resposta.text();

            throw new Error(
                erro ||
                'Erro ao cadastrar chamado'
            );
        }


        /*
         * IMPORTANTE:
         *
         * Pegamos o retorno REAL da API.
         */

        const chamadoCriado =
            await resposta.json();


        console.log(
            "Chamado criado pela API:",
            chamadoCriado
        );


        /*
         * Em vez de montar manualmente o chamado,
         * recarregamos a tabela através da API.
         *
         * Isso garante que o ID e os demais dados
         * venham do backend.
         */

        renderizarTabela(chamadoCriado);


        fecharModal();


    } catch (erro) {

        console.error(
            "Erro ao cadastrar chamado:",
            erro
        );

        alert(
            "Erro ao cadastrar chamado. " +
            "Verifique o console."
        );
    }


}
