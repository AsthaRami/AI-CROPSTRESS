from flask import Blueprint, jsonify
import random

market_bp = Blueprint('market', __name__)

@market_bp.route('/api/market/latest', methods=['GET'])
def get_market_prices():
    from datetime import datetime
    
    crops = [
        {'crop': 'Wheat', 'mandi': 'Rajkot', 'base': 2600, 'msp': 2585},
        {'crop': 'Rice', 'mandi': 'Karnal', 'base': 3700, 'msp': 2183},
        {'crop': 'Cotton', 'mandi': 'Rajkot', 'base': 5600, 'msp': 6620},
        {'crop': 'Soybean', 'mandi': 'Indore', 'base': 4400, 'msp': 4600},
        {'crop': 'Tomato', 'mandi': 'Bangalore', 'base': 1800, 'msp': 0},
        {'crop': 'Potato', 'mandi': 'Agra', 'base': 1200, 'msp': 0},
        {'crop': 'Onion', 'mandi': 'Lasalgaon', 'base': 1800, 'msp': 0},
        {'crop': 'Bajra', 'mandi': 'Jaipur', 'base': 2200, 'msp': 2500},
        {'crop': 'Mustard', 'mandi': 'Bharatpur', 'base': 5200, 'msp': 5650}
    ]
    
    data = []
    for c in crops:
        change_pct = float(random.uniform(-2, 3))
        # Use string formatting for display, manual calculation for final price
        change_val = float(f"{change_pct:.1f}")
        
        base_price = float(c['base'])
        final_price = int(base_price * (1 + change_val/100.0))
        
        # Ensure msp is treated as int
        msp_val = int(c.get('msp', 0))
        msp_display = f"₹{msp_val}/q" if msp_val > 0 else 'N/A'
        
        data.append({
            'crop': c['crop'],
            'mandi': c['mandi'],
            'price': f"₹{final_price:,}/q",
            'change': f"{'+' if change_val > 0 else ''}{change_val}%",
            'trend': 'up' if change_val > 0 else 'down',
            'msp': msp_display
        })
    
    return jsonify({'prices': data, 'date': datetime.now().strftime('%B %d, %Y')}), 200
