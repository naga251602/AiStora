# routes/tables.py
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Table, Project

tables_bp = Blueprint('tables', __name__)

def get_table_if_owner(table_id, user_id):
    table = Table.query.get(table_id)
    if not table:
        return None
    # Check project ownership
    project = Project.query.get(table.project_id)
    if not project or project.user_id != user_id:
        return None
    return table

@tables_bp.route('/api/tables/<int:id>', methods=['PUT'])
@jwt_required()
def rename_table(id):
    current_user_id = get_jwt_identity()
    table = get_table_if_owner(id, current_user_id)
    
    if not table:
        return jsonify({'success': False, 'error': 'Table not found'}), 404

    data = request.get_json()
    new_name = data.get('name')
    if not new_name:
        return jsonify({'success': False, 'error': 'Name is required'}), 400
    
    # Check collision in same project
    exists = Table.query.filter_by(project_id=table.project_id, name=new_name).first()
    if exists and exists.id != id:
        return jsonify({'success': False, 'error': 'Name already taken in this workspace'}), 409
    
    table.name = new_name
    db.session.commit()
    
    return jsonify({'success': True})

@tables_bp.route('/api/tables/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_table(id):
    current_user_id = get_jwt_identity()
    table = get_table_if_owner(id, current_user_id)
    
    if not table:
        return jsonify({'success': False, 'error': 'Table not found'}), 404

    try:
        if os.path.exists(table.filepath):
            os.remove(table.filepath)
        
        db.session.delete(table)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500