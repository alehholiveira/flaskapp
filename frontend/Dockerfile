# Etapa 1: Imagem base
FROM denoland/deno:latest

# Etapa 2: Definir diretório de trabalho
WORKDIR /app

# Etapa 3: Copiar arquivos do projeto
COPY . .

# Etapa 4: Instalar dependências e construir o projeto
RUN deno task build

# Etapa 5: Expor porta
EXPOSE 5173

# Etapa 6: Iniciar o servidor
CMD ["deno", "task", "dev", "--host"]