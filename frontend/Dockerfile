# Etapa 1: Imagem base
FROM node:18-alpine

# Etapa 2: Definir diretório de trabalho
WORKDIR /app

# Etapa 3: Copiar arquivos do projeto
COPY package*.json .

# Etapa 4: Instalar dependências
RUN npm install

# Etapa 5: Copiar o restante dos arquivos do projeto
COPY . .

# Etapa 6: Construir o projeto
RUN npm run build

# Etapa 7: Expor porta
EXPOSE 5173

# Etapa 8: Iniciar o servidor
CMD ["npm", "run", "dev", "--", "--host"]