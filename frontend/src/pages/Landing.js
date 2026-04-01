import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { translations } from '../translations';

export default function Landing({ onLoginClick, onSignupClick, theme, toggleTheme, lang, changeLang }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  const t = translations[lang] || translations.en;
  const isDark = theme === 'black';

  const [activeModal, setActiveModal] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'Diagnostic Inquiry', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isMobile = windowWidth < 1024;
  const isSmallMobile = windowWidth < 640;

  const bgMain = isDark ? 'radial-gradient(circle at top left, #0f172a 0, #020617 45%, #000000 100%)' : '#f8fafc';
  const bgCard = isDark ? 'rgba(15,23,42,0.95)' : '#ffffff';
  const txtMain = isDark ? '#f1f5f9' : '#1e293b';
  const txtSec = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(34,197,94,0.3)' : '#e2e8f0';

  const modalContent = {
    'Scanner': { 
      title: 'Precision Crop Scanner', 
      text: 'Our AI-powered scanner uses proprietary neural networks to detect 38+ types of crop stresses including fungal infections, viral diseases, and nutrient deficiencies. Simply snap a photo of a leaf to get an instant diagnosis and treatment plan.', 
      icon: '📸',
      features: ['98% Accuracy', 'Offline Analysis', 'Multi-crop Support']
    },
    'Dashboard': { 
      title: 'Smart Farm Dashboard', 
      text: 'Gain a bird\'s eye view of your entire agricultural operation. Track historical health trends, receive predictive alerts for potential outbreaks, and manage multiple field locations from a single unified interface.', 
      icon: '📊',
      features: ['Predictive Analytics', 'Multi-farm View', 'Exportable Reports']
    },
    'AI Kisan Bot': { 
      title: 'AI Kisan Assistant', 
      text: 'Meet your 24/7 agricultural expert. Our Kisan Bot understands regional dialects including Hindi and Gujarati. Ask about pesticide ratios, market prices (Mandis), or seasonal planting advice.', 
      icon: '🤖',
      features: ['Voice Commands', 'Regional Languages', 'Expert Advice']
    },
    'Mission': { 
      title: 'Our Agricultural Mission', 
      text: 'We are committed to securing the global food supply by empowering small-scale farmers with enterprise-grade technology. Our goal is to reduce crop loss by 40% through early detection systems.', 
      icon: '🌿',
      features: ['Zero Food Waste', 'Sustainable Farming', 'Farmer Empowerment']
    },
    'Documentation': { 
      title: 'Technical Guide', 
      text: 'Detailed documentation for developers and advanced users. Learn how our CNN architecture works, how to sync IoT sensors with the dashboard, and integration APIs.', 
      icon: '📄'
    },
    'Contact Us': { 
      title: 'Get in Touch', 
      text: 'Need field support? Our team of agronomists and technical engineers is available to help. Email: ramiaastha02@gmail.com | Phone: +91 7863000132', 
      icon: '📞'
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: bgMain,
      color: txtMain,
      fontFamily: '"Outfit", "Inter", sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Dynamic Modal Overlay */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
              zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isSmallMobile ? 15 : 40
            }}
            onClick={() => { setActiveModal(null); setSubmitted(false); }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              style={{
                background: bgCard, width: '100%', maxWidth: activeModal === 'Contact Us' ? 950 : 700,
                maxHeight: isSmallMobile ? '90vh' : 'auto', overflowY: isSmallMobile ? 'auto' : 'visible',
                padding: isSmallMobile ? '30px 20px' : '60px',
                borderRadius: 32, position: 'relative', textAlign: 'center',
                boxShadow: '0 30px 100px rgba(0,0,0,0.5)', border: `1px solid ${borderCol}`
              }}
              onClick={e => e.stopPropagation()}
            >
              {activeModal === 'Contact Us' ? (
                <div style={{ textAlign: 'left', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 }}>
                    <h2 style={{ fontSize: isSmallMobile ? '1.8rem' : '2.5rem', fontWeight: 950, margin: 0 }}>Send an Inquiry</h2>
                    <div onClick={() => setActiveModal(null)} style={{ cursor: 'pointer', fontSize: '1.5rem', opacity: 0.5, fontWeight: 300 }}>✕</div>
                  </div>

                  {submitted ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                       <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '5rem', marginBottom: 20 }}>🌿</motion.div>
                       <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 15 }}>Message Received!</h3>
                       <p style={{ color: txtSec, fontSize: '1.1rem', maxWidth: 450, margin: '0 auto' }}>Thank you for reaching out. Our agricultural team will contact you regarding your crop stress concerns shortly.</p>
                       <button onClick={() => setSubmitted(false)} style={{ marginTop: 40, background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#fff', border: 'none', padding: '16px 40px', borderRadius: 16, cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}>Send Another</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 40 }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                         <div style={{ padding: 28, borderRadius: 24, background: isDark ? 'rgba(34,197,94,0.05)' : '#f8fafc', border: `1px solid ${borderCol}` }}>
                            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📧</div>
                            <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900 }}>Email Our Team</h4>
                            <p style={{ margin: 0, color: txtSec, fontSize: '0.95rem', fontWeight: 500 }}>ramiaastha02@gmail.com</p>
                         </div>
                         <div style={{ padding: 28, borderRadius: 24, background: isDark ? 'rgba(59,130,246,0.05)' : '#f8fafc', border: `1px solid ${borderCol}` }}>
                            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📞</div>
                            <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900 }}>Call Assistant</h4>
                            <p style={{ margin: 0, color: txtSec, fontSize: '0.95rem', fontWeight: 500 }}>+91 7863000132</p>
                         </div>
                         <div style={{ padding: 28, borderRadius: 24, background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', marginTop: 'auto' }}>
                            <h4 style={{ margin: '0 0 12px', color: '#22c55e', fontWeight: 900 }}>Project Support</h4>
                            <p style={{ margin: 0, color: txtSec, fontSize: '0.9rem', lineHeight: 1.6 }}>Our expert agronomists provide specialized diagnostics support for large-scale farms using our project data.</p>
                         </div>
                      </div>

                       <div style={{ flex: 1.5, background: isDark ? 'rgba(255,255,255,0.02)' : '#fff', padding: isSmallMobile ? 20 : 35, borderRadius: 28, border: `1px solid ${borderCol}`, boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                         <div style={{ display: 'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <div style={{ flex: 1 }}>
                               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, marginBottom: 10, opacity: 0.8, letterSpacing: '0.5px' }}>NAME</label>
                               <input 
                                  type="text" 
                                  placeholder="Farmer / Agency Name" 
                                  value={contactForm.name}
                                  required
                                  style={{ width: '100%', background: isDark ? '#020617' : '#f8fafc', border: `1px solid ${borderCol}`, padding: '14px 18px', borderRadius: 14, color: txtMain, boxSizing: 'border-box', outline: 'none' }} 
                                  onChange={e => setContactForm({...contactForm, name: e.target.value})} 
                               />
                            </div>
                            <div style={{ flex: 1 }}>
                               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, marginBottom: 10, opacity: 0.8, letterSpacing: '0.5px' }}>EMAIL</label>
                               <input 
                                  type="email" 
                                  name="email"
                                  placeholder="contact@farm.com" 
                                  value={contactForm.email}
                                  required
                                  style={{ width: '100%', background: isDark ? '#020617' : '#f8fafc', border: `1px solid ${borderCol}`, padding: '14px 18px', borderRadius: 14, color: txtMain, boxSizing: 'border-box', outline: 'none' }} 
                                  onChange={e => setContactForm({...contactForm, email: e.target.value})} 
                               />
                            </div>
                         </div>
                         <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, marginBottom: 10, opacity: 0.8, letterSpacing: '0.5px' }}>PROJECT INQUIRY SUBJECT</label>
                            <select 
                               name="subject"
                               value={contactForm.subject}
                               style={{ width: '100%', background: isDark ? '#020617' : '#f8fafc', border: `1px solid ${borderCol}`, padding: '14px 18px', borderRadius: 14, color: txtMain, cursor: 'pointer', outline: 'none' }} 
                               onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                            >
                               <option>Diagnostic Accuracy Inquiry</option>
                               <option>Farm Enterprise Solutions</option>
                               <option>AI Kisan Bot Integration</option>
                               <option>Technical Support</option>
                               <option>Partnership & Research</option>
                            </select>
                         </div>
                         <div style={{ marginBottom: 30 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, marginBottom: 10, opacity: 0.8, letterSpacing: '0.5px' }}>MESSAGE</label>
                            <textarea 
                               name="message"
                               rows="4" 
                               value={contactForm.message}
                               required
                               placeholder="How can our project support your agricultural needs?" 
                               style={{ width: '100%', background: isDark ? '#020617' : '#f8fafc', border: `1px solid ${borderCol}`, padding: '14px 18px', borderRadius: 14, color: txtMain, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }} 
                               onChange={e => setContactForm({...contactForm, message: e.target.value})}
                            ></textarea>
                         </div>
                         <button 
                            disabled={isSubmitting}
                            onClick={async () => {
                               if (!contactForm.email || !contactForm.message) return;
                               setIsSubmitting(true);
                               try {
                                 const res = await fetch('https://formspree.io/f/xqeypywd', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify(contactForm)
                                 });
                                 if (res.ok) {
                                   setSubmitted(true);
                                   setContactForm({ name:'', email:'', subject:'Diagnostic Accuracy Inquiry', message:'' });
                                 }
                               } catch (err) {
                                 console.error("Formspree error:", err);
                               }
                               setIsSubmitting(false);
                            }}
                            style={{ 
                                width: '100%', background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#fff', 
                                border: 'none', padding: '18px', borderRadius: 16, fontWeight: 950, fontSize: '1.1rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                                boxShadow: '0 15px 35px rgba(34,197,94,0.3)', transition: 'transform 0.2s'
                            }}
                         >
                            {isSubmitting ? 'Sending...' : 'Send Message'} 
                            {!isSubmitting && <span style={{ fontSize: '1.3rem' }}>↗</span>}
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '4.5rem', marginBottom: 20 }}>{modalContent[activeModal]?.icon}</div>
                  <h2 style={{ fontSize: isSmallMobile ? '2rem' : '3rem', fontWeight: 900, marginBottom: 20 }}>{modalContent[activeModal]?.title}</h2>
                  <p style={{ color: txtSec, fontSize: '1.2rem', lineHeight: 1.7, marginBottom: 40, maxWidth: 550, margin: '0 auto 40px' }}>
                    {modalContent[activeModal]?.text}
                  </p>
                  
                  {modalContent[activeModal]?.features && (
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
                      {modalContent[activeModal].features.map(f => (
                        <span key={f} style={{ padding: '8px 16px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '0.85rem', fontWeight: 800 }}>✓ {f}</span>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => setActiveModal(null)}
                    style={{
                      padding: '18px 50px', borderRadius: 20, border: 'none',
                      background: 'linear-gradient(135deg, #22c55e, #10b981)',
                      color: 'white', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                      boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    Got it
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background Polish */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: -1, pointerEvents: 'none',
        background: isDark 
          ? 'radial-gradient(circle at 50% -10%, rgba(34,197,94,0.08) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(59,130,246,0.04) 0%, transparent 50%)'
          : 'radial-gradient(circle at 50% -10%, rgba(34,197,94,0.03) 0%, transparent 60%)',
        opacity: 1
      }} />

      {/* Floating Interactive Sidebar */}
      {!isSmallMobile && (
        <div style={{ position: 'fixed', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { id: 'Scanner', icon: '📸', color: '#22c55e' },
            { id: 'Dashboard', icon: '📊', color: '#3b82f6' },
            { id: 'AI Kisan Bot', icon: '🤖', color: '#eab308' },
            { id: 'Mission', icon: '🌿', color: '#10b981' }
          ].map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 + (i * 0.1) }}
              whileHover={{ x: 8, scale: 1.1 }}
              onClick={() => setActiveModal(item.id)}
              style={{
                width: 60, height: 60, borderRadius: 18, background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(15px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', cursor: 'pointer', border: `1px solid ${borderCol}`,
                boxShadow: isDark ? '0 15px 35px rgba(0,0,0,0.4)' : '0 15px 35px rgba(0,0,0,0.1)', 
                position: 'relative'
              }}
            >
              {item.icon}
              <motion.div 
                style={{ 
                  position: 'absolute', left: 80, background: item.color, color: 'white', 
                  padding: '10px 18px', borderRadius: 12, fontSize: '0.9rem', fontWeight: 800,
                  whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0, scale: 0.8
                }}
                whileHover={{ opacity: 1, scale: 1 }}
              >
                {item.id}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Scroll Progress Bar */}
      <motion.div 
        style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, height: 4, 
          background: 'linear-gradient(90deg, #22c55e, #10b981)', 
          transformOrigin: '0%', zIndex: 3000, scaleX
        }} 
      />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 2500,
        background: scrolled 
          ? (isDark ? 'rgba(2, 6, 23, 0.85)' : 'rgba(255, 255, 255, 0.85)')
          : 'transparent',
        backdropFilter: scrolled ? 'blur(30px)' : 'none',
        borderBottom: scrolled ? `1px solid ${borderCol}` : '1px solid transparent',
        padding: isSmallMobile ? (scrolled ? '12px 20px' : '20px 20px') : (scrolled ? '16px 80px' : '30px 80px'),
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing:'border-box',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: scrolled ? (isDark ? '0 10px 50px rgba(0,0,0,0.3)' : '0 10px 50px rgba(0,0,0,0.05)') : 'none'
      }}>
        <div 
          style={{ fontSize: isSmallMobile ? '1.1rem' : '1.4rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span style={{ color: '#22c55e' }}>AI</span>
          {!isSmallMobile && <span>CROPSTRESS</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 12 : 24 }}>
          <select value={lang} onChange={(e) => changeLang(e.target.value)} style={{
            background: 'transparent', color: txtMain, border: `1px solid ${borderCol}`,
            borderRadius: '10px', padding: '6px 8px', fontSize: '0.85rem', cursor: 'pointer', outline: 'none'
          }}>
            <option value="en" style={{ background: isDark ? '#0f172a' : '#fff', color: isDark ? '#fff' : '#000' }}>EN</option>
            <option value="hi" style={{ background: isDark ? '#0f172a' : '#fff', color: isDark ? '#fff' : '#000' }}>HI</option>
            <option value="gu" style={{ background: isDark ? '#0f172a' : '#fff', color: isDark ? '#fff' : '#000' }}>GU</option>
          </select>

          <button onClick={toggleTheme} style={{
            background: isDark ? '#fff' : '#0f172a', color: isDark ? '#020617' : '#fff',
            border: 'none', borderRadius: '12px', width: '36px', height: '36px', 
            cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isDark ? '☀️' : '🌙'}
          </button>

          <button onClick={onLoginClick} style={{ color: txtMain, background: 'transparent', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: isSmallMobile ? '0.85rem' : '1rem' }}>
            {t.login}
          </button>
          <button 
            onClick={onSignupClick}
            style={{ 
              background: 'linear-gradient(135deg, #22c55e, #10b981)', 
              color: 'white', padding: isSmallMobile ? '8px 16px' : '10px 24px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)', fontSize: isSmallMobile ? '0.85rem' : '1rem'
            }}
          >
            {t.signup}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative', minHeight: '100vh', display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'center', 
        padding: isMobile ? '140px 24px 100px' : '120px 80px 100px 100px',
        overflow: 'hidden', gap: isMobile ? 60 : 80
      }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: '15%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)', zIndex: 0 }} />

        <motion.div 
          initial="hidden" animate="visible" variants={containerVariants}
          style={{ position: 'relative', zIndex: 2, maxWidth: 650, textAlign: isMobile ? 'center' : 'left' }}
        >
          <motion.div variants={itemVariants} style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '2px', marginBottom: 20 }}>
            FUTURE OF AGRICULTURE
          </motion.div>
          <motion.h1 variants={itemVariants} style={{ fontSize: isSmallMobile ? '2.8rem' : (isMobile ? '3.5rem' : '4.6rem'), fontWeight: 950, lineHeight: 1.05, margin: 0, letterSpacing: '-2px' }}>
            {t.heroTitle}
            <span style={{ display: 'block', background: 'linear-gradient(120deg, #22c55e, #10b981)', WebkitBackgroundClip: 'text', color: 'transparent', paddingBottom: 10 }}>
              {t.heroGradient}
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} style={{ fontSize: isSmallMobile ? '1rem' : '1.25rem', color: txtSec, marginTop: 24, lineHeight: 1.7, maxWidth: 550, margin: isMobile ? '24px auto 0' : '24px 0 0' }}>
            {t.heroSubtitle}
          </motion.p>
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: 16, marginTop: 40, justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(34, 197, 94, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onSignupClick}
              style={{ padding: isSmallMobile ? '16px 32px' : '20px 48px', background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white', borderRadius: 20, border: 'none', fontWeight: 950, fontSize: isSmallMobile ? '1rem' : '1.1rem', cursor: 'pointer', boxShadow: '0 20px 45px rgba(34, 197, 94, 0.4)', transition: 'all 0.3s ease' }}
            >
              Start Protection →
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: isSmallMobile ? '16px 32px' : '20px 48px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', color: txtMain, borderRadius: 20, border: `1px solid ${borderCol}`, fontWeight: 800, fontSize: isSmallMobile ? '1rem' : '1.1rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}
            >
              Live Demo ↓
            </motion.button>
         </motion.div>
        </motion.div>
         {/* Hero Image Container */}
         <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 50 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            style={{ flex: 1, display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', position: 'relative', zIndex: 2, width: '100%' }}
         >
            <div style={{ 
               position: 'relative', 
               width: isSmallMobile ? '95%' : '100%', 
               maxWidth: 700, 
               borderRadius: '40px', 
               overflow: 'hidden', 
               boxShadow: isDark ? '0 50px 100px rgba(0,0,0,0.5)' : '0 40px 80px rgba(0,0,0,0.15)',
               border: isDark ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(0,0,0,0.05)',
               background: isDark ? 'rgba(255,255,255,0.02)' : 'white'
            }}>
              <img 
                src={process.env.PUBLIC_URL + "/smart_farming_hero.png"} 
                alt="AI Crop Stress Detection Assistant"
                style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.5s' }} 
              />
              <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: -1 }} />
            </div>
         </motion.div>
      </section>

      {/* Feature Section */}
      <section id="features" style={{ padding: isMobile ? '80px 24px' : '120px 80px', background: isDark ? '#020617' : '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: isSmallMobile ? '2.2rem' : '3.5rem', fontWeight: 950, letterSpacing: '-1px' }}>Precision Ecosystem</h2>
            <p style={{ color: txtSec, fontSize: '1.2rem', maxWidth: 650, margin: '20px auto 0' }}>Advanced diagnostics mapped to a comprehensive farm management suite.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               whileInView={{ scale: 1, opacity: 1 }}
               viewport={{ once: true }}
               style={{
                  borderRadius: 32, overflow: 'hidden', 
                  boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.4)' : '0 30px 60px rgba(0,0,0,0.1)',
                  border: `1px solid ${borderCol}`
               }}
            >
              <img src={process.env.PUBLIC_URL + "/crop_ai_feature.png"} alt="Crop AI Features" style={{ width: '100%', height: 'auto', display: 'block' }} />            
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {[
                { title: "Visual Feature Extraction", desc: "CNN-based identification of pixel-level stress symptoms before they trigger system-wide failure.", icon: "🔬" },
                { title: "Regional Heatmaps", desc: "Visualize stress outbreaks across your local community to coordinate preventive measures.", icon: "🗺️" },
                { title: "Curated Protocols", desc: "Instant biological and eco-friendly treatment advice synced from global agri-research databases.", icon: "🧪" }
              ].map((f, i) => (
                <motion.div key={i} initial={{ x: 30, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }} style={{ display: 'flex', gap: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', fontWeight: 900 }}>{f.title}</h3>
                    <p style={{ margin: 0, color: txtSec, lineHeight: 1.6, fontSize: '1.05rem' }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modern High-End Footer */}
      <footer style={{ padding: isMobile ? '80px 24px' : '100px 80px', background: isDark ? '#000' : '#f8fafc', borderTop: `1px solid ${borderCol}` }}>
         <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 60 }}>
            <div style={{ maxWidth: 400 }}>
               <div style={{ fontSize: '1.8rem', fontWeight: 950, marginBottom: 25, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#22c55e' }}>AI</span>CROPSTRESS
               </div>
               <p style={{ color: txtSec, lineHeight: 1.8, fontSize: '1.1rem', marginBottom: 35 }}>
                 The gold standard in predictive agricultural intelligence. Protecting over 5,000 hectares of farmland with next-gen neural monitoring.
               </p>
               <div style={{ display: 'flex', gap: 15 }}>
                  {['FB', 'TW', 'LI', 'IG'].map(s => (
                    <motion.div 
                      key={s} whileHover={{ y: -5, background: '#22c55e', color: 'white' }}
                      style={{ width: 44, height: 44, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.05)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, cursor: 'pointer', border: `1px solid ${borderCol}` }}
                    >{s}</motion.div>
                  ))}
               </div>
            </div>
            
            <div style={{ display: 'flex', gap: isSmallMobile ? 40 : 100, flexWrap: 'wrap' }}>
               <div>
                  <h5 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 30 }}>Product</h5>
                  <ul style={{ listStyle: 'none', padding: 0, color: txtSec, lineHeight: 2.8, fontSize: '1rem' }}>
                    {['Scanner', 'Dashboard', 'AI Kisan Bot'].map(item => (
                      <li key={item} style={{ cursor: 'pointer' }} onMouseEnter={e => e.target.style.color = '#22c55e'} onMouseLeave={e => e.target.style.color = txtSec} onClick={() => setActiveModal(item)}>{item}</li>
                    ))}
                  </ul>
               </div>
               <div>
                  <h5 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 30 }}>Service</h5>
                  <ul style={{ listStyle: 'none', padding: 0, color: txtSec, lineHeight: 2.8, fontSize: '1rem' }}>
                    {['Mission', 'Documentation', 'Contact Us'].map(item => (
                      <li key={item} style={{ cursor: 'pointer' }} onMouseEnter={e => e.target.style.color = '#22c55e'} onMouseLeave={e => e.target.style.color = txtSec} onClick={() => setActiveModal(item)}>{item}</li>
                    ))}
                  </ul>
               </div>
               <div>
                  <h5 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 30 }}>Status</h5>
                  <div style={{ padding: '10px 20px', borderRadius: 14, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    ALL SYSTEMS OK
                  </div>
               </div>
            </div>
         </div>
         <div style={{ maxWidth: 1200, margin: '80px auto 0', textAlign: 'center', borderTop: `1px solid ${borderCol}`, paddingTop: 40, color: txtSec, fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} AI-Based Early Crop Stress Detection Suite. Engineered for the Future of Agriculture.
         </div>
      </footer>
    </div>
  );
}

