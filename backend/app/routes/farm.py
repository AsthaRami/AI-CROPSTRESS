from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.farm import Farm
from ..models.crop import Crop
from ..models.detection import Detection
from ..models.alert import Alert

farm_bp = Blueprint('farm', __name__)

@farm_bp.route('/api/farm/test', methods=['GET'])
def test():
    return jsonify({'message': 'Farm Ready!'})


@farm_bp.route('/api/farm/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    try:
        user_id = get_jwt_identity()
        farm_count = Farm.query.filter_by(user_id=user_id).count()
        det_q = Detection.query.filter((Detection.user_id == int(user_id)) | (Detection.user_id == None))
        total_scans = det_q.count()
        healthy_crops = det_q.filter(Detection.severity.in_(['low', 'medium'])).count()
        stressed_crops = det_q.filter(Detection.severity.in_(['high', 'critical'])).count()
        active_alerts = Alert.query.filter_by(user_id=user_id, status='active').count()

        return jsonify({
            'total_farms'   : farm_count,
            'healthy_crops' : healthy_crops,
            'stressed_crops': stressed_crops,
            'active_alerts' : active_alerts,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farm_bp.route('/api/farm/list', methods=['GET'])
@jwt_required()
def farm_list():
    user_id = get_jwt_identity()
    farms   = Farm.query.filter_by(user_id=user_id).all()
    return jsonify({'farms': [f.to_dict() for f in farms]}), 200

@farm_bp.route('/api/farm/add', methods=['POST'])
@jwt_required()
def add_farm():
    user_id = get_jwt_identity()
    data    = request.get_json()
    farm = Farm(
        user_id    = user_id,
        name       = data.get('name'),
        location   = data.get('location'),
        area_acres = data.get('area_acres', 0),
        soil_type  = data.get('soil_type', 'loamy')
    )
    db.session.add(farm)
    db.session.commit()
    return jsonify({
        'message': 'Farm added!',
        'farm'   : farm.to_dict()
    }), 201
