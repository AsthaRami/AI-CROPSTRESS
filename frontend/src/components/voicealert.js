import React, { useState } from 'react';

export default function VoiceAlert({ result, weather }) {
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState('hi-IN');

  const speak = () => {
    if (!result) return;
    window.speechSynthesis.cancel();

    const disease = result.disease?.type?.replace(/___/g, ' ').replace(/_/g, ' ') || 'Unknown';
    const confidence = result.disease?.confidence || 0;
    const severity = result.severity || 'low';
    const treatment = result.treatment || '';
    const weatherText = weather
      ? `Tapman ${weather.temperature} degree, Aardrata ${weather.humidity} pratishat.`
      : '';

    let message = '';

    if (lang === 'hi-IN') {
      message = `Fasal swaasthya jaanch ki report. Bimari mili hai: ${disease}. Vishwaas star: ${confidence} pratishat. Gambhirta: ${severity}. Ilaaj: ${treatment}. ${weatherText} ${
        severity === 'critical' ? 'Seedha dhyan dijiye! Turant spray karein!' :
        severity === 'high' ? 'Jaldi ilaaj karein. Do din mein spray karein.' :
        severity === 'medium' ? 'Ek hafte mein ilaaj karein.' :
        'Fasal theek hai. Nazar rakhein.'
      }`;
    } else if (lang === 'gu-IN') {
      message = `Pako swasthya tapas report. Rog malyo chhe: ${disease}. Vishwas star: ${confidence} taaka. Gambhirta: ${severity}. Upchar: ${treatment}. ${weatherText} ${
        severity === 'critical' ? 'Tatkal dhyan apo! Abhi spray karo!' :
        severity === 'high' ? 'Jaldi upchar karo. Be divas ma spray karo.' :
        severity === 'medium' ? 'Ek Athvadiya ma upchar karo.' :
        'Pako saras chhe. Nazar rakho.'
      }`;
    } else {
      message = `Crop health analysis report. Disease detected: ${disease}. Confidence: ${confidence} percent. Severity: ${severity}. Treatment: ${treatment}. ${
        weather ? `Weather: Temperature ${weather.temperature} degrees, Humidity ${weather.humidity} percent.` : ''
      } ${
        severity === 'critical' ? 'Immediate attention required! Spray today!' :
        severity === 'high' ? 'Urgent treatment needed within 2 days.' :
        severity === 'medium' ? 'Treatment needed within one week.' :
        'Crop is healthy. Keep monitoring.'
      }`;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  if (!result) return null;

  return (
    <div style={{
      background: speaking
        ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
        : 'linear-gradient(135deg, #1e1b4b, #312e81)',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px',
      border: '1px solid #4f46e5'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
            Voice Alert System
          </div>
          <div style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>
            Report sunne ke liye language chunein
          </div>
        </div>
        {speaking && (
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{
                width: '4px',
                background: '#818cf8',
                borderRadius: '2px',
                height: (10 + i * 6) + 'px'
              }}></div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {[
          { code: 'hi-IN', label: 'Hindi' },
          { code: 'gu-IN', label: 'Gujarati' },
          { code: 'en-US', label: 'English' },
        ].map(l => (
          <button key={l.code}
            onClick={() => setLang(l.code)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              background: lang === l.code ? '#4f46e5' : 'rgba(255,255,255,0.1)',
              color: lang === l.code ? 'white' : '#a5b4fc'
            }}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={speak} disabled={speaking} style={{
          flex: 1,
          padding: '10px',
          borderRadius: '8px',
          border: 'none',
          background: speaking ? '#6d28d9' : '#4f46e5',
          color: 'white',
          cursor: speaking ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '0.95rem'
        }}>
          {speaking ? 'Bol raha hai...' : 'Report Sunao'}
        </button>
        {speaking && (
          <button onClick={stop} style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#dc2626',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
