# Imagem oficial do Nginx baseada em Alpine. O container recebe as requisições
# públicas na porta 80; o Compose publica essa porta para o host.
FROM nginx:1.26-alpine

# Substitui nginx.conf da imagem base. A configuração define os serviços
# upstream, encaminha páginas/assets ao frontend e /api ao backend, além de
# expor a documentação OpenAPI do backend.
COPY nginx.conf /etc/nginx/nginx.conf
