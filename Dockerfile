# Etapa 1: Imagem base
FROM python:3.9-slim

# Etapa 2: Instalar dependências do sistema para OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Etapa 3: Definir diretório de trabalho
WORKDIR /app

# Etapa 4: Copiar apenas o requirements.txt inicialmente para instalar dependências
COPY requirements.txt /app/

# Etapa 5: Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 6: Copiar o restante dos arquivos da aplicação
COPY . /app

# Etapa 7: Configurar variáveis de ambiente
ENV FLASK_APP=flaskapp.py
ENV FLASK_ENV=production

# Etapa 8: Expor porta
EXPOSE 5000

# Etapa 9: Inicializar o banco de dados e executar a aplicação
CMD ["sh", "-c", "python database.py && flask run --host=0.0.0.0"]