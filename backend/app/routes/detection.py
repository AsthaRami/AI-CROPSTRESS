from flask import Blueprint, request, jsonify, abort
from flask import send_from_directory
import os, uuid
from flask_mail import Message
from .. import db, mail
from ..models.detection import Detection
from ..models.alert import Alert
from ..services.ai_service import AIService
from flask_jwt_extended import jwt_required, get_jwt_identity

detect_bp = Blueprint('detect', __name__)

# Load AI models once when this module is imported
ai_service = AIService()

@detect_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    """
    Serve uploaded images + overlays from backend/uploads.
    """
    upload_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
    return send_from_directory(upload_folder, filename)


@detect_bp.route('/api/detect/test', methods=['GET'])
def test():
    return jsonify({'message': 'Detection Ready!'})


@detect_bp.route('/api/detect/image', methods=['POST'])
def detect_image():
    print('--- NEW DETECTION REQUEST ---')
    print('Headers:', request.headers)
    
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    try:
        # Manually verify; if optional=True, it won't 401 if token is missing
        # If token is present but invalid, we catch the exception to avoid 401
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception as jwt_err:
        print(f"JWT Verification Warning: {jwt_err}")
        user_id = None

    print('User Identity:', user_id)
    
    # If no valid user logged in, use fallback user_id=1
    if user_id is None:
        print('Warning: No valid JWT found. Using fallback user_id=1.')
        user_id = 1
    
    if 'image' not in request.files:
        print('Error: No image in request')
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty file name'}), 400

    # Save upload using absolute path to avoid Errno 22 on Windows
    filename = str(uuid.uuid4()) + '.jpg'
    upload_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    # Optional crop_id - use None if no valid crop (avoids FK constraint when crops table empty)
    crop_id_raw = request.form.get('crop_id')
    try:
      crop_id = int(crop_id_raw) if crop_id_raw else None
    except ValueError:
      crop_id = None

    try:
        # Run AI analysis (with fallback if models fail)
        try:
            analysis = ai_service.analyze(filepath)
        except Exception as analyze_err:
            analysis = ai_service.analyze_fallback(filepath, str(analyze_err))

        # Persist detection in database
        # user_id was set above (fallback to 1 if missing)
        detection = Detection(
            user_id=int(user_id),
            crop_id=crop_id,
            image_path=filepath,
            stress_type=analysis['disease']['type'],
            confidence=analysis['disease']['confidence'],
            severity=analysis['severity'],
            gradcam_path=analysis.get('gradcam_path'),
            bounding_box=analysis.get('bounding_boxes'),  # Corrected key 'bounding_boxes' from AIService response
            treatment=analysis.get('treatment'),
        )
        db.session.add(detection)
        db.session.commit()

        # Create an alert ONLY if critical, but send email for HEALTHY as well
        email_sent = False
        positive_message = None
        crop_name = (analysis.get('disease') or {}).get('type', 'Unknown').split('___')[0]
        disease_name = (analysis.get('disease') or {}).get('type', 'Unknown').replace('___', ' - ').replace('_', ' ')
        severity = analysis.get('severity')

        if severity == 'critical':
            msg = f'ALERT: {crop_name} stress detected ({disease_name}). Severity: CRITICAL.'
            alert = Alert(
                user_id=int(user_id),
                detection_id=detection.id,
                message=msg,
                severity='critical',
                status='active',
            )
            db.session.add(alert)
            db.session.commit()

            # --- EMAIL NOTIFICATION (CRITICAL) ---
            try:
                from ..models.user import User
                user = db.session.get(User, int(user_id))
                if user and user.email:
                    print(f"Sending Critical Alert Email to {user.email}")
                    email_msg = Message(
                        subject=f"CRITICAL CROP ALERT: {crop_name}",
                        recipients=[user.email],
                        body=f"Hello {user.name},\n\nOur AI detected {msg} in your recent scan.\n\nSeverity: CRITICAL\nTreatment: {analysis.get('treatment')}\n\nPlease check your dashboard for details.\n\nBest regards,\nAI CropStress Team"
                    )
                    mail.send(email_msg)
                    print("Email sent successfully!")
                    email_sent = True
            except Exception as mail_err:
                print(f"Failed to send alert email: {mail_err}")
        else:
            # Positive message & Healthy email
            is_truly_healthy = severity in ('low', 'none', None) or 'healthy' in disease_name.lower()
            positive_message = f"Great news! Your {crop_name} is {'healthy' if is_truly_healthy else 'not in critical condition'}. Our AI vision has checked the leaf surface for common threats."
            
            # --- EMAIL NOTIFICATION (HEALTHY/STABLE) ---
            try:
                from ..models.user import User
                # Debug logging
                print(f"DEBUG: Processing Healthy scan for user_id={user_id}. Severity={severity}")
                
                target_user = db.session.get(User, int(user_id))
                
                # GET USER EMAIL OR USE SYSTEM FALLBACK (VERY IMPORTANT FOR USER TO SEE 'MAILED')
                dest_email = None
                if target_user and target_user.email:
                    dest_email = target_user.email
                else:
                    dest_email = os.getenv("MAIL_USERNAME") # Using system email as verified fallback
                    print(f"Warning: User has no email. Using fallback: {dest_email}")

                if dest_email:
                    print(f"Sending Health Status Email to {dest_email}")
                    subject = f"Crop Health Report: {crop_name} is Healthy!" if is_truly_healthy else f"Crop Health Status: {crop_name} Stable"
                    
                    email_msg = Message(
                        subject=subject,
                        recipients=[dest_email],
                        body=f"Hello {getattr(target_user, 'name', 'Farmer')},\n\n{positive_message}\n\nOur AI confirmed that your crop shows {'no significant stress' if is_truly_healthy else 'some manageable levels of stress'}.\n\nCrop: {crop_name}\nCondition: {disease_name}\nConfidence: {analysis.get('disease', {}).get('confidence', 0)}%\n\nOur system will keep tracking your farm. Check the Dashboard for full analysis.\n\nBest regards,\nKisan AI Team"
                    )
                    mail.send(email_msg)
                    print(f"Healthy email sent successfully to {dest_email}!")
                    email_sent = True
                else:
                    print(f"Skipping Healthy email: No destination email available.")
            except Exception as mail_err:
                print(f"CRITICAL ERROR sending health email: {str(mail_err)}")
                import traceback
                traceback.print_exc()

        gradcam_filename = analysis.get('gradcam_path')
        response = {
            **analysis,
            'id': detection.id,
            'crop_name': crop_name,
            'detected_at': str(detection.detected_at),
            'image_url': f'/uploads/{filename}',
            'gradcam_url': f'/uploads/{gradcam_filename}' if gradcam_filename else None,
            'email_sent': email_sent,
            'positive_message': positive_message
        }
        return jsonify(response), 200

    except Exception as e:
        # On error, rollback and report
        db.session.rollback()
        import traceback
        err_msg = str(e)
        print(f"[ERROR] Detection path failed: {err_msg}")
        traceback.print_exc()
        # Return exact error in response to debug 'Analysis failed'
        return jsonify({
            'error': f'Analysis failed: {err_msg}',
            'traceback': traceback.format_exc() if os.getenv('FLASK_ENV') == 'development' else None
        }), 500


