import cv2
import numpy as np
import os

uploads_dir = os.path.join('backend', 'uploads')
files = [os.path.join(uploads_dir, f) for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('gradcam_')][:6]

for filepath in files:
    img = cv2.imread(filepath)
    if img is None: continue

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Leaf Mask (Exclude background)
    _, mask_leaf = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY)
    leaf_pixels = max(1, np.sum(mask_leaf > 0))

    # 2. Pure Green Mask (Healthy tissue)
    # Green Hue is roughly 35-85, Saturation > 40, Value > 50
    lower_green = np.array([35, 40, 50])
    upper_green = np.array([85, 255, 255])
    mask_green = cv2.inRange(hsv, lower_green, upper_green)
    mask_green_leaf = cv2.bitwise_and(mask_green, mask_green, mask=mask_leaf)

    # 3. Dark Necrotic / Blight Spot Mask (Black, Dark Brown spots on leaf)
    # Dark spots have low brightness V < 75 within the leaf area
    mask_dark_spots = (gray < 75) & (mask_leaf > 0)

    # 4. Brown / Yellow / Red Lesion Mask
    lower_brown = np.array([0, 30, 20])
    upper_brown = np.array([30, 255, 220])
    mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)
    mask_brown_leaf = cv2.bitwise_and(mask_brown, mask_brown, mask=mask_leaf)

    # Combine all disease/lesion spot masks
    mask_disease_spots = cv2.bitwise_or(mask_dark_spots.astype(np.uint8)*255, mask_brown_leaf)

    green_pct = (np.sum(mask_green_leaf > 0) / leaf_pixels) * 100.0
    disease_spot_pct = (np.sum(mask_disease_spots > 0) / leaf_pixels) * 100.0

    print("\n----------------------------------------------")
    print(f"File: {os.path.basename(filepath)}")
    print(f"  🌿 Green Ratio: {green_pct:.1f}%")
    print(f"  🚨 Disease / Dark Spot Ratio: {disease_spot_pct:.1f}%")

    if disease_spot_pct >= 6.0 or green_pct < 45.0:
        print("  ==> RESULT: DISEASED / CRITICAL LEAF ⚠️")
    else:
        print("  ==> RESULT: HEALTHY LEAF 🌿")
