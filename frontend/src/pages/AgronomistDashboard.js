import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../translations';
import { getAgroQueries, getAgroStats, respondToQuery, getAgroNotifications, markAgroNotificationsRead, updateAgroProfile } from '../services/api';

export default function AgronomistDashboard({ user, onLogout, theme, toggleTheme, lang, changeLang }) {
  const t = translations[lang] || translations.en;
  const [activeTab, setActiveTab] = useState('overview');
  const [queries, setQueries] = useState([]);
  const [answeredQueries, setAnsweredQueries] = useState([]);
  const [stats, setStats] = useState({ answered_count: 0, pending_count: 0, farmers_helped: 0 });
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [response, setResponse] = useState({ message: '', recommendation: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    profession: user?.profession || '', 
    bio: user?.bio || '', 
    photo: user?.photo || null 
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showMobileMenu]);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 1024;
  const isSmallMobile = windowWidth < 640;

  const isDark = theme === 'black';
  const bgMain = isDark ? 'radial-gradient(circle at top left, #0f172a 0, #020617 45%, #000000 100%)' : '#f8fafc';
  const bgCard = isDark ? 'rgba(15,23,42,0.8)' : '#ffffff';
  const txtMain = isDark ? '#f1f5f9' : '#1e293b';
  const txtSec = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(34,197,94,0.3)' : '#e2e8f0';
  
  const inp = {
    width:'100%', padding:'14px', marginBottom:'16px',
    border: `1px solid ${borderCol}`, borderRadius:'14px',
    fontSize:'0.95rem', boxSizing:'border-box', outline:'none',
    background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: txtMain,
    fontFamily: '"Lexend Deca", sans-serif'
  };

  const fetchData = useCallback(async () => {
    try {
      const qs = await getAgroQueries('pending');
      setQueries(qs.data);
      const aq = await getAgroQueries('answered');
      setAnsweredQueries(aq.data);
      const st = await getAgroStats();
      setStats(st.data);
      const nt = await getAgroNotifications();
      setNotifications(nt.data);
    } catch (err) {
      console.error("Failed to fetch agronomist data", err);
    }
  }, []);

  const formatDisease = (name) => {
    if (!name) return "Unknown";
    return name.replace(/___/g, ' - ').replace(/_/g, ' ');
  };

  const markRead = async () => {
    try {
      await markAgroNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const applyAISuggestion = () => {
    if (!selectedQuery || !selectedQuery.ai_diagnosis) return;
    const ai = selectedQuery.ai_diagnosis;
    setResponse({
      message: `Based on AI analysis, your ${formatDisease(selectedQuery.crop_type)} is showing signs of ${formatDisease(ai.disease?.type) || 'stress'}. ${ai.treatment || ''}`,
      recommendation: ai.recommendations ? ai.recommendations.join(', ') : (ai.treatment || '')
    });
  };

  useEffect(() => {
    fetchData();
    // Enable "Real-time" polling every 30 seconds for new queries/notifications
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!response.message || !response.recommendation) return;
    setLoading(true);
    try {
      await respondToQuery(selectedQuery.id, response);
      setMsg("Response sent successfully!");
      setSelectedQuery(null);
      setResponse({ message: '', recommendation: '' });
      await fetchData(); // Immediate real-time refresh
      setActiveTab('history'); // Switch to history as requested
    } catch (err) {
      setMsg("Failed to send response.");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const resizeImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleProfilePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await resizeImage(reader.result);
        setProfileData(prev => ({ ...prev, photo: optimized }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateAgroProfile(profileData);
      setMsg("Profile updated successfully!");
      setIsEditing(false);
      fetchData();
    } catch (err) {
      setMsg("Update failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  return (
    <div style={{ minHeight: '100vh', background: bgMain, color: txtMain, fontFamily: '"Lexend Deca", sans-serif', overflowX: 'hidden' }}>
      <nav style={{ 
        height: 70, 
        background: isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(248, 250, 252, 0.7)', 
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${borderCol}`,
        display: 'flex', 
        alignItems: 'center', 
        padding: isSmallMobile ? '0 15px' : '0 30px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 5000,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ position: 'relative' }}>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markRead(); }} 
              style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', position: 'relative', display:'flex', alignItems:'center', color: txtMain }}
            >
              <span style={{ filter: 'drop-shadow(0 0 5px rgba(255,193,7,0.5))' }}>🔔</span>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{ 
                  position: 'absolute', top: -2, right: -2, 
                  background: '#f43f5e', color: 'white', 
                  fontSize: '0.65rem', width: 16, height: 16, 
                  borderRadius: '50%', fontWeight: 900,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow: '0 0 10px #f43f5e', border: `2px solid ${isDark ? '#020617' : '#fff'}`
                }}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', top: 50, left: 0, width: 300, background: bgCard, borderRadius: 24, border: `1px solid ${borderCol}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', padding: 20, zIndex: 1001, maxHeight: 400, overflowY: 'auto' }}>
                    <div style={{ fontWeight: 950, fontSize: '0.9rem', marginBottom: 15, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Notifications</span>
                      <span onClick={() => setShowNotifications(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>×</span>
                    </div>
                    {notifications.length === 0 && <p style={{ fontSize: '0.8rem', color: txtSec, textAlign:'center' }}>Clean slate!</p>}
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {notifications.map(n => (
                        <div key={n.id} style={{ padding: '12px', borderRadius: 16, background: n.is_read ? 'transparent' : 'rgba(34,197,94,0.05)', border: `1px solid ${n.is_read ? 'transparent' : borderCol}`, display: 'flex', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : '#22c55e', marginTop: 5, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4, color: txtMain }}>{n.message}</div>
                            <div style={{ fontSize: '0.7rem', color: txtSec, marginTop: 4 }}>🕒 {new Date(n.created_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
            <div style={{ width: 32, height: 32, background: '#22c55e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>AI</div>
            {!isSmallMobile && <span style={{ fontWeight: 950, fontSize: '1.2rem', color: txtMain }}>CROPSTRESS</span>}
          </div>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[
              { id: 'overview', label: t.agronomistDashboard },
              { id: 'pending', label: t.pendingRequests },
              { id: 'history', label: t.resolvedHistory },
              { id: 'profile', label: t.specialistProfile }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSelectedQuery(null); }}
                style={{
                  padding: '10px 15px', borderRadius: 12, border: 'none',
                  background: 'transparent',
                  color: activeTab === item.id ? '#22c55e' : txtSec,
                  fontWeight: 900, cursor: 'pointer',
                  fontSize: '0.8rem', transition: '0.3s',
                  position: 'relative'
                }}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.div layoutId="nav-agro" style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, background: '#22c55e', borderRadius: 5 }} />
                )}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: isSmallMobile ? 8 : 16, alignItems: 'center' }}>
          {!isSmallMobile && (
            <select 
              value={lang} 
              onChange={(e) => changeLang(e.target.value)} 
              style={{ background: 'transparent', color: txtMain, border: ' none', fontWeight: 900, cursor: 'pointer', outline:'none', fontSize: '0.85rem' }}
            >
              <option value="en" style={{ background: isDark ? '#020617' : '#fff', color: txtMain }}>EN</option>
              <option value="hi" style={{ background: isDark ? '#020617' : '#fff', color: txtMain }}>HI</option>
              <option value="gu" style={{ background: isDark ? '#020617' : '#fff', color: txtMain }}>GU</option>
            </select>
          )}

          <button onClick={toggleTheme} style={{ background: isDark ? '#fff' : '#0f172a', border: 'none', color: isDark ? '#000' : '#fff', width: isSmallMobile ? 30 : 34, height: isSmallMobile ? 30 : 34, borderRadius: 10, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isSmallMobile ? '0.9rem' : '1.1rem' }}>
            {isDark ? '☀️' : '🌙'}
          </button>

          <div 
            onClick={() => setActiveTab('profile')}
            style={{ width: isSmallMobile ? 30 : 36, height: isSmallMobile ? 30 : 36, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: isSmallMobile ? '0.8rem' : '0.9rem', cursor: 'pointer', overflow: 'hidden' }}>
            {profileData.photo ? <img src={profileData.photo} alt="p" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (user.name?.charAt(0).toUpperCase())}
          </div>
          
          {!isMobile && (
             <button onClick={onLogout} style={{ background: 'transparent', border: `1px solid rgba(244,63,94,0.3)`, padding: '8px 18px', borderRadius: 10, color: '#f43f5e', fontWeight: 900, cursor: 'pointer', fontSize:'0.8rem', marginLeft: 10 }}>{t.logout}</button>
          )}

          {isMobile && (
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{ background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: txtMain, marginLeft: isSmallMobile ? 5 : 10, display: 'flex', alignItems: 'center' }}
            >
              {showMobileMenu ? '✕' : '☰'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, right: 0, 
                width: isSmallMobile ? '280px' : '380px', 
                height: '100vh',
                background: isDark ? 'rgba(2, 6, 23, 0.98)' : 'rgba(255, 255, 255, 0.98)', 
                backdropFilter: 'blur(32px)',
                boxShadow: isDark ? '-10px 0 50px rgba(0,0,0,0.8)' : '-10px 0 50px rgba(0,0,0,0.2)',
                padding: '40px 25px', zIndex: 9999, display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom: 15, borderBottom: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.1)'}`, marginBottom: 35 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 950, color: txtSec, opacity: 0.8, letterSpacing: '2.5px' }}>NAVIGATION</span>
                  <button onClick={() => setShowMobileMenu(false)} style={{ background:'transparent', border:'none', color:txtMain, fontSize:'1.4rem', cursor:'pointer', fontWeight: 100 }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { id: 'overview', label: t.agronomistDashboard, icon: '📊' },
                  { id: 'pending', label: t.pendingRequests, icon: '⏳' },
                  { id: 'history', label: t.resolvedHistory, icon: '📋' },
                  { id: 'profile', label: t.specialistProfile, icon: '👨‍🔬' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); setSelectedQuery(null); }}
                    style={{
                      padding: '16px 20px', borderRadius: 18, 
                      border: activeTab === item.id ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                      background: activeTab === item.id ? 'rgba(34,197,94,0.08)' : 'transparent',
                      color: activeTab === item.id ? '#22c55e' : txtMain,
                      fontWeight: 700, textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: '0.3s',
                      marginBottom: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1rem', filter: activeTab === item.id ? 'none' : 'grayscale(1)' }}>{item.icon}</span>
                      {item.label}
                    </div>
                    {activeTab === item.id && <span style={{ color: '#2add6b', fontSize: '1rem' }}>→</span>}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 'auto', borderTop: `1px solid ${borderCol}`, paddingTop: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: '15px 25px', borderRadius: 20, border: `1px solid ${borderCol}` }}>
                  <span style={{ fontWeight: 900, color: txtSec }}>Language</span>
                  <select value={lang} onChange={(e) => changeLang(e.target.value)} style={{ background: 'transparent', color: txtMain, border: 'none', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>
                    <option value="en" style={{ background: isDark ? '#020617' : '#fff' }}>English</option>
                    <option value="hi" style={{ background: isDark ? '#020617' : '#fff' }}>Hindi</option>
                    <option value="gu" style={{ background: isDark ? '#020617' : '#fff' }}>Gujarati</option>
                  </select>
                </div>
                <button onClick={onLogout} style={{ width: '100%', padding: '18px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 20, fontWeight: 900, cursor: 'pointer' }}>Logout Executive Session</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main style={{ padding: isSmallMobile ? '20px 15px 100px' : '40px 60px', overflowY: 'auto' }}>
        {msg && <div style={{ padding: '15px 25px', background: '#22c55e', color: 'white', borderRadius: 14, marginBottom: 30, fontWeight: 800, textAlign: 'center' }}>{msg}</div>}

        <AnimatePresence mode='wait'>
          {activeTab === 'overview' && (
            <motion.section key="overview" initial="hidden" animate="visible" variants={containerVariants}>
              <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight: 950, color: txtMain, margin: '0 0 10px', letterSpacing:'-1px' }}>
                   Welcome Agronomist {user.name}
                </h1>
                <p style={{ color: txtSec, fontWeight: 700, fontSize: '1rem' }}>Your expertise helps farmers ensure crop health and secure yields.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 25, marginBottom: 50 }}>
                {[
                  { label: 'Pending Queries', value: stats.pending_count, grad: 'linear-gradient(135deg, #1e293b, #0f172a)', icon: '⏳', color: '#eab308' },
                  { label: 'Answered Total', value: stats.answered_count, grad: 'linear-gradient(135deg, #065f46, #064e3b)', icon: '✅', color: '#34d399' },
                  { label: 'Farmers Helped', value: stats.farmers_helped, grad: 'linear-gradient(135deg, #1e3a8a, #1e1b4b)', icon: '🤝', color: '#60a5fa' },
                  { label: 'Success Rate', value: '98%', grad: 'linear-gradient(135deg, #581c87, #3b0764)', icon: '📈', color: '#c084fc' }
                ].map((s, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -5, scale: 1.02 }}
                    style={{ 
                      background: isDark ? s.grad : '#ffffff', 
                      padding: isSmallMobile ? 20 : 30, borderRadius: 28, 
                      border: `1px solid ${borderCol}`, 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', right: -10, top: -10, fontSize: isSmallMobile ? '3rem' : '5rem', opacity: 0.1 }}>{s.icon}</div>
                    <div style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', marginBottom: 15 }}>{s.icon}</div>
                    <div style={{ color: isDark ? 'rgba(255,255,255,0.7)' : txtSec, fontWeight: 800, fontSize: isSmallMobile ? '0.75rem' : '0.95rem', letterSpacing: '1px' }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontSize: isSmallMobile ? '2rem' : '2.8rem', fontWeight: 900, marginTop: 10, color: isDark ? '#fff' : s.color }}>{s.value}</div>
                    <div style={{ marginTop: 15, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                       <div style={{ width: '70%', height: '100%', background: s.color, borderRadius: 2 }}></div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <h2 style={{ fontWeight: 900, marginBottom: 25 }}>Recent Pending Requests</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {queries.slice(0, 5).map(q => (
                  <motion.div 
                    key={q.id} 
                    whileHover={{ x: isSmallMobile ? 0 : 10, background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}
                    onClick={() => { setSelectedQuery(q); setActiveTab('detail'); }} 
                    style={{ 
                      background: bgCard, padding: isSmallMobile ? '20px' : '25px 35px', borderRadius: 24, 
                      border: `1px solid ${borderCol}`, display: 'flex', 
                      flexDirection: isSmallMobile ? 'column' : 'row',
                      justifyContent: 'space-between', alignItems: isSmallMobile ? 'flex-start' : 'center', 
                      cursor: 'pointer', transition: '0.3s',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                      gap: isSmallMobile ? 20 : 0
                    }}
                  >
                    <div style={{ display: 'flex', gap: isSmallMobile ? 15 : 25, alignItems: 'center', width: isSmallMobile ? '100%' : 'auto' }}>
                      <div style={{ 
                        width: isSmallMobile ? 50 : 70, height: isSmallMobile ? 50 : 70, borderRadius: isSmallMobile ? 12 : 20, 
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #22c55e, #10b981)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: isSmallMobile ? '1.5rem' : '2rem', color: '#fff', boxShadow: '0 10px 20px rgba(34,197,94,0.2)'
                      }}>
                        {q.image_path ? <img src={`http://localhost:5001/uploads/${q.image_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: isSmallMobile ? 12 : 20 }} alt="Crop" /> : '🍃'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: isSmallMobile ? '1.1rem' : '1.3rem', color: txtMain }}>{q.title}</div>
                        <div style={{ color: txtSec, marginTop: 4, fontWeight: 600, fontSize: '0.85rem' }}>Farmer: {q.farmer_name || 'Grower #'+q.user_id} • <span style={{ color: '#22c55e' }}>{formatDisease(q.crop_type)}</span></div>
                      </div>
                    </div>
                    <div style={{ textAlign: isSmallMobile ? 'left' : 'right', width: isSmallMobile ? '100%' : 'auto' }}>
                      <div style={{ fontSize: '0.8rem', color: txtSec, fontWeight: 700, marginBottom: 5 }}>{new Date(q.created_at).toLocaleDateString()}</div>
                      <div style={{ fontWeight: 900, color: '#22c55e', letterSpacing: '1.5px', fontSize: '0.8rem' }}>REVIEW REQUEST →</div>
                    </div>
                  </motion.div>
                ))}
                {queries.length === 0 && <p style={{ color: txtSec }}>No pending queries.</p>}
              </div>
            </motion.section>
          )}

          {activeTab === 'pending' && (
             <motion.section key="pending" initial="hidden" animate="visible" variants={containerVariants}>
                <h2 style={{ fontWeight: 900, marginBottom: 30 }}>Pending Farmer Consultations</h2>
                <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 25 }}>
                    {queries.map(q => (
                        <div key={q.id} style={{ background: bgCard, borderRadius: 24, border: `1px solid ${borderCol}`, overflow: 'hidden', display:'flex', flexDirection:'column' }}>
                            {q.image_path && <img src={`http://localhost:5001/uploads/${q.image_path}`} alt="Crop" style={{ width:'100%', height: 200, objectFit:'cover' }} />}
                            <div style={{ padding: 25 }}>
                                <div style={{ fontSize:'0.75rem', fontWeight:900, color:'#22c55e', textTransform:'uppercase', marginBottom:5 }}>{formatDisease(q.crop_type)}</div>
                                <h3 style={{ margin:'0 0 10px', fontWeight:900 }}>{q.title}</h3>
                                <p style={{ color:txtSec, fontSize:'0.9rem', marginBottom:20, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.description}</p>
                                <button onClick={() => { setSelectedQuery(q); setActiveTab('detail'); }} style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', background:'#22c55e', color:'white', fontWeight:900, cursor:'pointer' }}>REVIEW NOW</button>
                            </div>
                        </div>
                    ))}
                </div>
             </motion.section>
          )}

          {activeTab === 'detail' && selectedQuery && (
            <motion.section key="detail" initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x:0 }}>
                <button onClick={() => setActiveTab('pending')} style={{ background:'transparent', border:'none', color:'#22c55e', fontWeight:900, cursor:'pointer', marginBottom:25, display:'flex', alignItems:'center', gap:8 }}>← BACK TO LIST</button>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isSmallMobile ? 20 : 40, alignItems: 'start' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap: isSmallMobile ? 20 : 30, width: isMobile ? '100%' : 'auto' }}>
                        <div style={{ background: bgCard, borderRadius: 28, border: `1px solid ${borderCol}`, padding: isSmallMobile ? 25 : 40, boxShadow:'0 15px 35px rgba(0,0,0,0.1)' }}>
                             <h2 style={{ fontWeight: 950, margin: '0 0 15px', fontSize:'2.2rem', letterSpacing:'-1px' }}>{selectedQuery.title}</h2>
                             <div style={{ display:'flex', gap:10, marginBottom:25 }}>
                                <span style={{ padding:'6px 16px', borderRadius:10, background:'rgba(34,197,94,0.1)', color:'#22c55e', fontSize:'0.85rem', fontWeight:900 }}>{formatDisease(selectedQuery.crop_type)}</span>
                                <span style={{ padding:'6px 16px', borderRadius:10, background:'rgba(234,179,8,0.1)', color:'#eab308', fontSize:'0.85rem', fontWeight:900 }}>PENDING REVIEW</span>
                             </div>
                             <p style={{ color:txtSec, lineHeight:1.8, fontSize:'1.1rem' }}>{selectedQuery.description}</p>
                        </div>

                        {selectedQuery.ai_diagnosis && (
                            <div style={{ background: isDark ? 'rgba(34,197,94,0.03)' : 'rgba(34,197,94,0.05)', borderRadius: 28, border: `2px dashed #22c55e`, padding: isSmallMobile ? 25 : 35, boxShadow: 'inset 0 0 20px rgba(34,197,94,0.05)' }}>
                                <div style={{ display: 'flex', flexDirection: isSmallMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isSmallMobile ? 'flex-start' : 'center', gap: 15, marginBottom: 25 }}>
                                    <h3 style={{ margin:0, fontWeight:950, color:'#22c55e', fontSize: isSmallMobile ? '1.1rem' : '1.3rem', letterSpacing:'0.5px' }}>{t.initialScan || "AI Preliminary Diagnosis"}</h3>
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={applyAISuggestion}
                                        style={{ background:'#22c55e', color:'white', border:'none', padding:'10px 22px', borderRadius:12, fontWeight:900, cursor:'pointer', fontSize:'0.85rem', boxShadow:'0 10px 20px rgba(34,197,94,0.3)', display:'flex', alignItems:'center', gap:8 }}
                                    >
                                        {t.useAsDraft || "Use as Draft"}
                                    </motion.button>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:25, marginBottom: 25 }}>
                                    <div>
                                        <div style={{ fontSize:'0.7rem', fontWeight:950, color:txtSec, letterSpacing:'1px', marginBottom:6 }}>DETECTED STRESS</div>
                                        <div style={{ fontWeight:900, fontSize:'1.1rem', color:txtMain }}>{formatDisease(selectedQuery.ai_diagnosis.disease?.type)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:'0.7rem', fontWeight:950, color:txtSec, letterSpacing:'1px', marginBottom:6 }}>CONFIDENCE</div>
                                        <div style={{ fontWeight:900, fontSize:'1.1rem', color:txtMain }}>{(selectedQuery.ai_diagnosis.disease?.confidence || 100).toFixed(1)}%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:'0.7rem', fontWeight:950, color:txtSec, letterSpacing:'1px', marginBottom:6 }}>SEVERITY</div>
                                        <div style={{ fontWeight:900, fontSize:'1.1rem', color: selectedQuery.ai_diagnosis.severity === 'critical' ? '#ef4444' : selectedQuery.ai_diagnosis.severity === 'high' ? '#f97316' : '#22c55e' }}>{selectedQuery.ai_diagnosis.severity?.toUpperCase()}</div>
                                    </div>
                                </div>
                                <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: 25 }}>
                                    <div style={{ fontSize:'0.7rem', fontWeight:950, color:txtSec, marginBottom: 10, letterSpacing:'1px' }}>AI TREATMENT SUGGESTION</div>
                                    <div style={{ fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 700, color: txtMain, marginBottom:15 }}>{selectedQuery.ai_diagnosis.treatment}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {(selectedQuery.ai_diagnosis.recommendations || ["Act within 24-48 hours", "Manage crop residue", "Ensure soil fertility"]).map((r, idx) => (
                                            <span key={idx} style={{ 
                                              padding: '6px 14px', 
                                              background: 'rgba(34,197,94,0.12)', 
                                              color: '#22c55e', 
                                              borderRadius: '10px', 
                                              fontSize: '0.75rem', 
                                              fontWeight: 800,
                                              border: '1px solid rgba(34,197,94,0.2)'
                                            }}>
                                              • {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap: isSmallMobile ? 20 : 30, width: isMobile ? '100%' : 'auto' }}>
                        {selectedQuery.image_path && (
                             <div style={{ position:'relative' }}>
                                 <img src={`http://localhost:5001/uploads/${selectedQuery.image_path}`} alt="Analysis" style={{ width:'100%', borderRadius:32, border:`1px solid ${borderCol}`, boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }} />
                             </div>
                        )}

                        <form onSubmit={handleSubmitResponse} style={{ background: bgCard, borderRadius: 32, border: `1px solid ${borderCol}`, padding: isSmallMobile ? 25 : 40, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                              <h3 style={{ margin:'0 0 25px', fontWeight: 950, fontSize: '1.6rem' }}>{t.expertRecommendation}</h3>
                              <div style={{ marginBottom: 25 }}>
                                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:950, marginBottom:10, color:txtSec, letterSpacing: '1px' }}>{t.professionalAdvice.toUpperCase()}</label>
                                <textarea value={response.message} onChange={e => setResponse({...response, message: e.target.value})} placeholder="..."
                                    style={{ width:'100%', background: isDark?'rgba(255,255,255,0.02)':'#f8fafc', border:`1px solid ${borderCol}`, borderRadius:16, padding:20, color:txtMain, minHeight:150, fontFamily:'inherit' }}
                                />
                              </div>
                              <div style={{ marginBottom: 30 }}>
                                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:950, marginBottom:10, color:txtSec, letterSpacing: '1px' }}>{t.treatmentProtocol.toUpperCase()}</label>
                                <textarea value={response.recommendation} onChange={e => setResponse({...response, recommendation: e.target.value})} placeholder="..."
                                    style={{ width:'100%', background: isDark?'rgba(255,255,255,0.02)':'#f8fafc', border:`1px solid ${borderCol}`, borderRadius:16, padding:20, color:txtMain, minHeight:150, fontFamily:'inherit' }}
                                />
                              </div>
                              <button disabled={loading} type="submit" style={{ width:'100%', padding:'22px', borderRadius:18, border:'none', background:'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', color:'white', fontWeight:900, cursor:'pointer', boxShadow:'0 15px 35px rgba(34,197,94,0.4)', fontSize:'1.1rem' }}>
                                 {loading ? 'SUBMITTING...' : t.submitExpertResponse.toUpperCase()}
                              </button>
                        </form>
                    </div>
                </div>
            </motion.section>
          )}

          {activeTab === 'history' && (
             <motion.section key="history" initial="hidden" animate="visible" variants={containerVariants}>
                <h2 style={{ fontWeight: 900, marginBottom: 30, fontSize: isSmallMobile ? '1.5rem' : '2rem' }}>Resolved Consultations History</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {answeredQueries.map(q => (
                        <div key={q.id} style={{ background: bgCard, borderRadius: 28, border: `1px solid ${borderCol}`, padding: isSmallMobile ? 25 : 35, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, marginBottom: 30 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
                                        <span style={{ padding: '6px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>{formatDisease(q.crop_type).toUpperCase()}</span>
                                        <span style={{ padding: '6px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>ANSWERED</span>
                                    </div>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: isSmallMobile ? '1.2rem' : '1.4rem' }}>{q.title}</h3>
                                    <p style={{ color: txtSec, fontSize: '0.95rem', marginTop: 12, lineHeight: 1.6 }}>{q.description}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-end', justifyContent: isMobile ? 'flex-start' : 'center', gap: 15 }}>
                                    {q.image_path && <img src={`http://localhost:5001/uploads/${q.image_path}`} style={{ width: isSmallMobile ? 80 : 100, height: isSmallMobile ? 80 : 100, borderRadius: 16, objectFit: 'cover', border: `2px solid ${borderCol}` }} alt="Crop" />}
                                    <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: txtSec, fontWeight: 700 }}>Resolved on:</div>
                                        <div style={{ fontWeight: 900, color: txtMain, fontSize: '0.9rem' }}>{new Date(q.updated_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {q.responses && q.responses.map(res => (
                                <div key={res.id} style={{ 
                                  padding: isSmallMobile ? 20 : 30, 
                                  background: isDark ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)' : '#f0fdf4', 
                                  borderRadius: 24, 
                                  border: `2px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)'}`, 
                                  marginTop: 10,
                                  position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: 25, right: 30, fontSize: '2rem', opacity: 0.2 }}>📋</div>
                                    <div style={{ color: '#2add6b', fontWeight: 900, fontSize: '0.9rem', marginBottom: 15, letterSpacing: '1px' }}>MY PROFESSIONAL RESPONSE:</div>
                                    <div style={{ marginBottom: 25, fontSize: '1.1rem', lineHeight: 1.6, color: txtMain }}>{res.message}</div>
                                    
                                    <div style={{ padding: '20px', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: 16 }}>
                                      <div style={{ fontWeight: 900, fontSize: '0.85rem', color: txtSec, marginBottom: 10, letterSpacing: '1px' }}>FINAL RECOMMENDATION & TREATMENT:</div>
                                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#22c55e' }}>{res.recommendation}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    {answeredQueries.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 50, background: bgCard, borderRadius: 24, border: `1px solid ${borderCol}` }}>
                            <div style={{ fontSize: '3rem', marginBottom: 20 }}>📂</div>
                            <p style={{ color: txtSec, fontWeight: 800 }}>No answered queries found in your history.</p>
                        </div>
                    )}
                </div>
             </motion.section>
          )}

          {activeTab === 'profile' && (
            <motion.section key="profile" initial="hidden" animate="visible" variants={containerVariants}>
               <div style={{ maxWidth: 850, margin: '0 auto', background: bgCard, borderRadius: 32, border: `1px solid ${borderCol}`, padding: isSmallMobile ? 25 : 60, textAlign: 'center', boxShadow:'0 20px 60px rgba(0,0,0,0.1)' }}>
                  <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 30px' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: 100, border: `4px solid #22c55e`, overflow: 'hidden', background: '#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>
                      {profileData.photo ? <img src={profileData.photo} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👨‍🔬'}
                    </div>
                    {isEditing && (
                      <label style={{ position:'absolute', bottom:0, right:0, background:'#22c55e', color:'white', width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'4px solid transparent' }}>
                        📷 <input type="file" onChange={handleProfilePhoto} style={{ display:'none' }} />
                      </label>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <>
                      <h2 style={{ fontSize: isSmallMobile ? '1.8rem' : '2.8rem', fontWeight: 950, margin: '0 0 10px', letterSpacing:'-1px' }}>Dr. {user.name}</h2>
                      <p style={{ color: '#22c55e', fontWeight: 900, fontSize: isSmallMobile ? '1rem' : '1.3rem', margin: '0 0 40px', letterSpacing:'1px' }}>EXPERT {user.profession?.toUpperCase() || t.specialization.toUpperCase()}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isSmallMobile ? 15 : 25, textAlign:'left', marginBottom:40 }}>
                          {[
                            { label: t.email, val: user.email },
                            { label: t.phone, val: user.phone || 'Not set' },
                            { label: t.expertSince, val: new Date(user.created_at || Date.now()).toLocaleDateString() },
                            { label: t.specialization, val: user.profession || "General Plant Pathology" }
                          ].map((field, i) => (
                            <div key={i} style={{ padding:30, borderRadius:24, background: isDark?'rgba(255,255,255,0.02)':'#f8fafc', border:`1px solid ${borderCol}` }}>
                              <div style={{ fontSize:'0.75rem', color:txtSec, fontWeight:950, letterSpacing:'1px', marginBottom:8 }}>{field.label.toUpperCase()}</div>
                              <div style={{ fontWeight:900, fontSize:'1.1rem' }}>{field.val}</div>
                            </div>
                          ))}
                      </div>

                      <div style={{ marginTop:0, padding:35, borderRadius:24, background: isDark?'rgba(255,255,255,0.02)':'#f8fafc', textAlign:'left', border:`1px solid ${borderCol}`, marginBottom:40 }}>
                        <h4 style={{ margin:'0 0 15px', fontWeight:950, fontSize:'0.9rem', letterSpacing:'1px', color:txtSec }}>{t.professionalBio.toUpperCase()}</h4>
                        <p style={{ color:txtMain, margin:0, lineHeight:1.8, fontSize:'1.1rem' }}>{user.bio || "Certified agronomist dedicated to improving regional crop health through advanced diagnostics."}</p>
                      </div>

                      <button onClick={() => setIsEditing(true)} style={{ padding:'18px 40px', borderRadius:16, border:'none', background:'#22c55e', color:'white', fontWeight:900, cursor:'pointer', fontSize:'1.1rem', boxShadow:'0 10px 20px rgba(34,197,94,0.3)' }}>{t.editProfile.toUpperCase()}</button>
                    </>
                  ) : (
                    <form onSubmit={handleUpdateProfile} style={{ textAlign:'left' }}>
                      <div style={{ display:'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:20 }}>
                        <div>
                          <label style={{ fontSize:'0.8rem', fontWeight:900, color:txtSec, display:'block', marginBottom:10 }}>FULL NAME</label>
                          <input style={inp} value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                        </div>
                        <div>
                          <label style={{ fontSize:'0.8rem', fontWeight:900, color:txtSec, display:'block', marginBottom:10 }}>PROFESSION / SPECIALIZATION</label>
                          <input style={inp} value={profileData.profession} onChange={e => setProfileData({...profileData, profession: e.target.value})} />
                        </div>
                        <div>
                          <label style={{ fontSize:'0.8rem', fontWeight:900, color:txtSec, display:'block', marginBottom:10 }}>PHONE NUMBER</label>
                          <input style={inp} value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                        </div>
                      </div>
                      <label style={{ fontSize:'0.8rem', fontWeight:900, color:txtSec, display:'block', marginBottom:10 }}>PROFESSIONAL BIO</label>
                      <textarea style={{...inp, height:120}} value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} />
                      
                      <div style={{ display:'flex', gap:15, marginTop:30 }}>
                        <button type="submit" style={{ flex:1, padding:20, borderRadius:16, border:'none', background:'#22c55e', color:'white', fontWeight:900, cursor:'pointer' }}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</button>
                        <button type="button" onClick={() => setIsEditing(false)} style={{ flex:1, padding:20, borderRadius:16, border:`1px solid ${borderCol}`, background:'transparent', color:txtMain, fontWeight:900, cursor:'pointer' }}>CANCEL</button>
                      </div>
                    </form>
                  )}
               </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
