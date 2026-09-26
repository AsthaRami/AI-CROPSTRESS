import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../translations';

// Translation Dictionary for Crop Diseases & Diagnostic Reports across English, Hindi, and Gujarati
export const getTranslatedReportData = (report, diseaseObj, lang = 'en') => {
  if (!report && !diseaseObj) return {};

  const currentLang = ['gu', 'hi', 'en'].includes(lang) ? lang : 'en';
  const diseaseType = diseaseObj?.type || report?.pathogen_cause?.common_name || 'Crop___Healthy';
  const rawTypeLower = diseaseType.toLowerCase();
  const isHealthy = rawTypeLower.includes('healthy');
  const isOOD = diseaseObj?.is_ood || report?.is_ood || report?.ood_detection?.is_ood || ((diseaseObj?.confidence || 0) < 50 && !isHealthy);

  const statusTranslations = {
    gu: {
      healthy: 'તંદુરસ્ત પાક (ઉત્તમ સ્થિતિ)',
      critical: 'ગંભીર ચેપ રોગ (તત્કાલ પગલાં જરૂરી)',
      ood: 'અજાણ્યો રોગ / અણધારી સ્થિતિ (OOD તણાવ)'
    },
    hi: {
      healthy: 'स्वस्थ फसल (उत्कृष्ट स्थिति)',
      critical: 'गंभीर संक्रमण (तत्काल कार्रवाई आवश्यक)',
      ood: 'अज्ञात बीमारी / ओओडी तनाव'
    },
    en: {
      healthy: 'HEALTHY CROP (OPTIMAL)',
      critical: 'CRITICAL INFECTION OUTBREAK',
      ood: 'UNKNOWN / OUT-OF-DISTRIBUTION STRESS'
    }
  };

  const diseaseNameTranslations = {
    gu: {
      'Apple Scab': 'સફરજનમાં પોપડીનો રોગ (Apple Scab)',
      'Apple Black Rot': 'સફરજનનો કાળો સડો (Black Rot)',
      'Cedar Apple Rust': 'સફરજનનો ગેરુ રોગ (Cedar Rust)',
      'Grape Black Rot': 'દ્રાક્ષનો કાળો સડો (Black Rot)',
      'Potato Early Blight': 'બટાકાનો વહેલો સુકારો (Early Blight)',
      'Potato Late Blight': 'બટાકાનો પાછલો સુકારો (Late Blight)',
      'Tomato Early Blight': 'ટામેટાનો વહેલો સુકારો (Early Blight)',
      'Tomato Late Blight': 'ટામેટાનો પાછલો સુકારો (Late Blight)',
      'Tomato Yellow Leaf Curl Virus': 'ટામેટાનો પણ વણાટ વાયરસ (Yellow Leaf Curl)',
      'Tomato Mosaic Virus': 'ટામેટાનો મોઝેઇક વાયરસ',
      'Corn Common Rust': 'મકાઈનો ગેરુ રોગ (Common Rust)',
      'Corn Northern Leaf Blight': 'મકાઈનો ઉત્તરીય પણ સુકારો',
      'Healthy': 'તંદુરસ્ત પાક (કોઈ રોગ નથી)',
      'Unknown / Unclassified Disease': 'અજાણ્યો / અણધારી રોગ (OOD)'
    },
    hi: {
      'Apple Scab': 'सेब में पपड़ी रोग (Apple Scab)',
      'Apple Black Rot': 'सेब का काला सड़न रोग',
      'Cedar Apple Rust': 'सेब का गेरू रोग',
      'Grape Black Rot': 'अंगूर का काला सड़न',
      'Potato Early Blight': 'आलू का अगेती झुलसा रोग',
      'Potato Late Blight': 'आलू का पछेती झुलसा रोग',
      'Tomato Early Blight': 'टमाटर का अगेती झुलसा रोग',
      'Tomato Late Blight': 'टमाटर का पछेती झुलसा रोग',
      'Tomato Yellow Leaf Curl Virus': 'टमाटर का पर्ण कुंचन वायरस',
      'Tomato Mosaic Virus': 'टमाटर का मोज़ेक वायरस',
      'Corn Common Rust': 'मक्का का गेरू रोग',
      'Corn Northern Leaf Blight': 'मक्का का उत्तरी पर्ण झुलसा',
      'Healthy': 'स्वस्थ फसल (कोई रोग नहीं)',
      'Unknown / Unclassified Disease': 'अज्ञात / अवर्गीकृत बीमारी'
    }
  };

  const organicRemediesTranslations = {
    gu: {
      healthy: ['નિયમિત દેશી ખાતર (છાણીયું ખાતર) અને વર્મીકોમ્પોસ્ટનો ઉપયોગ ચાલુ રાખો.', 'જમીનમાં પૂરતો ભેજ અને સમયાંતરે પાકનું નિરીક્ષણ જાળવો.'],
      critical: [
        'લીમડાનું તેલ (Neem Oil 5ml/લીટર) અને 5% ખાટી છાશનું મિશ્રણ બનાવી છંટકાવ કરો.',
        'ટ્રાઇકોડર્મા વિરીડી (Trichoderma viride @ 5g/L) નો જૈવિક રોગનિયંત્રક તરીકે ઉપયોગ કરો.',
        'રોગગ્રસ્ત પાંદડાં તોડીને પ્લાસ્ટિકની થેલીમાં બંધ કરી ખેતરથી દૂર નાશ કરો.'
      ],
      ood: [
        'લીમડાનું તેલ (5ml/L) + 5% ખાટી છાશનો રક્ષણાત્મક જૈવિક છંટકાવ કરો.',
        'વધુ અસરગ્રસ્ત પાંદડાં કાપીને અલગ કરો અને નિષ્ણાતની સલાહ લીધા વિના રાસાયણિક છંટકાવ કરશો નહીં.'
      ]
    },
    hi: {
      healthy: ['नियमित जैविक खाद (गोबर खाद) और वर्मीकम्पोस्ट का प्रयोग जारी रखें।', 'मिट्टी में उचित नमी और समय-समय पर फसल की निगरानी बनाए रखें।'],
      critical: [
        'नीम का तेल (Neem Oil 5ml/लीटर) और 5% खट्टी छाछ का घोल बनाकर छिड़काव करें।',
        'ट्राइकोडरमा विरिडी (Trichoderma viride @ 5g/L) का जैविक नियंत्रण के रूप में उपयोग करें।',
        'संक्रमित पत्तियों को तोड़कर प्लास्टिक बैग में बंद कर खेत से दूर नष्ट करें।'
      ],
      ood: [
        'नीम का तेल (5ml/L) + 5% खट्टी छाछ का सुरक्षात्मक जैविक छिड़काव करें।',
        'अत्यधिक प्रभावित पत्तियों को अलग करें और विशेषज्ञ की पुष्टि के बिना रासायनिक दवा न छिड़कें।'
      ]
    }
  };

  const chemicalControlTranslations = {
    gu: {
      healthy: { active_ingredient: 'કોઈ રાસાયણિક જરૂર નથી', dosage: 'રાસાયણિક છંટકાવ કરશો નહીં' },
      critical: {
        active_ingredient: report?.chemical_control?.active_ingredient || 'મેન્કોઝેબ / ક્લોરોથેલોનિલ (Mancozeb / Chlorothalonil)',
        dosage: report?.chemical_control?.dosage || '2.5 ગ્રામ/લીટર પાણીમાં ભેળવીને સવારે છંટકાવ કરવો'
      },
      ood: { active_ingredient: 'અજમાયશી દવાઓ બંધ રાખો', dosage: 'કૃષિ નિષ્ણાતની ચકાસણી સુધી રાસાયણિક દવા ન છાંટવી' }
    },
    hi: {
      healthy: { active_ingredient: 'कोई रासायनिक आवश्यकता नहीं', dosage: 'रासायनिक छिड़काव न करें' },
      critical: {
        active_ingredient: report?.chemical_control?.active_ingredient || 'मैन्कोज़ेब / क्लोरोथेलोनिल (Mancozeb / Chlorothalonil)',
        dosage: report?.chemical_control?.dosage || '2.5 ग्राम/लीटर पानी में मिलाकर सुबह छिड़काव करें'
      },
      ood: { active_ingredient: 'अस्थायी रूप से रसायन बंद रखें', dosage: 'कृषि विशेषज्ञ की पुष्टि तक रासायनिक दवा न छिड़कें' }
    }
  };

  const symptomsTranslations = {
    gu: {
      healthy: 'છોડના પાંદડા લીલા, સ્વચ્છ અને સંપૂર્ણપણે તંદુરસ્ત છે.',
      critical: report?.visual_symptoms || 'પાંદડા પર ભૂરા/કાળા ટપકાં, કિનારીઓ સુકાઈ જવી અને ફંગલ ડાઘ જોવા મળે છે.',
      ood: 'અસામાન્ય ડાઘ અને અનિયમિત સુકારો જે પ્રમાણભૂત ડેટાબેઝ સાથે મેળ ખાતા નથી.'
    },
    hi: {
      healthy: 'पौधे की पत्तियां हरी, साफ और पूरी तरह से स्वस्थ हैं।',
      critical: report?.visual_symptoms || 'पत्तियों पर भूरे/काले धब्बे, किनारों का सूखना और फंगल दाग दिखाई देते हैं।',
      ood: 'असामान्य धब्बे और अनियमित सूखापन जो मानक डेटाबेस से मेल नहीं खाते हैं।'
    }
  };

  const cropNameTranslations = {
    gu: {
      'Tomato': 'ટામેટા (Tomato)',
      'Potato': 'બટાકા (Potato)',
      'Corn (Maize)': 'મકાઈ (Corn)',
      'Corn': 'મકાઈ (Corn)',
      'Apple': 'સફરજન (Apple)',
      'Grape': 'દ્રાક્ષ (Grape)',
      'Peach': 'પીચ (Peach)',
      'Pepper (Bell)': 'કેપ્સિકમ / મરચાં (Pepper)',
      'Pepper': 'મરચાં (Pepper)',
      'Cherry': 'ચેરી (Cherry)',
      'Strawberry': 'સ્ટ્રોબેરી (Strawberry)',
      'Orange (Citrus)': 'સંતરા (Orange)',
      'Orange': 'સંતરા (Orange)',
      'Blueberry': 'બ્લુબેરી (Blueberry)',
      'Raspberry': 'રાસ્પબેરી (Raspberry)',
      'Soybean': 'સોયાબીન (Soybean)',
      'Squash': 'કોળું (Squash)',
      'Wheat': 'ઘઉં (Wheat)',
      'Rice': 'ચોખા (Rice)',
      'Cotton': 'કપાસ (Cotton)'
    },
    hi: {
      'Tomato': 'टमाटर (Tomato)',
      'Potato': 'आलू (Potato)',
      'Corn (Maize)': 'मक्का (Corn)',
      'Corn': 'मक्का (Corn)',
      'Apple': 'सेब (Apple)',
      'Grape': 'अंगूर (Grape)',
      'Peach': 'आड़ू (Peach)',
      'Pepper (Bell)': 'शिमला मिर्च (Pepper)',
      'Pepper': 'मिर्च (Pepper)',
      'Cherry': 'चेरी (Cherry)',
      'Strawberry': 'स्ट्रॉबेरी (Strawberry)',
      'Orange (Citrus)': 'संतरा (Orange)',
      'Orange': 'संतरा (Orange)',
      'Blueberry': 'ब्लूबेरी (Blueberry)',
      'Raspberry': 'रसभरी (Raspberry)',
      'Soybean': 'सोयाबीन (Soybean)',
      'Squash': 'कद्दू (Squash)',
      'Wheat': 'गेहूं (Wheat)',
      'Rice': 'चावल (Rice)',
      'Cotton': 'कपास (Cotton)'
    }
  };

  let displayStatus = report?.health_status || 'HEALTHY';
  let displayDisease = report?.pathogen_cause?.common_name || diseaseObj?.type || 'Healthy';

  let rawCropName = diseaseObj?.crop_name || diseaseObj?.crop_identified || report?.crop_name || 'Crop';
  const dLower = (diseaseObj?.type || '').toLowerCase();

  if (rawCropName === 'Crop' || rawCropName === 'UNKNOWN CROP' || rawCropName === 'Non-Crop Asset') {
    if (dLower.includes('cherry')) rawCropName = 'Cherry';
    else if (dLower.includes('corn') || dLower.includes('maize')) rawCropName = 'Corn (Maize)';
    else if (dLower.includes('peach')) rawCropName = 'Peach';
    else if (dLower.includes('grape')) rawCropName = 'Grape';
    else if (dLower.includes('strawberry')) rawCropName = 'Strawberry';
    else if (dLower.includes('potato')) rawCropName = 'Potato';
    else if (dLower.includes('pepper')) rawCropName = 'Pepper (Bell)';
    else if (dLower.includes('tomato')) rawCropName = 'Tomato';
    else if (dLower.includes('apple')) rawCropName = 'Apple';
    else if (dLower.includes('orange') || dLower.includes('citrus') || dLower.includes('haunglongbing')) rawCropName = 'Orange (Citrus)';
    else if (dLower.includes('blueberry')) rawCropName = 'Blueberry';
    else if (dLower.includes('raspberry')) rawCropName = 'Raspberry';
    else if (dLower.includes('soybean')) rawCropName = 'Soybean';
    else if (dLower.includes('squash')) rawCropName = 'Squash';
  }

  let displayCropName = rawCropName;
  if (currentLang !== 'en' && cropNameTranslations[currentLang] && cropNameTranslations[currentLang][rawCropName]) {
    displayCropName = cropNameTranslations[currentLang][rawCropName];
  }

  if (currentLang !== 'en') {
    const langDict = statusTranslations[currentLang];
    if (isOOD) displayStatus = langDict.ood;
    else if (isHealthy) displayStatus = langDict.healthy;
    else displayStatus = langDict.critical;

    if (diseaseNameTranslations[currentLang] && diseaseNameTranslations[currentLang][displayDisease]) {
      displayDisease = diseaseNameTranslations[currentLang][displayDisease];
    }
  }

  const organicRemediesList = currentLang !== 'en' && organicRemediesTranslations[currentLang]
    ? (isOOD ? organicRemediesTranslations[currentLang].ood : (isHealthy ? organicRemediesTranslations[currentLang].healthy : organicRemediesTranslations[currentLang].critical))
    : (report?.organic_remedies || []);

  const chemicalControlData = currentLang !== 'en' && chemicalControlTranslations[currentLang]
    ? (isOOD ? chemicalControlTranslations[currentLang].ood : (isHealthy ? chemicalControlTranslations[currentLang].healthy : chemicalControlTranslations[currentLang].critical))
    : (report?.chemical_control || { active_ingredient: 'N/A', dosage: 'N/A' });

  const symptomsText = currentLang !== 'en' && symptomsTranslations[currentLang]
    ? (isOOD ? symptomsTranslations[currentLang].ood : (isHealthy ? symptomsTranslations[currentLang].healthy : symptomsTranslations[currentLang].critical))
    : (report?.visual_symptoms || 'N/A');

  return {
    displayStatus,
    displayDisease,
    displayCropName,
    organicRemediesList,
    chemicalControlData,
    symptomsText
  };
};

