from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'Flask Working!'})

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # 1. Validation Checks
    phone = data.get('phone')
    email = data.get('email')
    
    if not phone or not email:
        return jsonify({'error': 'Phone and Email are required'}), 400

    if User.query.filter_by(phone=phone).first():
        return jsonify({'error': 'Phone already registered'}), 409
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
        
    try:
        user = User(
            name     = data.get('name'),
            phone    = phone,
            email    = email,
            role     = data.get('role', 'farmer'),
            language = data.get('language', 'gujarati')
        )
        user.set_password(data.get('password'))
        
        db.session.add(user)
        db.session.commit()
        
        token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Registration successful!',
            'token'  : token,
            'user'   : user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"REGISTRATION ERROR: {e}")
        return jsonify({'error': f'Server Error: {str(e)}'}), 500

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(phone=data.get('phone')).first()
    if not user or not user.check_password(data.get('password')):
        return jsonify({'error': 'Invalid phone or password'}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful!',
        'token'  : token,
        'user'   : user.to_dict()
    }), 200

@auth_bp.route('/api/auth/profile/update', methods=['POST'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # 1. Validation without holding full object
        if 'email' in data and data['email']:
            existing_email = User.query.filter_by(email=data.get('email')).first()
            if existing_email and str(existing_email.id) != str(user_id):
                 return jsonify({'error': 'Email already registered by another user'}), 409

        # 2. Update User
        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if 'name' in data: user.name = data['name']
        if 'email' in data: user.email = data['email']
        if 'language' in data: user.language = data['language']
        if 'profession' in data: user.profession = data['profession']
        if 'location' in data: user.location = data['location']
        if 'bio' in data: user.bio = data['bio']
        if 'photo' in data: user.photo = data['photo']
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated!',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        print(f"PROFILE UPDATE ERROR: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/api/auth/delete_account', methods=['POST'])
@jwt_required()
def delete_account():
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # All associated data will be deleted if cascade is set in models
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
