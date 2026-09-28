# Central de chamados

Aplicação web para abertura e acompanhamento de chamados por clientes e gerenciamento da fila de atendimento por responsáveis. O sistema oferece atribuição manual ou automática, atualização de status e prioridade, pesquisa e filtros.

> ⚠️ **ATENÇÃO: VERIFIQUE AS PORTAS ANTES DE INICIAR O PROJETO!**
>
> As portas **80** (Nginx/frontend), **5000** (API) e a porta definida em `DB_PORT` precisam estar livres no computador. Se outra aplicação ou container estiver usando uma delas, o Docker pode falhar ao iniciar. Encerre o processo que está ocupando a porta ou ajuste o mapeamento no `docker-compose.yml` e, para o banco, o valor de `DB_PORT` no `.env`.
>
> **O MySQL dentro do container usa a porta padrão `3306`.** O mapeamento `${DB_PORT}:3306` conecta a porta `DB_PORT` do computador à porta `3306` do container. Assim, `DB_PORT=3306` exige que a porta 3306 do computador esteja livre. Se ela já estiver em uso (por exemplo, por um MySQL local), defina uma porta externa livre, como `DB_PORT=3307`; a porta interna permanece `3306`.

## Funcionalidades

- Identificação do cliente pelo nome e consulta dos chamados associados.
- Abertura de chamados com título, descrição e prioridade.
- Atribuição automática ao responsável com menos chamados ativos (abertos, pendentes ou em andamento).
- Edição dos dados de um chamado pelo cliente enquanto ele estiver aberto.
- Consulta da fila por responsável e atualização de status, prioridade e responsável.
- Registro e retorno de `data_hora_fechamento` quando o status passa para “Resolvido” ou “Fechado”; enquanto o chamado estiver em andamento, o campo retorna `null`.

> A identificação de cliente e responsável é feita por seleção/nome, sem autenticação ou controle de acesso. Não use o sistema para dados sensíveis sem implementar autenticação e autorização.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript, servido por `http-server`.
- **Backend:** Python, FastAPI, SQLAlchemy e PyMySQL.
- **Banco de dados:** MySQL 8.
- **Infraestrutura:** Docker Compose e Nginx como proxy reverso.

## Justificativa das tecnologias

As tecnologias foram escolhidas para manter o desenvolvimento direto e facilitar a execução do projeto:

- **Python e FastAPI:** Python ajuda a escrever a lógica do backend de forma simples. O FastAPI agiliza a criação das rotas da API e gera documentação interativa automaticamente.
- **Pydantic:** valida os dados recebidos pela API e define o formato das respostas, ajudando a detectar entradas inválidas antes de processá-las.
- **MySQL:** armazena os dados de forma estruturada e persistente, com tabelas relacionadas para clientes, chamados, status, prioridades e responsáveis.
- **HTML, CSS e JavaScript:** atendem às necessidades da interface sem exigir a configuração e a curva de aprendizado de um framework frontend. Isso permite construir e ajustar as páginas com rapidez.
- **Docker Compose:** inicia o banco, a API, o frontend e o proxy como serviços coordenados. Assim, outras pessoas podem executar o mesmo ambiente com Docker, sem instalar e configurar cada componente manualmente.
- **Nginx:** oferece um único ponto de entrada para a aplicação e encaminha as requisições para o frontend ou para a API.

## Instalação e execução

