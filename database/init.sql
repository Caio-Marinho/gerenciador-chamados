-- Criação das tabelas (caso ainda não existam)

-- 1. Tabela de Prioridades
CREATE TABLE IF NOT EXISTS prioridades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prioridade VARCHAR(50) NOT NULL
);

-- 2. Tabela de Status
CREATE TABLE IF NOT EXISTS status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    status VARCHAR(50) NOT NULL
);

-- 3. Tabela de Responsáveis
CREATE TABLE IF NOT EXISTS responsaveis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL
);

-- 4. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 5. Tabela de Chamados
CREATE TABLE IF NOT EXISTS chamados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    Titulo VARCHAR(150) NOT NULL,
    Descricao VARCHAR(500) NOT NULL,
    id_prioridade INT NOT NULL,
    id_status INT NOT NULL DEFAULT 1,
    id_responsavel INT NOT NULL,
    id_cliente INT NOT NULL,
    data_hora_abertura DATETIME NOT NULL,
    data_hora_fechamento DATETIME NULL,
    CONSTRAINT fk_prioridade FOREIGN KEY (id_prioridade) REFERENCES prioridades(id),
    CONSTRAINT fk_status FOREIGN KEY (id_status) REFERENCES status(id),
    CONSTRAINT fk_responsavel FOREIGN KEY (id_responsavel) REFERENCES responsaveis(id),
    CONSTRAINT fk_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);

-- Inserção dos dados iniciais (já virão alimentados)

-- 1. Prioridades comuns em um sistema de chamados
INSERT INTO prioridades (id, prioridade) VALUES
(1, 'Baixa'),
(2, 'Média'),
(3, 'Alta'),
(4, 'Urgente');

-- 2. Status comuns (o id 1 é o padrão no seu modelo)
INSERT INTO status (id, status) VALUES
(1, 'Aberto'),
(2, 'Pendente'),
(3, 'Em Andamento'),
(4, 'Resolvido'),
(5, 'Fechado');


-- 3. Responsáveis de exemplo pela resolução dos chamados
INSERT INTO responsaveis (id, nome) VALUES
(1, 'Ana Souza'),
(2, 'Carlos Silva'),
(3, 'Mariana Lima');