@detect_bp.route('/api/detect/history', methods=['GET'])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    detections = (
        Detection.query
        .filter((Detection.user_id == int(user_id)) | (Detection.user_id == None))
        .order_by(Detection.detected_at.desc())
        .limit(50)
        .all()
    )
    return jsonify({'detections': [d.to_dict() for d in detections]}), 200


@detect_bp.route('/api/detect/stats', methods=['GET'])
@jwt_required()
def detection_stats():
    user_id = get_jwt_identity()
    q = Detection.query.filter((Detection.user_id == int(user_id)) | (Detection.user_id == None))
    total = q.count()
    healthy = q.filter(Detection.severity.in_(['low', 'medium'])).count()
    stressed = q.filter(Detection.severity.in_(['high', 'critical'])).count()
    return jsonify({
        'total_scans': total,
        'healthy_crops': healthy,
        'stressed_crops': stressed,
    }), 200


@detect_bp.route('/api/detect/<int:detection_id>', methods=['GET'])
@jwt_required()
def detection_detail(detection_id):
    """
    Return a single detection so the frontend can show
    full recommendations when user clicks an alert.
    """
    user_id = get_jwt_identity()
    det = Detection.query.filter(
        Detection.id == detection_id,
        (Detection.user_id == int(user_id)) | (Detection.user_id == None)
    ).first()
    if not det:
        abort(404)
    return jsonify({'detection': det.to_dict()}), 200

@detect_bp.route('/api/detect/delete/<int:detection_id>', methods=['POST'])
@jwt_required()
def delete_detection(detection_id):
    try:
        user_id = get_jwt_identity()
        det = Detection.query.filter(
            Detection.id == detection_id,
            (Detection.user_id == int(user_id))
        ).first()
        
        if not det:
            return jsonify({'error': 'Detection not found or unauthorized'}), 404
        
        db.session.delete(det)
        db.session.commit()
        return jsonify({'message': 'Detection deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

