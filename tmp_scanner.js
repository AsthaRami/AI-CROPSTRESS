import React, { useState } from 'react';

export default function CropScanner({ onScanComplete }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  const analyze = async () => {
    if (!image) { alert('Please select an image!'); return; }
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', image);
      formData.append('crop_id', '1');
      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const res = await fetch(`${API_BASE}/api/detect/image`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ error: data.error || 'Analysis failed' });
      } else {
        setResult(data);
        if (onScanComplete) onScanComplete();
      }
    } catch (e) {
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
                { label:'Temperature', value: weather.temperature + ' C',    icon:'Temp' },
                { label:'Humidity',    value: weather.humidity    + '%',      icon:'Hum'  },
                { label:'Wind Speed',  value: weather.wind_speed  + ' m/s',   icon:'Wind' },
                { label:'Condition',   value: weather.description,            icon:'Sky'  },
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
                <span style={{ fontSize:'0.9rem', opacity:0.9 }}>Crop Risk Level:</span>
                <span style={{
                  padding:'3px 12px', borderRadius:'12px', fontWeight:'bold',
                  background: riskColor(weather.risk_level), fontSize:'0.85rem'
                }}>{(weather.risk_level || '').toUpperCase()}</span>
              </div>
              {weather.crop_impact?.map((imp, i) => (
                <div key={i} style={{ fontSize:'0.85rem', opacity:0.9, marginBottom:'3px' }}>
                  ù {imp}
                </div>
              ))}
            </div>

            {/* Weather Recommendations */}
            <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:'10px', padding:'12px' }}>
              <div style={{ fontSize:'0.85rem', fontWeight:'bold', marginBottom:'6px' }}>
                Weather Recommendations:
              </div>
              {weather.recommendations?.map((rec, i) => (
                <div key={i} style={{ fontSize:'0.85rem', opacity:0.9, marginBottom:'3px' }}>
                  ù {rec}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ opacity:0.8 }}>Weather data unavailable</p>
            <p style={{ opacity:0.7, fontSize:'0.85rem' }}>
              Add OpenWeatherMap API key in weather.py
            </p>
          </div>
        )}
      </div>

      {/* Scanner Card */}
      <div style={{
        background:'white', borderRadius:'16px',
        padding:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ color:'#166534', marginTop:0 }}>AI Crop Scanner</h3>
        <p style={{ color:'#666', fontSize:'0.9rem', marginBottom:'20px' }}>
          Upload leaf photo for complete disease, pest and stress analysis
        </p>

        {/* Upload */}
        <div style={{
          border:'2px dashed #16a34a', borderRadius:'12px', padding:'24px',
          textAlign:'center', background:'#f0fdf4', marginBottom:'16px', cursor:'pointer'
        }} onClick={() => document.getElementById('fileInput').click()}>
          {preview ? (
            <img src={preview} alt="crop"
              style={{ maxWidth:'100%', maxHeight:'200px', borderRadius:'8px' }} />
          ) : (
            <div>
              <div style={{ fontSize:'2.5rem', color:'#16a34a' }}>+</div>
              <p style={{ color:'#16a34a', fontWeight:'bold', margin:'5px 0' }}>
                Click to Upload Leaf Photo
              </p>
              <p style={{ color:'#999', fontSize:'0.85rem' }}>JPG, PNG supported</p>
            </div>
          )}
        </div>

        <input id="fileInput" type="file" accept="image/*"
          onChange={handleImage} style={{ display:'none' }} />

        {image && (
          <p style={{ color:'#666', fontSize:'0.85rem', marginBottom:'12px' }}>
            Selected: {image.name}
          </p>
        )}

        <button onClick={analyze} disabled={loading || !image} style={{
          width:'100%', padding:'14px',
          background: !image ? '#e5e7eb' : loading ? '#9ca3af' : '#16a34a',
          color: !image ? '#999' : 'white',
          border:'none', borderRadius:'8px', fontSize:'1rem',
          cursor: !image ? 'not-allowed' : 'pointer', fontWeight:'bold'
        }}>
          {loading ? 'Analyzing...' : 'Analyze Crop'}
        </button>

        {/* COMPLETE ANALYSIS RESULT */}
        {result && !result.error && (
          <div style={{ marginTop:'24px' }}>

            {/* Header */}
            <div style={{
              background: result.severity === 'critical' ? '#fef2f2' :
                          result.severity === 'high'     ? '#fff7ed' :
                          result.severity === 'medium'   ? '#fefce8' : '#f0fdf4',
              borderRadius:'12px', padding:'20px', marginBottom:'16px',
              border:'2px solid ' + sevColor(result.severity)
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h4 style={{ margin:0, color:'#333', fontSize:'1.2rem' }}>
                  Analysis Report
                </h4>
                <span style={{
                  padding:'6px 18px', borderRadius:'20px',
                  background: sevColor(result.severity),
                  color:'white', fontWeight:'bold', fontSize:'0.9rem'
                }}>
                  {(result.severity || '').toUpperCase()} SEVERITY
                </span>
              </div>

              {/* Disease + Confidence */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                <div style={{ background:'white', padding:'14px', borderRadius:'8px' }}>
                  <div style={{ color:'#999', fontSize:'0.8rem', marginBottom:'4px' }}>DISEASE DETECTED</div>
                  <div style={{ color:'#333', fontWeight:'bold', fontSize:'1rem' }}>
                    {result.disease?.type?.replace(/___/g,' ').replace(/_/g,' ')}
                  </div>
                </div>
                <div style={{ background:'white', padding:'14px', borderRadius:'8px' }}>
                  <div style={{ color:'#999', fontSize:'0.8rem', marginBottom:'4px' }}>AI CONFIDENCE</div>
                  <div style={{ color: sevColor(result.severity), fontWeight:'bold', fontSize:'1.5rem' }}>
                    {result.disease?.confidence}%
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontSize:'0.85rem', color:'#666' }}>Confidence Level</span>
                  <span style={{ fontSize:'0.85rem', fontWeight:'bold' }}>{result.disease?.confidence}%</span>
                </div>
                <div style={{ background:'#e5e7eb', borderRadius:'10px', height:'10px', overflow:'hidden' }}>
                  <div style={{
                    width: result.disease?.confidence + '%',
                    height:'100%', borderRadius:'10px',
                    background: sevColor(result.severity),
                    transition:'width 1s ease'
                  }}></div>
                </div>
              </div>
            </div>

            {/* Treatment */}
            <div style={{
              background:'#fffbeb', padding:'16px', borderRadius:'12px',
              border:'2px solid #fbbf24', marginBottom:'16px'
            }}>
              <div style={{ color:'#92400e', fontWeight:'bold', marginBottom:'8px', fontSize:'0.95rem' }}>
                RECOMMENDED TREATMENT
              </div>
              <div style={{ color:'#78350f', fontSize:'0.95rem', lineHeight:'1.6' }}>
                {result.treatment}
              </div>
            </div>

            {/* Pests */}
            {result.pests && result.pests.length > 0 && (
              <div style={{
                background:'#fef3c7', padding:'16px', borderRadius:'12px',
                border:'2px solid #f59e0b', marginBottom:'16px'
              }}>
                <div style={{ color:'#92400e', fontWeight:'bold', marginBottom:'10px' }}>
                  PESTS DETECTED
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {result.pests.map((p, i) => (
                    <div key={i} style={{
                      background:'white', padding:'8px 14px', borderRadius:'20px',
                      border:'1px solid #fbbf24', fontSize:'0.9rem', color:'#78350f'
                    }}>
                      {p.pest} ù {p.confidence}%
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weather Impact on This Disease */}
            {weather && !weather.error && (
              <div style={{
                background:'#eff6ff', padding:'16px', borderRadius:'12px',
                border:'2px solid #93c5fd', marginBottom:'16px'
              }}>
                <div style={{ color:'#1e40af', fontWeight:'bold', marginBottom:'10px', fontSize:'0.95rem' }}>
                  WEATHER IMPACT ON DISEASE
                </div>
                <div style={{ color:'#1e3a8a', fontSize:'0.9rem', lineHeight:'1.6' }}>
                  {weather.humidity > 75 && result.severity !== 'low' ? (
                    <p>ù High humidity ({weather.humidity}%) is accelerating disease spread. Immediate action needed!</p>
                  ) : (
                    <p>ù Current humidity ({weather.humidity}%) ù disease spread is moderate.</p>
                  )}
                  {weather.temperature > 30 ? (
                    <p>ù High temperature ({weather.temperature}C) creating favorable conditions for {result.disease?.type?.split('___')[1]?.replace(/_/g,' ')}.</p>
                  ) : (
                    <p>ù Temperature ({weather.temperature}C) is within normal range for disease development.</p>
                  )}
                  <p>ù Best spray time: Early morning (6-9 AM) or evening (5-7 PM) in current conditions.</p>
                </div>
              </div>
            )}

            {/* Analysis Summary */}
            <div style={{
              background:'#f0fdf4', padding:'16px', borderRadius:'12px',
              border:'2px solid #86efac'
            }}>
              <div style={{ color:'#166534', fontWeight:'bold', marginBottom:'10px', fontSize:'0.95rem' }}>
                COMPLETE ANALYSIS SUMMARY
              </div>
              <div style={{ fontSize:'0.9rem', color:'#166534', lineHeight:'1.8' }}>
                <p style={{ margin:'4px 0' }}>
                  Crop: {result.crop_name || result.disease?.type?.split('___')[0] || 'Unknown'}
                </p>
                <p style={{ margin:'4px 0' }}>
                  Disease: {result.disease?.type?.replace(/___/g,' - ').replace(/_/g,' ')}
                </p>
                <p style={{ margin:'4px 0' }}>
                  Severity: {result.severity?.toUpperCase()} ({result.disease?.confidence}% confidence)
                </p>
                <p style={{ margin:'4px 0' }}>
                  Pests: {result.pests?.length > 0 ? result.pests.map(p => p.pest).join(', ') : 'None detected'}
                </p>
                <p style={{ margin:'8px 0 4px', fontWeight:'bold' }}>
                  Action Required: {
                    result.severity === 'critical' ? 'IMMEDIATE ù Spray today!' :
                    result.severity === 'high'     ? 'URGENT ù Within 2 days' :
                    result.severity === 'medium'   ? 'SOON ù Within 1 week' :
                                                     'MONITOR ù Check weekly'
                  }
                </p>
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
