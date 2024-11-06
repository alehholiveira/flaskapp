# Aplicação com Flask - Trilha Cloud AiotLab

Esta é uma aplicação web simples desenvolvida com Flask que permite o upload de imagens, processa essas imagens e exibe o resultado.

## Funcionalidades

- Upload de imagens
- Processamento de imagens (conversão para cartoon)
- Exibição da imagem original e da imagem processada
- Registro de IP e data/hora do upload

## Requisitos

- Python 3.6+
- Flask
- OpenCV

## Instalação

### Passo 1: Clonar o repositório

```bash
git clone https://github.com/alehholiveira/flaskapp.git
cd flaskapp
```

### Passo 2: Criar um ambiente virtual
```bash
python3 -m venv venv
source venv/bin/activate  # No Windows use `venv\Scripts\activate`
```

### Passo 3: Instalar as dependências
```bash
pip install -r requirements.txt
```

### Passo 4: Executar a aplicação
```bash
python3 flaskapp.py
```

## Uso

1. Acesse [http://localhost:5000](http://localhost:5000) no seu navegador.
2. Faça o upload de uma imagem.
3. Veja a imagem original e a imagem processada.
4. A tabela exibirá o IP e a data/hora do upload.

## Contribuição

Sinta-se à vontade para contribuir com melhorias para este projeto. Faça um fork do repositório, crie uma branch para suas alterações e envie um pull request.