// src/pages/HomePage.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import Button from '../components/Button';
import SideNavigation from '../components/SideNavigation';

interface HomePageProps {
  onStart: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

function HomePage({ onStart, onNavigate, currentPage }: HomePageProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  const handleStart = () => {
    console.log('Home: Start button clicked');
    onStart();
  };

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

  return (
    <>
      <motion.div
        key="home-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen bg-gradient-pink-to-purple flex flex-col items-center justify-center p-6"
      >
        {/* Menu Button */}
        <div className="w-full max-w-md absolute top-30 left-6">
          <button
            onClick={toggleSideNav}
            className="text-muted-purple text-button-text flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Menu
          </button>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-md space-y-6">
          {/* Header Card */}
          <HeaderCard>
            <h1 className="text-header text-dark-grey">Fix My Home</h1>
          </HeaderCard>

          {/* Content Card */}
          <ContentCard>
            <h2 className="text-header text-dark-grey text-center mb-4">
              How it works:
            </h2>
            <p className="text-big-text text-dark-grey text-center">
              Based on your analysis, we will recommend changes or improvements to be implemented in your home. 
            </p>
            
            <Button variant="danger" onClick={handleStart}>
              Start
            </Button>
          </ContentCard>
        </div>
      </motion.div>

      {/* Side Navigation */}
      <SideNavigation 
        isOpen={isSideNavOpen} 
        onClose={() => setIsSideNavOpen(false)}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
    </>
  );
}

export default HomePage;