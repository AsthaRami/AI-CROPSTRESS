import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../translations';

export default function Login({ onLogin, mode = 'login', onBackToLanding, theme, toggleTheme, lang, changeLang }) {
  const t = translations[lang] || translations.en;
  const isDark = theme === 'black';

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isSmallMobile = windowWidth < 640;

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', email:'', password:'', confirmPassword:'', role:'farmer' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsRegister(mode === 'signup');
    setMessage('');
  }, [mode]);

  const handleSubmit = async () => {
    if (isRegister) {
      if (!form.name || !form.phone || !form.email || !form.password || !form.confirmPassword) {
        setMessage(lang === 'en' ? 'Please fill all fields.' : (lang === 'hi' ? 'कृपया सभी फ़ील्ड भरें।' : 'કૃપા કરીને બધી ફીલ્ડ ભરો.'));
        return;
      }
      if (form.password !== form.confirmPassword) {
        setMessage(lang === 'en' ? 'Passwords do not match.' : (lang === 'hi' ? 'पासवर्ड मेल नहीं खाते।' : 'પાસવર્ડ મેચ થતા નથી.'));
        return;
      }
    } else {
      if (!form.phone || !form.password) {
        setMessage(lang === 'en' ? 'Phone and password are required.' : (lang === 'hi' ? 'फोन और पासवर्ड आवश्यक हैं।' : 'ફોન અને પાસવર્ડ જરૂરી છે.'));
        return;
      }
    }

    setLoading(true);
    setMessage('');
    try {
      const url = isRegister
        ? 'http://127.0.0.1:5001/api/auth/register'
        : 'http://127.0.0.1:5001/api/auth/login';
      const res  = await fetch(url, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) {
          if (data.user.email) localStorage.setItem('user_email', data.user.email);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        setMessage(isRegister ? 'Account created successfully!' : 'Welcome back!');
        setTimeout(() => onLogin(data.user || data), 800);
      } else {
        setMessage('Error: ' + (data.error || 'Invalid credentials'));
      }
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
    setLoading(false);
  };

  const txtMain = isDark ? '#f1f5f9' : '#1e293b';
  const txtSec = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)';

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    marginBottom: '16px',
    borderRadius: '12px',
    border: `1px solid ${borderCol}`,
    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
    color: txtMain,
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: '"Lexend Deca", sans-serif'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `url("/smart_farming_hero.png") center/cover no-repeat fixed`,
      fontFamily: '"Outfit", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: isDark ? 'rgba(2, 6, 23, 0.85)' : 'rgba(255, 255, 255, 0.7)',
        zIndex: 1
      }} />

      <nav style={{
        position: 'relative', zIndex: 10, width: '100%', padding: isSmallMobile ? '20px' : '24px 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: isSmallMobile ? '1.2rem' : '1.4rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={onBackToLanding}>
          <span style={{ color: '#22c55e' }}>AI</span>
          <span style={{ color: txtMain }}>CROPSTRESS</span>
        </div>

        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <select value={lang} onChange={(e) => changeLang(e.target.value)} style={{
            background: 'transparent', color: txtMain, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer'
          }}>
            <option value="en">EN</option>
            <option value="hi">HI</option>
            <option value="gu">GU</option>
          </select>
          <button onClick={toggleTheme} style={{
            background: isDark ? '#fff' : '#000', color: isDark ? '#000' : '#fff', border: 'none', borderRadius: '12px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: 20 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={isRegister ? 'register' : 'login'}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              width: 440,
              maxWidth: '100%',
              padding: isSmallMobile ? '32px 24px' : '48px',
              borderRadius: isSmallMobile ? 24 : 32,
              background: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${borderCol}`,
              boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
              color: txtMain
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <motion.div 
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ fontSize: '2.5rem', marginBottom: 15 }}
              >
                {isRegister ? '🚜' : '🌿'}
              </motion.div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {isRegister ? 'Create a new farmer account' : t.welcomeBack}
              </h2>
              <p style={{ color: txtSec, marginTop: 12, fontSize: '1rem', lineHeight: 1.5 }}>
                {isRegister ? 'Join thousands of farmers protecting their yield with AI.' : 'Sign in to monitor your farm health and alerts.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {isRegister && (
                <motion.input
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  placeholder={t.fullName}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onKeyPress={e => e.key === 'Enter' && handleSubmit()}
                  style={inputStyle}
                />
              )}
              
              <motion.input
                initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                placeholder="Phone Number"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onKeyPress={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle}
              />

              {isRegister && (
                <motion.input
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                  placeholder={t.email}
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                />
              )}
              
              <div style={{ position: 'relative' }}>
                <motion.input
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  placeholder={t.password}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyPress={e => e.key === 'Enter' && handleSubmit()}
                  style={{ ...inputStyle, paddingRight: '45px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '15px', background: 'transparent', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900, padding: 0 }}
                >
                  {showPassword ? t.hide : t.show}
                </button>
              </div>

              {isRegister && (
                <div style={{ position: 'relative' }}>
                  <motion.input
                    initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                    placeholder={lang === 'en' ? "Confirm Password" : (lang === 'hi' ? "पासवर्ड की पुष्टि करें" : "પાસવર્ડની પુષ્ટિ કરો")}
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    onKeyPress={e => e.key === 'Enter' && handleSubmit()}
                    style={{ ...inputStyle, paddingRight: '45px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '15px', top: '15px', background: 'transparent', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900, padding: 0 }}
                  >
                    {showConfirmPassword ? t.hide : t.show}
                  </button>
                </div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 16px', borderRadius: '12px', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center',
                    background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: message.includes('Error') ? '#ef4444' : '#22c55e',
                    border: `1px solid ${message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                  }}
                >
                  {message}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 900,
                  background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white',
                  boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)', transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Authenticating...' : isRegister ? t.signup : t.login}
              </motion.button>

              <p style={{ textAlign: 'center', marginTop: 30, color: txtSec, fontSize: '0.95rem' }}>
                {isRegister ? t.alreadyHaveAccount : t.dontHaveAccount}
                {' '}
                <span
                  onClick={() => { setIsRegister(!isRegister); setMessage(''); }}
                  style={{ color: '#22c55e', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline' }}
                >
                  {isRegister ? t.login : t.signup}
                </span>
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 0', color: txtSec, fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} AI CROPSTRESS. Secure & Encrypted Connection.
      </footer>
    </div>
  );
}
