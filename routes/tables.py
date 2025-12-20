# routes/tables.py
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Table, Project
from engine.dataframe import DataFrame

tables_bp = Blueprint('tables', __name__)

def get_table_if_owner(table_id, user_id):
    table = Table.query.get(table_id)
    if not table: return None
    project = Project.query.get(table.project_id)
    if not project or project.user_id != int(user_id): return None
    return table

@tables_bp.route('/api/tables/<int:id>/preview', methods=['GET'])
@jwt_required()
def preview_table(id):
    current_user_id = get_jwt_identity()
    
    # 1. Verify Ownership
    table = get_table_if_owner(id, current_user_id)
    if not table:
        return jsonify({'success': False, 'error': 'Table not found'}), 404

    # 2. Check File Existence
    if not os.path.exists(table.filepath):
        return jsonify({'success': False, 'error': 'File missing. Please re-upload.'}), 404

    try:
        # 3. Use Engine to Load Data
        df = DataFrame(source=table.filepath)
        
        # Use the new .head() method for efficient preview
        preview_rows = df.head(5)
        
        return jsonify({
            'success': True,
            'name': table.name,
            'columns': list(df.columns),
            'rows': preview_rows 
        })
    except Exception as e:
        print(f"Preview Error: {e}")
        return jsonify({'success': False, 'error': f"Engine Error: {str(e)}"}), 500

@tables_bp.route('/api/tables/<int:id>', methods=['PUT'])
@jwt_required()
def rename_table(id):
    current_user_id = get_jwt_identity()
    table = get_table_if_owner(id, current_user_id)
    if not table: return jsonify({'success': False, 'error': 'Table not found'}), 404

    data = request.get_json()
    new_name = data.get('name')
    if not new_name: return jsonify({'success': False, 'error': 'Name required'}), 400
    
    exists = Table.query.filter_by(project_id=table.project_id, name=new_name).first()
    if exists and exists.id != id:
        return jsonify({'success': False, 'error': 'Name taken'}), 409
    
    table.name = new_name
    db.session.commit()
    return jsonify({'success': True})

@tables_bp.route('/api/tables/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_table(id):
    current_user_id = get_jwt_identity()
    table = get_table_if_owner(id, current_user_id)
    if not table: return jsonify({'success': False, 'error': 'Table not found'}), 404

    try:
        if table.filepath and os.path.exists(table.filepath):
            os.remove(table.filepath)
    except:
        pass

    db.session.delete(table)
    db.session.commit()
    return jsonify({'success': True})