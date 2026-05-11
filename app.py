from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import io
import tempfile
from werkzeug.utils import secure_filename
from pdf2docx import Converter

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app, expose_headers=['Content-Disposition'])

ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/api/convert', methods=['POST'])
def convert():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    # Check file size
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File size exceeds 50MB limit'}), 400

    original_name = secure_filename(file.filename)
    base_name = os.path.splitext(original_name)[0]
    download_name = f'{base_name}.docx'

    # Use temp files for conversion (works locally & on cloud)
    pdf_fd, pdf_path = tempfile.mkstemp(suffix='.pdf')
    docx_fd, docx_path = tempfile.mkstemp(suffix='.docx')
    os.close(pdf_fd)
    os.close(docx_fd)

    try:
        file.save(pdf_path)

        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()

        # Read into memory so we can clean up temp files
        with open(docx_path, 'rb') as f:
            docx_bytes = f.read()

        return send_file(
            io.BytesIO(docx_bytes),
            as_attachment=True,
            download_name=download_name,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    except Exception as e:
        return jsonify({'error': f'Conversion failed: {str(e)}'}), 500

    finally:
        # Always clean up temp files
        try:
            os.unlink(pdf_path)
        except Exception:
            pass
        try:
            os.unlink(docx_path)
        except Exception:
            pass


if __name__ == '__main__':
    print("PDF to Word Converter running at http://localhost:5000")
    app.run(debug=False, host='0.0.0.0', port=5000)