Baixe o Docker Desktop pelo [site oficial do Docker](https://www.docker.com/get-started/) ou siga o guia do Docker Engine para Linux. Depois de instalar, mantenha o Docker em execução enquanto usa o projeto.

### Linux

1. Abra o guia oficial de instalação do [Docker Engine para Linux](https://docs.docker.com/engine/install/) e selecione sua distribuição (por exemplo, Ubuntu, Debian ou Fedora). Instale também o plugin Compose indicado no guia.
2. O comando usado neste projeto é `docker compose` (com espaço). Inicie o serviço Docker, se ele não tiver iniciado automaticamente, e confirme a instalação:

   ```bash
   sudo systemctl start docker
   sudo docker run hello-world
   docker compose version
   ```

3. Para usar Docker sem digitar `sudo` em cada comando, adicione sua conta ao grupo `docker`:

   ```bash
   getent group docker || sudo groupadd docker
   sudo usermod -aG docker "$(whoami)"
   ```

   Saia da sessão e entre novamente (ou reinicie o computador). Depois, valide sem `sudo`:

   ```bash
   docker run hello-world
   docker compose version
   ```

   **Atenção:** pertencer ao grupo `docker` concede privilégios equivalentes aos de administrador/root na máquina. Consulte o [guia pós-instalação](https://docs.docker.com/engine/install/linux-postinstall/) antes de habilitar essa opção.

### macOS

1. No [site oficial](https://www.docker.com/get-started/), baixe o Docker Desktop para Mac e escolha a versão correspondente ao processador: **Apple silicon** ou **Intel**. Também estão disponíveis as [instruções detalhadas](https://docs.docker.com/desktop/setup/install/mac-install/).
2. Abra o arquivo `.dmg`, arraste Docker para **Applications** e inicie o Docker Desktop.
3. Aceite os termos e aguarde o Docker indicar que está em execução.
4. No Terminal, confirme a instalação:

   ```bash
   docker --version
   docker compose version
   ```

   Com o Docker Desktop em execução, use esses comandos diretamente no Terminal, sem `sudo`.

### Windows: PowerShell ou WSL 2

1. No [site oficial do Docker](https://www.docker.com/get-started/), baixe e instale o Docker Desktop para Windows. Consulte também os [requisitos e instruções detalhadas](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Durante a instalação, selecione **WSL 2** como backend, se solicitado. Se ainda não tiver WSL 2, abra o PowerShell como administrador, execute `wsl --install` e reinicie o computador.
3. Abra o Docker Desktop e aguarde a inicialização. Em **Settings > General**, confirme que **Use the WSL 2 based engine** está habilitado.
4. Se for usar o terminal WSL, em **Settings > Resources > WSL Integration**, habilite a distribuição Linux desejada. Assim, os comandos Docker dessa distribuição usam o Docker Desktop do Windows. **Não instale outro Docker Engine dentro da distribuição WSL** para essa configuração.
5. Use Docker diretamente no **PowerShell** ou abra o terminal da distribuição **WSL 2** integrada. Confirme a instalação no terminal que pretende usar:

   ```powershell
   docker --version
   docker compose version
   ```

   No PowerShell e na integração WSL com Docker Desktop, os comandos não precisam de `sudo`. Se você optar por instalar e executar o Docker Engine diretamente dentro do WSL, siga os passos Linux acima para configurar o grupo `docker`; essa alternativa é separada da integração com Docker Desktop.

### Configurar e iniciar o projeto

Com o Docker em execução, abra um terminal na pasta raiz do projeto, onde está `docker-compose.yml`. Crie um arquivo chamado `.env` nessa pasta:

```env
DB_USER=chamados
DB_PASSWORD=troque_esta_senha
DB_NAME=central_chamados
DB_PORT=3306

MYSQL_DATABASE=central_chamados
MYSQL_USER=chamados
MYSQL_PASSWORD=troque_esta_senha
MYSQL_ROOT_PASSWORD=troque_a_senha_root
```

Mantenha `DB_USER`, `DB_PASSWORD` e `DB_NAME` iguais a `MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_DATABASE`, respectivamente. `DB_PORT` é a porta do MySQL exposta no host.

Inicie a aplicação:

```bash
docker compose up --build
```

Quando os serviços estiverem prontos, acesse **http://localhost**. Para executar em segundo plano, use `docker compose up --build -d`. Para acompanhar os logs, use `docker compose logs -f`. O comando `docker compose down` para e remove os containers e a rede do projeto, mas preserva o volume `mysql_data` com os dados do MySQL.

O MySQL inicializa as tabelas e os dados de exemplo definidos em `database/init.sql` na primeira inicialização do volume. O backend também cria/atualiza a estrutura de clientes ao iniciar. Se alterar as variáveis de inicialização do banco depois que o volume já foi criado, elas não reaplicam os dados iniciais automaticamente.

## Parar e remover containers

- Apenas parar os serviços, mantendo containers e dados para iniciar novamente depois:

  ```bash
  docker compose stop
  ```

- Parar e remover os containers e a rede do projeto. O volume `mysql_data` é mantido, então os dados continuam disponíveis na próxima execução:

  ```bash
  docker compose down
  ```

- Remover também o volume do MySQL e apagar permanentemente os dados persistidos:

  ```bash
  docker compose down --volumes
  ```

Use a última opção somente se quiser reiniciar o banco do zero. `docker system prune --all --volumes` remove recursos não utilizados de **outros projetos Docker também**, por isso não é necessário para limpar apenas este projeto.

## Páginas do frontend

- **`/` — início (`frontend/index.html`):** apresenta as duas áreas e direciona para o portal do cliente ou para a fila de atendimento.
- **`/chamados` — portal do cliente (`frontend/chamados.html`):** identifica o cliente pelo nome, lista apenas os chamados associados a ele e permite abrir chamados. A página oferece busca por ID, título, descrição, status, prioridade, responsável e datas de abertura e fechamento; filtros avançados por status, prioridade e responsável; balões rápidos de status e prioridade; balões removíveis para busca e filtros ativos; e ordenação crescente das colunas. O cliente pode editar título, descrição e prioridade enquanto o chamado estiver aberto. O detalhe apresenta as datas de abertura e fechamento.
- **`/responsavel` — fila de atendimento (`frontend/responsavel.html`):** permite selecionar o responsável e consultar os chamados atribuídos a ele. Oferece busca por ID, cliente, título, descrição, status, prioridade, responsável e datas de abertura e fechamento; filtros avançados por status, prioridade e cliente; balões rápidos de status e prioridade; balões removíveis para busca e filtros; e ordenação crescente de todas as colunas. A tabela e o detalhe mostram as datas de abertura e fechamento. Ao abrir um chamado, o responsável pode atualizar status, prioridade e responsável.

### Sessão do cliente no navegador

Depois que o cliente se identifica, o portal guarda os dados retornados pela API na chave `clienteAtual` do `sessionStorage`. Isso permite restaurar a identificação ao recarregar a página na mesma aba. Ao usar **Trocar cliente**, essa informação é removida; ela também é descartada quando a sessão da aba termina. O `sessionStorage` é armazenamento local do navegador, não autentica o cliente nem protege os dados dos chamados.

Todas as rotas que retornam chamados incluem `data_hora_abertura` e `data_hora_fechamento`. A data de abertura é gerada uma vez por chamado. A data de fechamento é registrada quando o status muda para “Resolvido” ou “Fechado”, permanece estável em edições posteriores enquanto finalizado e é limpa se o chamado voltar a um status não finalizado. Ambas usam o horário local de São Paulo; chamados ainda não finalizados retornam `data_hora_fechamento: null`. A migração de inicialização adiciona essa coluna a bancos existentes quando necessário. Chamados já encerrados antes da migração não têm como recuperar o instante real do encerramento e permanecem com esse campo nulo até serem encerrados novamente ou corrigidos manualmente.

As duas páginas de chamados carregam seus scripts próprios: `portal-cliente.js` e `responsavel.js`, respectivamente. O Nginx encaminha `/chamados` e `/responsavel` aos arquivos HTML correspondentes.

## API

- `/api/...` — API FastAPI encaminhada pelo Nginx.
- `http://localhost:5000/docs` — documentação interativa da API (backend).

Principais rotas da API:

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/clientes/identificar` | Localiza ou cadastra cliente pelo nome |
| `POST` | `/cadastrar` | Abre um chamado |
| `GET` | `/listar` | Lista todos os chamados |
| `GET` | `/clientes/{cliente_id}/chamados` | Lista chamados de um cliente |
| `PATCH` | `/clientes/{cliente_id}/chamados/{chamado_id}` | Edita chamado ainda aberto |
| `GET` | `/responsavel` | Lista responsáveis |
| `GET` | `/responsavel/{responsavel_id}/chamados` | Lista chamados atribuídos |
| `PATCH` | `/responsavel/chamados/{chamado_id}` | Atualiza status, prioridade e responsável |
| `GET` | `/prioridade` | Lista prioridades |
| `GET` | `/status` | Lista status |

Ao acessar por meio do Nginx, acrescente o prefixo `/api` às rotas acima (por exemplo, `/api/status`).

## Estrutura do projeto

```text
.
├── .gitignore                        # Regras gerais de arquivos locais
├── .env.example                      # Modelo de configuração local
├── backend/                         # API FastAPI
│   ├── app/
│   │   ├── models/                  # Modelos SQLAlchemy e migração
│   │   │   ├── chamado.py
│   │   │   ├── cliente.py
│   │   │   ├── databaseConections.py
│   │   │   ├── migrate.py
│   │   │   ├── prioridade.py
│   │   │   ├── responsavel.py
│   │   │   └── status.py
│   │   ├── router/
│   │   │   └── chamado.py           # Rotas de clientes, chamados e atendimento
│   │   ├── schemas/
│   │   │   └── schema.py            # Schemas de entrada e resposta
│   │   ├── utils/
│   │   │   └── data_time.py         # Utilitário de data e hora
│   │   └── main.py                  # Criação da aplicação FastAPI
│   ├── .gitignore                    # Cache, ambiente virtual e build Python
│   ├── requirements.txt
│   ├── server.py                    # Inicialização do servidor Uvicorn
│   └── Dockerfile
├── database/
│   ├── .gitignore                    # Dados locais e arquivos transitórios MySQL
│   ├── init.sql                     # Tabelas e dados iniciais
│   ├── my.cnf                       # Configuração do MySQL
│   └── Dockerfile
├── frontend/
│   ├── .gitignore                    # Dependências e saídas de build Node
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── portal-cliente.js
│   │       ├── responsavel.js
│   │       ├── chamados.js            # Script legado de listagem
│   │       └── script.js              # Script legado de cadastro/listagem
│   ├── index.html                   # Página inicial
│   ├── chamados.html                # Portal do cliente
│   ├── responsavel.html             # Fila de atendimento
│   └── Dockerfile
├── proxy/
│   ├── .gitignore                    # Logs e caches locais do Nginx
│   ├── nginx.conf                   # Proxy para frontend e API
│   └── Dockerfile
├── docker-compose.yml               # Orquestração dos serviços
└── README.md
```

`frontend/assets/js/chamados.js` e `script.js` são arquivos legados e não são carregados pelas páginas HTML atuais. O portal do cliente usa `portal-cliente.js`, e a fila de atendimento usa `responsavel.js`.

## Dados iniciais

O script SQL cria as prioridades **Baixa**, **Média**, **Alta** e **Urgente**; os status **Aberto**, **Pendente**, **Em Andamento**, **resolvido** e **Fechado**; e os responsáveis **Ana Souza**, **Carlos Silva** e **Mariana Lima**. Eles são usados como dados de exemplo e podem ser alterados em `database/init.sql` antes da primeira inicialização do banco.

## Autor

- [Caio Marinho](https://github.com/Caio-Marinho)