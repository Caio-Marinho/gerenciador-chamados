# Node é usado para instalar e executar o servidor de arquivos estáticos; o
# frontend da aplicação em si continua sendo HTML, CSS e JavaScript sem build.
# O build context é frontend/.
FROM node:24.17.0-alpine

# Mantém os arquivos da interface em um local previsível dentro do container.
WORKDIR /app

# Instala globalmente uma versão fixa de http-server, usada para disponibilizar
# os arquivos estáticos na porta 80. Limpa o cache do npm na mesma camada.
RUN npm install -g http-server@14.1.1 && npm cache clean --force

# Copia as três páginas e os assets para o diretório que será servido. As
# instruções explícitas deixam claro quais arquivos fazem parte da imagem.
COPY index.html ./
COPY chamados.html ./
COPY responsavel.html ./
COPY assets/ ./assets/

# Porta interna do http-server. O Nginx recebe tráfego público e encaminha as
# requisições de páginas e assets para este serviço na rede Compose.
EXPOSE 80

# Inicia o servidor em /app. -p define a porta, -c-1 desativa cache dos assets
# durante desenvolvimento e --cors envia cabeçalhos de acesso entre origens.
CMD ["http-server", ".", "-p", "80", "-c-1", "--cors"]
