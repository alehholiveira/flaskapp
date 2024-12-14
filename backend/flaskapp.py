import os
import cv2
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
from telegram import Bot
import asyncio
import requests
from dotenv import load_dotenv
import random
import time

app = Flask(__name__)
CORS(app)
load_dotenv()

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
TEMP_FOLDER = 'temp'
if not os.path.exists(TEMP_FOLDER):
    os.makedirs(TEMP_FOLDER)
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['TEMP_FOLDER'] = TEMP_FOLDER

# O token deve ser inserido no arquivo .env
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
bot = Bot(token=TELEGRAM_BOT_TOKEN)

temp_codes = {}

def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            datetime TEXT NOT NULL,
            username TEXT NOT NULL,
            filename TEXT NOT NULL,
            chat_id TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return "Servidor Flask rodando!"

@app.route('/image/processed/<username>/<filename>')
def processed_file(username, filename):
    file = os.path.join(app.config['PROCESSED_FOLDER'], username, filename)
    if not os.path.exists(file):
        return jsonify({'error': 'File not found'}), 404
    return send_file(file)

@app.route('/image/temp/processed/<filename>')
def processed_temp_file(filename):
    file = os.path.join(app.config['TEMP_FOLDER'], 'processed', filename)
    if not os.path.exists(file):
        return jsonify({'error': 'File not found'}), 404
    return send_file(file)

@app.route('/image/uploaded/<username>/<filename>')
def uploaded_file(username, filename):
    file = os.path.join(app.config['UPLOAD_FOLDER'], username, filename)
    if not os.path.exists(file):
        return jsonify({'error': 'File not found'}), 404
    return send_file(file)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    username = request.form.get('username', '')
    send_telegram = request.form.get('send_telegram', 'false').lower() == 'true'

    filename = secure_filename(file.filename)

    if username:
        if send_telegram:
            chat_id = get_chat_id_by_username(username)
            if not chat_id:
                return jsonify({'error': 'Username not found in Telegram updates'}), 404
            
            user_folder = os.path.join(app.config['UPLOAD_FOLDER'], username)
            processed_folder = os.path.join(app.config['PROCESSED_FOLDER'], username)
            os.makedirs(user_folder, exist_ok=True)
            os.makedirs(processed_folder, exist_ok=True)
            file_path = os.path.join(user_folder, filename)
            
            file.save(file_path)
            client_ip = request.remote_addr
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            processed_image_paths = process_images(file_path, filename, processed_folder)

            conn = sqlite3.connect('database.db')
            cursor = conn.cursor()
            cursor.execute('INSERT INTO uploads (ip, datetime, username, filename, chat_id) VALUES (?, ?, ?, ?, ?)', (client_ip, current_time, username, filename, chat_id))
            conn.commit()
            conn.close()

            asyncio.run(send_images_via_telegram(chat_id, processed_image_paths))
    else:
        temp_folder = os.path.join(app.config['TEMP_FOLDER'], 'uploads')
        processed_folder = os.path.join(app.config['TEMP_FOLDER'], 'processed')
        os.makedirs(temp_folder, exist_ok=True)
        os.makedirs(processed_folder, exist_ok=True)
        file_path = os.path.join(temp_folder, filename)
        file.save(file_path)

        client_ip = request.remote_addr
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        processed_image_paths = process_images(file_path, filename, processed_folder)
        
        for path in processed_image_paths:
            temp_path = os.path.join(processed_folder, os.path.basename(path))
            os.rename(path, temp_path)

    return jsonify({
        'filename': filename,
        'processed_images': [os.path.relpath(path, app.config['PROCESSED_FOLDER']) for path in processed_image_paths],   # Retornar a primeira imagem processada para exibição
        'ip': client_ip,
        'datetime': current_time,
        'username': username,
    })
    
def process_images(filepath, filename, processed_folder):
    image = cv2.imread(filepath)
    processed_image_paths = []

    # Processamento 1: Cartoon
    cartoon = process_cartoon(image)
    cartoon_path = os.path.join(processed_folder, f'cartoon_{filename}')
    cv2.imwrite(cartoon_path, cartoon)
    processed_image_paths.append(cartoon_path)

    # Processamento 2: Gray
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_path = os.path.join(processed_folder, f'gray_{filename}')
    cv2.imwrite(gray_path, gray)
    processed_image_paths.append(gray_path)

    # Processamento 3: Blur
    blur = cv2.GaussianBlur(image, (15, 15), 0)
    blur_path = os.path.join(processed_folder, f'blur_{filename}')
    cv2.imwrite(blur_path, blur)
    processed_image_paths.append(blur_path)

    return processed_image_paths

def process_cartoon(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_blur = cv2.medianBlur(gray, 5)
    edges = cv2.adaptiveThreshold(gray_blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)
    color = cv2.bilateralFilter(image, 9, 300, 300)
    cartoon = cv2.bitwise_and(color, color, mask=edges)
    return cartoon

def get_chat_id_by_username(username):
    # Primeiro, tentar buscar o chat_id no banco de dados
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT chat_id FROM uploads WHERE username = ? LIMIT 1', (username,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return row[0]

    # Se não encontrar no banco de dados, buscar na API do Telegram
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
    response = requests.get(url)
    data = response.json()

    if data['ok']:
        for result in data['result']:
            message = result.get('message')
            if message:
                from_user = message.get('from')
                if from_user and from_user.get('username') == username:
                    return from_user.get('id')
    return None

async def send_images_via_telegram(chat_id, image_paths):
    async with bot:
        message = f"Obrigado por utilizar do serviço 'Image Processor AiotLab'!. Segue as fotos:"
        await bot.send_message(chat_id=chat_id, text=message)
        for image_path in image_paths:
            await bot.send_photo(chat_id=chat_id, photo=open(image_path, 'rb'))

@app.route('/generate_code/<username>', methods=['GET'])
def generate_code(username):
    chat_id = get_chat_id_by_username(username)
    if not chat_id:
        return jsonify({'error': 'Usuário não encontrado. Envie uma mensagem para o bot e tente novamente!'}), 404

    code = str(random.randint(10000, 99999))
    temp_codes[username] = {'code': code, 'timestamp': time.time()}

    asyncio.run(send_code_via_telegram(chat_id, code))
    return jsonify({'message': 'Código gerado com sucesso! Verifique seu Telegram.'})

async def send_code_via_telegram(chat_id, code):
    async with bot:
        message = f"Seu código temporário é: {code}. Ele expira em 5 minutos."
        await bot.send_message(chat_id=chat_id, text=message)

@app.route('/user_images/<username>/<code>', methods=['GET'])
def get_user_images(username, code):
    if username not in temp_codes:
        return jsonify({'error': 'Não há um código gerado para esse usuário'}), 400

    stored_code = temp_codes[username]['code']
    timestamp = temp_codes[username]['timestamp']

    # Verificar se o código é válido e não expirou (5 minutos)
    if stored_code != code or time.time() - timestamp > 300:
        return jsonify({'error': 'Código inválido ou expirado'}), 400

    # Código válido, buscar imagens
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM uploads WHERE username = ?', (username,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return jsonify({'error': 'No images found for this user'}), 404

    images = []
    for row in rows:
        images.append({
            'id': row[0],
            'ip': row[1],
            'datetime': row[2],
            'username': row[3],
            'filename': row[4]
        })

    return jsonify(images)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', debug=True)