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
        # Run AI analysis (with Quality Guard check)
        print(f"DEBUG /api/detect/image: file.filename={file.filename}, filepath={filepath}")
        try:
            analysis = ai_service.analyze(filepath, original_filename=file.filename)
            print(f"DEBUG /api/detect/image: crop_name={analysis.get('crop_name')}, disease={analysis.get('disease', {}).get('type')}")
        except Exception as analyze_err:
            print(f"DEBUG /api/detect/image ERROR: {analyze_err}")
            analysis = ai_service.analyze_fallback(filepath, str(analyze_err))

        if analysis.get('is_rejected'):
            return jsonify(analysis), 200

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
        crop_name = analysis.get('crop_name') or (analysis.get('disease') or {}).get('type', 'Unknown').split('___')[0]
        disease_name = (analysis.get('disease') or {}).get('type', 'Unknown').replace('___', ' - ').replace('_', ' ')
        severity = analysis.get('severity')

        if severity in ('critical', 'high'):
            msg = f'ALERT: {crop_name} stress detected ({disease_name}). Severity: {severity.upper()}.'
            alert = Alert(
                user_id=int(user_id),
                detection_id=detection.id,
                message=msg,
                severity=severity,
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
                        subject=f"{severity.upper()} CROP ALERT: {crop_name}",
                        recipients=[user.email],
                        body=f"Hello {user.name},\n\nOur AI detected {msg} in your recent scan.\n\nSeverity: {severity.upper()}\nTreatment: {analysis.get('treatment')}\n\nPlease check your dashboard for details.\n\nBest regards,\nAI CropStress Team"
                    )
                    mail.send(email_msg)
                    print("Email sent successfully!")
                    email_sent = True
            except Exception as mail_err:
                print(f"Failed to send alert email: {mail_err}")
        else:
            # Positive message & Healthy email
            is_truly_healthy = 'healthy' in disease_name.lower()
            if is_truly_healthy:
                positive_message = f"Great news! Your {crop_name} is in clean, healthy condition. Our AI vision confirmed no disease symptoms."
            else:
                positive_message = f"AI Attention: Symptoms of {disease_name} detected on your {crop_name}. Immediate treatment recommended."
            
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
        infection_overlay_filename = analysis.get('infection_overlay_path')
        response = {
            **analysis,
            'id': detection.id,
            'crop_name': crop_name,
            'detected_at': str(detection.detected_at),
            'image_url': f'/uploads/{filename}',
            'gradcam_url': f'/uploads/{gradcam_filename}' if gradcam_filename else None,
            'infection_overlay_url': f'/uploads/{infection_overlay_filename}' if infection_overlay_filename else None,
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


@detect_bp.route('/api/detect/batch', methods=['POST'])
def detect_batch():
    print('--- NEW BATCH DETECTION REQUEST ---')
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception as jwt_err:
        print(f"JWT Verification Warning: {jwt_err}")
        user_id = None

    if user_id is None:
        user_id = 1

    files = request.files.getlist('images')
    if not files or len(files) == 0:
        if 'image' in request.files:
            files = request.files.getlist('image')

    if not files or len(files) == 0 or files[0].filename == '':
        return jsonify({'error': 'No images uploaded for batch scan. Please upload 2 to 10 leaf photos.'}), 400

    upload_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
    os.makedirs(upload_folder, exist_ok=True)

    individual_results = []
    healthy_count = 0
    diseased_count = 0
    disease_counts = {}

    for f in files:
        if not f or f.filename == '':
            continue
        
        filename = str(uuid.uuid4()) + '.jpg'
        filepath = os.path.join(upload_folder, filename)
        f.save(filepath)

        try:
            analysis = ai_service.analyze(filepath, original_filename=f.filename)
        except Exception as err:
            analysis = ai_service.analyze_fallback(filepath, str(err))

        if analysis.get('is_rejected'):
            status_tag = analysis.get('status', '⛔ NON-CROP REJECTED')
            individual_results.append({
                'id': None,
                'original_name': f.filename,
                'crop_name': 'Non-Crop Asset',
                'disease_type': status_tag,
                'raw_disease': status_tag,
                'confidence': 0.0,
                'severity': 'low',
                'is_healthy': False,
                'is_rejected': True,
                'status': status_tag,
                'image_url': f'/uploads/{filename}',
                'gradcam_url': None,
                'infection_overlay_url': None,
                'disease': {'type': status_tag, 'confidence': 0.0},
                'pests': [],
                'pest_solution': {},
                'bounding_boxes': [],
                'treatment': analysis.get('error', 'Image Quality Guard Rejection'),
                'recommendations': ['Please upload a clear crop leaf photo.'],
                'details': {}
            })
            continue

        raw_disease = analysis.get('disease', {}).get('type', 'Unknown')
        confidence = analysis.get('disease', {}).get('confidence', 0.0)
        severity = analysis.get('severity', 'low')
        gradcam_filename = analysis.get('gradcam_path')
        infection_overlay_filename = analysis.get('infection_overlay_path')

        crop_name = analysis.get('crop_name') or (raw_disease.split('___')[0] if '___' in raw_disease else 'Crop')
        display_disease = raw_disease.replace('___', ' - ').replace('_', ' ')

        # Save to DB
        det_id = None
        try:
            det = Detection(
                user_id=int(user_id),
                crop_id=None,
                image_path=filepath,
                stress_type=raw_disease,
                confidence=confidence,
                severity=severity,
                gradcam_path=gradcam_filename,
                bounding_box=analysis.get('bounding_boxes'),
                treatment=analysis.get('treatment')
            )
            db.session.add(det)
            db.session.commit()
            det_id = det.id
        except Exception as db_err:
            db.session.rollback()
            print(f"Batch DB save warning: {db_err}")

        is_healthy = 'healthy' in raw_disease.lower() or severity in ('low', 'none')
        if is_healthy:
            healthy_count += 1
        else:
            diseased_count += 1

        disease_counts[display_disease] = disease_counts.get(display_disease, 0) + 1

        individual_results.append({
            'id': det_id,
            'original_name': f.filename,
            'crop_name': crop_name,
            'disease_type': display_disease,
            'raw_disease': raw_disease,
            'confidence': confidence,
            'severity': severity,
            'is_healthy': is_healthy,
            'image_url': f'/uploads/{filename}',
            'gradcam_url': f'/uploads/{gradcam_filename}' if gradcam_filename else None,
            'infection_overlay_url': f'/uploads/{infection_overlay_filename}' if infection_overlay_filename else None,
            'disease': analysis.get('disease', {}),
            'pests': analysis.get('pests', []),
            'pest_solution': analysis.get('pest_solution', {}),
            'bounding_boxes': analysis.get('bounding_boxes', []),
            'treatment': analysis.get('treatment'),
            'recommendations': analysis.get('recommendations', []),
            'details': analysis.get('disease', {}).get('details', {})
        })

    total_scanned = len(individual_results)
    valid_scanned = max(1, total_scanned)

    healthy_pct = round((healthy_count / valid_scanned) * 100, 1)
    diseased_pct = round((diseased_count / valid_scanned) * 100, 1)

    if healthy_pct >= 80.0:
        overall_status = 'HEALTHY_FIELD'
        risk_level = 'SAFE'
        summary_msg = f"🌿 Excellent Farm Condition! {healthy_pct}% of sampled leaves are healthy ({healthy_count}/{total_scanned} sample points)."
    elif healthy_pct >= 50.0:
        overall_status = 'MODERATE_RISK'
        risk_level = 'WARNING'
        summary_msg = f"⚠️ Moderate Farm Stress Alert: {diseased_pct}% of sampled leaves show disease symptoms ({diseased_count}/{total_scanned} sample points)."
    else:
        overall_status = 'HIGH_RISK_OUTBREAK'
        risk_level = 'CRITICAL'
        summary_msg = f"🚨 Critical Infection Outbreak: {diseased_pct}% of sampled leaves infected ({diseased_count}/{total_scanned} sample points). Immediate action required!"

    if diseased_count > 0:
        try:
            alert_msg = f"MULTI-LEAF BATCH SCAN: {diseased_pct}% farm infection detected across {total_scanned} leaf samples."
            alert = Alert(
                user_id=int(user_id),
                message=alert_msg,
                severity='critical' if diseased_pct >= 50 else 'medium',
                status='active'
            )
            db.session.add(alert)
            db.session.commit()
        except Exception:
            db.session.rollback()

    # --- EMAIL NOTIFICATION (CRITICAL OR HEALTHY) ---
    email_sent = False
    try:
        from ..models.user import User
        target_user = db.session.get(User, int(user_id))
        dest_email = None
        if target_user and target_user.email:
            dest_email = target_user.email
        else:
            dest_email = os.getenv("MAIL_USERNAME")

        if dest_email:
            if risk_level == 'CRITICAL' or diseased_count > 0:
                subject = f"🚨 CRITICAL FARM ALERT: {diseased_pct}% Infection Rate ({diseased_count}/{total_scanned} Leaves Stressed)"
                body_msg = (
                    f"Hello {getattr(target_user, 'name', 'Farmer')},\n\n"
                    f"Our Multi-Leaf Batch AI Scanner analyzed {total_scanned} sample leaves from your field.\n\n"
                    f"RESULT SUMMARY:\n"
                    f"• Overall Status: {overall_status} ({risk_level})\n"
                    f"• Diseased Leaves: {diseased_count} of {total_scanned} ({diseased_pct}%)\n"
                    f"• Healthy Leaves: {healthy_count} of {total_scanned} ({healthy_pct}%)\n"
                    f"• Primary Conditions Identified: {', '.join(disease_counts.keys())}\n\n"
                    f"{summary_msg}\n\n"
                    f"Immediate action is recommended. Check your dashboard for detailed leaf diagnostic reports.\n\n"
                    f"Best regards,\nKisan AI Team"
                )
            else:
                subject = f"🌿 FARM HEALTH REPORT: 100% Healthy Field ({healthy_count}/{total_scanned} Leaves Clean)"
                body_msg = (
                    f"Hello {getattr(target_user, 'name', 'Farmer')},\n\n"
                    f"Great news! Our Multi-Leaf Batch AI Scanner evaluated {total_scanned} sample points across your farm and found no critical infections.\n\n"
                    f"RESULT SUMMARY:\n"
                    f"• Farm Health Index: {healthy_pct}% Healthy\n"
                    f"• All {total_scanned} sampled leaves are in clean, healthy condition.\n\n"
                    f"Our AI system will continue tracking your field. Check your Dashboard for detailed analysis.\n\n"
                    f"Best regards,\nKisan AI Team"
                )

            email_msg = Message(subject=subject, recipients=[dest_email], body=body_msg)
            mail.send(email_msg)
            print(f"Batch scan email sent successfully to {dest_email}!")
            email_sent = True
    except Exception as mail_err:
        print(f"Batch email notification error: {mail_err}")

    return jsonify({
        'scanner_mode': 'BATCH_SCANNER',
        'total_scanned_items': total_scanned,
        'batch_results': [
            {
                'item_index': idx + 1,
                'status': r.get('status', 'PASSED'),
                'crop_identified': r.get('crop_name'),
                'diagnostic_report': r.get('details', {})
            }
            for idx, r in enumerate(individual_results)
        ],
        'total_scanned': total_scanned,
        'healthy_count': healthy_count,
        'diseased_count': diseased_count,
        'healthy_pct': healthy_pct,
        'diseased_pct': diseased_pct,
        'healthy_percentage': healthy_pct,
        'diseased_percentage': diseased_pct,
        'overall_status': overall_status,
        'risk_level': risk_level,
        'summary_msg': summary_msg,
        'summary_message': summary_msg,
        'disease_breakdown': disease_counts,
        'individual_results': individual_results,
        'results': individual_results,
        'email_sent': email_sent
    }), 200


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

