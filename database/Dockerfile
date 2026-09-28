# Imagem oficial do MySQL 8, usada como serviço de persistência da aplicação.
# As variáveis MYSQL_* são fornecidas pelo env_file no docker-compose.yml.
FROM mysql:8.0

# A imagem oficial processa arquivos SQL neste diretório ao inicializar um
# diretório de dados vazio. init.sql cria as tabelas e insere os dados de
# referência; scripts não são executados novamente enquanto o volume persistir.
COPY init.sql /docker-entrypoint-initdb.d/

# Instala a configuração customizada do servidor MySQL, incluindo charset
# utf8mb4, collation e limite de conexões. Ela é lida durante a inicialização.
COPY my.cnf /etc/mysql/conf.d/my.cnf
