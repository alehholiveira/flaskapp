# Aplicação com Flask - Trilha Cloud AiotLab

Esta é uma aplicação web desenvolvida com Flask e React que permite o upload de imagens, processa essas imagens utilizando diversos filtros e exibe o resultado. A aplicação também integra notificações via Telegram e utiliza Nginx como proxy reverso.

## Funcionalidades

- Upload de imagens
- Processamento de imagens com diversos filtros (cartoon, gray, blur, faces, sketch, classified)
- Exibição da imagem original e da imagem processada
- Registro de IP e data/hora do upload
- Geração de código temporário para acesso às imagens processadas
- Notificações via Telegram

## Requisitos

- Docker
- Docker Compose

## Instalação

### Passo 1: Clonar o repositório

```bash
git clone https://github.com/alehholiveira/flaskapp.git
cd flaskapp
```

### Passo 2: Configurar variáveis de ambiente

Crie um arquivo `.env` na pasta `backend` e adicione o token do seu bot do Telegram:

```
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

### Passo 3: Construir e iniciar os containers

```bash
docker compose up --build
```

### Passo 4: Acessar a aplicação

Acesse [http://localhost](http://localhost) no seu navegador.

## Uso

1. Acesse [http://localhost](http://localhost) no seu navegador.
2. Faça o upload de uma imagem.
3. Veja a imagem original e a imagem processada.
4. A tabela exibirá o IP e a data/hora do upload.
5. Utilize o Telegram para receber as imagens e códigos temporários.

## Contribuição

Sinta-se à vontade para contribuir com melhorias para este projeto. Faça um fork do repositório, crie uma branch para suas alterações e envie um pull request.