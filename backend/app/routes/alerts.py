from flask import Blueprint, jsonify
from app.models.alert import Alert
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.services.notification_service import send_email_notification, send_sms_notification

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/api/alerts/active', methods=['GET'])
@jwt_required()
def active_alerts():
    user_id = int(get_jwt_identity())
    alerts = (
        Alert.query
        .filter_by(user_id=user_id, status='active')
        .order_by(Alert.sent_at.desc())
        .limit(50)
        .all()
    )
    return jsonify({'alerts': [a.to_dict() for a in alerts]}), 200

@alerts_bp.route('/api/alerts/history', methods=['GET'])
@jwt_required()
def alert_history():
    user_id = int(get_jwt_identity())
    alerts = (
        Alert.query
        .filter_by(user_id=user_id)
        .order_by(Alert.sent_at.desc())
        .limit(100)
        .all()
    )
    return jsonify({'alerts': [a.to_dict() for a in alerts]}), 200

@alerts_bp.route('/api/alerts/notify', methods=['POST'])
@jwt_required()
def notify_alert():
    try:
        from flask import request
        data = request.get_json()
        alert_msg = data.get('message', 'No message')
        
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # 1. Send Real Email
        if user.email:
            send_email_notification(
                to_email=user.email,
                subject="CROP STRESS ALERT",
                body=f"Hello {user.name},\n\nA critical alert was triggered for your farm: {alert_msg}\n\nPlease check your dashboard for details."
            )

        # 2. Send Real SMS (If Twilio is configured)
        if user.phone:
            send_sms_notification(
                to_phone=user.phone,
                message=f"STRESS ALERT: {alert_msg}. Check your dashboard."
            )

        return jsonify({'message': 'Notifications sent via Email and SMS if configured.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
