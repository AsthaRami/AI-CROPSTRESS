import os
from flask import Blueprint, request, jsonify
from deep_translator import GoogleTranslator
import wikipedia

# Set up Wikipedia
wikipedia.set_lang("en")

global HAS_GENAI
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

kisan_bot_bp = Blueprint('kisan_bot', __name__)

KNOWLEDGE_BASE = {
    "tomato": {
        "growth": "Tomatoes need 6-8 hours of sunlight. Use well-drained soil rich in organic matter. Space plants 2 feet apart.",
        "pests": "Watch for aphids and fruit borers. Use Neem oil spray or yellow sticky traps.",
        "fertilizer": "Apply balanced NPK (19:19:19) during planting and increase Phosphorus (12:61:0) when flowering starts.",
        "harvest": "Harvest when fruits are uniform red but still firm. Avoid picking in the middle of a hot day.",
        "default": "Tomatoes are a warm-season crop. Deep watering is key."
    },
    "potato": {
        "growth": "Plant potato tubers 4 inches deep. Hill the soil around stems as they grow to protect tubers from sunlight.",
        "pests": "Potato beetles and Blight are common. Handpick beetles or use Copper-based fungicides.",
        "fertilizer": "Potatoes love Potassium. Use wood ash or SOP (Sulphate of Potash) during the bulking stage.",
        "harvest": "Harvest when vines have died back. Let tubers sit in the ground for 2 weeks to toughen the skin.",
        "default": "Potatoes are root crops requiring loose soil. Watch out for early blight."
    },
    "wheat": {
        "growth": "Sow wheat in cool weather. It requires 4-6 irrigations—the CRI (Crown Root Initiation) stage is most critical.",
        "pests": "Watch for Rust, Smut, and Aphids. Use resistant varieties and avoid over-nitrogen application.",
        "fertilizer": "Apply Urea in split doses. DAP (Di-Ammonium Phosphate) should be given at the time of sowing.",
        "harvest": "Harvest when the grain is hard and the moisture level is below 12%. The straw should be golden yellow.",
        "default": "Wheat is a major cereal crop. Timing of sowing and irrigation are completely crucial."
    },
    "cotton": {
        "growth": "Cotton needs deep well-drained loamy soil. Maintain constant moisture but avoid waterlogging.",
        "pests": "Bollworms and Jassids are threats. Use Pheromone traps and Neem based pesticides.",
        "fertilizer": "Needs high Nitrogen. Apply Urea after first weeding and flowering.",
        "harvest": "Pick cotton when bolls are fully open and dry. Avoid picking wet cotton as it reduces quality.",
        "default": "Cotton is a major cash crop. Protect it from whiteflies and bollworms."
    },
    "rice": {
        "growth": "Maintain 5cm standing water in the initial stages. Use transplanting method for better yield.",
        "pests": "Brown Plant Hopper and Stem Borer. Use light traps and maintain field hygiene.",
        "fertilizer": "Zinc deficiency is common in rice. Apply Zinc Sulphate (25kg/ha).",
        "harvest": "Harvest when 80% of the panicles turn golden yellow. Drain the field 10 days before harvest.",
        "default": "Rice (Paddy) requires significant water and nitrogen for tillering."
    },
    "onion": {
        "growth": "Onions need well-worked soil. Plant seedlings at 10-15 cm spacing. Avoid deep planting.",
        "pests": "Thrips and Purple Blotch. Use intercropping with marigold and apply sulfur-based sprays.",
        "fertilizer": "Apply 100kg Nitrogen per hectare in 3 doses. Avoid late Nitrogen as it causes thick necks.",
        "harvest": "Harvest when 50% of the tops fall over. Cure in shade for 10-15 days for better shelf life.",
        "default": "Onions are shallow rooted and need consistent moisture."
    },
    "seed": { "default": "Always buy certified seeds. Treat seeds with Trichoderma before sowing." },
    "irrigation": { "default": "Drip irrigation can save up to 70% water." },
    "pest": { "default": "Identify the pest first. For sucking pests, use Neem oil." },
    "water": { "default": "Irrigate during early morning or late evening." },
    "soil": { "default": "Get your soil tested every 2 years from a KVK." },
    "organic": { "default": "Use Jeevamrut and Neem oil for organic farming." },
    "market": { "default": "Check e-NAM or your local Mandi portal for latest rates." },
    "weather": { "default": "Weather updates can be monitored closely via your app dashboard." }
}

def translate_text(text, source='auto', target='en'):
    if target == 'en' and source == 'en': return text
    try:
        if target == 'en':
            return GoogleTranslator(source='auto', target='en').translate(text)
        else:
            return GoogleTranslator(source='en', target=target).translate(text)
    except Exception:
        return text

