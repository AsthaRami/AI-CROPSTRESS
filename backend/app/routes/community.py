from flask import Blueprint, jsonify
from app import db
from app.models.detection import Detection
from app.models.farm import Farm
from flask_jwt_extended import jwt_required, get_jwt_identity

community_bp = Blueprint('community', __name__)

@community_bp.route('/api/community/alerts', methods=['GET'])
@jwt_required()
def get_community_alerts():
    user_id = get_jwt_identity()
    
    # Simple logic: Get detections from the same cities where the current user has farms
    user_farms = Farm.query.filter_by(user_id=user_id).all()
    user_cities = [f.location for f in user_farms]
    
    if not user_cities:
        return jsonify({"alerts": []})

    # Find detections where the farm location matches user's cities, but exclude user's own detections
    # We join with Farm to get the location of each detection
    nearby_detections = db.session.query(Detection, Farm.location)\
        .join(Farm, Detection.crop_id == Farm.id)\
        .filter(Farm.location.in_(user_cities))\
        .filter(Detection.user_id != user_id)\
        .order_by(Detection.detected_at.desc())\
        .limit(5).all()

    alerts = []
    for det, loc in nearby_detections:
        alerts.append({
            "crop": (det.stress_type or '').split('___')[0],
            "stress": det.stress_type.replace('___', ' - ') if det.stress_type else 'Unknown',
            "location": loc,
            "severity": det.severity,
            "time": det.detected_at.strftime("%Y-%m-%d %H:%M")
        })

    return jsonify({"alerts": alerts})
