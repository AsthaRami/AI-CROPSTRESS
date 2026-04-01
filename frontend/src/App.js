import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgronomistDashboard from './pages/AgronomistDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  
  // Theme and Language states
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'black');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
      setShowLanding(false);
    }
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    setShowLanding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowLanding(true);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'black' ? 'white' : 'black';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  if (user) {
    if (user.role === 'agronomist') {
      return (
        <AgronomistDashboard 
          user={user} 
          onLogout={handleLogout} 
          onUpdateProfile={setUser}
          theme={theme} 
          toggleTheme={toggleTheme}
          lang={lang}
          changeLang={changeLang}
        />
      );
    }
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout} 
        onUpdateProfile={setUser}
        theme={theme} 
        toggleTheme={toggleTheme}
        lang={lang}
        changeLang={changeLang}
      />
    );
  }

  if (showLanding) {
    return (
      <Landing
        onLoginClick={() => { setAuthMode('login'); setShowLanding(false); }}
        onSignupClick={() => { setAuthMode('signup'); setShowLanding(false); }}
        theme={theme} 
        toggleTheme={toggleTheme}
        lang={lang}
        changeLang={changeLang}
      />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      mode={authMode}
      onBackToLanding={() => setShowLanding(true)}
      theme={theme} 
      toggleTheme={toggleTheme}
      lang={lang}
      changeLang={changeLang}
    />
  );
}

export default App;



