# Central de chamados

Aplicação web para abertura e acompanhamento de chamados por clientes e gerenciamento da fila de atendimento por responsáveis.

## Visão geral

Este projeto foi criado para simular um sistema de atendimento com fluxo simples de clientes, responsáveis, prioridades e status de chamados. A aplicação combina backend, banco de dados e frontend em uma estrutura organizada para execução local com Docker.

## Tecnologias

- Python
- FastAPI
- MySQL
- Docker Compose
- Nginx
- HTML, CSS e JavaScript

## Funcionalidades

- Cadastro ou identificação de clientes
- Abertura de chamados
- Atribuição automática ou manual de responsáveis
- Atualização de status, prioridade e responsável
- Consulta por cliente e por responsável
- Histórico de abertura e fechamento de chamados
- Interface web para clientes e atendentes

## Estrutura do projeto

```text
.
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── server.py
│   └── Dockerfile
├── database/
│   ├── init.sql
│   ├── my.cnf
│   └── Dockerfile
├── frontend/
│   ├── assets/
│   ├── index.html
│   ├── chamados.html
│   ├── responsavel.html
│   └── Dockerfile
├── proxy/
│   ├── nginx.conf
│   └── Dockerfile
├── .env.example
├── docker-compose.yml
├── README.md
├── .gitignore
└── LICENSE
```

## Requisitos

- Docker
- Docker Compose
- Navegador web

## Execução local

1. Crie um arquivo `.env` com as variáveis do projeto.
2. Inicie os serviços:

```bash
docker compose up --build
```

3. Acesse:

```text
http://localhost
```

## Variáveis de ambiente

Use o arquivo `.env.example` como base.

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

## API

A API é acessível pela interface do Nginx e também diretamente em `http://localhost:5000/docs` quando em execução local.

## Observações

- O banco é persistido em volume Docker.
- A aplicação foi criada para ambiente local e estudo de arquitetura de software.
- A documentação e a organização foram pensadas para facilitar entendimento e execução do projeto por terceiros.

## Autor

- Caio Marinho
