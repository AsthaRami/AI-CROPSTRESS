import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import CropScanner from '../components/CropScanner';
import { translations } from '../translations';
import { submitFarmerQuery, getFarmerQueries, getNotifications, markNotificationsRead } from '../services/api';

export default function Dashboard({ user, onLogout, onUpdateProfile, theme, toggleTheme, lang, changeLang }) {
  const t = translations[lang] || translations.en;
  
  const [stats,       setStats]       = useState({ total_farms:0, healthy_crops:0, stressed_crops:0, active_alerts:0 });
  const [farms,       setFarms]       = useState([]);
  const [history,     setHistory]     = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showMobileMenu]);

  const [showAddFarm, setShowAddFarm] = useState(false);
  const [newFarm,     setNewFarm]     = useState({ name:'', location:'', area_acres:'', soil_type:'loamy' });
  const [msg,         setMsg]         = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [profileData, setProfileData] = useState({ 
    name: user?.name || '', 
    email: user?.email || '', 
    phone: user?.phone || '', 
    profession: user?.profession || 'Farmer', 
    location: user?.location || '', 
    bio: user?.bio || '', 
    password: '', 
    language: user?.language || lang,
    photo: user?.photo || null
  });

  const [farmerQueries, setFarmerQueries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notiTimer, setNotiTimer] = useState(null);
  const [newQuery, setNewQuery] = useState({ title: '', description: '', crop_type: '' });
  const [queryImage, setQueryImage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        photo: user.photo || prev.photo
      }));
    }
  }, [user]);

  const [profilePhoto, setProfilePhoto] = useState(user?.photo || null);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth <= 1024;
  const isSmallMobile = windowWidth <= 640;

  const resizeImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress as JPEG with 0.7 quality
      };
    });
  };

  const handleProfilePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMsg("Error: Image is too large (Max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result;
        setMsg("Optimizing photo...");
        const optimized = await resizeImage(originalBase64);
        setProfilePhoto(optimized);
        setProfileData(prev => ({ ...prev, photo: optimized }));
        setMsg("Photo ready!");
      };
      reader.readAsDataURL(file);
    }
  };

  const [showBot, setShowBot] = useState(false);
  const [botMessage, setBotMessage] = useState('');
  
  // Advanced User-Specific Session Management
  const historyKey = useMemo(() => `kisanBotSessions_${user?.email || 'guest'}`, [user?.email]);

  const [botSessions, setBotSessions] = useState(() => {
    const saved = localStorage.getItem(historyKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) return parsed;
      } catch(e) {}
    }
    const id = Date.now().toString();
    return { [id]: { id, title: 'Welcome Chat', history: [{ role: 'bot', key: 'hello' }] } };
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return Object.keys(botSessions)[0];
  });

  // chatHistory is now derived from the active session
  const chatHistory = botSessions[activeSessionId]?.history || [];

  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Real-time Data States
  const [marketPrices, setMarketPrices] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherSearch, setWeatherSearch] = useState('Vadodara'); // Default city for high accuracy

  // Headers and Auth

  const token   = localStorage.getItem('token');
  const headers = useMemo(() => ({ 
    'Authorization':'Bearer ' + token, 
    'Content-Type':'application/json' 
  }), [token]);

  const fetchWeather = (city) => {
    fetch(`http://localhost:5001/api/weather/${city}`)
      .then(r => r.json())
      .then(d => {
        setWeatherData(d);
      })
      .catch(() => {});
  };

  const fetchMarket = () => {
    fetch('http://localhost:5001/api/market/latest')
      .then(r => r.json())
      .then(d => setMarketPrices(d.prices || []))
      .catch(() => {});
  };

  const fetchNews = () => {
    // News feature disabled or handled elsewhere
  };

  const loadAll = useCallback(() => {
    fetch('http://localhost:5001/api/farm/dashboard', { headers })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {});
    fetch('http://localhost:5001/api/farm/list', { headers })
      .then(r => r.json()).then(d => setFarms(d.farms || [])).catch(() => {});
    fetch('http://localhost:5001/api/detect/history', { headers })
      .then(r => r.json()).then(d => setHistory(d.detections || [])).catch(() => {});
    fetch('http://localhost:5001/api/alerts/active', { headers })
      .then(r => r.json()).then(d => setAlerts(d.alerts || [])).catch(() => {});
    
    // Farmer specific data
    getFarmerQueries().then(d => setFarmerQueries(d.data)).catch(() => {});
    getNotifications().then(d => setNotifications(d.data || d)).catch(() => {});

    fetchWeather(weatherSearch);
    fetchMarket();
    fetchNews();
  }, [headers, weatherSearch]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [loadAll]);
  
  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(botSessions));
    } catch (e) {
      console.warn("Bot sessions quota exceeded. Clearing some space...");
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        // Simple strategy: Clear the oldest 2 sessions if too many
        const sessionIds = Object.keys(botSessions);
        if (sessionIds.length > 3) {
           const reducedSessions = { ...botSessions };
           delete reducedSessions[sessionIds[0]];
           delete reducedSessions[sessionIds[1]];
           setBotSessions(reducedSessions);
        }
      }
    }
  }, [botSessions, historyKey]);
  
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const addFarm = async () => {
    setMsg('');
    if (!newFarm.name || !newFarm.location) return setMsg('Please fill Name and Location');
    try {
      const r = await fetch('http://localhost:5001/api/farm/add', {
        method: 'POST', headers,
        body: JSON.stringify(newFarm)
      });
      if (r.ok) {
        setMsg('Farm added successfully!');
        setShowAddFarm(false);
        setNewFarm({ name:'', location:'', area_acres:'', soil_type:'loamy' });
        loadAll();
      } else {
        const d = await r.json();
        setMsg(d.error || 'Error adding farm');
      }
    } catch (e) { setMsg('Network error'); }
  };

   const downloadReport = async (det) => {
    // If modal is open for this report, capture it
    const element = document.getElementById('history-report-preview');
    if (element) {
        setMsg('Generating visual report...');
        html2canvas(element, { scale: 2, useCORS: true, backgroundColor: isDark ? '#020617' : '#ffffff' }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Health_Report_${det.crop_name}_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setMsg('Report downloaded successfully!');
        });
    } else {
        // Fallback or open modal first
        setSelectedReport(det);
        setMsg('Opening preview for download...');
    }
  };

  const deleteDetection = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scan?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/detect/delete/${id}`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setMsg("Scan deleted successfully!");
        loadAll();
      } else {
        const data = await res.json();
        setMsg(data.error || "Error deleting scan");
      }
    } catch (err) {
      setMsg("Network error");
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return setMsg('Please type DELETE to confirm');
    try {
      const res = await fetch('http://localhost:5001/api/auth/delete_account', {
        method: 'POST', headers
      });
      if (res.ok) {
        localStorage.clear();
        window.location.href = '/';
      } else {
        const d = await res.json();
        setMsg(d.error || 'Error deleting account');
      }
    } catch (e) { setMsg('Network error'); }
  };

  const updateProfile = async () => {
    setMsg('');
    try {
      const res = await fetch('http://localhost:5001/api/auth/profile/update', {
        method: 'POST', headers,
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
        if (res.ok) {
          setMsg(t.successUpdate);
          const updatedUser = { ...user, ...data.user };
          onUpdateProfile(updatedUser);
          try {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (storageError) {
            console.error('Storage quota exceeded during profile update:', storageError);
            const slimUser = { ...updatedUser };
            if (slimUser.photo) delete slimUser.photo;
            try {
               localStorage.setItem('user', JSON.stringify(slimUser));
            } catch (e2) {}
          }
        } else {
        setMsg(data.error || t.errorUpdate);
      }
    } catch (e) { setMsg(t.errorUpdate); }
  };

  const sendBotMessage = async (msgOverride) => {
    const textToSend = msgOverride || botMessage;
    if (!textToSend.trim()) return;
    
    const tempId = Date.now();
    const newHistory = [...chatHistory, { role: 'user', content: textToSend }, { role: 'bot', key: 'typing', temp_id: tempId, content: 'Thinking...' }];
    
    // Update session title if it's the first user message
    const currentSession = botSessions[activeSessionId];
    const newTitle = currentSession.title === 'Welcome Chat' ? (textToSend.substring(0, 20) + '...') : currentSession.title;
    
    setBotSessions(prev => ({
       ...prev,
       [activeSessionId]: { ...prev[activeSessionId], title: newTitle, history: newHistory }
    }));

    setBotMessage('');
    try {
        const res = await fetch('http://localhost:5001/api/kisan-bot/chat', {
            method: 'POST', headers,
            body: JSON.stringify({ message: textToSend, lang: lang })
        });
        const data = await res.json();
        
        setBotSessions(prev => {
           // Remove thinking placeholder and add actual response
           let updatedHistory = prev[activeSessionId].history.filter(m => m.temp_id !== tempId);
           updatedHistory.push({ role: 'bot', key: data.key || 'default', content: data.response });
           return {
              ...prev,
              [activeSessionId]: { ...prev[activeSessionId], history: updatedHistory }
           };
        });

        if (speechEnabled) speakText(data.response);
    } catch (error) {
        setBotSessions(prev => {
           let updatedHistory = prev[activeSessionId].history.filter(m => m.temp_id !== tempId);
           updatedHistory.push({ role: 'bot', key: 'default' });
           return {
              ...prev,
              [activeSessionId]: { ...prev[activeSessionId], history: updatedHistory }
           };
        });
    }
  };

  const createNewChat = () => {
     const id = Date.now().toString();
     setBotSessions(prev => ({
        [id]: { id, title: t.newChat, history: [{ role: 'bot', key: 'hello' }] },
        ...prev
     }));
     setActiveSessionId(id);
  };

  const deleteSession = (e, id) => {
     e.stopPropagation();
     setBotSessions(prev => {
        const next = { ...prev };
        delete next[id];
        if (Object.keys(next).length === 0) {
           const newId = Date.now().toString();
           return { [newId]: { id: newId, title: 'Welcome Chat', history: [{ role: 'bot', key: 'hello' }] } };
        }
        return next;
     });
     if (activeSessionId === id) {
        setActiveSessionId(Object.keys(botSessions).find(k => k !== id) || Object.keys(botSessions)[0]);
     }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : (lang === 'gu' ? 'gu-IN' : 'en-US');
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setBotMessage(transcript);
      sendBotMessage(transcript);
    };
    recognition.start();
  };

  const speakText = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'hi' ? 'hi-IN' : (lang === 'gu' ? 'gu-IN' : 'en-US');
    synth.speak(utter);
  };


  const submitQuery = async (e) => {
    e.preventDefault();
    if (!newQuery.title || !newQuery.description || !newQuery.crop_type) return;
    
    const formData = new FormData();
    formData.append('title', newQuery.title);
    formData.append('description', newQuery.description);
    formData.append('crop_type', newQuery.crop_type);
    if (queryImage) formData.append('image', queryImage);

    setMsg("Sending query to agronomists... 🚀");
    try {
      const res = await submitFarmerQuery(formData);
      if (res.status === 201) {
        setMsg("Your query has been sent to our agronomists! ✅");
        setNewQuery({ title: '', description: '', crop_type: '' });
        setQueryImage(null);
        // Refresh queries
        const queriesRes = await getFarmerQueries();
        setFarmerQueries(queriesRes.data);
      }
    } catch (err) {
      setMsg("Failed to send query. ❌");
    }
  };

  const markAllRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const tabs = [
    { id:'dashboard', label: t.dashboard  },
    { id:'scanner',   label: t.scanner    },
    { id:'alerts',    label: t.alerts     },
    { id:'history',   label: t.history    },
    { id:'bot',       label: t.botTab     },
    { id:'queries',   label: t.askExpert  },
    { id:'farms',     label: t.farms      },
  ];

  const statCards = [
    { label: t.totalFarms,    value:stats.total_farms    || 0, color:'#16a34a', icon: '🚜' },
    { label: t.healthyScans,  value:stats.healthy_crops  || 0, color:'#22c55e', icon: '✅' },
    { label: t.stressedScans, value:stats.stressed_crops || 0, color:'#eab308', icon: '⚠️' },
    { label: t.activeAlerts,  value:stats.active_alerts  || 0, color:'#f43f5e', icon: '🚨' },
  ];

  const isDark = theme === 'black';
  const bgMain = isDark ? 'radial-gradient(circle at top left, #0f172a 0, #020617 45%, #000000 100%)' : '#f8fafc';
  const bgCard = isDark ? 'rgba(15,23,42,0.8)' : '#ffffff';
  const txtMain = isDark ? '#f1f5f9' : '#1e293b';
  const txtSec = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(34,197,94,0.3)' : '#e2e8f0';

  const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };

  const inp = {
    width:'100%', padding:'14px', marginBottom:'16px',
    border: `1px solid ${borderCol}`, borderRadius:'14px',
    fontSize:'0.95rem', boxSizing:'border-box', outline:'none',
    background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', color: txtMain,
    transition: 'all 0.2s ease',
    fontFamily: '"Lexend Deca", sans-serif'
  };

  return (
    <div style={{ minHeight:'100vh', background: bgMain, fontFamily:'"Lexend Deca", sans-serif', color: txtMain, overflowX: 'hidden' }}>
      
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(248, 250, 252, 0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${borderCol}`,
        padding: isMobile ? '12px 15px' : '12px 32px'
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:isMobile?10:20 }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { 
                  if (showNotifications) {
                    setShowNotifications(false);
                    if (notiTimer) clearTimeout(notiTimer);
                  } else {
                    setShowNotifications(true);
                    if (!showNotifications) markAllRead();
                    const timer = setTimeout(() => setShowNotifications(false), 4000);
                    setNotiTimer(timer);
                  }
                }} 
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative' }}
              >
                🔔
                {notifications.filter(n => !n.is_read).length > 0 && (
                    <span style={{ 
                      position: 'absolute', top: '-2px', right: '-2px', 
                      background: '#f43f5e', color: 'white', 
                      fontSize: '0.65rem', padding: '2px 5px', 
                      borderRadius: '50%', fontWeight: 900,
                      boxShadow: '0 0 10px rgba(244,63,94,0.5)',
                      border: `2px solid ${isDark ? '#020617' : '#fff'}`,
                      minWidth: '14px', height: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1
                    }}>
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', top: 40, left: 0, width: 300, background: bgCard, borderRadius: 16, border: `1px solid ${borderCol}`, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 15, zIndex: 1000, maxHeight: 400, overflowY: 'auto' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t.alerts}</span>
                      <span onClick={() => setShowNotifications(false)} style={{ cursor: 'pointer' }}>×</span>
                    </div>
                    {notifications.length === 0 && <p style={{ fontSize: '0.8rem', color: txtSec }}>No notifications yet.</p>}
                    {notifications.map(n => (
                      <div key={n.id} style={{ 
                        padding: '12px 0', 
                        borderBottom: `1px solid ${borderCol}`, 
                        opacity: n.is_read ? 0.6 : 1,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ 
                          width: 8, height: 8, borderRadius: '50%', 
                          background: n.is_read ? 'transparent' : '#f43f5e', 
                          marginTop: 5, flexShrink: 0,
                          boxShadow: n.is_read ? 'none' : '0 0 8px rgba(244,63,94,0.4)'
                        }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4, color: txtMain }}>{n.message}</div>
                          <div style={{ fontSize: '0.7rem', color: txtSec, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span>🕒</span> {new Date(n.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setActiveTab('dashboard')}>
              <div style={{ width:32, height:32, background:'#22c55e', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900 }}>AI</div>
              {!isSmallMobile && <span style={{ fontWeight:900, fontSize:'1.2rem' }}>CROPSTRESS</span>}
            </div>
          </div>
          
          <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 12 : 28 }}>
            {!isMobile && (
              <div style={{ display:'flex', alignItems:'center', gap:28 }}>
                {tabs.map(tab => (
                  <span key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    color: activeTab === tab.id ? '#2add6b' : txtSec, 
                    cursor:'pointer', fontWeight:800, fontSize:'0.9rem', position: 'relative', transition: 'all 0.3s',
                    padding: '5px 12px'
                  }}>
                    {tab.label}
                    {activeTab === tab.id && <motion.div layoutId="underline" style={{ position:'absolute', bottom: -6, left: 0, right: 0, height: 2, background: '#2add6b' }} />}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', gap: isSmallMobile ? 8 : 16 }}>
              {!isSmallMobile && (
                <select value={lang} onChange={(e) => changeLang(e.target.value)} style={{ background:'transparent', color:txtMain, border:'none', fontSize:'0.85rem', fontWeight:700, cursor:'pointer' }}>
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="gu">GU</option>
                </select>
              )}
              
              <button onClick={toggleTheme} style={{ background: isDark ? '#fff' : '#0f172a', color: isDark ? '#000' : '#fff', border:'none', borderRadius:10, width:isSmallMobile?28:34, height:isSmallMobile?28:34, cursor:'pointer', fontSize: isSmallMobile ? '0.8rem' : '1rem' }}>{isDark ? '☀️' : '🌙'}</button>
              
              <div 
                onClick={() => setActiveTab('profile')}
                style={{ width:isSmallMobile?28:36, height:isSmallMobile?28:36, borderRadius:'50%', background:'linear-gradient(135deg, #22c55e, #10b981)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, cursor:'pointer', overflow:'hidden' }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="p" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  (profileData.name || user?.name || 'F').charAt(0).toUpperCase()
                )}
              </div>

              {!isMobile && (
                <button onClick={onLogout} style={{ background:'transparent', color:'#f43f5e', border:`1px solid rgba(244,63,94,0.3)`, padding:'6px 14px', borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:'0.8rem' }}>{t.logout}</button>
              )}

              {isMobile && (
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  style={{ background:'transparent', border:'none', fontSize:'1.8rem', cursor:'pointer', color:txtMain, marginLeft:5 }}
                >
                  {showMobileMenu ? '✕' : '☰'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, right: 0, width: '280px', height: '100vh',
                background: bgCard, backdropFilter: 'blur(32px)',
                borderLeft: `1px solid ${borderCol}`,
                zIndex: 200, padding: '40px 24px',
                display: 'flex', flexDirection: 'column',
                boxShadow: '-20px 0 50px rgba(0,0,0,0.2)',
                overflowY: 'auto'
              }}
            >
              <div style={{ marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: txtSec, fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Navigation</span>
                <span onClick={() => setShowMobileMenu(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', color: txtSec }}>×</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {tabs.map(tab => (
                  <div 
                    key={tab.id} 
                    onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                    style={{
                      padding: '14px 0', fontSize: '0.95rem', fontWeight: 800,
                      color: activeTab === tab.id ? '#2add6b' : txtMain,
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      lineHeight: 1
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.id && <span style={{ fontSize: '0.85rem' }}>➜</span>}
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: 30, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select value={lang} onChange={(e) => changeLang(e.target.value)} style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color:txtMain, border:`1px solid ${borderCol}`, borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}>
                      <option value="en" style={{ background: isDark ? '#1e293b' : '#fff', color: txtMain }}>English</option>
                      <option value="hi" style={{ background: isDark ? '#1e293b' : '#fff', color: txtMain }}>Hindi</option>
                      <option value="gu" style={{ background: isDark ? '#1e293b' : '#fff', color: txtMain }}>Gujarati</option>
                    </select>
                  </div>
                  <button 
                    onClick={onLogout}
                    style={{ 
                      width: '100%', padding: '14px', borderRadius: 14, 
                      background: 'rgba(244,63,94,0.1)', color: '#f43f5e', 
                      border: '1px solid rgba(244,63,94,0.2)', fontWeight: 900, fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Logout System
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMobileMenu(false)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 199 }}
          />
        )}
      </nav>

      <div style={{ padding: isMobile ? '20px 15px 100px' : '40px 64px 100px', maxWidth:1600, margin:'0 auto' }}>
        
        <AnimatePresence mode="wait">
          {msg && (
            <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} style={{
              padding:'18px 24px', borderRadius:'16px', marginBottom:'24px', background: msg.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
              color: msg.includes('Error') ? '#fca5a5' : '#4ade80', fontWeight:800, border: `1px solid ${msg.includes('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
            }}>{msg}</motion.div>
          )}
        </AnimatePresence>

        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <motion.section initial="hidden" animate="visible" variants={containerVariants}>
            <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 20 : 0, marginBottom:40 }}>
              <div>
                <h1 style={{ margin:0, fontSize: isSmallMobile ? '1.75rem' : '2.8rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{t.welcome}, {profileData.name || 'Farmer'}! 🌿</h1>
                <p style={{ color: txtSec, fontSize: isSmallMobile ? '0.9rem' : '1.1rem', marginTop: 10 }}>Your farm intelligence network is fully active.</p>
              </div>
              <button onClick={loadAll} style={{ width: isMobile ? '100%' : 'auto', background:'linear-gradient(135deg, #22c55e, #10b981)', color:'white', border:'none', padding:'14px 32px', borderRadius:16, cursor:'pointer', fontWeight:900, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)' }}>{t.refresh} 🔄</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isSmallMobile ? 12 : 24, marginBottom:48 }}>
              {statCards.map((s, i) => (
                <div key={i} style={{ background: bgCard, borderRadius: isSmallMobile ? 20 : 28, padding: isSmallMobile ? 20 : 32, border:`1px solid ${borderCol}`, position:'relative', overflow:'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize: isSmallMobile ? '1.6rem' : '2.2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: isSmallMobile ? '1.2rem' : '1.6rem' }}>{s.icon}</div>
                  </div>
                  <div style={{ color: txtSec, fontSize: isSmallMobile ? '0.7rem' : '0.85rem', fontWeight:800, marginTop:12, textTransform:'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 2. COMMAND CENTER - WIDE, EXPANSIVE (Replaces Chart) */}
            <div style={{ background: isDark ? 'linear-gradient(135deg, rgba(2,6,23,0.8), rgba(15,23,42,0.9))' : 'linear-gradient(135deg, #f0fdf4, #ffffff)', borderRadius:40, padding: isMobile ? 30 : 60, border:`1px solid ${borderCol}`, marginBottom:50, boxShadow: '0 30px 60px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', right: -50, top: -50, width: 300, height: 300, background: '#22c55e', filter: 'blur(100px)', opacity: 0.1 }} />
               <h2 style={{ fontSize: isSmallMobile ? '1.5rem' : '2.2rem', fontWeight: 900, marginBottom: 20 }}>Farm Status Overview</h2>
               <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 30 : 40 }}>
                 <div>
                    <h4 style={{ color: txtSec, fontSize: '1rem', marginBottom: 10 }}>Overall Crop Health</h4>
                    <div style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight: 900, color: '#22c55e', display: 'flex', alignItems:'center', gap: 20, flexWrap:'wrap' }}>
                        Excellent <span style={{ fontSize: '1rem', padding: '8px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: 20 }}>98% Safe</span>
                     </div>
                     <p style={{ color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', marginTop: 20, lineHeight: 1.6 }}>Your crops are showing optimal nitrogen levels. The AI has detected no immediate severe fungal threats in your active zones.</p>
                  </div>
                  <div style={{ borderLeft: isMobile ? 'none' : `2px solid ${borderCol}`, borderTop: isMobile ? `2px solid ${borderCol}` : 'none', paddingLeft: isMobile ? 0 : 40, paddingTop: isMobile ? 30 : 0 }}>
                     <h4 style={{ color: txtSec, fontSize: '1.1rem', marginBottom: 20 }}>Quick Action Core Tools</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                       
                       {/* Link to Crop Scanner */}
                       <div 
                         onClick={() => setActiveTab('scanner')} 
                         style={{ background: isDark?'rgba(34,197,94,0.1)':'#f0fdf4', padding: '15px 25px', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(34,197,94,0.3)', transition: 'all 0.2s' }}
                         onMouseOver={e => e.currentTarget.style.transform = 'translateX(10px)'}
                         onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
                       >
                         <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <span style={{ fontSize: '1.8rem' }}>📸</span>
                            <div>
                               <div style={{ fontWeight: 900, fontSize: '1.1rem', color: txtMain }}>Launch Crop Scanner</div>
                               <div style={{ fontSize: '0.85rem', color: txtSec }}>Identify diseases in real-time</div>
                            </div>
                         </div>
                         <div style={{ fontSize: '1.5rem', color: '#22c55e' }}>→</div>
                       </div>

                       {/* Link to Kisan Bot */}
                       <div 
                         onClick={() => setActiveTab('bot')} 
                         style={{ background: isDark?'rgba(59,130,246,0.1)':'#eff6ff', padding: '15px 25px', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
                         onMouseOver={e => e.currentTarget.style.transform = 'translateX(10px)'}
                         onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
                       >
                         <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <span style={{ fontSize: '1.8rem' }}>🤖</span>
                            <div>
                               <div style={{ fontWeight: 900, fontSize: '1.1rem', color: txtMain }}>Ask Kisan AI Bot</div>
                               <div style={{ fontSize: '0.85rem', color: txtSec }}>Get instant agricultural advice</div>
                            </div>
                         </div>
                         <div style={{ fontSize: '1.5rem', color: '#3b82f6' }}>→</div>
                       </div>

                    </div>
                 </div>
               </div>
            </div>

            {/* 3. WIDE UTILITY ROW (Weather & Mandi) */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 40, marginBottom:50 }}>
               {/* Weather Wide Card */}
               <div style={{ background: bgCard, borderRadius:40, padding: isSmallMobile ? 24 : 50, border:`1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display:'flex', flexDirection: window.innerWidth < 1150 ? 'column' : 'row', justifyContent:'space-between', alignItems: window.innerWidth < 1150 ? 'flex-start' : 'flex-start', marginBottom: 30, gap: 20 }}>
                     <div>
                        <h3 style={{ margin:'0 0 10px', fontSize: isSmallMobile ? '1.25rem' : '1.6rem', fontWeight:900 }}>Live Weather Intelligence</h3>
                        <p style={{ color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', margin: 0 }}>Real-time atmospheric conditions.</p>
                     </div>
                     <div style={{ display:'flex', gap:10, width: window.innerWidth < 1150 ? '100%' : 'auto' }}>
                       <input style={{...inp, marginBottom:0, borderRadius: 16, flex: 1, minWidth: 120}} placeholder="Search City..." value={weatherSearch} onChange={e => setWeatherSearch(e.target.value)} />
                       <button onClick={() => fetchWeather(weatherSearch)} style={{background:'#22c55e', color:'white', border:'none', borderRadius:16, padding: isSmallMobile ? '0 15px' : '0 25px', fontWeight: 900, cursor: 'pointer', flexShrink: 0}}>Search</button>
                     </div>
                  </div>
                  {weatherData && (
                    <div style={{ display: 'flex', flexDirection: isSmallMobile ? 'column' : 'row', alignItems: isSmallMobile ? 'flex-start' : 'center', gap: isSmallMobile ? 20 : 40, padding: isSmallMobile ? 20 : 30, background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: 30 }}>
                      <div style={{fontSize: isSmallMobile ? '3.5rem' : '4.5rem', fontWeight:900, lineHeight: 1, color: '#10b981'}}>{weatherData.temperature}°</div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: isSmallMobile ? '1.2rem' : '1.5rem', fontWeight: 800, textTransform: 'capitalize', marginBottom: 5 }}>{weatherData.description} in {weatherData.city}</div>
                         <div style={{color: txtSec, fontSize: isSmallMobile ? '0.9rem' : '1.1rem', fontWeight: 600, marginBottom: 15 }}>Humidity: {weatherData.humidity}% • Wind: {weatherData.windSpeed} km/h</div>
                         <div style={{ padding: 15, background:'rgba(34,197,94,0.1)', borderRadius: 15, color:'#10b981', fontSize:'0.9rem', fontWeight: 800 }}>
                           💡 Advice: {weatherData.recommendations[0]}
                         </div>
                      </div>
                    </div>
                  )}
               </div>

               {/* Mandi Rates Stack */}
               <div style={{ background: bgCard, borderRadius:40, padding: isSmallMobile ? 24 : 50, border:`1px solid ${borderCol}` }}>
                  <h3 style={{ margin:'0 0 25px', fontSize: isSmallMobile ? '1.25rem' : '1.6rem', fontWeight: 900 }}>Market Mandi Rates</h3>
                  <div style={{ display:'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap: isSmallMobile ? 12 : 20 }}>
                    {marketPrices.map((m, i) => (
                      <div key={i} style={{ padding:20, borderRadius:20, background: isDark?'rgba(255,255,255,0.02)':'#fbfcfd', border: `1px solid ${borderCol}`, display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
                        <div><div style={{fontWeight:900, fontSize: '1.1rem'}}>{m.crop}</div><div style={{fontSize:'0.85rem', color:txtSec}}>{m.mandi}</div></div>
                        <div style={{textAlign:'right'}}><div style={{fontWeight:900, color:'#22c55e', fontSize: '1.2rem'}}>{m.price}</div><div style={{fontSize:'0.8rem', fontWeight: 800, color:m.trend==='up'?'#22c55e':'#f43f5e'}}>{m.change}</div></div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* 4. REAL FARMER RESOURCES (NON-SQUARE, DIRECT EXTERNAL LINKS) */}
            <div style={{ marginTop: 70, marginBottom: 70 }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
                  <div>
                     <h2 style={{ fontSize: isSmallMobile ? '1.5rem' : '2.2rem', fontWeight: 900, margin: '0 0 10px 0' }}>National Farmer Portals</h2>
                     <p style={{ color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', margin: 0 }}>Direct access to official government services and markets.</p>
                  </div>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* e-NAM Portal Link */}
                  <a href="https://enam.gov.in/web/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                     <motion.div whileHover={{ scale: 1.01, x: 10 }} style={{ 
                       background: isDark ? 'linear-gradient(90deg, #0f172a, #020617)' : 'linear-gradient(90deg, #ffffff, #f8fafc)', 
                       padding: isSmallMobile ? '25px' : '40px 50px', 
                       borderRadius: 32, 
                       border: `1px solid ${borderCol}`, 
                       borderLeft: isSmallMobile ? '0' : '6px solid #3b82f6',
                       borderTop: isSmallMobile ? '6px solid #3b82f6' : '0',
                       display: 'flex', 
                       flexDirection: isMobile ? 'column' : 'row',
                       justifyContent: 'space-between', 
                       alignItems: isMobile ? 'flex-start' : 'center', 
                       boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                       gap: 24
                     }}>
                        <div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 12 : 20, marginBottom: 15, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: isSmallMobile ? '2rem' : '2.8rem' }}>⚖️</span>
                              <span style={{ fontSize: isSmallMobile ? '1.8rem' : '2.2rem' }}>⚖️</span>
                              <h3 style={{ margin: 0, fontSize: isSmallMobile ? '1.25rem' : '1.6rem', color: txtMain, fontWeight: 900 }}>e-NAM Market Portal</h3>
                              <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.65rem', padding: '4px 10px', borderRadius: 12, fontWeight: 900 }}>GOVT OF INDIA</span>
                           </div>
                           <p style={{ margin: 0, color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', maxWidth: 850, lineHeight: 1.6 }}>Access the National Agriculture Market to trade your commodities securely online. Check real-time bidding, analyze demand, and view nationwide mandi prices directly from the official portal.</p>
                        </div>
                        <div style={{ 
                          background: '#3b82f6', color: 'white', 
                          padding: isSmallMobile ? '14px 24px' : '18px 40px', 
                          borderRadius: 20, fontWeight: 900, 
                          fontSize: isSmallMobile ? '0.9rem' : '1.1rem', 
                          boxShadow: '0 10px 20px rgba(59,130,246,0.3)',
                          width: isMobile ? '100%' : 'auto',
                          textAlign: 'center'
                        }}>
                           Visit e-NAM ↗
                        </div>
                     </motion.div>
                  </a>

                  {/* PM-Kisan Portal Link */}
                  <a href="https://pmkisan.gov.in/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                     <motion.div whileHover={{ scale: 1.01, x: 10 }} style={{ 
                       background: isDark ? 'linear-gradient(90deg, #0f172a, #020617)' : 'linear-gradient(90deg, #ffffff, #f8fafc)', 
                       padding: isSmallMobile ? '25px' : '40px 50px', 
                       borderRadius: 32, 
                       border: `1px solid ${borderCol}`, 
                       borderLeft: isSmallMobile ? '0' : '6px solid #22c55e',
                       borderTop: isSmallMobile ? '6px solid #22c55e' : '0',
                       display: 'flex', 
                       flexDirection: isMobile ? 'column' : 'row',
                       justifyContent: 'space-between', 
                       alignItems: isMobile ? 'flex-start' : 'center', 
                       boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                       gap: 24
                     }}>
                        <div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 12 : 20, marginBottom: 15, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: isSmallMobile ? '1.8rem' : '2.2rem' }}>🏦</span>
                              <h3 style={{ margin: 0, fontSize: isSmallMobile ? '1.25rem' : '1.6rem', color: txtMain, fontWeight: 900 }}>PM-Kisan Samman Nidhi</h3>
                              <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '0.65rem', padding: '4px 10px', borderRadius: 12, fontWeight: 900 }}>SUBSIDY SCHEME</span>
                           </div>
                           <p style={{ margin: 0, color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', maxWidth: 850, lineHeight: 1.6 }}>Check your beneficiary status, update e-KYC, and automatically register for the ₹6,000 annual income support scheme. Manage your direct bank transfers securely.</p>
                        </div>
                        <div style={{ 
                          background: '#22c55e', color: 'white', 
                          padding: isSmallMobile ? '14px 24px' : '18px 40px', 
                          borderRadius: 20, fontWeight: 900, 
                          fontSize: isSmallMobile ? '0.9rem' : '1.1rem', 
                          boxShadow: '0 10px 20px rgba(34,197,94,0.3)',
                          width: isMobile ? '100%' : 'auto',
                          textAlign: 'center'
                        }}>
                           Open PM-Kisan ↗
                        </div>
                     </motion.div>
                  </a>

                  {/* Kisan Suvidha App Link */}
                  <a href="https://kisansuvidha.gov.in/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                     <motion.div whileHover={{ scale: 1.01, x: 10 }} style={{ 
                       background: isDark ? 'linear-gradient(90deg, #0f172a, #020617)' : 'linear-gradient(90deg, #ffffff, #f8fafc)', 
                       padding: isSmallMobile ? '25px' : '40px 50px', 
                       borderRadius: 32, 
                       border: `1px solid ${borderCol}`, 
                       borderLeft: isSmallMobile ? '0' : '6px solid #f59e0b',
                       borderTop: isSmallMobile ? '6px solid #f59e0b' : '0',
                       display: 'flex', 
                       flexDirection: isMobile ? 'column' : 'row',
                       justifyContent: 'space-between', 
                       alignItems: isMobile ? 'flex-start' : 'center', 
                       boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                       gap: 24
                     }}>
                        <div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 12 : 20, marginBottom: 15, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: isSmallMobile ? '1.8rem' : '2.2rem' }}>🚜</span>
                              <h3 style={{ margin: 0, fontSize: isSmallMobile ? '1.25rem' : '1.6rem', color: txtMain, fontWeight: 900 }}>E-RUPI Unified Market (CHMS)</h3>
                              <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.65rem', padding: '4px 10px', borderRadius: 12, fontWeight: 900 }}>ALL-IN-ONE</span>
                           </div>
                           <p style={{ margin: 0, color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', maxWidth: 850, lineHeight: 1.6 }}>A unified master portal for farmers to easily access granular weather data, locate nearby fertilizer/seed dealers, read plant protection advice, and lease farm machinery.</p>
                        </div>
                        <div style={{ 
                          background: '#f59e0b', color: 'white', 
                          padding: isSmallMobile ? '14px 24px' : '18px 40px', 
                          borderRadius: 20, fontWeight: 900, 
                          fontSize: isSmallMobile ? '0.9rem' : '1.1rem', 
                          boxShadow: '0 10px 20px rgba(245,158,11,0.3)',
                          width: isMobile ? '100%' : 'auto',
                          textAlign: 'center'
                        }}>
                           Access Platform ↗
                        </div>
                     </motion.div>
                  </a>

                  {/* PM Fasal Bima Yojana (Crop Insurance) */}
                  <a href="https://pmfby.gov.in/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                     <motion.div whileHover={{ scale: 1.01, x: 10 }} style={{ 
                       background: isDark ? 'linear-gradient(90deg, #0f172a, #020617)' : 'linear-gradient(90deg, #ffffff, #f8fafc)', 
                       padding: isSmallMobile ? '25px' : '40px 50px', 
                       borderRadius: 32, 
                       border: `1px solid ${borderCol}`, 
                       borderLeft: isSmallMobile ? '0' : '6px solid #8b5cf6',
                       borderTop: isSmallMobile ? '6px solid #8b5cf6' : '0',
                       display: 'flex', 
                       flexDirection: isMobile ? 'column' : 'row',
                       justifyContent: 'space-between', 
                       alignItems: isMobile ? 'flex-start' : 'center', 
                       boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                       gap: 24
                     }}>
                        <div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 12 : 20, marginBottom: 15, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: isSmallMobile ? '1.8rem' : '2.2rem' }}>🛡️</span>
                              <h3 style={{ margin: 0, fontSize: isSmallMobile ? '1.25rem' : '1.6rem', color: txtMain, fontWeight: 900 }}>Crop Insurance (PMFBY)</h3>
                              <span style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: '0.65rem', padding: '4px 10px', borderRadius: 12, fontWeight: 900 }}>CROP PROTECTION</span>
                           </div>
                           <p style={{ margin: 0, color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', maxWidth: 850, lineHeight: 1.6 }}>Protect your crops against natural calamities, pests & diseases. Calculate insurance premiums, report crop losses online, and track your insurance claims to safeguard your farming yield.</p>
                        </div>
                        <div style={{ 
                          background: '#8b5cf6', color: 'white', 
                          padding: isSmallMobile ? '14px 24px' : '18px 40px', 
                          borderRadius: 20, fontWeight: 900, 
                          fontSize: isSmallMobile ? '0.9rem' : '1.1rem', 
                          boxShadow: '0 10px 20px rgba(139,92,246,0.3)',
                          width: isMobile ? '100%' : 'auto',
                          textAlign: 'center'
                        }}>
                           Insure Crop ↗
                        </div>
                     </motion.div>
                  </a>

                  {/* Soil Health Card Portal Link */}
                  <a href="https://soilhealth.dac.gov.in/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                     <motion.div whileHover={{ scale: 1.01, x: 10 }} style={{ 
                       background: isDark ? 'linear-gradient(90deg, #0f172a, #020617)' : 'linear-gradient(90deg, #ffffff, #f8fafc)', 
                       padding: isSmallMobile ? '25px' : '40px 50px', 
                       borderRadius: 32, 
                       border: `1px solid ${borderCol}`, 
                       borderLeft: isSmallMobile ? '0' : '6px solid #14b8a6',
                       borderTop: isSmallMobile ? '6px solid #14b8a6' : '0',
                       display: 'flex', 
                       flexDirection: isMobile ? 'column' : 'row',
                       justifyContent: 'space-between', 
                       alignItems: isMobile ? 'flex-start' : 'center', 
                       boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                       gap: 24
                     }}>
                        <div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 12 : 20, marginBottom: 15, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: isSmallMobile ? '1.8rem' : '2.2rem' }}>🌱</span>
                              <h3 style={{ margin: 0, fontSize: isSmallMobile ? '1.25rem' : '1.6rem', color: txtMain, fontWeight: 900 }}>Soil Health Card Portal</h3>
                              <span style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6', fontSize: '0.65rem', padding: '4px 10px', borderRadius: 12, fontWeight: 900 }}>CROP PLANNING</span>
                           </div>
                           <p style={{ margin: 0, color: txtSec, fontSize: isSmallMobile ? '0.85rem' : '1rem', maxWidth: 850, lineHeight: 1.6 }}>Download your official soil health card. Get highly specific crop recommendations and precise fertilizer/nutrient dosages required based on your farm's exact laboratory soil test results.</p>
                        </div>
                        <div style={{ 
                          background: '#14b8a6', color: 'white', 
                          padding: isSmallMobile ? '14px 24px' : '18px 40px', 
                          borderRadius: 20, fontWeight: 900, 
                          fontSize: isSmallMobile ? '0.9rem' : '1.1rem', 
                          boxShadow: '0 10px 20px rgba(20,184,166,0.3)',
                          width: isMobile ? '100%' : 'auto',
                          textAlign: 'center'
                        }}>
                           Track Soil ↗
                        </div>
                     </motion.div>
                  </a>
               </div>
            </div>
          </motion.section>
        )}

        {/* 2. CROP SCANNER */}
        {activeTab === 'scanner' && (
          <motion.section initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <h2 style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight:900, marginBottom:30, color: txtMain }}>🔬 Precision Crop Scanner</h2>
            <div style={{ background:bgCard, borderRadius:32, padding: isMobile ? 24 : 48, border:`1px solid ${borderCol}` }}>
              <CropScanner onScanComplete={loadAll} theme={theme} goToTab={setActiveTab} lang={lang} />
            </div>
          </motion.section>
        )}

        {/* 3. KISAN BOT (ENHANCED WITH SIDEBAR) */}
        {activeTab === 'bot' && (
          <motion.section initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ height:'75vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isSmallMobile ? 'flex-start' : 'center', marginBottom:30, gap: 20 }}>
               <h2 style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight:900, margin:0 }}>🤖 {t.kisanBot}</h2>
               <div style={{ display:'flex', gap:10, width: isMobile ? '100%' : 'auto' }}>
                  <button onClick={createNewChat} style={{ flex: 1, padding: isSmallMobile ? '10px 15px' : '12px 24px', borderRadius:20, border:'none', background:'#22c55e', color:'white', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 10px 30px rgba(34,197,94,0.3)', fontSize: isSmallMobile ? '0.8rem' : '1rem' }}>
                    <span>+</span> {t.newChat}
                  </button>
                  <button onClick={() => setSpeechEnabled(!speechEnabled)} style={{ flex: 1, padding: isSmallMobile ? '10px 15px' : '10px 20px', borderRadius:20, border:`1px solid ${borderCol}`, background: speechEnabled?'rgba(34,197,94,0.1)':'transparent', color: speechEnabled?'#22c55e':txtSec, fontWeight:900, cursor:'pointer', fontSize: isSmallMobile ? '0.75rem' : '0.9rem' }}>
                    {speechEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF'}
                  </button>
               </div>
            </div>
            
            <div style={{ flex:1, display:'flex', gap:isMobile?0:30, overflow:'hidden', flexDirection: isMobile?'column':'row' }}>
               {/* Sidebar - Hidden on small mobile or shown differently */}
               {!isMobile && (
                 <div style={{ width:300, background:bgCard, borderRadius:32, border:`1px solid ${borderCol}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  <div style={{ padding:20, fontWeight:900, fontSize:'0.9rem', color:txtSec, borderBottom:`1px solid ${borderCol}`, display:'flex', alignItems:'center', gap:10 }}>
                     <span>📜</span> {t.yourChats}
                  </div>
                  <div style={{ flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:8 }}>
                     {Object.values(botSessions).map(session => (
                        <div 
                           key={session.id} 
                           onClick={() => setActiveSessionId(session.id)}
                           style={{ 
                              padding:'12px 15px', 
                              borderRadius:15, 
                              background: activeSessionId === session.id ? (isDark?'rgba(34,197,94,0.1)':'#f1f5f9') : 'transparent',
                              color: activeSessionId === session.id ? '#22c55e' : txtMain,
                              cursor:'pointer',
                              display:'flex',
                              justifyContent:'space-between',
                              alignItems:'center',
                              group:true,
                              transition:'all 0.2s'
                           }}
                        >
                           <span style={{ fontSize:'0.85rem', fontWeight: activeSessionId === session.id ? 900 : 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'80%' }}>
                              {session.title}
                           </span>
                           <button 
                              onClick={(e) => deleteSession(e, session.id)} 
                              style={{ border:'none', background:'transparent', color:'#f43f5e', fontSize:'1rem', cursor:'pointer', opacity: 0.6, hover: {opacity: 1} }}
                           >
                              🗑️
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
               )}

               {/* Main Chat Area */}
               <div style={{ flex:1, background:bgCard, borderRadius:32, border:`1px solid ${borderCol}`, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.1)' }}>
                  <div style={{ flex:1, padding: isSmallMobile ? 15 : 30, overflowY:'auto', display:'flex', flexDirection:'column', gap:15 }}>
                     {chatHistory.map((m, i) => (
                        <motion.div key={i} initial={{ x: m.role==='user'?20:-20, opacity:0 }} animate={{ x:0, opacity:1 }} style={{ alignSelf: m.role==='user'?'flex-end':'flex-start', background: m.role==='user'?'#22c55e':(isDark?'rgba(255,255,255,0.05)':'#f1f5f9'), color: m.role==='user'?'white':txtMain, padding: isSmallMobile ? '12px 18px' : '16px 24px', borderRadius:24, maxWidth:'85%', boxShadow:'0 4px 15px rgba(0,0,0,0.05)', fontSize: isSmallMobile ? '0.85rem' : '1rem' }}>
                        {m.role === 'bot' ? ((m.key === 'dynamic' || m.key === 'typing') ? m.content : (t.botAnswers[m.key] || t.botAnswers.default)) : m.content}
                        </motion.div>
                     ))}
                  </div>
                  <div style={{ padding: isSmallMobile ? 15 : 30, borderTop:`1px solid ${borderCol}`, display:'flex', gap:10, alignItems:'center', background: isDark?'rgba(0,0,0,0.2)':'#fafafa' }}>
                     <input style={{...inp, marginBottom:0, borderRadius:20, flex: 1}} placeholder={t.botPlaceholder} value={botMessage} onChange={e => setBotMessage(e.target.value)} onKeyPress={e => e.key==='Enter'&&sendBotMessage()} />
                     
                     <button onClick={startListening} style={{ width: isSmallMobile ? 44 : 54, height: isSmallMobile ? 44 : 54, borderRadius:'50%', background: isListening ? '#f43f5e' : (isDark?'#1e293b':'#fff'), color: isListening ? 'white' : '#22c55e', border:`2px solid ${isListening?'#f43f5e':'#22c55e'}`, cursor:'pointer', fontSize: isSmallMobile ? '1rem' : '1.4rem', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s', flexShrink: 0 }}>
                        {isListening ? '🛑' : '🎤'}
                     </button>

                     <button onClick={() => sendBotMessage()} style={{ background:'#22c55e', color:'white', border:'none', borderRadius:20, padding: isSmallMobile ? '0 15px' : '0 30px', height: isSmallMobile ? 44 : 54, fontWeight:900, fontSize: isSmallMobile ? '0.8rem' : '1.1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:10, flexShrink: 0 }}>
                        {isSmallMobile ? '➡' : 'SEND'} {!isSmallMobile && <span style={{fontSize:'1.2rem'}}>➡</span>}
                     </button>
                  </div>
               </div>
            </div>
          </motion.section>
        )}

        {/* 4. ASK AGRONOMIST */}
        {activeTab === 'queries' && (
           <motion.section initial="hidden" animate="visible" variants={containerVariants}>
              <div style={{ display:'grid', gridTemplateColumns: windowWidth < 700 ? '1fr' : '1.1fr 0.9fr', gap:40, marginBottom:50, alignItems: 'start', width: '100%' }}>
                  <div style={{ background:bgCard, padding:40, borderRadius:32, border:`1px solid ${borderCol}` }}>
                      <h2 style={{ fontWeight:900, margin:'0 0 25px' }}>{t.askExpert} 🩺</h2>
                      <p style={{ color:txtSec, marginBottom:30 }}>{t.descExpert}</p>
                      
                      <form onSubmit={submitQuery}>
                          <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:8 }}>{t.cropType}</label>
                          <select 
                            value={newQuery.crop_type} 
                            onChange={e => setNewQuery({...newQuery, crop_type: e.target.value})}
                            style={{ ...inp, appearance:'none', cursor:'pointer' }}
                          >
                            <option value="">{t.selectCrop}</option>
                            <option value="Tomato">{t.crops?.Tomato || 'Tomato'}</option>
                            <option value="Potato">{t.crops?.Potato || 'Potato'}</option>
                            <option value="Corn">{t.crops?.Corn || 'Corn'}</option>
                            <option value="Wheat">{t.crops?.Wheat || 'Wheat'}</option>
                            <option value="Cotton">{t.crops?.Cotton || 'Cotton'}</option>
                            <option value="Rice">{t.crops?.Rice || 'Rice'}</option>
                            <option value="Other">{t.crops?.Other || 'Other'}</option>
                          </select>
                          <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:8 }}>{t.queryTitle}</label>
                          <input type="text" placeholder="e.g., Yellow spots on tomato leaves" style={inp} value={newQuery.title} onChange={e => setNewQuery({...newQuery, title: e.target.value})} />
                          <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:8 }}>{t.queryDesc}</label>
                          <textarea placeholder="Describe when it started and what you've tried..." style={{ ...inp, height:120 }} value={newQuery.description} onChange={e => setNewQuery({...newQuery, description: e.target.value})} />
                          <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:8 }}>{t.selectImage}</label>
                          <input type="file" onChange={e => setQueryImage(e.target.files[0])} style={{ ...inp, padding:'10px' }} />
                          <button type="submit" style={{ width:'100%', padding:'18px', background:'#22c55e', color:'white', border:'none', borderRadius:16, fontWeight:900, cursor:'pointer', boxShadow:'0 10px 20px rgba(34,197,94,0.3)' }}>{t.submitQuery.toUpperCase()}</button>
                      </form>
                  </div>
                  <div>
                      <h2 style={{ fontWeight:900, marginBottom:25 }}>{t.consultationBenefits}</h2>
                      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                          {[
                              { title: t.preliminaryScan, desc: t.scanDesc, icon: '🤖' },
                              { title: t.humanExpert, desc: t.expertDesc, icon: '👨‍🔬' },
                              { title: t.customTreatment, desc: t.protocolDesc, icon: '💊' }
                          ].map((b, i) => (
                              <div key={i} style={{ display:'flex', gap:20, background:bgCard, padding:25, borderRadius:24, border:`1px solid ${borderCol}` }}>
                                  <div style={{ fontSize:'2rem' }}>{b.icon}</div>
                                  <div>
                                      <div style={{ fontWeight:900 }}>{b.title}</div>
                                      <div style={{ color:txtSec, fontSize:'0.9rem', marginTop:5 }}>{b.desc}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <h2 style={{ fontWeight:900, marginBottom:30 }}>{t.myConsultations}</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  {farmerQueries.map(q => (
                      <div key={q.id} style={{ background:bgCard, borderRadius:32, border:`1px solid ${borderCol}`, overflow:'hidden' }}>
                          <div style={{ padding:30, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:20 }}>
                              <div style={{ flex:1 }}>
                                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                                      <span style={{ padding:'4px 12px', borderRadius:8, background:'rgba(34,197,94,0.1)', color:'#22c55e', fontSize:'0.75rem', fontWeight:900 }}>{q.crop_type.replace(/___/g, ' - ').replace(/_/g, ' ')}</span>
                                      <span style={{ padding:'4px 12px', borderRadius:8, background: q.status==='pending' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', color: q.status==='pending' ? '#eab308' : '#22c55e', fontSize:'0.75rem', fontWeight:900 }}>{q.status.toUpperCase()}</span>
                                  </div>
                                  <h3 style={{ margin:'0 0 10px', fontWeight:900 }}>{q.title}</h3>
                                  <p style={{ color:txtSec, fontSize:'0.95rem', margin:0 }}>{q.description}</p>
                                  
                                  {q.ai_diagnosis && (
                                      <div style={{ marginTop: 20, padding: 15, background: 'rgba(34,197,94,0.05)', borderRadius: 16, border: `1px dashed ${borderCol}` }}>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#22c55e', marginBottom: 5 }}>{t.initialScan}:</div>
                                          <div style={{ fontWeight: 800 }}>{q.ai_diagnosis.disease?.type.replace(/___/g, ' - ').replace(/_/g, ' ')}</div>
                                          <div style={{ fontSize: '0.8rem', color: txtSec }}>{t.confidence}: {(q.ai_diagnosis.disease?.confidence || 0).toFixed(1)}%</div>
                                      </div>
                                  )}
                              </div>
                              <div style={{ width:isSmallMobile?'100%':200 }}>
                                  {q.image_path && <img src={`http://localhost:5001/uploads/${q.image_path}`} alt="query" style={{ width:'100%', borderRadius:16, border:`1px solid ${borderCol}` }} />}
                              </div>
                          </div>
                          
                          {q.responses && q.responses.length > 0 && (
                               <div style={{ background: isDark ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(0,0,0,0.3) 100%)' : '#f0fdf4', padding: 40, borderTop: `2px solid ${borderCol}` }}>
                                   {q.responses.map(res => (
                                       <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={res.id} style={{ position: 'relative' }}>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
                                               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 5px 15px rgba(34,197,94,0.3)' }}>👨‍🔬</div>
                                               <div>
                                                 <div style={{ fontWeight: 900, fontSize: '1.2rem', color: txtMain }}>Dr. {res.agronomist_name}</div>
                                                 <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px' }}>CERTIFIED AGRONOMIST EXPERT ADVICE</div>
                                               </div>
                                           </div>
                                           <div style={{ background: isDark ? 'rgba(0,0,0,0.3)' : '#fff', borderRadius: 24, padding: 30, border: `1px solid ${borderCol}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                                               <div style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 25, color: txtMain }}>{res.message}</div>
                                               <div style={{ padding: 20, background: isDark ? 'rgba(34,197,94,0.1)' : '#f8fafc', borderRadius: 16, borderLeft: '5px solid #22c55e' }}>
                                                  <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '0.85rem', marginBottom: 10, letterSpacing: '1px' }}>OFFICIAL TREATMENT PROTOCOL:</div>
                                                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: txtMain }}>{res.recommendation}</div>
                                               </div>
                                           </div>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                       </div>
                  ))}
                  {farmerQueries.length === 0 && <p style={{ color:txtSec, textAlign:'center' }}>You haven't submitted any queries yet.</p>}
              </div>
           </motion.section>
        )}
        {activeTab === 'farms' && (
           <motion.section initial="hidden" animate="visible" variants={containerVariants}>
             <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 20 : 0, marginBottom:40 }}>
                <div>
                   <h2 style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight:900 }}>Field Management (My Farms)</h2>
                   <p style={{ color:txtSec, marginTop:10, maxWidth: 700 }}>This hub is the foundation of your precision agriculture. By organizing your farm into specific zones, our AI can track time-series health data, soil variations, and localized weather risks for each plot separately. This ensures targeted treatments and maximum yield for every acre.</p>
                </div>
                <button onClick={() => setShowAddFarm(!showAddFarm)} style={{ width: isMobile ? '100%' : 'auto', background:'linear-gradient(135deg, #22c55e, #10b981)', color:'white', border:'none', padding:'14px 32px', borderRadius:16, fontWeight:900, cursor:'pointer', boxShadow:'0 10px 20px rgba(34,197,94,0.2)' }}>
                   {showAddFarm ? 'CANCEL' : '+ REGISTER NEW ZONE'}
                </button>
             </div>
             {showAddFarm && (
               <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} style={{ background:bgCard, padding: isSmallMobile ? 24 : 48, borderRadius:32, border:`2px solid #22c55e`, marginBottom:48, maxWidth:800 }}>
                  <h3 style={{ margin:'0 0 30px', fontSize:'1.4rem', fontWeight:900 }}>Initialize Field Protocol</h3>
                  <div style={{ display:'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap:20 }}>
                     <input style={inp} placeholder="Farm Identifier (e.g. North Sector)" value={newFarm.name} onChange={e => setNewFarm({...newFarm, name:e.target.value})} />
                     <input style={inp} placeholder="Geographic Location" value={newFarm.location} onChange={e => setNewFarm({...newFarm, location:e.target.value})} />
                     <input style={inp} type="number" placeholder="Area (Acres)" value={newFarm.area_acres} onChange={e => setNewFarm({...newFarm, area_acres:e.target.value})} />
                     <select style={inp} value={newFarm.soil_type} onChange={e => setNewFarm({...newFarm, soil_type:e.target.value})}>
                        <option value="loamy">Loamy Soil</option><option value="black">Black Cotton</option><option value="clay">Clay</option>
                     </select>
                  </div>
                  <button onClick={addFarm} style={{ width:'100%', padding:18, background:'#22c55e', color:'white', border:'none', borderRadius:16, fontWeight:900, fontSize:'1.1rem', cursor:'pointer' }}>CONFIRM REGISTRATION</button>
               </motion.div>
             )}
             <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))', gap:32 }}>
                {farms.map((f, i) => (
                  <motion.div key={i} whileHover={{ y:-10 }} style={{ background:bgCard, padding: isSmallMobile ? 24 : 40, borderRadius:32, border:`1px solid ${borderCol}`, boxShadow:'0 10px 30px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                       <div style={{ width:48, height:48, borderRadius:12, background:'rgba(34,197,94,0.1)', color:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>🚜</div>
                       <div style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', padding:'6px 14px', borderRadius:12, fontSize:'0.75rem', fontWeight:900 }}>ACTIVE PROFILE</div>
                    </div>
                    <h3 style={{ margin:'0 0 10px', fontSize:'1.4rem', fontWeight:900 }}>{f.name}</h3>
                    <div style={{ color:txtSec, display:'flex', flexDirection:'column', gap:8 }}>
                       <span>📍 {f.location}</span>
                       <span>📏 {f.area_acres || '---'} Total Acres</span>
                       <span style={{ color:'#22c55e', fontWeight:800, fontSize:'0.8rem', marginTop:8 }}>SOIL TYPE: {f.soil_type?.toUpperCase()}</span>
                    </div>
                    <div style={{ position:'absolute', bottom:-10, right:-10, fontSize:'5rem', opacity:0.03 }}>🌱</div>
                  </motion.div>
                ))}
             </div>
           </motion.section>
        )}

        {/* 5. HISTORY */}
        {activeTab === 'history' && (
           <motion.section initial="hidden" animate="visible" variants={containerVariants}>
             <h2 style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight:900, marginBottom:40 }}>Diagnostic intelligence History</h2>
             <div style={{ background:bgCard, borderRadius:40, padding: isSmallMobile ? 20 : 40, border:`1px solid ${borderCol}`, boxShadow:'0 20px 50px rgba(0,0,0,0.05)' }}>
               {history.length === 0 ? (
                 <div style={{textAlign:'center', padding:60}}>
                    <div style={{fontSize:'4rem', marginBottom:20}}>📋</div>
                    <p style={{color:txtSec}}>No scan data found in history.</p>
                 </div>
               ) : (
                 <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
                    {history.map((h, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ background: isDark?'rgba(255,255,255,0.03)':'#f8fafc' }}
                        style={{ 
                          padding: isSmallMobile ? 20 : 30, borderRadius:24, border: `1px solid ${borderCol}`, 
                          display:'grid', gridTemplateColumns: isSmallMobile ? '1fr' : 'auto 1fr auto', gap: isSmallMobile ? 15 : 30, alignItems:'center' 
                        }}
                      >
                         <div style={{ width:60, height:60, borderRadius:18, border:`2px solid ${borderCol}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>🌿</div>
                         <div>
                            <div style={{ display:'flex', alignItems:'center', gap:15 }}>
                               <span style={{ fontWeight:900, fontSize:'1.2rem' }}>{h.crop_name}</span>
                               <span style={{ color:'#22c55e', fontWeight:800, fontSize:'0.85rem' }}>{h.confidence}% ACCURACY</span>
                            </div>
                            <div style={{ marginTop:8, fontSize:'0.95rem', color:txtSec }}>
                               <strong>Diagnostics:</strong> {h.stress_type?.replace(/___/g,' ')}
                            </div>
                            <div style={{ marginTop:8, fontSize:'0.8rem', color:txtSec }}>🕒 {h.detected_at}</div>
                         </div>
                         <div style={{ display: 'flex', gap: 12 }}>
                             <button onClick={() => downloadReport(h)} title={t.downloadReport} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${borderCol}`, background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>📥</button>
                             <button onClick={() => deleteDetection(h.id)} title={t.deleteReport} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${borderCol}`, background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                             <button onClick={() => setSelectedReport(h)} style={{ padding:'10px 24px', background:isDark?'#fff':'#0f172a', color:isDark?'#000':'#fff', border:'none', borderRadius:12, fontWeight:800, cursor:'pointer' }}>{t.viewReport}</button>
                          </div>
                      </motion.div>
                    ))}
                 </div>
               )}
             </div>
           </motion.section>
        )}

        {/* 6. ALERTS */}
        {activeTab === 'alerts' && (
           <motion.section initial="hidden" animate="visible" variants={containerVariants}>
             <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 20 : 0, marginBottom:40 }}>
                <div>
                   <h2 style={{ margin:0, fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight:900 }}>Health & Security Alerts</h2>
                   <p style={{ color:txtSec, marginTop:10, fontSize: isSmallMobile ? '1rem' : '1.1rem' }}>Instant notifications for critical farm stress and regional threats.</p>
                </div>
                <div style={{ width: isMobile ? '100%' : 'auto', textAlign:'center', background:'rgba(244,63,94,0.1)', color:'#f43f5e', padding:'12px 24px', borderRadius:16, fontWeight:900, border:'1px solid rgba(244,63,94,0.2)' }}>
                   {alerts.length} CRITICAL ALERTS
                </div>
             </div>

             <div style={{ background:bgCard, borderRadius:40, padding: isSmallMobile ? 20 : 40, border:`1px solid ${borderCol}`, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                {alerts.length === 0 ? (
                   <div style={{ textAlign:'center', padding:60 }}>
                      <div style={{ fontSize:'4rem', marginBottom:20 }}>🛡️</div>
                      <h3 style={{ margin:0, fontSize:'1.5rem' }}>No Security Threats</h3>
                      <p style={{ color:txtSec, marginTop:10 }}>Your fields are currently clear of critical stress outbreaks.</p>
                   </div>
                ) : (
                   <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                      {alerts.map((a, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ x: 10 }}
                          style={{ 
                            padding:isMobile?20:32, borderRadius:28, background: isDark ? 'rgba(239, 68, 68, 0.05)' : '#fff1f2', 
                            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'}`, 
                            display:'grid', gridTemplateColumns: isMobile?'1fr':'auto 1fr auto', gap:isMobile?15:30, alignItems:'center' 
                          }}
                        >
                           <div style={{ width:56, height:56, borderRadius:16, background:'#f43f5e', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:900 }}>!</div>
                           <div>
                             <h4 style={{ margin:0, color:'#991b1b', fontSize:'1.2rem', fontWeight:900 }}>{a.message}</h4>
                             <div style={{ display:'flex', gap:20, marginTop:10, fontSize:'0.9rem', color:txtSec }}>
                                <span>🕒 Received: <strong>{a.sent_at}</strong></span>
                                <span>📍 Location: <strong>Farm Zone A</strong></span>
                             </div>
                           </div>
                           <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                             <button 
                               onClick={() => setActiveTab('scanner')}
                               style={{ 
                                 padding:'10px 20px', cursor:'pointer', fontWeight:900, fontSize:'0.85rem',
                                 background:'linear-gradient(135deg, #ef4444, #dc2626)',
                                 color:'white', border:'none', borderRadius:14,
                                 boxShadow:'0 8px 20px rgba(239,68,68,0.4)',
                                 display:'flex', alignItems:'center', gap:8
                               }}
                             >
                               🔬 RE-SCAN NOW
                             </button>
                             <button 
                               onClick={() => setActiveTab('queries')}
                               style={{ 
                                 padding:'10px 20px', cursor:'pointer', fontWeight:900, fontSize:'0.85rem',
                                 background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                 color: isDark ? '#f1f5f9' : '#1e293b',
                                 border: `2px solid ${borderCol}`,
                                 borderRadius:14, display:'flex', alignItems:'center', gap:8
                               }}
                             >
                               🩺 GET EXPERT HELP
                             </button>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                )}
             </div>
           </motion.section>
        )}

        {/* 7. PROFILE */}
        {activeTab === 'profile' && (
          <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} variants={containerVariants}>
            <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 20 : 0, marginBottom:40 }}>
               <h2 style={{ margin:0, fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight:900 }}>Profile Settings</h2>
               <div style={{ display:'flex', gap:10, width: isMobile ? '100%' : 'auto' }}>
                  <span style={{ flex: 1, textAlign: 'center', padding:'8px 16px', borderRadius:10, background:'rgba(34,197,94,0.1)', color:'#22c55e', fontSize:'0.8rem', fontWeight:900 }}>ACCOUNT ID: #{user?.id || '---'}</span>
               </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '350px 1fr', gap:40, alignItems:'start' }}>
               
               {/* Left Sidebar Profile Summary */}
               <div style={{ background:bgCard, borderRadius:40, padding: isSmallMobile ? 24 : 40, border:`1px solid ${borderCol}`, textAlign:'center', boxShadow:'0 20px 50px rgba(0,0,0,0.05)' }}>
                  <div style={{ position:'relative', width: isSmallMobile ? 100 : 140, height: isSmallMobile ? 100 : 140, margin:'0 auto 30px' }}>
                    <div style={{ width:'100%', height:'100%', background: 'linear-gradient(135deg, #22c55e, #10b981)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize: isSmallMobile ? '2.5rem' : '4rem', fontWeight:900, boxShadow:'0 15px 35px rgba(34,197,94,0.3)', overflow:'hidden' }}>
                       {profilePhoto ? (
                         <img src={profilePhoto} alt="profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                       ) : (
                         (profileData.name || 'F').charAt(0).toUpperCase()
                       )}
                    </div>
                    <input id="profilePhotoInput" type="file" accept="image/*" onChange={handleProfilePhoto} style={{ display:'none' }} />
                    <div onClick={() => document.getElementById('profilePhotoInput').click()} title="Change Photo" style={{ position:'absolute', bottom:0, right:0, width: isSmallMobile ? 32 : 40, height: isSmallMobile ? 32 : 40, background:isDark?'#fff':'#0f172a', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:`3px solid ${isDark?'#020617':'#fff'}`, fontSize: isSmallMobile ? '0.9rem' : '1.1rem' }}>📷</div>
                  </div>
                  
                  <h3 style={{ margin:'0 0 5px', fontSize: isSmallMobile ? '1.4rem' : '1.8rem', fontWeight:950 }}>{profileData.name || 'Full Name'}</h3>
                  <p style={{ color:txtSec, fontSize: isSmallMobile ? '0.95rem' : '1.1rem', marginBottom:30, fontWeight:700 }}>{profileData.profession}</p>
                  
                  <div style={{ textAlign:'left', borderTop:`1px solid ${borderCol}`, paddingTop:30, display:'flex', flexDirection:'column', gap:20 }}>
                     <div style={{ display:'flex', alignItems:'center', gap:15 }}>
                        <span style={{ fontSize:'1.2rem' }}>📧</span>
                        <div style={{ fontSize: isSmallMobile ? '0.8rem' : '0.9rem', color:txtSec, wordBreak:'break-all' }}>{profileData.email || 'Email not set'}</div>
                     </div>
                     <div style={{ display:'flex', alignItems:'center', gap:15 }}>
                        <span style={{ fontSize:'1.2rem' }}>📍</span>
                        <div style={{ fontSize: isSmallMobile ? '0.8rem' : '0.9rem', color:txtSec }}>{profileData.location || 'Location not set'}</div>
                     </div>
                  </div>
               </div>

               {/* Right Side Settings Form */}
               <div style={{ background:bgCard, borderRadius:40, padding: isSmallMobile ? 24 : 60, border:`1px solid ${borderCol}`, boxShadow:'0 20px 60px rgba(0,0,0,0.05)' }}>
                  <div style={{ display:'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap: isSmallMobile ? 20 : 30, marginBottom:30 }}>
                     <div>
                        <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:12, opacity:0.8 }}>USERNAME / NAME</label>
                        <input style={inp} placeholder="Full Name" value={profileData.name} onChange={e => setProfileData({...profileData, name:e.target.value})} />
                     </div>
                     <div>
                        <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:12, opacity:0.8 }}>EMAIL ADDRESS</label>
                        <input style={inp} placeholder="Email" value={profileData.email} onChange={e => setProfileData({...profileData, email:e.target.value})} />
                     </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap: isSmallMobile ? 20 : 30, marginBottom:30 }}>
                     <div>
                        <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:12, opacity:0.8 }}>PROFESSION</label>
                        <select style={inp} value={profileData.profession} onChange={e => setProfileData({...profileData, profession:e.target.value})}>
                           {['Farmer', 'Agronomist', 'Agricultural Researcher', 'Farm Manager', 'Soil Scientist', 'Crop Insurance Agent', 'Student'].map(p => (
                             <option key={p} value={p}>{p}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:12, opacity:0.8 }}>LOCATION</label>
                        <input style={inp} placeholder="City, State, Country" value={profileData.location} onChange={e => setProfileData({...profileData, location:e.target.value})} />
                     </div>
                  </div>

                  <div style={{ marginBottom:30 }}>
                     <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:12, opacity:0.8 }}>BIO</label>
                     <textarea style={{ ...inp, height:120, resize:'none', padding:'18px' }} placeholder="Tell us about yourself or your farm machinery..." value={profileData.bio} onChange={e => setProfileData({...profileData, bio:e.target.value})} />
                  </div>

                  <div style={{ marginBottom:40 }}>
                     <label style={{ display:'block', fontSize:'0.85rem', fontWeight:900, marginBottom:12, opacity:0.8 }}>NEW PASSWORD (LEAVE BLANK TO KEEP CURRENT)</label>
                     <input style={inp} type="password" placeholder="••••••••" value={profileData.password} onChange={e => setProfileData({...profileData, password:e.target.value})} />
                  </div>

                  <button 
                    onClick={updateProfile}
                    style={{ 
                      width:'100%', background:'linear-gradient(135deg, #22c55e, #10b981)', color:'white', 
                      border:'none', padding:22, borderRadius:20, fontWeight:950, fontSize:'1.1rem', cursor:'pointer',
                      boxShadow:'0 15px 35px rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:12
                    }}
                  >
                    💾 SAVE CHANGES
                  </button>

                  <div style={{ marginTop:60, paddingTop:40, borderTop:`1px solid ${borderCol}` }}>
                     <h4 style={{ color:'#f43f5e', margin:'0 0 20px', fontSize:'1rem', fontWeight:900 }}>DANGER ZONE</h4>
                     <button onClick={() => setShowDeleteConfirm(true)} style={{ width:'100%', background:'transparent', border:'2px solid rgba(244,63,94,0.3)', color:'#f43f5e', padding:20, borderRadius:20, fontWeight:900, cursor:'pointer' }}>
                        🗑️ {t.deleteAccount || 'DELETE MY ACCOUNT PERMANENTLY'}
                     </button>
                  </div>
               </div>

            </div>
          </motion.section>
        )}

      </div>

      {/* FLOATING BOT (ALSO ENHANCED WITH MIC) */}
      <div style={{ position:'fixed', bottom:30, right:30, zIndex:2000 }}>
         {!showBot && (
           <motion.button 
             whileHover={{ scale:1.1 }}
             onClick={() => setShowBot(true)} 
             style={{ 
               width: isSmallMobile ? 56 : 80, 
               height: isSmallMobile ? 56 : 80, 
               background:'linear-gradient(135deg, #22c55e, #10b981)', 
               borderRadius:'50%', color:'white', 
               fontSize: isSmallMobile ? '1.8rem' : '2.5rem', 
               border:'none', cursor:'pointer', 
               boxShadow:'0 20px 40px rgba(34,197,94,0.4)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}
           >
             🤖
           </motion.button>
         )}
         {showBot && (
           <motion.div initial={{ scale:0.8, opacity:0, y:50 }} animate={{ scale:1, opacity:1, y:0 }} style={{ width: isSmallMobile ? window.innerWidth - 40 : 380, height: isSmallMobile ? 500 : 600, background:bgCard, borderRadius:32, border:`1px solid ${borderCol}`, boxShadow:'0 30px 80px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
             <div style={{ padding:25, background:'linear-gradient(135deg, #16a34a, #10b981)', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
               <div style={{ fontWeight:900 }}>{t.kisanBot}</div>
               <button onClick={() => setShowBot(false)} style={{background:'transparent', border:'none', color:'white', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
             </div>
             <div style={{ flex:1, padding:20, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
                {chatHistory.map((m, i) => ( 
                   <div key={i} style={{ alignSelf: m.role==='user'?'flex-end':'flex-start', background: m.role==='user'?'#22c55e':(isDark?'rgba(255,255,255,0.05)':'#f1f5f9'), color: m.role==='user'?'white':txtMain, padding:'12px 18px', borderRadius:20, fontSize:'0.9rem', maxWidth:'85%' }}>
                      {m.role === 'bot' ? ((m.key === 'dynamic' || m.key === 'typing') ? m.content : (t.botAnswers[m.key] || t.botAnswers.default)) : m.content}
                   </div> 
                ))}
             </div>
             <div style={{ padding:20, borderTop:`1px solid ${borderCol}`, background:isDark?'rgba(0,0,0,0.1)':'#fafafa' }}>
               <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <input style={{...inp, marginBottom:0, borderRadius:15, padding:'10px 15px'}} value={botMessage} onChange={e => setBotMessage(e.target.value)} onKeyPress={e => e.key==='Enter'&&sendBotMessage()} placeholder={t.botPlaceholder} />
                  <button onClick={startListening} style={{ width:44, height:44, borderRadius:'50%', background: isListening ? '#f43f5e' : 'transparent', color: isListening ? 'white' : '#22c55e', border:`2px solid ${isListening?'#f43f5e':'#22c55e'}`, cursor:'pointer' }}>{isListening ? '🛑' : '🎤'}</button>
                  <button onClick={() => sendBotMessage()} style={{ background:'#22c55e', color:'white', border:'none', borderRadius:12, padding:'0 15px', height:44, fontWeight:900 }}>GO</button>
               </div>
             </div>
           </motion.div>
         )}
      </div>


      {/* View Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <motion.div id="history-report-preview" initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }} style={{ background:bgCard, width:'100%', maxWidth:900, maxHeight:'90vh', borderRadius:32, overflow:'hidden', display:'flex', flexDirection:'column', border:`1px solid ${borderCol}` }}>
               <div style={{ padding:'20px 30px', background:'linear-gradient(135deg, #16a34a, #10b981)', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h3 style={{ margin:0, fontWeight:900 }}>{t.viewReport} - {selectedReport.crop_name}</h3>
                  <button onClick={() => setSelectedReport(null)} style={{ background:'transparent', border:'none', color:'white', fontSize:'2.5rem', cursor:'pointer' }}>×</button>
               </div>
               <div style={{ flex:1, overflowY:'auto', padding:40 }}>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:30, marginBottom:30 }}>
                     <div style={{ background:isDark?'rgba(255,255,255,0.02)':'#f8fafc', padding:20, borderRadius:20, border:`1px solid ${borderCol}` }}>
                        <h4 style={{ margin:'0 0 10px', color:txtSec }}>Diagnostic Analysis</h4>
                        <div style={{ fontSize:'1.5rem', fontWeight:900, color:(selectedReport.severity === 'critical' || selectedReport.severity === 'high') ? '#f43f5e' : '#22c55e' }}>{selectedReport.stress_type?.replace(/___/g,' ')}</div>
                        <div style={{ marginTop:10, fontWeight:800 }}>Severity: {selectedReport.severity?.toUpperCase()}</div>
                        <div style={{ marginTop:5, color:txtSec }}>Confidence: {selectedReport.confidence}%</div>
                     </div>
                     <div style={{ background:isDark?'rgba(255,255,255,0.02)':'#f8fafc', padding:20, borderRadius:20, border:`1px solid ${borderCol}` }}>
                        <h4 style={{ margin:'0 0 10px', color:txtSec }}>Scan Details</h4>
                        <div><strong>Crop:</strong> {selectedReport.crop_name}</div>
                        <div><strong>Detected at:</strong> {selectedReport.detected_at}</div>
                        <div style={{ marginTop:10 }}><strong>Status:</strong> <span style={{ color:'#22c55e', fontWeight:900 }}>Archived Intelligence</span></div>
                     </div>
                  </div>
                  
                  <div style={{ background:isDark?'rgba(34,197,94,0.05)':'#f0fdf4', padding:30, borderRadius:20, border:`1px solid rgba(34,197,94,0.2)`, marginBottom:30 }}>
                     <h4 style={{ margin:'0 0 15px', color:'#166534' }}>💊 Recommended Treatment Protocol</h4>
                     <p style={{ margin:0, lineHeight:1.7, fontSize:'1.1rem' }}>{selectedReport.treatment || "Consult an agronomist for specific site-based treatment of this condition."}</p>
                  </div>

                  {selectedReport.image_path && (
                    <div style={{ textAlign:'center' }}>
                       <h4 style={{ margin:'0 0 15px', color:txtSec }}>Visual Documentation</h4>
                       {/* Note: backend serves static files from /uploads path if configured */}
                       <div style={{ position: 'relative', display: 'inline-block', borderRadius: 20, overflow: 'hidden', border: `2px solid ${borderCol}`, background: '#0f172a', padding: '10px' }}>
                          <img src={`http://localhost:5001/uploads/${selectedReport.image_path.split('\\').pop().split('/').pop()}`} alt="scan" style={{ maxWidth:'100%', maxHeight:400, objectFit:'contain', display: 'block', borderRadius: '12px' }} />
                          
                          {/* Animated Scanning Overlay */}
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(rgba(34,197,94,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.05) 1px, transparent 1px)',
                            backgroundSize: '20px 20px', pointerEvents: 'none'
                          }}></div>
                          <motion.div 
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            style={{
                              position: 'absolute', left: 0, right: 0, height: '3px',
                              background: '#22c55e', boxShadow: '0 0 15px 5px rgba(34,197,94,0.5)',
                              zIndex: 10
                            }}
                          />
                          <div style={{
                            position: 'absolute', top: 10, left: 10,
                            padding: '4px 10px', background: 'rgba(0,0,0,0.6)',
                            color: '#22c55e', fontSize: '0.6rem', fontFamily: 'monospace',
                            borderRadius: 4, fontWeight: 900, letterSpacing: 1
                          }}>
                            INTEL_SCAN_ACTIVE [v4.2]
                          </div>
                       </div>
                    </div>
                  )}
               </div>
               <div style={{ padding:25, borderTop:`1px solid ${borderCol}`, textAlign:'right' }}>
                  <button onClick={() => downloadReport(selectedReport)} style={{ background:'#22c55e', color:'white', border:'none', padding:'12px 24px', borderRadius:12, fontWeight:900, cursor:'pointer' }}>Download PDF Report</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
             <motion.div initial={{ y:50, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:50, opacity:0 }} style={{ background:bgCard, width:'100%', maxWidth:500, padding: isSmallMobile ? 30 : 50, borderRadius:32, textAlign:'center', border:`2px solid #f43f5e` }}>
                <div style={{ fontSize:'4rem', marginBottom:20 }}>⚠️</div>
                <h3 style={{ fontSize:'2rem', fontWeight:900, marginBottom:15 }}>{t.confirmDelete || 'Final Verification'}</h3>
                <p style={{ color:txtSec, marginBottom:30, lineHeight:1.6 }}>{t.confirmDelete2 || "This action is irreversible. All your farm data, history, and profile will be permanently wiped. Type 'DELETE' to confirm."}</p>
                <input style={{...inp, textAlign:'center', borderColor:'#f43f5e', marginBottom:30}} placeholder="Type DELETE here" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
                <div style={{ display:'flex', gap:15 }}>
                   <button onClick={() => setShowDeleteConfirm(false)} style={{ flex:1, padding:18, borderRadius:16, border:`1px solid ${borderCol}`, background:'transparent', color:txtMain, fontWeight:900, cursor:'pointer' }}>{t.cancel}</button>
                   <button onClick={deleteAccount} style={{ flex:1, padding:18, borderRadius:16, border:'none', background:'#f43f5e', color:'white', fontWeight:900, cursor:'pointer' }}>{t.deleteAccount || 'CONFIRM DELETE'}</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

