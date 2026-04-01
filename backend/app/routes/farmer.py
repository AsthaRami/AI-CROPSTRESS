from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os, uuid
from .. import db
from ..models.user import User
from ..models.query import Query
from ..models.notification import Notification
from ..services.ai_service import AIService

farmer_bp = Blueprint('farmer', __name__)
ai_service = AIService()

@farmer_bp.route('/api/farmer/query', methods=['POST'])
@jwt_required()
def submit_query():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'farmer':
        return jsonify({'error': 'Unauthorized. Farmer role required.'}), 403
    
    title = request.form.get('title')
    description = request.form.get('description')
    crop_type = request.form.get('crop_type')
    
    if not title or not description or not crop_type:
        return jsonify({'error': 'Title, description and crop type are required.'}), 400
    
    image_path = None
    ai_diagnosis = None
    
    if 'image' in request.files:
        file = request.files['image']
        if file.filename != '':
            filename = str(uuid.uuid4()) + '.jpg'
            upload_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
            os.makedirs(upload_folder, exist_ok=True)
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            image_path = filename # Store relative path for serving
            
            # Run AI diagnosis
            try:
                ai_diagnosis = ai_service.analyze(filepath)
            except Exception as e:
                ai_diagnosis = ai_service.analyze_fallback(filepath, str(e))

    query = Query(
        farmer_id=user_id,
        title=title,
        description=description,
        crop_type=crop_type,
        image_path=image_path,
        ai_diagnosis=ai_diagnosis,
        status='pending'
    )
    
    db.session.add(query)
    db.session.commit()
    
    # Notify all agronomists
    agronomists = User.query.filter_by(role='agronomist').all()
    for agro in agronomists:
        notification = Notification(
            user_id=agro.id,
            message=f"New query from {user.name}: {title}",
            type='query',
            reference_id=query.id
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({'message': 'Your query has been sent to our agronomists!', 'query': query.to_dict()}), 201

@farmer_bp.route('/api/farmer/queries', methods=['GET'])
@jwt_required()
def get_farmer_queries():
    user_id = get_jwt_identity()
    queries = Query.query.filter_by(farmer_id=user_id).order_by(Query.created_at.desc()).all()
    
    # Include responses in the output
    results = []
    for q in queries:
        q_dict = q.to_dict()
        q_dict['responses'] = [r.to_dict() for r in q.responses]
        results.append(q_dict)
        
    return jsonify(results), 200

@farmer_bp.route('/api/farmer/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notifications]), 200

@farmer_bp.route('/api/farmer/notifications/read', methods=['PATCH'])
@jwt_required()
def mark_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'Notifications marked as read'}), 200