def advanced_offline_processor(msg_native, lang):
    # 1. Translate user message to English to parse intents
    msg_en = translate_text(msg_native, target='en').lower()
    
    # Check general intents
    if any(w in msg_en for w in ["help", "who", "what are you"]):
        ans_en = "I am Kisan AI, your agricultural assistant. I can answer all types of crop-related questions!"
        return translate_text(ans_en, target=lang)
    
    # 2. Check local expert Knowledge Base
    found_answer = None
    for crop, data in KNOWLEDGE_BASE.items():
        if crop in msg_en:
            if any(w in msg_en for w in ["pest", "insect", "disease", "rot"]): 
                found_answer = data.get("pests", data.get("default"))
            elif any(w in msg_en for w in ["fertilizer", "urea", "dap", "npk"]): 
                found_answer = data.get("fertilizer", data.get("default"))
            elif any(w in msg_en for w in ["harvest", "picking", "cut"]): 
                found_answer = data.get("harvest", data.get("default"))
            elif "growth" in data:
                found_answer = data["growth"]
            else:
                found_answer = data.get("default")
            break
            
    if found_answer:
        return translate_text(found_answer, target=lang)

    # 3. Wikipedia Fallback for "All Types of Questions"
    try:
        # Extract main nouns/keywords roughly
        keywords = ' '.join([w for w in msg_en.split() if w not in ['what', 'is', 'the', 'how', 'to', 'grow', 'a', 'an', 'in', 'of', 'for']])
        if not keywords: keywords = msg_en
        
        # Search wiki for agricultural context
        search_results = wikipedia.search(keywords + " agriculture crop")
        if search_results:
            summary = wikipedia.summary(search_results[0], sentences=2)
            ans_en = f"According to Wikipedia: {summary}"
            return translate_text(ans_en, target=lang)
    except Exception as e:
        print("Wiki Error:", str(e))
        pass

    # 4. Ultimate Fallback
    ans_en = "That is a great agricultural question. Please ensure your soil pH is balanced, and use our Crop Scanner for detailed diagnostics."
    return translate_text(ans_en, target=lang)


@kisan_bot_bp.route('/api/kisan-bot/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"key": "default", "response": "Hello! How can I help?"}), 200
            
        message = data.get('message', '').strip()
        lang = data.get('lang', 'en')
        
        if not message:
             return jsonify({"key": "default", "response": "Please ask a question."}), 200

        # Attempt to use primary GenAI (Google Gemini)
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if HAS_GENAI and api_key and api_key != "AIzaSyXXXXXX":
            try:
                genai.configure(api_key=api_key)
                # Fallback sequentially through models starting with flash 1.5
                model = genai.GenerativeModel('gemini-1.5-flash')
                
                lang_map = {'en': 'English', 'hi': 'Hindi', 'gu': 'Gujarati'}
                target_lang = lang_map.get(lang, 'English')
                
                system_prompt = f"You are 'Kisan AI', an agricultural assistant bot for farmers. Answer queries thoughtfully in {target_lang}."
                response = model.generate_content(f"{system_prompt}\n\nUser Question: {message}")
                
                return jsonify({"key": "dynamic", "response": response.text.strip()}), 200
            except Exception as model_err:
                print(f"GenAI API Error (falling back to offline Wikipedia logic): {str(model_err)}")
                pass

        # If GenAI fails (missing key, 404 model not found, library error), use our Smart Offline KNOWLEDGE + Wiki tool
        final_answer = advanced_offline_processor(message, lang)
        return jsonify({"key": "dynamic", "response": final_answer}), 200
        
    except Exception as e:
        print(f"CRITICAL ERROR in kisan-bot: {e}")
        return jsonify({"key": "default", "response": "System error. Please try again later."}), 200ह एक उत्कृष्ट कृषि प्रश्न है। विस्तृत निदान के लिए, मैं पत्तियों पर हमारे क्रॉप स्कैनर का उपयोग करने, या मिट्टी की नमी की बारीकी से निगरानी करने की सलाह देता हूं।"
           ans_gu = "આ એક ઉત્કૃષ્ટ કૃષિ પ્રશ્ન છે. વિગતવાર નિદાન માટે, હું પાંદડા પર અમારા પાક સ્કેનરનો ઉપયોગ કરવાની અથવા જમીનના ભેજનું નિરીક્ષણ કરવાની ભલામણ કરું છું."

        # Select translated fallback
        final_ans = ans_en
        if lang == 'hi': final_ans = ans_hi
        elif lang == 'gu': final_ans = ans_gu
        
        return jsonify({"key": "dynamic", "response": final_ans}), 200

