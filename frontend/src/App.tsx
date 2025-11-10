// src/App.tsx - Update the state and add HistoryPage
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import PreMemoryBot from './pages/PreMemoryBot';
import ChatPage from './pages/ChatPage';
import PostMemoryBot from './pages/PostMemoryBot';
import HomePage from './pages/HomePage';
import FixMyHome from './pages/FixMyHome';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';

type AppState = 'login' | 'welcome' | 'prememorybot' | 'chat' | 'postmemorybot' | 'home' | 'fixmyhome' | 'profile' | 'history';

function App() {
  const [currentPage, setCurrentPage] = useState<AppState>('login');
  const [backgroundClass, setBackgroundClass] = useState('bg-gradient-pink-to-purple');

  // Central navigation handler
  const handleNavigate = (page: string) => {
    console.log('App: Navigating to:', page);
    setCurrentPage(page as AppState);
  };

  // Individual page handlers
  const handleLoginSuccess = () => handleNavigate('welcome');
  const handleWelcomeReady = () => handleNavigate('prememorybot');
  const handleGoBackFromPreMemory = () => handleNavigate('welcome');
  const handleContinueFromPreMemory = () => handleNavigate('chat');
  const handleGoBackFromChat = () => handleNavigate('home');
  const handleNextFromChat = () => handleNavigate('postmemorybot');
  const handleGoBackFromPostMemory = () => handleNavigate('chat');
  const handleFinishFromPostMemory = () => handleNavigate('home');
  const handleStartFromHome = () => handleNavigate('fixmyhome');
  const handleBackFromFixMyHome = () => handleNavigate('home');
  const handleBackFromProfile = () => handleNavigate('home');

  // Update background based on current page
  useEffect(() => {
    let newBackground = 'bg-gradient-pink-to-purple';
    
    switch (currentPage) {
      case 'login': newBackground = 'bg-gradient-pink-to-purple'; break;
      case 'welcome': newBackground = 'bg-gradient-pink-to-purple'; break;
      case 'prememorybot': newBackground = 'bg-gradient-purple-to-blue'; break;
      case 'chat': newBackground = 'bg-gradient-lightpurple-to-lightblue'; break;
      case 'postmemorybot': newBackground = 'bg-gradient-purple-to-blue'; break;
      case 'home': newBackground = 'bg-gradient-pink-to-purple'; break;
      case 'fixmyhome': newBackground = 'bg-gradient-yellow-to-pink'; break;
      case 'profile': newBackground = 'bg-light-blue'; break;
      case 'history': newBackground = 'bg-gradient-green-to-blue'; break;
      default: newBackground = 'bg-gradient-pink-to-purple';
    }
    
    setBackgroundClass(newBackground);
  }, [currentPage]);

  return (
    <div className={`min-h-screen transition-all duration-1500 ease-in-out ${backgroundClass}`}>
      <AnimatePresence mode="wait">
        {currentPage === 'login' && (
          <LoginPage key="login" onLoginSuccess={handleLoginSuccess} />
        )}
        
        {currentPage === 'welcome' && (
          <WelcomePage key="welcome" onGetStarted={handleWelcomeReady} />
        )}
        
        {currentPage === 'prememorybot' && (
          <PreMemoryBot 
            key="prememorybot" 
            onBack={handleGoBackFromPreMemory}
            onContinue={handleContinueFromPreMemory}
          />
        )}
        
        {currentPage === 'chat' && (
          <ChatPage 
            key="chat" 
            onBack={handleGoBackFromChat}
            onNext={handleNextFromChat}
          />
        )}
        
        {currentPage === 'postmemorybot' && (
          <PostMemoryBot 
            key="postmemorybot" 
            onBack={handleGoBackFromPostMemory}
            onContinue={handleFinishFromPostMemory}
          />
        )}
        
        {currentPage === 'home' && (
          <HomePage 
            key="home" 
            onStart={handleStartFromHome}
            onNavigate={handleNavigate}
            currentPage={currentPage}
          />
        )}
        
        {currentPage === 'fixmyhome' && (
          <FixMyHome 
            key="fixmyhome" 
            onBack={handleBackFromFixMyHome}
          />
        )}
        
        {currentPage === 'profile' && (
          <ProfilePage 
            key="profile" 
            onBack={handleBackFromProfile}
            onNavigate={handleNavigate}
            currentPage={currentPage}
          />
        )}
        
        {currentPage === 'history' && (
          <HistoryPage 
            key="history" 
            onNavigate={handleNavigate}
            currentPage={currentPage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;