import os
import cv2
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS

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

def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            datetime TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return "Servidor Flask rodando!"

@app.route('/image/<filename>')
def uploaded_file(filename):
    file = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    return send_file(file)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    client_ip = request.remote_addr
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Salvar no banco de dados
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO uploads (ip, datetime) VALUES (?, ?)', (client_ip, current_time))
    conn.commit()
    conn.close()

    processed_image_path = process_image(file_path, filename)

    print(f'[{current_time}] {client_ip} uploaded {filename} and processed it to {processed_image_path}')

    return jsonify({
        'filename': filename,
        'ip': client_ip,
        'datetime': current_time,
        'image_proc': processed_image_path
    })

def process_image(filepath, filename):
    image = cv2.imread(filepath)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_blur = cv2.medianBlur(gray, 5)
    edges = cv2.adaptiveThreshold(gray_blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)
    color = cv2.bilateralFilter(image, 9, 300, 300)
    cartoon = cv2.bitwise_and(color, color, mask=edges)
    processed_image_path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    cv2.imwrite(processed_image_path, cartoon)
    return filename

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', debug=True)