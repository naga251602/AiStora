# routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies
from sqlalchemy import or_
from extensions import db
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/status', methods=['GET'])
@jwt_required(optional=True)
def auth_status():
    """
    Checks if the incoming request has a valid JWT token.
    """
    current_user_id = get_jwt_identity()
    if current_user_id:
        # SQLAlchemy handles string-to-int conversion automatically for primary keys
        user = User.query.get(current_user_id)
        if user:
            return jsonify({
                'isLoggedIn': True, 
                'user': {
                    'email': user.email,
                    'username': user.username,
                    'full_name': user.full_name
                }
            })
    return jsonify({'isLoggedIn': False})

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('fullName')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # 1. Input Validation
    if not all([full_name, username, email, password]):
        return jsonify({'success': False, 'error': 'All fields are required.'}), 400
    
    # 2. Check existence
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Email is already registered.'}), 409
    
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'error': 'Username is already taken.'}), 409

    # 3. Create User
    new_user = User(full_name=full_name, username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Account created! Please login.'})

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    login_identifier = data.get('loginIdentifier') # Can be email OR username
    password = data.get('password')
    
    if not login_identifier or not password:
        return jsonify({'success': False, 'error': 'Please provide credentials.'}), 400

    # 1. Find User (Email OR Username)
    user = User.query.filter(
        or_(User.email == login_identifier, User.username == login_identifier)
    ).first()
    
    # 2. Validation
    if not user:
        return jsonify({'success': False, 'error': 'Account does not exist.'}), 200
        
    if not user.check_password(password):
        return jsonify({'success': False, 'error': 'Invalid password.'}), 200
    # 3. Generate Token
    # [CRITICAL FIX] Convert ID to string to satisfy JWT standards
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'success': True, 
        'token': access_token,
        'user': {
            'email': user.email,
            'username': user.username,
            'full_name': user.full_name
        }
    })

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    resp = jsonify({'success': True})
    unset_jwt_cookies(resp)
    return resp

@auth_bp.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    return jsonify({'success': True, 'message': 'If that email exists, a reset link has been sent.'})