export default function CropScanner({ onScanComplete, theme, goToTab, lang }) {
  const t = translations[lang] || translations.en;
  const isDark = theme === 'black';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 1024;
  const isSmallMobile = windowWidth < 640;

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [weather] = useState(null);
  const [wLoading] = useState(false);
  const [city, setCity] = useState('Vadodara');
  const loadWeather = () => { };
  const [scanMode, setScanMode] = useState('single'); // 'single' | 'batch'
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchPreviews, setBatchPreviews] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState(null);
  const [selectedLeafModal, setSelectedLeafModal] = useState(null);
  const [showGradcamModal, setShowGradcamModal] = useState(false);
  const [batchOverlayMode, setBatchOverlayMode] = useState('original'); // 'original' | 'gradcam' | 'overlay'
  const [expertSent, setExpertSent] = useState(false);

  const handleBatchImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const combined = [...batchFiles, ...selected].slice(0, 10);
    setBatchFiles(combined);
    setBatchPreviews(combined.map(file => URL.createObjectURL(file)));
    setBatchResult(null);
    setBatchError(null);
  };

  const removeBatchFile = (indexToRemove) => {
    const updated = batchFiles.filter((_, idx) => idx !== indexToRemove);
    setBatchFiles(updated);
    setBatchPreviews(updated.map(file => URL.createObjectURL(file)));
    setBatchResult(null);
  };

  const analyzeBatch = async () => {
    if (batchFiles.length === 0) {
      alert('Please select 2 to 10 leaf photos to scan your farm batch!');
      return;
    }
    setBatchLoading(true);
    setBatchResult(null);
    setBatchError(null);
    setBatchProgress(10);
    setBatchStatus('Initializing Farm Batch Neural Engine...');

    const stages = [
      'Extracting features from sample leaf photos...',
      'Running CNN disease & pest classification across batch...',
      'Calculating farm health ratio (% Healthy vs % Diseased)...',
      'Generating Grad-CAM overlays & field recommendation protocol...',
      'Finalizing poore farm ka analysis report...'
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setBatchStatus(stages[stageIdx]);
        setBatchProgress(Math.min(90, stageIdx * 20));
      }
    }, 1200);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      batchFiles.forEach(file => {
        formData.append('images', file, file.name || 'leaf_scan.jpg');
      });

      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const res = await fetch(`${API_BASE}/api/detect/batch`, {
        method: 'POST',
        headers,
        body: formData
      });

      clearInterval(interval);
      setBatchProgress(100);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBatchError(data.error || 'Batch analysis failed');
      } else {
        setBatchResult(data);
        if (onScanComplete) onScanComplete();
      }
    } catch (err) {
      clearInterval(interval);
      setBatchError(err.message || 'Failed to analyze farm batch.');
    }
    setBatchLoading(false);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const analyze = async () => {
    if (!image) { alert('Please select an image!'); return; }
    setLoading(true);
    setResult(null);
    setScanStatus('Initializing Neural Network...');

    // Simulate multi-stage scanning for "length/detail" feel
    const stages = [
      'Extracting image features...',
      'Running disease classifier...',
      'Analyzing symptom patterns...',
      'Calculating confidence scores...',
      'Fetching local treatment recommendations...'
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setScanStatus(stages[stageIdx]);
        stageIdx++;
      } else {
        clearInterval(interval);
      }
    }, 1200); // Cycle every 1.2 seconds

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', image, image.name || 'leaf_scan.jpg');
      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const fetchPromise = fetch(`${API_BASE}/api/detect/image`, {
        method: 'POST',
        headers,
        body: formData
      });

      const minDelay = new Promise(resolve => setTimeout(resolve, 4000));
      const [res] = await Promise.all([fetchPromise, minDelay]);

      const data = await res.json().catch(() => ({}));
      clearInterval(interval); // Stop status cycling on response
      if (!res.ok) {
        setResult({ error: data.error || 'Analysis failed' });
      } else {
        setResult(data);
        if (onScanComplete) onScanComplete();
      }
    } catch (e) {
      clearInterval(interval); // Stop status cycling on error
      const msg = e.message || 'Unknown error';
      const hint = msg.includes('fetch') || msg.includes('network')
        ? 'Backend may be offline. Start it: cd backend && python run.py'
        : msg;
      setResult({ error: hint });
    }
    setLoading(false);
  };

  const sevColor = s => ({
    low: '#16a34a', medium: '#d97706', high: '#ea580c', critical: '#dc2626'
  })[s] || '#666';
  const riskColor = r => ({ low: '#16a34a', medium: '#d97706', high: '#dc2626' })[r] || '#666';

  const handleDownloadReport = () => {
    const element = document.getElementById('report-container');
    if (element) {
      html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Crop_Report_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Weather section removed - showing Scanner only */}
      <div style={{
        display: 'none',
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        borderRadius: '16px', padding: '20px', marginBottom: '20px', color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Weather Conditions</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City"
              style={{
                padding: '6px 10px', borderRadius: '6px', border: 'none',
                fontSize: '0.9rem', width: '120px'
              }}
            />
            <button onClick={() => loadWeather(city)} style={{
              background: 'rgba(255,255,255,0.2)', color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
            }}>Update</button>
          </div>
        </div>

        {wLoading ? (
          <p style={{ opacity: 0.8 }}>Loading weather...</p>
        ) : weather && !weather.error ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: t.temp || 'Temperature', value: weather.temperature + ' C', icon: 'Temp' },
                { label: t.humidity || 'Humidity', value: weather.humidity + '%', icon: 'Hum' },
                { label: t.windSpeed || 'Wind Speed', value: weather.wind_speed + ' m/s', icon: 'Wind' },
                { label: t.condition || 'Condition', value: weather.description, icon: 'Sky' },
              ].map((w, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: '10px',
                  padding: '12px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{w.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '4px' }}>{w.value}</div>
                </div>
              ))}
            </div>

            {/* Risk Level */}
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: '10px',
              padding: '12px', marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t.riskLevel || 'Crop Risk Level'}:</span>
                <span style={{
                  padding: '3px 12px', borderRadius: '12px', fontWeight: 'bold',
                  background: riskColor(weather.risk_level), fontSize: '0.85rem'
                }}>{(weather.risk_level || 'Unknown').toUpperCase()}</span>
              </div>
              {weather.crop_impact?.map((imp, i) => (
                <div key={i} style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '3px' }}>
                  � {imp}
                </div>
              ))}
            </div>

            {/* Weather Recommendations */}
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                {t.weatherRec || 'Weather Recommendations'}:
              </div>
              {weather.recommendations?.map((rec, i) => (
                <div key={i} style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '3px' }}>
                  � {rec}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ opacity: 0.8 }}>{t.weatherNA || 'Weather data unavailable'}</p>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              Add OpenWeatherMap API key in weather.py
            </p>
          </div>
        )}
      </div>

      {/* SCAN MODE SWITCHER BAR */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '24px',
        background: isDark ? '#1e293b' : '#f1f5f9', padding: '6px', borderRadius: '14px',
        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setScanMode('single')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: '10px', border: 'none',
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease',
            background: scanMode === 'single' ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'transparent',
            color: scanMode === 'single' ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
            boxShadow: scanMode === 'single' ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none'
          }}
        >
          {t.singleScanTab || '🍃 Single Leaf Scanner'}
        </button>
        <button
          onClick={() => setScanMode('batch')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: '10px', border: 'none',
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease',
            background: scanMode === 'batch' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
            color: scanMode === 'batch' ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
            boxShadow: scanMode === 'batch' ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
          }}
        >
          {t.batchScanTab || '📸 Multi-Leaf Batch Scanner'}
        </button>
      </div>

      {/* MULTI-LEAF BATCH SCANNER UI */}
      {scanMode === 'batch' && (
        <div style={{
          background: isDark ? '#0f172a' : '#ffffff', borderRadius: '20px',
          padding: isSmallMobile ? '20px' : '30px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(14, 165, 233, 0.08)',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem' }}>📸</span>
            <div>
              <h3 style={{ margin: 0, color: '#0ea5e9', fontSize: isSmallMobile ? '1.3rem' : '1.6rem', fontWeight: 800 }}>
                Multi-Leaf Batch Scanner
              </h3>
              <p style={{ margin: 0, color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.95rem' }}>
                Scan multiple leaf photos simultaneously &nbsp;|&nbsp; Instant aggregated field diagnostic report
              </p>
            </div>
          </div>

          {/* Upload Dropzone for Batch */}
          <div style={{
            border: '2px dashed #0ea5e9', borderRadius: '16px',
            padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
            background: isDark ? 'rgba(14, 165, 233, 0.06)' : '#f0f9ff',
            marginBottom: '24px', transition: 'all 0.3s ease'
          }}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBatchImageChange}
              style={{ display: 'none' }}
              id="batch-file-picker"
            />
            <label htmlFor="batch-file-picker" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍃 📸</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold' }}>
                Select or Snap Multiple Crop Leaf Photos
              </h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                Capture leaves from different plants across your field to get an aggregate farm health report!
              </p>
              <span style={{
                background: '#0ea5e9', color: 'white', padding: '10px 24px',
                borderRadius: '10px', fontWeight: 'bold', fontSize: '0.95rem',
                display: 'inline-block', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
              }}>
                📂 Choose Files from Gallery / Camera
              </span>
            </label>
          </div>

          {/* Selected Photos Thumbnails Grid */}
          {batchFiles.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.1rem' }}>
                  Selected Leaf Photos ({batchFiles.length} uploaded)
                </h4>
                {batchFiles.length < 5 && (
                  <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 'bold', background: 'rgba(217, 119, 6, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                    💡 Tip: Add multiple photos across your field for best diagnostic accuracy
                  </span>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '12px'
              }}>
                {batchPreviews.map((url, idx) => (
                  <div key={idx} style={{
                    position: 'relative', borderRadius: '12px', overflow: 'hidden',
                    border: '2px solid #0ea5e9', height: '110px', background: '#000',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}>
                    <img src={url} alt={`Leaf ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBatchFile(idx); }}
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: '#dc2626', color: 'white', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                      title="Remove photo"
                    >
                      ✕
                    </button>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.7)', color: 'white',
                      fontSize: '11px', padding: '3px', textAlign: 'center', fontWeight: 'bold'
                    }}>
                      Leaf #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={analyzeBatch}
                disabled={batchLoading}
                style={{
                  width: '100%', marginTop: '20px', padding: '16px',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: 'white', border: 'none', borderRadius: '14px',
                  fontWeight: '800', fontSize: '1.15rem', cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(14, 165, 233, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                {batchLoading ? '⏳ RUNNING BATCH AI INFERENCE...' : `🚀 SCAN ALL ${batchFiles.length} LEAVES (GENERATE FARM REPORT)`}
              </button>
            </div>
          )}

          {/* Batch Scanning Status & Progress */}
          {batchLoading && (
            <div style={{
              background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '16px',
              padding: '30px', textAlign: 'center', margin: '20px 0',
              border: '1px solid #0ea5e9'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡ 🧬</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                {batchStatus || 'Processing Multi-Leaf Batch...'}
              </h4>
              <div style={{ width: '100%', background: isDark ? '#334155' : '#e2e8f0', borderRadius: '10px', height: '14px', overflow: 'hidden', margin: '16px 0' }}>
                <div style={{ width: `${batchProgress}%`, background: 'linear-gradient(90deg, #0ea5e9, #22c55e)', height: '100%', transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
                Running CNN classification and Grad-CAM overlays across all {batchFiles.length} sample points...
              </p>
            </div>
          )}

          {/* Error Message if any */}
          {batchError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: '#fef2f2', borderLeft: '6px solid #ef4444',
                color: '#991b1b', padding: '16px 20px', borderRadius: '12px',
                marginBottom: '24px', textAlign: 'left',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.5 }}>
                ⚠️ {batchError}
              </div>
            </motion.div>
          )}

          {/* Batch Result Report */}
          {batchResult && (() => {
            const healthyPct = batchResult.healthy_percentage ?? batchResult.healthy_pct ?? 0;
            const diseasedPct = batchResult.diseased_percentage ?? batchResult.diseased_pct ?? 0;
            const summaryMsg = batchResult.summary_message ?? batchResult.summary_msg ?? '';
            const leafResults = batchResult.results || batchResult.individual_results || batchResult.batch_results || [];

            return (
              <div id="batch-report-container" style={{
                background: isDark ? '#1e293b' : '#ffffff', borderRadius: '18px',
                padding: isSmallMobile ? '16px' : '24px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                marginTop: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}>
                {/* Top Banner */}
                <div style={{
                  background: batchResult.risk_level === 'SAFE' ? 'linear-gradient(135deg, #16a34a, #15803d)' :
                    batchResult.risk_level === 'WARNING' ? 'linear-gradient(135deg, #d97706, #b45309)' :
                      'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span style={{
                        background: 'rgba(255,255,255,0.25)', padding: '5px 12px', borderRadius: '20px',
                        fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>
                        🌾 SINGLE CLICK -&gt; COMPLETE FARM DIAGNOSTIC REPORT
                      </span>
                      <h2 style={{ margin: '10px 0 6px 0', fontSize: isSmallMobile ? '1.4rem' : '1.8rem', fontWeight: '800' }}>
                        {healthyPct}% Healthy &nbsp;|&nbsp; {diseasedPct}% Diseased
                      </h2>
                      <p style={{ margin: 0, fontSize: '1rem', opacity: 0.95 }}>
                        {summaryMsg}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: '14px' }}>
                      <div style={{ fontSize: '2.4rem', fontWeight: 'bold', lineHeight: 1 }}>{healthyPct}%</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>Farm Health Index</div>
                    </div>
                  </div>

                  {/* Split Health Percentage Bar */}
                  <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', height: '20px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${healthyPct}%`, background: '#22c55e', height: '100%', transition: 'width 0.8s ease' }} title={`Healthy: ${healthyPct}%`} />
                    <div style={{ width: `${diseasedPct}%`, background: '#ef4444', height: '100%', transition: 'width 0.8s ease' }} title={`Diseased: ${diseasedPct}%`} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '8px', fontWeight: 'bold', opacity: 0.95 }}>
                    <span>🌿 Healthy Leaves: {batchResult.healthy_count} of {batchResult.total_scanned} ({healthyPct}%)</span>
                    <span>⚠️ Diseased Leaves: {batchResult.diseased_count} of {batchResult.total_scanned} ({diseasedPct}%)</span>
                  </div>

                  {batchResult.email_sent && (
                    <div style={{
                      marginTop: '14px', background: 'rgba(255,255,255,0.25)', padding: '6px 16px',
                      borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex',
                      alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.4)'
                    }}>
                      📧 Official Farm Diagnostic Email Sent to Farmer!
                    </div>
                  )}
                </div>

                {/* Sampled Conditions Breakdown */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.1rem' }}>
                    📊 Detected Conditions Across Farm ({batchResult.total_scanned} Leaves Scanned)
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.entries(batchResult.disease_breakdown || {}).map(([dName, count], idx) => {
                      const isH = dName.toLowerCase().includes('healthy');
                      return (
                        <div key={idx} style={{
                          padding: '10px 16px', borderRadius: '12px',
                          background: isH ? (isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7') : (isDark ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2'),
                          color: isH ? '#16a34a' : '#dc2626',
                          border: `1px solid ${isH ? '#16a34a' : '#dc2626'}`,
                          fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                          <span>{isH ? '🌿' : '⚠️'} {dName}</span>
                          <span style={{
                            background: isH ? '#16a34a' : '#dc2626', color: 'white',
                            borderRadius: '12px', padding: '2px 8px', fontSize: '0.8rem'
                          }}>
                            {count} {count === 1 ? 'leaf' : 'leaves'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per-Leaf Analysis Cards Grid */}
                <h4 style={{ margin: '0 0 16px 0', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.1rem' }}>
                  🔍 Individual Leaf Diagnostics ({leafResults.length} Samples)
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '16px', marginBottom: '24px'
                }}>
                  {leafResults.map((item, idx) => (
                    <div key={idx} style={{
                      background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '14px',
                      padding: '14px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                    }}>
                      <div>
                        <div style={{ position: 'relative', height: '160px', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                          <img src={`${API_BASE}${item.image_url}`} alt={`Leaf ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{
                            position: 'absolute', top: '8px', left: '8px',
                            background: 'rgba(0,0,0,0.75)', color: 'white', padding: '3px 8px',
                            borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'
                          }}>
                            Leaf #{idx + 1}
                          </span>
                          <span style={{
                            position: 'absolute', top: '8px', right: '8px',
                            background: item.is_healthy ? '#16a34a' : '#dc2626',
                            color: 'white', padding: '3px 8px', borderRadius: '6px',
                            fontSize: '0.75rem', fontWeight: 'bold'
                          }}>
                            {item.is_healthy ? 'HEALTHY' : (item.severity || 'CRITICAL').toUpperCase()}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                          🌾 {item.crop_name || 'Crop'}: <span style={{ color: '#0ea5e9' }}>{item.disease_type}</span>
                        </h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                          AI Match Confidence: <strong style={{ color: '#0ea5e9' }}>{item.confidence}%</strong>
                        </p>

                        {item.treatment && (
                          <p style={{
                            margin: '0 0 10px 0', fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#475569',
                            background: isDark ? '#1e293b' : '#e2e8f0', padding: '8px 10px', borderRadius: '8px'
                          }}>
                            <strong>Prescription:</strong> {item.treatment}
                          </p>
                        )}

                        <button
                          onClick={() => setSelectedLeafModal(item)}
                          style={{
                            width: '100%', padding: '10px',
                            background: '#0ea5e9', color: 'white', border: 'none',
                            borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}
                        >
                          🔬 View Full Diagnostic Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons (Rendered ONLY after analysis report is generated) */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <button
                    onClick={handleDownloadReport}
                    style={{
                      flex: 1, padding: '14px 20px', background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold',
                      cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    📄 Export Field Diagnostic Report (PNG)
                  </button>
                  <button
                    onClick={() => { setBatchFiles([]); setBatchPreviews([]); setBatchResult(null); }}
                    style={{
                      padding: '14px 24px', background: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a', border: 'none',
                      borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    🔄 Scan New Farm Batch
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Detailed Leaf Diagnostic Modal */}
          {selectedLeafModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}>
              <div style={{
                background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a',
                borderRadius: '20px', maxWidth: '750px', width: '100%', maxHeight: '90vh',
                overflowY: 'auto', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative'
              }}>
                <button
                  onClick={() => { setSelectedLeafModal(null); setShowGradcamModal(false); }}
                  style={{
                    position: 'absolute', top: '16px', right: '16px', background: '#dc2626',
                    color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                    fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>

                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.3rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔬 Precision Leaf Report: {selectedLeafModal.disease_type}
                </h3>

                {/* Explainable AI Visual Switcher Container */}
                <div style={{ position: 'relative', height: '280px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', background: '#0f172a', border: '1px solid #334155' }}>
                  <img
                    src={
                      batchOverlayMode === 'gradcam' && selectedLeafModal.gradcam_url
                        ? `${API_BASE}${selectedLeafModal.gradcam_url}`
                        : batchOverlayMode === 'overlay' && selectedLeafModal.infection_overlay_url
                          ? `${API_BASE}${selectedLeafModal.infection_overlay_url}`
                          : `${API_BASE}${selectedLeafModal.image_url}`
                    }
                    alt="Leaf Visual Scan"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />

                  {/* Explainable AI Overlay Switcher Buttons (Displayed only for diseased leaves) */}
                  {!(
                    (selectedLeafModal.disease_type || '').toLowerCase().includes('healthy') ||
                    selectedLeafModal.status === 'Healthy'
                  ) && (
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setBatchOverlayMode('original')}
                          style={{
                            background: batchOverlayMode === 'original' ? '#0ea5e9' : 'rgba(15, 23, 42, 0.85)',
                            color: 'white', border: '1px solid #38bdf8', padding: '6px 14px',
                            borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', backdropFilter: 'blur(4px)'
                          }}
                        >
                          🔍 1. Original
                        </button>
                        {selectedLeafModal.gradcam_url && (
                          <button
                            onClick={() => setBatchOverlayMode('gradcam')}
                            style={{
                              background: batchOverlayMode === 'gradcam' ? '#0ea5e9' : 'rgba(15, 23, 42, 0.85)',
                              color: 'white', border: '1px solid #38bdf8', padding: '6px 14px',
                              borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', backdropFilter: 'blur(4px)'
                            }}
                          >
                            🔥 2. Grad-CAM Heatmap
                          </button>
                        )}
                        {selectedLeafModal.infection_overlay_url && (
                          <button
                            onClick={() => setBatchOverlayMode('overlay')}
                            style={{
                              background: batchOverlayMode === 'overlay' ? '#f59e0b' : 'rgba(15, 23, 42, 0.85)',
                              color: 'white', border: '1px solid #f59e0b', padding: '6px 14px',
                              borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', backdropFilter: 'blur(4px)'
                            }}
                          >
                            🎯 3. Red/Yellow Infection Spotlight
                          </button>
                        )}
                      </div>
                    )}
                </div>

                {/* Diagnostic Metrics Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.95rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Detected Crop:</td>
                      <td style={{ padding: '8px 0', color: '#16a34a', fontWeight: 'bold' }}>
                        {selectedLeafModal.crop_name || 'Crop'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Condition:</td>
                      <td style={{ padding: '8px 0', color: selectedLeafModal.is_healthy ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                        {selectedLeafModal.disease_type}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold' }}>AI Match Accuracy:</td>
                      <td style={{ padding: '8px 0', color: '#0ea5e9', fontWeight: 'bold' }}>{selectedLeafModal.confidence}%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Severity Level:</td>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', textTransform: 'uppercase', color: selectedLeafModal.is_healthy ? '#16a34a' : '#dc2626' }}>
                        {selectedLeafModal.severity || (selectedLeafModal.is_healthy ? 'LOW' : 'CRITICAL')}
                      </td>
                    </tr>
                    {selectedLeafModal.details?.cause && (
                      <tr style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Pathogen / Cause:</td>
                        <td style={{ padding: '8px 0', color: isDark ? '#cbd5e1' : '#475569' }}>{selectedLeafModal.details.cause}</td>
                      </tr>
                    )}
                    {selectedLeafModal.details?.symptoms && (
                      <tr style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Visual Symptoms:</td>
                        <td style={{ padding: '8px 0', color: isDark ? '#cbd5e1' : '#475569' }}>{selectedLeafModal.details.symptoms}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Chemical Control */}
                <div style={{ background: isDark ? '#0f172a' : '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '12px', borderLeft: '4px solid #3b82f6' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>💊 Chemical Treatment Protocol</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: isDark ? '#e2e8f0' : '#334155', lineHeight: 1.5 }}>
                    {Array.isArray(selectedLeafModal.details?.chemical_control)
                      ? selectedLeafModal.details.chemical_control.map((item, idx) => <li key={idx}>{item}</li>)
                      : <li>{selectedLeafModal.details?.chemical_control || selectedLeafModal.treatment || "Standard market fungicide."}</li>}
                  </ul>
                </div>

                {/* Organic Control */}
                <div style={{ background: isDark ? '#0f172a' : '#f0fdf4', padding: '16px', borderRadius: '12px', marginBottom: '12px', borderLeft: '4px solid #22c55e' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>🌿 Organic & Biological Alternative</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: isDark ? '#e2e8f0' : '#15803d', lineHeight: 1.5 }}>
                    {Array.isArray(selectedLeafModal.details?.organic_control)
                      ? selectedLeafModal.details.organic_control.map((item, idx) => <li key={idx}>{item}</li>)
                      : <li>{selectedLeafModal.details?.organic_control || "Apply neem oil or natural sulfur-based sprays to reduce chemical dependency."}</li>}
                  </ul>
                </div>

                {/* Field Prevention */}
                <div style={{ background: isDark ? '#0f172a' : '#fffbeb', padding: '16px', borderRadius: '12px', marginBottom: '12px', borderLeft: '4px solid #f59e0b' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#b45309' }}>🛡️ Field Management & Prevention</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: isDark ? '#e2e8f0' : '#92400e', lineHeight: 1.5 }}>
                    {Array.isArray(selectedLeafModal.recommendations) && selectedLeafModal.recommendations.length > 0
                      ? selectedLeafModal.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)
                      : <li>Avoid overhead watering and ensure proper plant spacing for airflow.</li>}
                  </ul>
                </div>

                {/* 🚨 3. OOD Detection (Smart AI Control) Human-in-the-Loop Block */}
                {(selectedLeafModal.is_ood || selectedLeafModal.confidence < 60 || (selectedLeafModal.disease_type || '').toLowerCase().includes('unknown')) && (
                  <div style={{
                    background: isDark ? '#2e1065' : '#fffbe6',
                    border: '2px solid #f59e0b', borderRadius: '14px', padding: '18px',
                    marginBottom: '16px', color: isDark ? '#fef08a' : '#78350f'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🚨 3. OOD Detection (Smart AI Control)
                      </div>
                      <span style={{ background: '#f59e0b', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        CONFIDENCE: {selectedLeafModal.confidence}% (&lt; 60.0%)
                      </span>
                    </div>

                    <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
                      <strong>Galat answer dene se better hai "pata nahi" bolna:</strong> AI match confidence is below 60.0%. Rather than giving an inaccurate disease diagnosis, this specimen is flagged as <strong>Unknown Disease (OOD Stress)</strong> and sent for Expert Agronomist review.
                    </p>

                    <button
                      onClick={() => setExpertSent(true)}
                      disabled={expertSent}
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: expertSent ? '#16a34a' : '#d97706',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontWeight: 'bold', fontSize: '0.85rem', cursor: expertSent ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      {expertSent ? '✅ Specimen Sent to KVK Agronomist Expert!' : '👨‍🌾 Send Specimen to Local Agri Expert / KVK'}
                    </button>
                  </div>
                )}

                {/* Pest Trace AI Solution Protocol */}
                {selectedLeafModal.pest_solution && (
                  <div style={{
                    background: selectedLeafModal.pest_solution.detected ? (isDark ? '#1e1b4b' : '#f0fdf4') : (isDark ? '#0f172a' : '#f8fafc'),
                    border: `2px solid ${selectedLeafModal.pest_solution.detected ? '#8b5cf6' : '#22c55e'}`,
                    borderRadius: '12px', padding: '16px', marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: selectedLeafModal.pest_solution.detected ? '#7c3aed' : '#16a34a', fontSize: '1rem', fontWeight: 'bold' }}>
                        {selectedLeafModal.pest_solution.detected ? '🐛 Pest Trace Detected & AI Solution' : '🟢 Pest Trace Status: Clear (No Pests)'}
                      </h4>
                      <span style={{ background: selectedLeafModal.pest_solution.detected ? '#7c3aed' : '#22c55e', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {selectedLeafModal.pest_solution.detected ? 'ACTION NEEDED' : 'CLEAR'}
                      </span>
                    </div>
                    {selectedLeafModal.pest_solution.detected ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: isDark ? '#f8fafc' : '#0f172a' }}>
                          Target Pest Trace: <span style={{ color: '#7c3aed' }}>{selectedLeafModal.pest_solution.pest_name}</span>
                        </div>
                        <div style={{ marginBottom: '8px', color: isDark ? '#cbd5e1' : '#475569' }}>
                          <strong>Symptoms:</strong> {selectedLeafModal.pest_solution.symptoms}
                        </div>
                        <div style={{ background: isDark ? '#0f172a' : '#eff6ff', padding: '10px', borderRadius: '8px', marginBottom: '6px' }}>
                          <strong style={{ color: '#1d4ed8' }}>Chemical Solution:</strong>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', color: isDark ? '#e2e8f0' : '#1e3a8a' }}>
                            {Array.isArray(selectedLeafModal.pest_solution.chemical_control) ? selectedLeafModal.pest_solution.chemical_control.map((c, i) => <li key={i}>{c}</li>) : <li>{selectedLeafModal.pest_solution.chemical_control}</li>}
                          </ul>
                        </div>
                        <div style={{ background: isDark ? '#0f172a' : '#f0fdf4', padding: '10px', borderRadius: '8px' }}>
                          <strong style={{ color: '#15803d' }}>Organic Remedy:</strong>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', color: isDark ? '#e2e8f0' : '#14532d' }}>
                            {Array.isArray(selectedLeafModal.pest_solution.organic_control) ? selectedLeafModal.pest_solution.organic_control.map((o, i) => <li key={i}>{o}</li>) : <li>{selectedLeafModal.pest_solution.organic_control}</li>}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#475569' }}>
                        Leaf surface clean of active pest traces. Maintain perimeter sticky cards.
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setSelectedLeafModal(null); setShowGradcamModal(false); }}
                  style={{
                    width: '100%', padding: '12px', background: '#334155', color: 'white',
                    border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  Close Leaf Diagnostics
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Scanner Card */}
      {scanMode === 'single' && (
        <div style={{
          background: 'transparent', borderRadius: '16px',
          padding: '0', transition: 'all 0.3s ease'
        }}>
          <h3 style={{ color: '#22c55e', marginTop: 0, fontSize: isSmallMobile ? '1.25rem' : '1.5rem', fontWeight: 800 }}>{t.scannerTitle || 'AI Crop Health Scanner'}</h3>
          <p style={{ color: '#94a3b8', fontSize: isSmallMobile ? '0.9rem' : '1rem', marginBottom: '32px' }}>
            {t.scannerSub || 'Upload a high-resolution leaf photo for instant deep-learning analysis of diseases, pests, and stress.'}
          </p>

          {/* Upload - Enhanced Size */}
          <div style={{
            border: `3px dashed ${loading ? '#3b82f6' : (result && !result.error && result.severity) ? sevColor(result.severity) : '#22c55e'}`,
            borderRadius: '24px',
            padding: preview ? '0' : (isSmallMobile ? '40px 20px' : '60px 40px'),
            textAlign: 'center',
            background: preview ? '#020617' : 'rgba(34,197,94,0.05)',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.4s ease',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: preview ? (isSmallMobile ? '300px' : '400px') : 'auto',
            boxShadow: `0 0 30px ${loading ? '#3b82f620' : (result && !result.error && result.severity) ? sevColor(result.severity) + '20' : '#22c55e20'}`
          }}
            onMouseOver={e => e.currentTarget.style.background = preview ? '#020617' : 'rgba(34,197,94,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = preview ? '#020617' : 'rgba(34,197,94,0.05)'}>
            {preview ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', background: '#020617' }}>
                <img src={preview} alt="crop"
                  style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', display: 'block', filter: (loading || (result && !result.error)) ? 'contrast(1.15) brightness(0.85) saturate(1.2)' : 'none', transition: 'all 0.5s' }} />

                {/* HEATMAP DIRECT OVERLAY */}
                {result && result.gradcam_url && !loading && (
                  <img src={`${API_BASE}${result.gradcam_url}`} alt="heatmap" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0.65, mixBlendMode: 'screen', pointerEvents: 'none' }} />
                )}

                {/* SCI-FI AI SCANNING OVERLAY (Visible during Loading AND Result) */}
                {(loading || (result && !result.error)) && (
                  <>
                    {/* Horizontal Laser Beams - Only while loading */}
                    {loading && (
                      <>
                        <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', boxShadow: '0 0 25px 10px rgba(59,130,246,0.6)', animation: 'laserScan 3s linear infinite', zIndex: 10 }}></div>
                        <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'white', boxShadow: '0 0 20px 5px rgba(255,255,255,0.8)', animation: 'laserScan 3s linear infinite 0.1s', zIndex: 11 }}></div>

                        {/* Vertical Scanning Line */}
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', background: 'rgba(59,130,246,0.3)', left: '50%', boxShadow: '0 0 15px rgba(59,130,246,0.5)', zIndex: 9 }}></div>
                      </>
                    )}

                    {/* Floating Data Nodes (Decorative) */}
                    {loading && [1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{
                        position: 'absolute',
                        top: `${20 + i * 15}%`,
                        left: `${15 + (i % 3) * 25}%`,
                        width: '4px', height: '4px',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px #3b82f6',
                        animation: `floatData ${2 + i}s infinite`,
                        zIndex: 12
                      }}>
                        <div style={{ position: 'absolute', left: 10, top: -5, fontSize: '10px', color: '#3b82f6', whiteSpace: 'nowrap', opacity: 0.7, fontFamily: 'monospace' }}>
                          {['ANALYZING...', 'CHECKING PIXELS', 'GENOMIC SCAN', 'PATTERN MATCH', 'NODE_ID_402'][i - 1]}
                        </div>
                      </div>
                    ))}

                    {/* Glowing Matrix Grid */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(${loading ? 'rgba(59,130,246,0.2)' : sevColor(result?.severity) + '30'} 1px, transparent 1px), linear-gradient(90deg, ${loading ? 'rgba(59,130,246,0.2)' : sevColor(result?.severity) + '30'} 1px, transparent 1px)`, backgroundSize: '40px 40px', animation: loading ? 'pulseGrid 1.5s infinite alternate' : 'none', pointerEvents: 'none', zIndex: 5 }}></div>

                    {/* Top Left Diagnostic Data */}
                    <div style={{ position: 'absolute', top: isSmallMobile ? 10 : 20, left: isSmallMobile ? 10 : 20, padding: isSmallMobile ? '10px 15px' : '15px 20px', background: 'rgba(2, 6, 23, 0.85)', border: `1px solid ${loading ? '#3b82f6' : sevColor(result?.severity)}`, borderRadius: '12px', color: '#fff', fontFamily: 'monospace', zIndex: 20, backdropFilter: 'blur(10px)', textAlign: 'left', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', minWidth: isSmallMobile ? 180 : 220 }}>
                      <div style={{ fontSize: isSmallMobile ? '0.7rem' : '0.8rem', color: '#cbd5e1', marginBottom: 6, letterSpacing: '1px' }}>{loading ? 'SYSTEM STATUS' : 'DIAGNOSIS RESULT'}</div>
                      <div style={{ fontSize: isSmallMobile ? '1rem' : '1.25rem', fontWeight: 900, color: loading ? '#3b82f6' : sevColor(result?.severity) }}>{loading ? 'EXTRACTING...' : (result?.disease?.type?.replace(/___/g, ' - ').replace(/_/g, ' ') || 'Healthy')}</div>
                      {result && <div style={{ height: 4, background: '#1e293b', borderRadius: 2, margin: '10px 0' }}><div style={{ width: `${result.disease?.confidence || 0}%`, height: '100%', background: sevColor(result?.severity), borderRadius: 2 }}></div></div>}
                      {result && <div style={{ marginTop: 5, fontSize: isSmallMobile ? '0.75rem' : '0.9rem', color: '#f8fafc' }}>Confidence: <span style={{ fontWeight: 800, color: sevColor(result?.severity) }}>{result.disease?.confidence || 0}%</span></div>}
                    </div>

                    {/* Bottom Right Action Data */}
                    <div style={{ position: 'absolute', bottom: 20, right: 20, padding: '15px 20px', background: 'rgba(2, 6, 23, 0.85)', border: `1px solid ${loading ? '#3b82f6' : sevColor(result?.severity)}`, borderRadius: '12px', color: '#fff', fontFamily: 'monospace', zIndex: 20, backdropFilter: 'blur(10px)', textAlign: 'right', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', minWidth: 200, display: !isSmallMobile ? 'block' : 'none' }}>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 6, letterSpacing: '1px' }}>{loading ? 'ANALYSIS HUB' : 'ACTION REQUIRED'}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: loading ? '#3b82f6' : sevColor(result?.severity), textTransform: 'uppercase' }}>
                        {loading ? 'SCANNING' :
                          result?.severity === 'critical' ? 'URGENT TREATMENT' :
                            result?.severity === 'high' ? 'APPLY REMEDY' :
                              result?.severity === 'medium' ? 'MONITOR CLOSELY' : 'NO ACTION NEEDED'}
                      </div>
                    </div>

                    {/* Center Focus Box */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: `2px solid ${loading ? 'rgba(59,130,246,0.5)' : sevColor(result?.severity) + '80'}`, width: '40%', height: '40%', borderRadius: '12px', zIndex: 6, pointerEvents: 'none', boxShadow: `inset 0 0 20px ${loading ? 'rgba(59,130,246,0.3)' : sevColor(result?.severity) + '30'}`, transition: 'all 0.5s', animation: loading ? 'pulseGrid 2s infinite' : 'none' }}>
                      {/* Target Crosshairs in Center */}
                      {result && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 60, height: 60, border: `2px solid ${sevColor(result?.severity)}80`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseGrid 2s infinite alternate' }}>
                          <div style={{ width: 8, height: 8, background: sevColor(result?.severity), borderRadius: '50%', boxShadow: `0 0 10px ${sevColor(result?.severity)}` }}></div>
                          <div style={{ position: 'absolute', top: -15, left: 29, width: 2, height: 15, background: sevColor(result?.severity) }}></div>
                          <div style={{ position: 'absolute', bottom: -15, left: 29, width: 2, height: 15, background: sevColor(result?.severity) }}></div>
                          <div style={{ position: 'absolute', left: -15, top: 29, width: 15, height: 2, background: sevColor(result?.severity) }}></div>
                          <div style={{ position: 'absolute', right: -15, top: 29, width: 15, height: 2, background: sevColor(result?.severity) }}></div>
                        </div>
                      )}
                      {/* Corner Accents */}
                      <div style={{ position: 'absolute', top: -2, left: -2, width: 15, height: 15, borderTop: `3px solid ${loading ? '#3b82f6' : '#22c55e'}`, borderLeft: `3px solid ${loading ? '#3b82f6' : '#22c55e'}` }}></div>
                      <div style={{ position: 'absolute', top: -2, right: -2, width: 15, height: 15, borderTop: `3px solid ${loading ? '#3b82f6' : '#22c55e'}`, borderRight: `3px solid ${loading ? '#3b82f6' : '#22c55e'}` }}></div>
                      <div style={{ position: 'absolute', bottom: -2, left: -2, width: 15, height: 15, borderBottom: `3px solid ${loading ? '#3b82f6' : '#22c55e'}`, borderLeft: `3px solid ${loading ? '#3b82f6' : '#22c55e'}` }}></div>
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 15, height: 15, borderBottom: `3px solid ${loading ? '#3b82f6' : '#22c55e'}`, borderRight: `3px solid ${loading ? '#3b82f6' : '#22c55e'}` }}></div>
                    </div>

                    {/* Extra scanning dots overlay */}
                    <div style={{ position: 'absolute', top: '30%', left: '40%', width: 6, height: 6, background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 10px #3b82f6', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                    <div style={{ position: 'absolute', top: '60%', left: '60%', width: 6, height: 6, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 1s' }}></div>
                  </>
                )}

                {!loading && (
                  <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '10px 24px', borderRadius: '30px', color: '#fff', fontSize: '0.9rem', zIndex: 10, backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600 }}>
                    Click anywhere to change image
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isSmallMobile ? '12px' : '20px', width: '100%', padding: '20px' }}>
                <motion.div
                  whileHover={{ scale: 1.02, background: 'rgba(34,197,94,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => { e.stopPropagation(); document.getElementById('fileInputCamera').click(); }}
                  style={{
                    background: isDark ? 'rgba(34,197,94,0.05)' : '#f0fdf4',
                    border: '2px solid #22c55e', borderRadius: '24px', padding: isSmallMobile ? '30px 10px' : '50px 20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: isSmallMobile ? '2.5rem' : '3.5rem' }}>📸</div>
                  <div style={{ color: '#16a34a', fontWeight: 900, fontSize: isSmallMobile ? '0.85rem' : '1.1rem', letterSpacing: '0.5px' }}>
                    {t.camera || 'CAMERA'}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, background: 'rgba(59,130,246,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => { e.stopPropagation(); document.getElementById('fileInputGallery').click(); }}
                  style={{
                    background: isDark ? 'rgba(59,130,246,0.05)' : '#eff6ff',
                    border: '2px solid #3b82f6', borderRadius: '24px', padding: isSmallMobile ? '30px 10px' : '50px 20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: isSmallMobile ? '2.5rem' : '3.5rem' }}>🖼️</div>
                  <div style={{ color: '#2563eb', fontWeight: 900, fontSize: isSmallMobile ? '0.85rem' : '1.1rem', letterSpacing: '0.5px' }}>
                    {t.gallery || 'GALLERY'}
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input id="fileInputCamera" type="file" accept="image/*" capture="environment"
            onChange={handleImage} style={{ display: 'none' }} />
          <input id="fileInputGallery" type="file" accept="image/*"
            onChange={handleImage} style={{ display: 'none' }} />

          {image && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>📄</span>
              <span style={{ color: '#cbd5e1', fontSize: '1rem', fontWeight: 500 }}>{image.name}</span>
            </div>
          )}

          <AnimatePresence>
            {result && !result.error && (() => {
              const isHealthyResult = (result?.disease?.type || '').toLowerCase().includes('healthy') || result?.is_healthy === true;
              const isCriticalResult = result?.severity === 'critical' || result?.severity === 'high';

              return (
                <motion.div
                  initial={{ opacity: 0, y: -30, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  style={{
                    marginBottom: '25px', padding: '24px 32px',
                    background: isCriticalResult
                      ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                      : !isHealthyResult
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    border: '2px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center',
                    gap: '20px', flexWrap: 'wrap',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',
                    animation: 'shimmerSlide 3s ease-in-out infinite'
                  }} />

                  <div style={{
                    fontSize: '2.5rem', background: 'rgba(255,255,255,0.2)',
                    padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)',
                    flexShrink: 0, zIndex: 2
                  }}>
                    {isCriticalResult ? '🚨' : !isHealthyResult ? '⚠️' : '🌿'}
                  </div>

                  <div style={{ flex: 1, textAlign: 'left', position: 'relative', zIndex: 2 }}>
                    <div style={{ fontWeight: 950, fontSize: isSmallMobile ? '1rem' : '1.3rem', letterSpacing: '0.8px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {isCriticalResult ? 'CRITICAL ALERT' : !isHealthyResult ? 'DISEASE / STRESS DETECTED' : 'CROP HEALTH STATUS'}
                    </div>
                    <div style={{ fontSize: isSmallMobile ? '0.85rem' : '1rem', opacity: 0.95, fontWeight: 700, marginTop: '4px' }}>
                      {result.positive_message || (isCriticalResult ? 'Immediate action required for your crop.' : !isHealthyResult ? 'Pathogen symptoms detected. Review diagnosis below.' : 'Your crop is in healthy condition.')}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.2)', padding: '8px 18px',
                    borderRadius: '30px', fontWeight: 900, fontSize: '0.85rem',
                    border: '1px solid rgba(255,255,255,0.4)', flexShrink: 0, zIndex: 2
                  }}>
                    {result.email_sent ? 'MAILED ✓' : 'ANALYZED ✓'}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '40px', textAlign: 'center', background: 'rgba(34,197,94,0.08)',
                borderRadius: '28px', border: '3px dashed #22c55e',
                boxShadow: '0 15px 40px rgba(34,197,94,0.1)'
              }}
            >
              <div style={{
                width: 50, height: 50, border: '5px solid #22c55e',
                borderTop: '5px solid transparent', borderRadius: '50%',
                animation: 'spin 1s linear infinite', margin: '0 auto 25px'
              }}></div>
              <div style={{ fontWeight: 950, color: '#22c55e', fontSize: isSmallMobile ? '1rem' : '1.3rem', letterSpacing: '1px' }}>{scanStatus.toUpperCase()}</div>
              <div style={{ color: '#64748b', fontSize: isSmallMobile ? '0.8rem' : '0.9rem', marginTop: '10px', fontWeight: 600 }}>Running Deep Genomics Assessment...</div>
            </motion.div>
          ) : (!result || result.error) ? (
            <button
              onClick={analyze}
              disabled={!image}
              style={{
                width: '100%', padding: '24px',
                background: !image ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: !image ? '#64748b' : 'white',
                border: 'none', borderRadius: '20px', fontSize: '1.25rem',
                cursor: !image ? 'not-allowed' : 'pointer', fontWeight: 950,
                boxShadow: !image ? 'none' : '0 20px 50px rgba(34, 197, 94, 0.45)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                letterSpacing: '1px'
              }}
            >
              {t.startAnalysis || '🚀 START ADVANCED AI ANALYSIS'}
            </button>
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setImage(null);
                setPreview(null);
                setResult(null);
              }}
              style={{
                width: '100%', padding: '18px 22px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white', border: 'none', borderRadius: '20px', fontSize: isSmallMobile ? '1rem' : '1.25rem',
                cursor: 'pointer', fontWeight: 950,
                boxShadow: '0 20px 50px rgba(59,130,246,0.3)',
                transition: 'all 0.3s ease',
                letterSpacing: '1px'
              }}
            >
              {t.scanAnother || '🔄 SCAN ANOTHER LEAF / RESET UI'}
            </motion.button>
          )}
          <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes shimmerSlide { 0% { left: -100%; } 100% { left: 150%; } }
          @keyframes pulseGrid { 0% { opacity: 0.1; } 100% { opacity: 0.4; } }
          @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
          @keyframes laserScan {
            0% { top: 0%; opacity: 0.1; }
            50% { opacity: 1; }
            100% { top: 100%; opacity: 0.1; }
          }
          @keyframes scanLineGlow {
            0% { box-shadow: 0 0 15px 5px rgba(59,130,246,0.5); }
            100% { box-shadow: 0 0 30px 12px rgba(59,130,246,0.8); }
          }
          @keyframes floatData {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
          }
        `}</style>


          {/* COMPLETE ANALYSIS RESULT (FUTURISTIC UI) */}
          {result && !result.error && (() => {
            const reportData = getTranslatedReportData(result?.diagnostic_report, result?.disease, lang);
            return (
              <div style={{ marginTop: '40px', fontFamily: '"Lexend Deca", sans-serif' }}>

                {/* Main Modern Report Container */}
                <div id="report-container" style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  border: `2px solid ${sevColor(result.severity)}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.1)`,
                  overflow: 'hidden',
                  position: 'relative'
                }}>

                  {/* Header */}
                  <div style={{
                    background: sevColor(result.severity),
                    padding: isSmallMobile ? '20px' : '24px 30px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: isMobile ? 'flex-start' : 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: 20,
                    color: '#fff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '14px', fontSize: '1.8rem' }}>
                        📋
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: isSmallMobile ? '1rem' : '1.5rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Smart Farm Diagnostic Report</h3>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <span><strong>Scan ID:</strong> {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                          <span>•</span>
                          <span><strong>Time:</strong> {new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '10px 24px',
                      borderRadius: '30px',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '50%', animation: 'ping 2s infinite' }}></div>
                      {(result.severity || 'UNKNOWN').toUpperCase()} RISK LEVEL
                    </div>
                  </div>

                  <div style={{ padding: isSmallMobile ? '20px' : '30px' }}>

                    {/* Section 1: Explainable AI Transparency & Lesion Spotlight (Displayed only for diseased/critical/high/medium risk leaves) */}
                    {!(
                      (result?.disease?.type || '').toLowerCase().includes('healthy') ||
                      result?.severity === 'low' ||
                      result?.severity === 'safe'
                    ) && (
                        <>
                          {/* Explainable AI Transparency Callout Banner */}
                          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderLeft: '5px solid #0ea5e9', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', color: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                              <h4 style={{ margin: 0, color: '#38bdf8', fontSize: isSmallMobile ? '0.95rem' : '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🧠 Explainable AI (Grad-CAM & Red/Yellow Disease Highlights)
                              </h4>
                              <span style={{ background: '#0369a1', color: '#e0f2fe', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                RESEARCH-GRADE TRANSPARENT AI
                              </span>
                            </div>
                            <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                              <strong>How it works:</strong> Red & yellow highlights project the exact leaf regions and lesion spots analyzed by the deep-learning model. This makes the AI decision completely transparent and easy to understand.
                            </p>
                          </div>

                          {/* 3-Stage Explainable AI Visual Verification */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                            {/* 1. Original Photo */}
                            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                              <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                🔍 1. Original Upload
                              </h4>
                              <div style={{ position: 'relative', width: '100%', height: isSmallMobile ? '200px' : '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', borderRadius: '12px', overflow: 'hidden' }}>
                                <img src={preview} alt="Original Leaf" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              </div>
                            </div>

                            {/* 2. Grad-CAM Neural Heatmap */}
                            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                              <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                🔥 2. Grad-CAM Heatmap
                              </h4>
                              <div style={{ position: 'relative', width: '100%', height: isSmallMobile ? '200px' : '250px', borderRadius: '12px', overflow: 'hidden', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {result.gradcam_url ? (
                                  <img src={`${API_BASE}${result.gradcam_url}`} alt="Grad-CAM Heatmap" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Heatmap generating...</div>
                                )}
                              </div>
                            </div>

                            {/* 3. Red/Yellow Infection Spotlight */}
                            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                              <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                🎯 3. Red/Yellow Infection Spotlight
                              </h4>
                              <div style={{ position: 'relative', width: '100%', height: isSmallMobile ? '200px' : '250px', borderRadius: '12px', overflow: 'hidden', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {result.infection_overlay_url ? (
                                  <img src={`${API_BASE}${result.infection_overlay_url}`} alt="Infection Spotlight Overlay" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : result.gradcam_url ? (
                                  <img src={`${API_BASE}${result.gradcam_url}`} alt="Infection Overlay" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Spotlight generating...</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                    {/* 🚨 3. OOD Detection (Smart AI Control) Component */}
                    {(
                      result?.is_ood ||
                      result?.disease?.is_ood ||
                      result?.diagnostic_report?.is_ood ||
                      ((result?.disease?.confidence || 0) < 60 && !(result?.disease?.type || '').toLowerCase().includes('healthy')) ||
                      (result?.disease?.type || '').toLowerCase().includes('unknown') ||
                      (result?.diagnostic_report?.health_status || '').toLowerCase().includes('unknown')
                    ) && (
                        <div style={{
                          background: 'linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)',
                          border: '2px solid #f59e0b', borderRadius: '18px', padding: '24px',
                          marginBottom: '24px', color: '#78350f', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.8rem' }}>🚨</span>
                              <div>
                                <h3 style={{ margin: 0, color: '#b45309', fontSize: '1.25rem', fontWeight: 900 }}>
                                  {t.oodHeader || '🚨 3. OOD Detection (Smart AI Control)'}
                                </h3>
                                <span style={{ background: '#f59e0b', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  RESEARCH-GRADE HUMAN-IN-THE-LOOP WORKFLOW
                                </span>
                              </div>
                            </div>
                            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, color: '#92400e' }}>
                              {t.oodMotto || '💡 "Galat answer dene se better hai \'pata nahi\' bolna"'}
                            </div>
                          </div>

                          <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', lineHeight: 1.6, color: '#92400e' }}>
                            <strong>Problem &amp; Solution:</strong> AI match confidence is <strong>{result.disease?.confidence || 0}%</strong> (below the <strong>60.0% reliability threshold</strong>). To prevent wrong disease predictions or harmful chemical sprays, our system flags this sample as <strong>Unknown / Out-of-Distribution Disease</strong> and triggers a Human-in-the-Loop agronomist escalation.
                          </p>

                          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid #fcd34d', marginBottom: '16px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#b45309', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🛡️ Interim Broad-Spectrum Protection Plan:
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#78350f', lineHeight: 1.5 }}>
                              {reportData.organicRemediesList && reportData.organicRemediesList.length > 0 ? (
                                reportData.organicRemediesList.map((item, i) => <li key={i}>{item}</li>)
                              ) : (
                                <>
                                  <li><strong>Broad-Spectrum Organic Spray:</strong> Apply Neem Oil Extract (5ml/L) + 5% Sour Buttermilk spray as protective bio-film.</li>
                                  <li><strong>Leaf Isolation:</strong> Prune and seal heavily affected foliage in a plastic bag for agronomist review.</li>
                                </>
                              )}
                            </ul>
                          </div>

                          <button
                            onClick={() => setExpertSent(true)}
                            disabled={expertSent}
                            style={{
                              width: '100%', padding: '14px 20px',
                              background: expertSent ? '#16a34a' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                              color: 'white', border: 'none', borderRadius: '12px',
                              fontWeight: 'bold', fontSize: '1rem', cursor: expertSent ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)'
                            }}
                          >
                            {expertSent ? (t.escalateSent || '✅ Specimen Submitted to KVK Expert Network!') : (t.escalateExpert || '👨‍🌾 Escalate Specimen to Local Agronomist / KVK Expert')}
                          </button>
                        </div>
                      )}

                    {/* Section 2: Core Analysis Overview */}
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      📊 Core Analysis Overview
                    </h4>
                    <div style={{ background: isDark ? '#1e293b' : '#f8fafc', overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isSmallMobile ? '0.75rem' : '0.9rem', textAlign: 'left' }}>
                        <thead style={{ background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#cbd5e1' : '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          <tr>
                            <th style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px', fontWeight: 800 }}>Metric</th>
                            <th style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px', fontWeight: 800 }}>Detection Result</th>
                          </tr>
                        </thead>
                        <tbody style={{ color: isDark ? '#e2e8f0' : '#334155' }}>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px', fontWeight: 600 }}>Detected Crop</td>
                            <td style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px', fontWeight: 900, color: sevColor(result.severity), fontSize: isSmallMobile ? '0.9rem' : '1.1rem' }}>
                              {reportData.displayCropName?.toUpperCase() || result.crop_name?.toUpperCase() || 'TOMATO'}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', background: sevColor(result.severity) + '05' }}>
                            <td style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px', fontWeight: 600, fontSize: isSmallMobile ? '0.8rem' : '0.95rem' }}>Primary Condition</td>
                            <td style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: sevColor(result.severity), fontSize: isSmallMobile ? '0.9rem' : '1.1rem' }}>
                                  {reportData.displayDisease || result.disease?.type?.replace(/___/g, ' - ').replace(/_/g, ' ') || 'Healthy'}
                                </span>
                                <span style={{ background: sevColor(result.severity), color: '#fff', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, fontSize: isSmallMobile ? '0.7rem' : '0.85rem' }}>
                                  {reportData.displayStatus || (result.severity === 'critical' ? 'CRITICAL RISK' : result.severity === 'high' ? 'HIGH RISK' : result.severity === 'medium' ? 'CAUTION' : 'SAFE')}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Botanical Intelligence Rows injected here */}
                          {result.disease?.details && (
                            <>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Pathogen / Cause</td>
                                <td style={{ padding: '16px 20px', color: '#475569' }}>
                                  {result.disease.details.cause}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Visual Symptoms</td>
                                <td style={{ padding: '16px 20px', color: '#475569' }}>
                                  {result.disease.details.symptoms}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Preventive Strategy</td>
                                <td style={{ padding: '16px 20px', color: '#475569' }}>
                                  {result.disease.details.prevention}
                                </td>
                              </tr>
                            </>
                          )}

                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px 20px', fontWeight: 600 }}>AI Confidence</td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ fontWeight: 800 }}>{result.disease?.confidence || 0}% Accuracy Match</span>
                                <div style={{ width: '150px', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                  <div style={{ width: `${result.disease?.confidence || 0}%`, height: '100%', background: sevColor(result.severity) }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                          {weather && !weather.error && (
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '16px 20px', fontWeight: 600 }}>Weather Impact</td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span>Temp: <strong>{weather.temperature}°C</strong> | Humidity: <strong>{weather.humidity}%</strong></span>
                                  <span style={{ color: (weather.humidity > 70 && result.severity !== 'low') ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
                                    ▶ {(weather.humidity > 70 && result.severity !== 'low') ? 'High Spread Risk' : 'Moderate Factor'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td style={{ padding: '16px 20px', fontWeight: 600 }}>Pest Traces</td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 600, color: (result.pest_solution?.detected || result.pests?.length > 0) ? '#ef4444' : '#16a34a' }}>
                                  {(result.pest_solution?.detected || result.pests?.length > 0)
                                    ? `${result.pest_solution?.pest_name || result.pests?.[0]?.label || 'Pest'} Trace Identified ⚠️`
                                    : 'No visual pest traces found 🟢'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Section 2: Professional Resolution Protocol */}
                    <div style={{ marginTop: '30px' }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: isSmallMobile ? '1rem' : '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                        📋 AI-Driven Resolution Protocol
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        {/* Pest Trace AI Solution Protocol Card */}
                        {result.pest_solution && (
                          <div style={{
                            background: result.pest_solution.detected ? '#fef2f2' : '#f0fdf4',
                            borderLeft: `5px solid ${result.pest_solution.detected ? '#8b5cf6' : '#22c55e'}`,
                            borderRadius: '8px', padding: isSmallMobile ? '15px' : '20px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                              <h5 style={{ margin: 0, color: result.pest_solution.detected ? '#6d28d9' : '#166534', fontSize: isSmallMobile ? '0.9rem' : '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {result.pest_solution.detected ? '🐛 Pest Trace AI Solution & Diagnostic' : '🟢 Pest Trace Status: Clear (No Pests Found)'}
                              </h5>
                              <span style={{ background: result.pest_solution.detected ? '#7c3aed' : '#22c55e', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem' }}>
                                {result.pest_solution.detected ? `DETECTED (${result.pest_solution.confidence || 90}% Match)` : 'HEALTHY FOLIAGE'}
                              </span>
                            </div>

                            {result.pest_solution.detected ? (
                              <div>
                                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '8px', fontSize: '0.95rem' }}>
                                  Pest: <strong style={{ color: '#6d28d9' }}>{result.pest_solution.pest_name}</strong> | <strong>Symptoms:</strong> {result.pest_solution.symptoms}
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155', lineHeight: 1.6, fontSize: isSmallMobile ? '0.85rem' : '0.95rem' }}>
                                  <li><strong style={{ color: '#1d4ed8' }}>Chemical Solution:</strong> {Array.isArray(result.pest_solution.chemical_control) ? result.pest_solution.chemical_control.join(', ') : result.pest_solution.chemical_control}</li>
                                  <li><strong style={{ color: '#15803d' }}>Organic Remedy:</strong> {Array.isArray(result.pest_solution.organic_control) ? result.pest_solution.organic_control.join(', ') : result.pest_solution.organic_control}</li>
                                  <li><strong style={{ color: '#b45309' }}>Immediate Action:</strong> {Array.isArray(result.pest_solution.immediate_action) ? result.pest_solution.immediate_action.join(', ') : result.pest_solution.immediate_action}</li>
                                </ul>
                              </div>
                            ) : (
                              <p style={{ margin: 0, color: '#166534', fontSize: isSmallMobile ? '0.85rem' : '0.95rem' }}>
                                No insect pests or feeding marks detected on this leaf. Deploy yellow sticky traps for perimeter defense.
                              </p>
                            )}
                          </div>
                        )}

                        {/* 1. Chemical Control */}
                        <div style={{ background: '#f8fafc', borderLeft: '5px solid #3b82f6', borderRadius: '8px', padding: isSmallMobile ? '15px' : '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: isSmallMobile ? '0.9rem' : '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            💊 Recommended Chemical Treatment
                          </h5>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155', lineHeight: 1.6, fontSize: isSmallMobile ? '0.85rem' : '1rem' }}>
                            {result.disease?.details?.chemical_control && Array.isArray(result.disease.details.chemical_control) ? (
                              result.disease.details.chemical_control.map((item, i) => <li key={i}>{item}</li>)
                            ) : (
                              <li><strong>Primary Action:</strong> {result.disease?.details?.chemical_control || result.treatment || "Standard market fungicide."}</li>
                            )}
                          </ul>
                        </div>

                        {/* 2. Organic / Biological Alternative */}
                        <div style={{ background: '#f0fdf4', borderLeft: '5px solid #22c55e', borderRadius: '8px', padding: isSmallMobile ? '15px' : '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: isSmallMobile ? '0.9rem' : '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🌿 Organic & Biological Alternative
                          </h5>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#15803d', lineHeight: 1.6, fontSize: isSmallMobile ? '0.85rem' : '1rem' }}>
                            {result.disease?.details?.organic_control && Array.isArray(result.disease.details.organic_control) ? (
                              result.disease.details.organic_control.map((item, i) => <li key={i}>{item}</li>)
                            ) : (
                              <li><strong>Eco-Friendly Approach:</strong> {result.disease?.details?.organic_control || "Apply neem oil or natural sulfur-based sprays to reduce chemical dependency."}</li>
                            )}
                          </ul>
                        </div>

                        {/* 3. Cultural Preventative Actions */}
                        <div style={{ background: '#fffbeb', borderLeft: '5px solid #f59e0b', borderRadius: '8px', padding: isSmallMobile ? '15px' : '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#b45309', fontSize: isSmallMobile ? '0.9rem' : '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🛡️ Field Management & Prevention
                          </h5>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#92400e', lineHeight: 1.6, fontSize: isSmallMobile ? '0.85rem' : '1rem' }}>
                            {result.recommendations && result.recommendations.length > 0 ? (
                              result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)
                            ) : (
                              <li>Avoid overhead watering and ensure proper plant spacing for airflow.</li>
                            )}
                          </ul>
                        </div>

                        {/* 4. AI System Alert Trigger & Yield Protector */}
                        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', marginTop: '10px', color: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05, fontSize: '10rem' }}>
                            ⚡
                          </div>
                          <h5 style={{ margin: '0 0 15px 0', color: '#38bdf8', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📡 Next-Gen System Alert Assessment
                          </h5>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Alert Status Generated:</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: sevColor(result.severity) }}>
                                {result.severity === 'critical' || result.severity === 'high' ? 'ACTIVE - IMMEDIATE ACTION REQUIRED' : 'PASSIVE - MONITORING'}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Projected Yield Preservation:</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>Up to 85% with prompt action</div>
                            </div>
                          </div>

                          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderLeft: '4px solid #38bdf8', color: '#bae6fd', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            <strong>System Insight:</strong> {result.severity === 'high' || result.severity === 'critical' ? "Environmental factors and pathogen spread probability are currently very high. Dispatch treatment protocols within 48 hours for optimal recovery." : "Crop is currently stable. Maintain baseline agricultural practices and continue using the scanner weekly."}
                          </div>

                          <div data-html2canvas-ignore="true" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '15px', flexWrap: 'wrap' }}>
                            <button onClick={() => goToTab('queries')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(34,197,94,0.3)', transition: '0.2s' }}>
                              🩺 CONSULT EXPERT
                            </button>
                            <button onClick={() => goToTab('bot')} style={{ background: 'transparent', color: '#38bdf8', border: '2px solid #38bdf8', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>
                              🤖 ASK KISAN BOT
                            </button>
                            <button onClick={handleDownloadReport} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', zIndex: 10 }}>
                              📥 OFFLINE REPORT
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}

          {result?.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '20px', padding: '20px 24px',
                background: '#fef2f2', borderLeft: '6px solid #ef4444',
                borderRadius: '14px', color: '#991b1b', textAlign: 'left',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 900, marginBottom: '6px', color: '#dc2626' }}>
                🛡️ 🛑 Image Quality Guard Rejection
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.5 }}>
                {result.error}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '8px', fontWeight: 600 }}>
                💡 Tip: Please capture a clear, close-up, well-lit photograph focused on a single crop leaf.
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

