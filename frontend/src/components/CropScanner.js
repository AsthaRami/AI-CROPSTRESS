import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../translations';

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
  const loadWeather = () => {};

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
      formData.append('image', image);
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
    low:'#16a34a', medium:'#d97706', high:'#ea580c', critical:'#dc2626'
  })[s] || '#666';
  const riskColor = r => ({ low:'#16a34a', medium:'#d97706', high:'#dc2626' })[r] || '#666';

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
    <div style={{ fontFamily:'Arial', maxWidth:'1000px', margin:'0 auto' }}>

      {/* Weather section removed - showing Scanner only */}
      <div style={{
        display: 'none',
        background:'linear-gradient(135deg, #0ea5e9, #0284c7)',
        borderRadius:'16px', padding:'20px', marginBottom:'20px', color:'white'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <h3 style={{ margin:0, fontSize:'1.1rem' }}>Weather Conditions</h3>
          <div style={{ display:'flex', gap:'8px' }}>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City"
              style={{
                padding:'6px 10px', borderRadius:'6px', border:'none',
                fontSize:'0.9rem', width:'120px'
              }}
            />
            <button onClick={() => loadWeather(city)} style={{
              background:'rgba(255,255,255,0.2)', color:'white',
              border:'1px solid rgba(255,255,255,0.4)',
              padding:'6px 12px', borderRadius:'6px', cursor:'pointer'
            }}>Update</button>
          </div>
        </div>

        {wLoading ? (
          <p style={{ opacity:0.8 }}>Loading weather...</p>
        ) : weather && !weather.error ? (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'16px' }}>
              {[
                { label: t.temp || 'Temperature', value: weather.temperature + ' C',    icon:'Temp' },
                { label: t.humidity || 'Humidity', value: weather.humidity    + '%',      icon:'Hum'  },
                { label: t.windSpeed || 'Wind Speed', value: weather.wind_speed  + ' m/s',   icon:'Wind' },
                { label: t.condition || 'Condition', value: weather.description,            icon:'Sky'  },
              ].map((w, i) => (
                <div key={i} style={{
                  background:'rgba(255,255,255,0.15)', borderRadius:'10px',
                  padding:'12px', textAlign:'center'
                }}>
                  <div style={{ fontSize:'0.75rem', opacity:0.8 }}>{w.label}</div>
                  <div style={{ fontSize:'1rem', fontWeight:'bold', marginTop:'4px' }}>{w.value}</div>
                </div>
              ))}
            </div>

            {/* Risk Level */}
            <div style={{
              background:'rgba(255,255,255,0.15)', borderRadius:'10px',
              padding:'12px', marginBottom:'12px'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                <span style={{ fontSize:'0.9rem', opacity:0.9 }}>{t.riskLevel || 'Crop Risk Level'}:</span>
                <span style={{
                  padding:'3px 12px', borderRadius:'12px', fontWeight:'bold',
                  background: riskColor(weather.risk_level), fontSize:'0.85rem'
                }}>{(weather.risk_level || 'Unknown').toUpperCase()}</span>
              </div>
              {weather.crop_impact?.map((imp, i) => (
                <div key={i} style={{ fontSize:'0.85rem', opacity:0.9, marginBottom:'3px' }}>
                  � {imp}
                </div>
              ))}
            </div>

            {/* Weather Recommendations */}
            <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:'10px', padding:'12px' }}>
              <div style={{ fontSize:'0.85rem', fontWeight:'bold', marginBottom:'6px' }}>
                {t.weatherRec || 'Weather Recommendations'}:
              </div>
              {weather.recommendations?.map((rec, i) => (
                <div key={i} style={{ fontSize:'0.85rem', opacity:0.9, marginBottom:'3px' }}>
                  � {rec}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ opacity:0.8 }}>{t.weatherNA || 'Weather data unavailable'}</p>
            <p style={{ opacity:0.7, fontSize:'0.85rem' }}>
              Add OpenWeatherMap API key in weather.py
            </p>
          </div>
        )}
      </div>

      {/* Scanner Card */}
      <div style={{
        background:'transparent', borderRadius:'16px',
        padding:'0', transition: 'all 0.3s ease'
      }}>
        <h3 style={{ color: '#22c55e', marginTop:0, fontSize: isSmallMobile ? '1.25rem' : '1.5rem', fontWeight: 800 }}>{t.scannerTitle || 'AI Crop Health Scanner'}</h3>
        <p style={{ color:'#94a3b8', fontSize: isSmallMobile ? '0.9rem' : '1rem', marginBottom:'32px' }}>
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
                 style={{ width:'100%', height:'auto', maxHeight:'80vh', objectFit:'contain', display: 'block', filter: (loading || (result && !result.error)) ? 'contrast(1.15) brightness(0.85) saturate(1.2)' : 'none', transition: 'all 0.5s' }} />
               
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
                      {loading && [1,2,3,4,5].map(i => (
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
                            {['ANALYZING...', 'CHECKING PIXELS', 'GENOMIC SCAN', 'PATTERN MATCH', 'NODE_ID_402'][i-1]}
                          </div>
                        </div>
                      ))}
                      
                      {/* Glowing Matrix Grid */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(${loading ? 'rgba(59,130,246,0.2)' : sevColor(result?.severity) + '30'} 1px, transparent 1px), linear-gradient(90deg, ${loading ? 'rgba(59,130,246,0.2)' : sevColor(result?.severity) + '30'} 1px, transparent 1px)`, backgroundSize: '40px 40px', animation: loading ? 'pulseGrid 1.5s infinite alternate' : 'none', pointerEvents: 'none', zIndex: 5 }}></div>
                      
                      {/* Top Left Diagnostic Data */}
                      <div style={{ position: 'absolute', top: isSmallMobile ? 10 : 20, left: isSmallMobile ? 10 : 20, padding: isSmallMobile ? '10px 15px' : '15px 20px', background: 'rgba(2, 6, 23, 0.85)', border: `1px solid ${loading ? '#3b82f6' : sevColor(result?.severity)}`, borderRadius: '12px', color: '#fff', fontFamily: 'monospace', zIndex: 20, backdropFilter: 'blur(10px)', textAlign: 'left', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', minWidth: isSmallMobile ? 180 : 220 }}>
                         <div style={{ fontSize: isSmallMobile ? '0.7rem' : '0.8rem', color: '#cbd5e1', marginBottom: 6, letterSpacing: '1px' }}>{loading ? 'SYSTEM STATUS' : 'DIAGNOSIS RESULT'}</div>
                         <div style={{ fontSize: isSmallMobile ? '1rem' : '1.25rem', fontWeight: 900, color: loading ? '#3b82f6' : sevColor(result?.severity) }}>{loading ? 'EXTRACTING...' : (result?.disease?.type?.replace(/___/g,' - ').replace(/_/g,' ') || 'Healthy')}</div>
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
          onChange={handleImage} style={{ display:'none' }} />
        <input id="fileInputGallery" type="file" accept="image/*"
          onChange={handleImage} style={{ display:'none' }} />

        {image && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
            <span style={{ fontSize: '1.2rem' }}>📄</span>
            <span style={{ color:'#cbd5e1', fontSize:'1rem', fontWeight: 500 }}>{image.name}</span>
          </div>
        )}

        <AnimatePresence>
          {result && !result.error && (
            <motion.div 
              initial={{ opacity: 0, y: -30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                marginBottom: '25px', padding: '24px 32px',
                background: result?.severity === 'critical' 
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
                  : (result?.severity === 'low' || !result?.severity)
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                {result?.severity === 'critical' ? '🚨' : (result?.severity === 'low' || !result?.severity) ? '🌿' : '⚠️'}
              </div>

              <div style={{ flex: 1, textAlign: 'left', position: 'relative', zIndex: 2 }}>
                <div style={{ fontWeight: 950, fontSize: isSmallMobile ? '1rem' : '1.3rem', letterSpacing: '0.8px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {result?.severity === 'critical' ? 'CRITICAL ALERT' : (result?.severity === 'low' || !result?.severity) ? 'CROP HEALTH STATUS' : 'MODERATE STRESS DETECTED'}
                </div>
                <div style={{ fontSize: isSmallMobile ? '0.85rem' : '1rem', opacity: 0.95, fontWeight: 700, marginTop: '4px' }}>
                  {result.positive_message || (result.severity === 'critical' ? 'Immediate action required for your crop.' : 'Monitor your field for changes.')}
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
          )}
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
              width:'100%', padding:'24px',
              background: !image ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: !image ? '#64748b' : 'white',
              border:'none', borderRadius:'20px', fontSize:'1.25rem',
              cursor: !image ? 'not-allowed' : 'pointer', fontWeight:950,
              boxShadow: !image ? 'none' : '0 20px 50px rgba(34, 197, 94, 0.45)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              letterSpacing: '1px'
            }}
          >
            🚀 START ADVANCED AI ANALYSIS
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
              width:'100%', padding:'18px 22px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white', border:'none', borderRadius:'20px', fontSize: isSmallMobile ? '1rem' : '1.25rem',
              cursor: 'pointer', fontWeight:950,
              boxShadow: '0 20px 50px rgba(59,130,246,0.3)',
              transition: 'all 0.3s ease',
              letterSpacing: '1px'
            }}
          >
            🔄 SCAN ANOTHER LEAF / RESET UI
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
        {result && !result.error && (
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
                     <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', display: 'flex', gap: '10px', flexWrap:'wrap' }}>
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
                
                {/* Section 1: Visual Verification */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                   {/* Original Photo */}
                   <div style={{ background: '#0f172a', padding: '10px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', fontSize: isSmallMobile ? '0.85rem' : '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                         🔍 Original Upload
                      </h4>
                      <div style={{ position: 'relative', width: '100%', height: isSmallMobile ? '220px' : '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', borderRadius: '12px', overflow: 'hidden' }}>
                        <img src={preview} alt="Original Leaf" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                   </div>
                   {/* Heatmap/Analysis Photo */}
                   <div style={{ background: '#0f172a', padding: '10px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', fontSize: isSmallMobile ? '0.85rem' : '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                         🩸 Pathogen Heatmap
                      </h4>
                      {result.gradcam_url ? (
                        <div style={{ position: 'relative', width: '100%', height: isSmallMobile ? '220px' : '300px', borderRadius: '12px', overflow: 'hidden', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={preview} alt="Base" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', position: 'absolute' }} />
                          <img src={`${API_BASE}${result.gradcam_url}`} alt="Heatmap" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', position: 'absolute', mixBlendMode: 'screen', opacity: 0.8 }} />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '250px', background: '#e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 600 }}>
                           No structural damage mapped.
                        </div>
                      )}
                   </div>
                </div>

                {/* Section 2: Comprehensive Modern Analysis Overview */}
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
                          {result.crop_name?.toUpperCase() || 'UNKNOWN CROP'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: sevColor(result.severity) + '05' }}>
                        <td style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px', fontWeight: 600, fontSize: isSmallMobile ? '0.8rem' : '0.95rem' }}>Primary Condition</td>
                        <td style={{ padding: isSmallMobile ? '12px 15px' : '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: sevColor(result.severity), fontSize: isSmallMobile ? '0.9rem' : '1.1rem' }}>
                              {result.disease?.type?.replace(/___/g,' - ').replace(/_/g,' ') || 'Healthy'}
                            </span>
                            <span style={{ background: sevColor(result.severity), color: '#fff', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, fontSize: isSmallMobile ? '0.7rem' : '0.85rem' }}>
                               {result.severity === 'critical' ? 'CRITICAL RISK' : result.severity === 'high' ? 'HIGH RISK' : result.severity === 'medium' ? 'CAUTION' : 'SAFE'}
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
                            <span style={{ fontWeight: 600, color: result.pests?.length > 0 ? '#ef4444' : '#16a34a' }}>
                              {result.pests?.length > 0 ? result.pests.length + ' Pests Detected ⚠️' : 'No visual pests found 🟢'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Professional Resolution Protocol */}
                <div style={{ marginTop: '30px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: isSmallMobile ? '1rem' : '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                     📋 AI-Driven Resolution Protocol
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                     
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
        )}

        {result?.error && (
          <div style={{
            marginTop:'16px', padding:'14px',
            background:'#fee2e2', borderRadius:'8px', color:'#dc2626'
          }}>
            Error: {result.error}
          </div>
        )}
      </div>
    </div>
  );
}

