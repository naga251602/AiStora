# routes/data.py
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models import Table, Project
from engine.dataframe import DataFrame

data_bp = Blueprint('data', __name__)

@data_bp.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_files():
    current_user_id = get_jwt_identity()
    
    project_id = request.form.get('project_id')
    if not project_id:
        return jsonify({'success': False, 'error': 'No project ID provided'}), 400

    project = Project.query.filter_by(id=project_id, user_id=current_user_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Project not found or access denied'}), 403

    if 'files' not in request.files:
        return jsonify({'success': False, 'error': 'No files uploaded'}), 400

    files = request.files.getlist('files')
    updated_schema = {}

    for file in files:
        if file.filename == '':
            continue
            
        try:
            filename = secure_filename(file.filename)
            unique_name = f"{project_id}_{filename}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_name)
            file.save(filepath)
            
            # 1. Analyze File using Engine
            df = DataFrame(source=filepath)
            column_types = df.column_types
            
            # 2. Robust Row Count (Fallback included)
            row_count = len(df.data) if df.data else 0
            
            # If engine returns 0, try counting raw lines (subtracting header)
            if row_count == 0:
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        row_count = sum(1 for _ in f) - 1
                except:
                    pass # Keep as 0 if this fails too
            
            table_name = os.path.splitext(filename)[0]
            
            # 3. Save to DB
            existing_table = Table.query.filter_by(project_id=project.id, name=table_name).first()
            
            if existing_table:
                existing_table.filepath = filepath
                existing_table.columns_schema = column_types
                existing_table.row_count = row_count
                existing_table.filename = filename
                db.session.add(existing_table)
            else:
                new_table = Table(
                    name=table_name,
                    filename=filename,
                    filepath=filepath,
                    columns_schema=column_types,
                    row_count=row_count,
                    project_id=project.id
                )
                db.session.add(new_table)
                db.session.flush() # Flush to get ID
                
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': f"Failed processing {file.filename}: {str(e)}"}), 500

    db.session.commit()

    # Return Schema
    full_schema = {}
    for t in project.tables:
         full_schema[t.name] = {
            'id': t.id,
            'types': t.columns_schema,
            'row_count': t.row_count
        }

    return jsonify({'success': True, 'schema': full_schema})