import os
import cv2
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

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
    
    processed_image_path = process_image(file_path, filename)
    
    print(f'[{current_time}] {client_ip} uploaded {filename} and processed it to {processed_image_path}')

    return jsonify({
        'filename': filename,
        'ip': client_ip,
        'datetime': current_time,
        'image_proc': processed_image_path
    })

    
def process_image(filepath, filename):
    # Ler a imagem original
    image = cv2.imread(filepath)

    # Aplicar o filtro de cartoonização
    # 1. Converter para cinza
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 2. Aplicar um blur para suavizar a imagem
    gray_blur = cv2.medianBlur(gray, 5)

    # 3. Detectar bordas usando o filtro laplaciano
    edges = cv2.adaptiveThreshold(gray_blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)

    # 4. Reduzir o ruído com filtro bilateral
    color = cv2.bilateralFilter(image, 9, 300, 300)

    # 5. Combinar bordas e a imagem filtrada para criar o efeito de cartoon
    cartoon = cv2.bitwise_and(color, color, mask=edges)

    # Salvar a imagem processada
    processed_image_path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    cv2.imwrite(processed_image_path, cartoon)

    return filename


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)