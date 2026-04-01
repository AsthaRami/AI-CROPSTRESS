from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from .. import db, mail
from ..models.user import User
from ..models.query import Query
from ..models.response import Response
from ..models.notification import Notification

agronomist_bp = Blueprint('agronomist', __name__)

def is_agronomist(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'agronomist'

@agronomist_bp.route('/api/agronomist/queries', methods=['GET'])
@jwt_required()
def get_queries():
    user_id = get_jwt_identity()
    if not is_agronomist(user_id):
        return jsonify({'error': 'Unauthorized. Agronomist role required.'}), 403
    
    status = request.args.get('status', 'pending')
    queries = Query.query.filter_by(status=status).order_by(Query.created_at.desc()).all()
    
    results = []
    for q in queries:
        q_dict = q.to_dict()
        if status == 'answered':
            q_dict['responses'] = [r.to_dict() for r in q.responses]
        results.append(q_dict)
        
    return jsonify(results), 200

@agronomist_bp.route('/api/agronomist/queries/<int:id>', methods=['GET'])
@jwt_required()
def get_query_detail(id):
    user_id = get_jwt_identity()
    if not is_agronomist(user_id):
        return jsonify({'error': 'Unauthorized.'}), 403
    
    query = Query.query.get_or_404(id)
    return jsonify(query.to_dict()), 200

@agronomist_bp.route('/api/agronomist/respond/<int:query_id>', methods=['POST'])
@jwt_required()
def respond(query_id):
    user_id = get_jwt_identity()
    if not is_agronomist(user_id):
        return jsonify({'error': 'Unauthorized.'}), 403
    
    data = request.get_json()
    message = data.get('message')
    recommendation = data.get('recommendation')
    
    if not message or not recommendation:
        return jsonify({'error': 'Message and recommendation are required.'}), 400
    
    query = Query.query.get_or_404(query_id)
    
    response = Response(
        query_id=query_id,
        agronomist_id=user_id,
        message=message,
        recommendation=recommendation
    )
    
    query.status = 'answered'
    
    # Create notification for farmer
    notification = Notification(
        user_id=query.farmer_id,
        message=f"An agronomist has responded to your query: {query.title}",
        type='response',
        reference_id=query.id
    )
    
    db.session.add(response)
    db.session.add(notification)
    db.session.commit()
    
    # --- SEND EMAIL TO FARMER ---
    try:
        farmer = User.query.get(query.farmer_id)
        if farmer and farmer.email:
            email_msg = Message(
                subject=f"EXPERT RESPONSE: {query.title}",
                recipients=[farmer.email],
                body=f"Hello {farmer.name},\n\nAn agricultural expert has reviewed your query regarding '{query.crop_type}'.\n\nExpert Advice:\n{message}\n\nRecommended Treatment:\n{recommendation}\n\nPlease log in to your dashboard to see the full details.\n\nBest regards,\nAI CropStress Team"
            )
            mail.send(email_msg)
            print(f"Expert response emailed to farmer: {farmer.email}")
    except Exception as e:
        print(f"Failed to email expert response: {e}")
    
    return jsonify({'message': 'Response submitted successfully!', 'response': response.to_dict()}), 201

@agronomist_bp.route('/api/agronomist/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    if not is_agronomist(user_id):
        return jsonify({'error': 'Unauthorized.'}), 403
    
    answered_count = Response.query.filter_by(agronomist_id=user_id).count()
    pending_count = Query.query.filter_by(status='pending').count()
    
    # Unique farmers helped by this agronomist
    farmers_helped = db.session.query(Query.farmer_id).join(Response).filter(Response.agronomist_id == user_id).distinct().count()
    
    return jsonify({
        'answered_count': answered_count,
        'pending_count': pending_count,
        'farmers_helped': farmers_helped
    }), 200

@agronomist_bp.route('/api/agronomist/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'agronomist':
        return jsonify({'error': 'Unauthorized.'}), 403
    
    return jsonify(user.to_dict()), 200
@agronomist_bp.route('/api/agronomist/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    if not is_agronomist(user_id):
        return jsonify({'error': 'Unauthorized.'}), 403
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notifications]), 200

@agronomist_bp.route('/api/agronomist/notifications/read', methods=['PATCH'])
@jwt_required()
def mark_read():
    user_id = get_jwt_identity()
    if not is_agronomist(user_id):
        return jsonify({'error': 'Unauthorized.'}), 403
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'Notifications marked as read'}), 200
@agronomist_bp.route('/api/agronomist/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'agronomist':
        return jsonify({'error': 'Unauthorized.'}), 403
    
    data = request.get_json()
    user.name = data.get('name', user.name)
    user.phone = data.get('phone', user.phone)
    user.profession = data.get('profession', user.profession)
    user.bio = data.get('bio', user.bio)
    user.photo = data.get('photo', user.photo)
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully!', 'user': user.to_dict()}), 200
