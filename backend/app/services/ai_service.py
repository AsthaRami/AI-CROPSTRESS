# TensorFlow import moved inside class for lazy loading
import numpy as np
import cv2
import os, uuid, json

class AIService:
    def __init__(self):
        print('Loading AI models...')
        self.backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        self.models_dir = os.path.join(self.backend_dir, 'ml_models')
        self.uploads_dir = os.path.join(self.backend_dir, 'uploads')

        # Load class names
        class_file = os.path.join(self.models_dir, 'class_names.json')
        if os.path.exists(class_file):
            with open(class_file) as f:
                self.CLASS_NAMES = json.load(f)
            print(f'Loaded {len(self.CLASS_NAMES)} classes: {self.CLASS_NAMES[:3]}...')
        else:
            self.CLASS_NAMES = ['Tomato___Early_blight']
            print('WARNING: class_names.json not found!')

        # Load disease model (Lazy and safe)
        model_path = os.path.join(self.models_dir, 'plant_model.keras')
        if os.path.exists(model_path):
            try:
                import tensorflow as tf
                self.disease_model = tf.keras.models.load_model(model_path)
                print('Real model loaded.')
            except Exception as e:
                print(f'ERROR: Could not load disease model: {e}')
                self.disease_model = None
        else:
            self.disease_model = None
            print('WARNING: Model not found!')

        # Load pest model
        try:
            from ultralytics import YOLO
            pest_path = os.path.join(self.models_dir, 'yolov8_pest.pt')
            if os.path.exists(pest_path):
                self.pest_model = YOLO(pest_path)
            else:
                self.pest_model = None
        except:
            self.pest_model = None

        print('AI service ready.')

    def preprocess_image(self, image_path):
        """
        EfficientNetB0 needs RAW pixels [0-255] float32.
        NO normalization! Model handles it internally.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image at {image_path}")

        img = cv2.resize(img, (224, 224))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.astype(np.float32)  # NO /255.0 !!
        return np.expand_dims(img, axis=0)

    def classify_disease(self, processed_img):
        if self.disease_model is None:
            return {'type': 'Unknown', 'confidence': 0.0, 'top_predictions': []}
        try:
            import tensorflow as tf
            predictions = self.disease_model.predict(processed_img)
        except Exception as e:
            print(f"Prediction Error: {e}")
            return {'type': 'Error during analysis', 'confidence': 0.0, 'top_predictions': []}
        probs = predictions.flatten().astype(float)
        class_idx = int(np.argmax(probs))
        confidence = float(probs[class_idx]) * 100

        top_k = int(min(3, len(probs)))
        top_idx = np.argsort(probs)[::-1][:top_k].tolist()
        top_predictions = [
            {
                'type': self.CLASS_NAMES[int(i)] if int(i) < len(self.CLASS_NAMES) else 'Unknown',
                'confidence': round(float(probs[int(i)]) * 100, 2),
            }
            for i in top_idx
        ]
        return {
            'type': self.CLASS_NAMES[class_idx] if class_idx < len(self.CLASS_NAMES) else 'Unknown',
            'confidence': round(confidence, 2),
            'top_predictions': top_predictions,
        }

    def detect_pests(self, image_path):
        if self.pest_model is None:
            return []
        try:
            results = self.pest_model(image_path, conf=0.5)
            return [{'pest': results[0].names[int(b.cls)], 'confidence': round(float(b.conf)*100,2), 'bbox': b.xyxy[0].tolist()} for b in results[0].boxes]
        except:
            return []

    def calculate_severity(self, disease, pests):
        name = (disease.get('type') or '').lower()
        if 'healthy' in name:
            return 'low'
            
        conf = disease.get('confidence', 0)
        if conf >= 90 or len(pests) >= 3: return 'critical'
        elif conf >= 75: return 'high'
        elif conf >= 50: return 'medium'
        return 'low'

    def generate_gradcam(self, image_path):
        img = cv2.imread(image_path)
        if img is None:
            return None
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_small = cv2.resize(img_rgb, (224, 224))
        channel = img_small[:, :, 1]
        channel_norm = cv2.normalize(channel, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        heatmap = cv2.applyColorMap(channel_norm, cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(img_small, 0.62, heatmap, 0.38, 0)
        os.makedirs(self.uploads_dir, exist_ok=True)
        filename = f'gradcam_{uuid.uuid4()}.jpg'
        save_path = os.path.join(self.uploads_dir, filename)
        cv2.imwrite(save_path, cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        return filename

    def _is_probably_leaf_photo(self, image_path: str) -> bool:
        # Always return True - let model decide
        return True

    def _treatment_and_recommendations(self, disease_type: str, severity: str):
        name = (disease_type or 'Unknown').lower().replace('_', ' ')
        recs = []
        treatment = 'Consult local agronomist for field-confirmed diagnosis.'
        
        details = {
            "cause": "Environmental stress or unclassified pathogen.",
            "symptoms": "Visual abnormalities, discoloration or lesions on leaf surface.",
            "prevention": "Maintain optimal soil health and field sanitation.",
            "chemical_control": [
                "Apply recommended broad-spectrum fungicide or pesticide.",
                "Ensure strict adherence to safety waiting periods before harvest.",
                "Consult local agri-dealer for precise regional chemical variants."
            ],
            "organic_control": [
                "Apply neem oil extract (5ml/L) directly to affected foliage.",
                "Use homemade sour buttermilk spray (5% solution) for fungal defense.",
                "Introduce beneficial biological predators if pest-related issues arise."
            ]
        }

        if 'healthy' in name:
            treatment = 'No disease detected. Plant is in optimal condition.'
            recs = ['Scout weekly.', 'Avoid overhead irrigation late in the day.', 'Maintain field sanitation.']
            details["cause"] = "N/A (Healthy)"
            details["symptoms"] = "Vibrant green leaves, rigid stem, absence of spots or necrosis."
            details["prevention"] = "Continue current optimal agricultural practices."
            details["chemical_control"] = [
                "No chemical treatment required.",
                "Maintain baseline soil nutrition with NPK fertilizers.",
                "Avoid unnecessary chemical exposure to protect plant immunity."
            ]
            details["organic_control"] = [
                "Continue routine organic composting.",
                "Use organic mulch for moisture retention and weed control.",
                "Maintain natural predator habitats to keep pests away."
            ]
            return treatment, recs, disease_type, details

        if 'strawberry' in name:
            if 'leaf scorch' in name:
                treatment = 'Apply fungicide; remove infected leaves; improve air circulation.'
                recs = ['Avoid excess nitrogen.', 'Keep patch weed-free.', 'Plant resistant varieties if replanting.']
                details["cause"] = "Diplocarpon earlianum (Fungus)"
                details["symptoms"] = "Irregular purplish-brown blotches on upper leaf surfaces."
                details["prevention"] = "Renew plantings every 3-4 years and maintain wide spacing."
            else:
                treatment = 'Manage humidity and remove infected parts. Use copper-based sprays.'
                recs = ['Minimize handling when wet.', 'Improve drainage.']
        elif 'late blight' in name:
            treatment = 'Remove infected leaves, avoid overhead irrigation, apply approved fungicide.'
            recs = ['Isolate affected plants.', 'Water early morning.', 'Rotate fungicides to reduce resistance.']
            details["cause"] = "Phytophthora infestans (Oomycete/Water Mold)"
            details["symptoms"] = "Large dark brown blotches with a pale green edge, often with white fungal growth on the underside."
            details["prevention"] = "Destroy cull piles, use certified disease-free seeds, establish proper drainage."
        elif 'early blight' in name:
            treatment = 'Remove infected foliage, improve airflow, apply protective fungicide.'
            recs = ['Mulch to reduce soil splash.', 'Rotate crops after harvest.']
            details["cause"] = "Alternaria solani (Fungus)"
            details["symptoms"] = "Brown or black spots with concentric rings (bullseye pattern) mainly on older lower leaves."
            details["prevention"] = "Use a 2-3 year crop rotation with non-solanaceous crops, stake plants to keep off soil."
        elif 'apple' in name:
            if 'scab' in name:
                treatment = 'Apply fungicides during rainy season; remove fallen leaves.'
                recs = ['Plant scab-resistant varieties.', 'Prune for sunlight.']
                details["cause"] = "Venturia inaequalis (Fungus)"
                details["symptoms"] = "Olive-green to black scabs or velvety spots on leaves and fruit."
                details["prevention"] = "Rake and destroy fallen leaves before spring to break the fungal life cycle."
            elif 'cedar' in name:
                treatment = 'Remove nearby cedar trees; apply protective fungicides in spring.'
                recs = ['Plant rust-resistant cultivars.']
                details["cause"] = "Gymnosporangium juniperi-virginianae (Fungus)"
                details["symptoms"] = "Yellow-orange lesions on apple leaves and galls on nearby cedar trees."
                details["prevention"] = "Eradicate eastern red cedars within a 2-mile radius if possible."
            else:
                treatment = 'Prune infected areas, apply balanced fertilizer.'
                recs = ['Improve airflow.', 'Remove mummified fruit.']
        elif 'grape' in name:
            if 'black rot' in name:
                treatment = 'Prune infected canes; apply fungicides from bud break.'
                recs = ['Ensure full sun.', 'Maintain clean vineyard.']
            else:
                treatment = 'Apply sulfur or copper-based fungicides.'
                recs = ['Prune to open canopy.']
        elif 'corn' in name or 'maize' in name:
            treatment = 'Use resistant hybrids and rotate crops.'
            recs = ['Manage crop residue.', 'Ensure balanced soil fertility.']
        elif 'orange' in name or 'citrus' in name:
            treatment = 'Control psyllid vectors; remove highly infected trees.'
            recs = ['Use certified disease-free nursery stock.']
        elif 'peach' in name:
            treatment = 'Prune infected twigs in winter; apply copper sprays before bud break.'
            recs = ['Avoid overhead watering.']
        elif 'tomato' in name:
            if 'bacterial spot' in name:
                treatment = 'Apply copper-based sprays; avoid overhead irrigation.'
                recs = ['Use disease-free seeds.', 'Disinfect tools.']
                details["cause"] = "Xanthomonas species (Bacteria)"
                details["symptoms"] = "Small, water-soaked, greasy spots that turn dark and become slightly raised."
                details["prevention"] = "Use drip irrigation instead of sprinklers, handle plants only when dry."
            elif 'mosaic' in name or 'curl' in name:
                treatment = 'Remove infected plants; control whiteflies/aphids.'
                recs = ['Use yellow sticky traps.', 'Avoid planting near infected crops.']
                details["cause"] = "Viral infection (e.g., TMV, TYLCV) transmitted by pests."
                details["symptoms"] = "Mottled light and dark green leaves, stunted growth, upward curling."
                details["prevention"] = "Control insect vectors, plant virus-resistant varieties, wash hands thoroughly."
            elif 'leaf mold' in name:
                treatment = 'Improve ventilation; apply fungicide.'
                recs = ['Reduce humidity in greenhouse.']
            elif 'spider mite' in name:
                treatment = 'Apply miticide; wash plants with water.'
                recs = ['Increase humidity around plants.']
            elif 'target spot' in name:
                treatment = 'Apply fungicide; remove infected leaves.'
                recs = ['Rotate crops.']
            elif 'septoria' in name:
                treatment = 'Remove infected leaves; apply fungicide.'
                recs = ['Avoid wetting foliage.', 'Mulch soil.']
                details["cause"] = "Septoria lycopersici (Fungus)"
                details["symptoms"] = "Numerous small, circular spots with dark borders and gray centers."
                details["prevention"] = "Deep plow crop debris, use organic mulch, implement a 2-year rotation."
            else:
                treatment = 'Consult local agronomist for this tomato disease.'
                recs = ['Re-scan with clearer image.']
        elif 'potato' in name:
            treatment = 'Remove infected tubers/leaves; apply approved fungicide immediately.'
            recs = ['Use certified seed potatoes.', 'Rotate crops.']
        elif 'pepper' in name:
            treatment = 'Apply copper-based spray; remove infected plants.'
            recs = ['Avoid overhead irrigation.']
        elif 'soybean' in name:
            treatment = 'Monitor and apply fungicide if needed.'
            recs = ['Rotate with non-host crops.']
        elif 'squash' in name:
            treatment = 'Apply sulfur-based fungicide; improve airflow.'
            recs = ['Avoid overhead watering.']
        else:
            recs = ['Re-scan with a clear, close leaf photo.', 'Consult local agronomist.']

        if severity in ('high', 'critical'):
            recs = ['Act within 24-48 hours to reduce yield loss.'] + recs

        display_name = disease_type
        return treatment, recs, display_name, details

    def analyze(self, image_path):
        processed = self.preprocess_image(image_path)
        disease = self.classify_disease(processed)
        pests = self.detect_pests(image_path)
        severity = self.calculate_severity(disease, pests)

        if float(disease.get('confidence') or 0.0) < 40.0:
            disease = {**disease, 'type': 'Uncertain'}
            severity = 'low'

        gradcam = self.generate_gradcam(image_path)
        treatment, recs, display_name, details = self._treatment_and_recommendations(disease.get('type'), severity)

        if display_name:
            disease['type'] = display_name
            
        disease['details'] = details

        return {
            'disease': disease,
            'pests': pests,
            'severity': severity,
            'gradcam_path': gradcam,
            'treatment': treatment,
            'recommendations': recs,
            'bounding_boxes': [p['bbox'] for p in pests]
        }

    def analyze_fallback(self, image_path: str, err: str):
        return {
            'disease': {'type': 'Uncertain', 'confidence': 0.0, 'top_predictions': []},
            'pests': [],
            'severity': 'low',
            'gradcam_path': None,
            'treatment': 'Analysis engine temporarily unavailable. Please try again.',
            'recommendations': ['Try a clearer image.', 'Restart backend if issue persists.'],
            'bounding_boxes': [],
            'debug_error': err,
        }