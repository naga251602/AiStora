# routes/databases.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Project, Table

databases_bp = Blueprint('databases', __name__)

@databases_bp.route('/api/databases', methods=['GET'])
@jwt_required()
def get_databases():
    current_user_id = get_jwt_identity()
    projects = Project.query.filter_by(user_id=current_user_id).all()
    return jsonify({
        'success': True, 
        'databases': [{'id': p.id, 'name': p.name, 'table_count': len(p.tables)} for p in projects]
    })

@databases_bp.route('/api/databases', methods=['POST'])
@jwt_required()
def create_database():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'success': False, 'error': 'Name required'}), 400

    new_project = Project(name=name, user_id=current_user_id)
    db.session.add(new_project)
    db.session.commit()
    
    return jsonify({'success': True, 'database': {'id': new_project.id, 'name': new_project.name}})

@databases_bp.route('/api/databases/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_database(id):
    current_user_id = get_jwt_identity()
    project = Project.query.filter_by(id=id, user_id=current_user_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Database not found'}), 404

    db.session.delete(project)
    db.session.commit()
    return jsonify({'success': True})

@databases_bp.route('/api/databases/select', methods=['POST'])
@jwt_required()
def select_database():
    """
    Stateless selection: Returns the schema for the requested project ID.
    Does NOT set session variables.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    project_id = data.get('id')
    
    project = Project.query.filter_by(id=project_id, user_id=current_user_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Database not found'}), 404
        
    # Build schema payload
    schema = {}
    for table in project.tables:
        schema[table.name] = {
            'id': table.id,
            'filename': table.filename,
            'types': table.columns_schema, # Assuming 'columns_schema' is a stored dict/JSON
            'row_count': table.row_count
        }
    
    return jsonify({'success': True, 'name': project.name, 'schema': schema, 'id': project.id})