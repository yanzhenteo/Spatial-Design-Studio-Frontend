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
        className="min-h-screen flex flex-col bg-gradient-pink-to-purple"
      >
        {/* Sticky Menu Button */}
        <div className="sticky top-0 z-30 w-full bg-pink pt-4 sm:pt-6 pb-4 px-4 sm:px-6" style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}>
          <div className="w-full max-w-md mx-auto">
            <button
              onClick={toggleSideNav}
              className="text-muted-purple text-button-text flex items-center gap-1 sm:gap-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-sm sm:text-base">Menu</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm sm:max-w-md"
          >
            {/* Header Card */}
            <HeaderCard className="mb-4 sm:mb-6">
              <h1 className="text-header text-dark-grey text-center">
                Fix My Home
              </h1>
            </HeaderCard>

            {/* Content Card */}
            <ContentCard>
              <h2 className="text-header text-dark-grey text-center mb-3 sm:mb-4">
                How it works:
              </h2>
              <p className="text-big-text text-dark-grey text-center mb-4 sm:mb-6 px-2 sm:px-0">
                Based on your analysis, we will recommend changes or improvements to be implemented in your home. 
              </p>
              
              <Button variant="danger" onClick={handleStart}>
                Start
              </Button>
            </ContentCard>
          </motion.div>
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