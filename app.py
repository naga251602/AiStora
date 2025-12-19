# app.py
import os
import time 
from flask import Flask
from config import Config
from extensions import db, jwt # <--- Import jwt from extensions
from services.llm_service import configure_llm
from models import User, Project, Table

from routes.pages import pages_bp
from routes.auth import auth_bp
from routes.data import data_bp
from routes.chat import chat_bp
from routes.databases import databases_bp
from routes.tables import tables_bp 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Force JWT Key explicitly to avoid any Config loading issues
    app.config['JWT_SECRET_KEY'] = app.config.get('SECRET_KEY')

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Init DB & JWT
    db.init_app(app)
    jwt.init_app(app) # <--- Initialize the global instance properly

    # Import models AFTER db.init_app(app)
    with app.app_context():
        from models import User, Project, Table
        db.create_all()

    configure_llm()

    @app.context_processor
    def inject_version():
        return dict(version_id=int(time.time()))
    
    app.register_blueprint(pages_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(databases_bp)
    app.register_blueprint(tables_bp)

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)