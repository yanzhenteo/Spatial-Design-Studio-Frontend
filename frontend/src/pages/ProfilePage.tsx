// src/pages/ProfilePage.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import SideNavigation from '../components/SideNavigation';

interface ProfilePageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

function ProfilePage({onNavigate, currentPage }: ProfilePageProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

  return (
    <>
      <motion.div
        key="profile-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen bg-light-blue flex flex-col items-center justify-center p-6"
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

        {/* Main Content - Empty for now */}
        <div className="w-full max-w-md">
          <h1 className="text-header text-dark-grey text-center mb-4">
            Profile Page
          </h1>
          <p className="text-big-text text-dark-grey text-center">
            Profile content will be added here later.
          </p>
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

export default ProfilePage;