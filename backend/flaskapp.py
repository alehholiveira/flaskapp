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

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

# colocar o token do bot
TELEGRAM_BOT_TOKEN = ''
bot = Bot(token=TELEGRAM_BOT_TOKEN)

def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            datetime TEXT NOT NULL,
            username TEXT NOT NULL,
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return "Servidor Flask rodando!"

@app.route('/image/processed/<name>/<filename>')
def uploaded_file(name, filename):
    file = os.path.join(app.config['PROCESSED_FOLDER'], name, filename)
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

    username = request.form['username'] 

    chat_id = get_chat_id_by_username(username)
    if not chat_id:
        return jsonify({'error': 'Username not found in Telegram updates'}), 404

    filename = secure_filename(file.filename)
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], username)
    processed_folder = os.path.join(app.config['PROCESSED_FOLDER'], username)
    os.makedirs(user_folder, exist_ok=True)
    os.makedirs(processed_folder, exist_ok=True)
    file_path = os.path.join(user_folder, filename)
    file.save(file_path)

    client_ip = request.remote_addr
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Salvar no banco de dados
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO uploads (ip, datetime, username) VALUES (?, ?, ?)', (client_ip, current_time, username))
    conn.commit()
    conn.close()

    processed_image_paths = process_images(file_path, filename, processed_folder)

    # Enviar imagens processadas via Telegram
    asyncio.run(send_images_via_telegram(chat_id, processed_image_paths))

    print(f'[{current_time}] {client_ip} uploaded {filename} and processed it to {processed_image_paths}')

    return jsonify({
        'filename': filename,
        'image_proc': processed_image_paths[0],  # Retornar a primeira imagem processada para exibição
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

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', debug=True)