// src/pages/HistoryPage.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import SideNavigation from '../components/SideNavigation';
import HeaderCard from '../components/HeaderCard';
import HistoryCard from '../components/HistoryCard';

interface HistoryPageProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

function HistoryPage({ onNavigate, currentPage }: HistoryPageProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([
    // Mock data - in a real app, this would come from an API or localStorage
    {
      id: 1,
      date: new Date('2024-01-15T10:30:00'),
      onViewLog: () => onNavigate('log-1') // This will navigate to a specific log page
    },
    {
      id: 2,
      date: new Date('2024-01-10T14:45:00'),
      onViewLog: () => onNavigate('log-2')
    },
    {
      id: 3,
      date: new Date('2024-01-05T09:15:00'),
      onViewLog: () => onNavigate('log-3')
    },
    {
      id: 4,
      date: new Date('2024-01-01T16:20:00'),
      onViewLog: () => onNavigate('log-4')
    },
  ]);

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

  const handleViewLog = (logId: string) => {
    console.log('Viewing log:', logId);
    // In your actual implementation, you would navigate to the specific log page
    // For now, we'll use a placeholder navigation
    onNavigate(`log-${logId}`);
  };

  return (
    <>
      <motion.div
        key="history-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen bg-gradient-green-to-blue flex flex-col items-center justify-start p-4 sm:p-6 pt-24" // Added pt-24 for header spacing
      >
        {/* Menu Button */}
        <div className="w-full max-w-md absolute top-6 left-4 sm:left-6 z-20">
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

        {/* Main Content */}
        <div className="w-full max-w-md sm:max-w-lg">
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 sm:mb-8"
          >
            <HeaderCard>
              <h1 className="text-header text-dark-grey text-center">
                History
              </h1>
            </HeaderCard>
          </motion.div>

          {/* History List */}
          <div className="space-y-4 sm:space-y-6">
            {historyEntries.length > 0 ? (
              historyEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <HistoryCard
                    date={entry.date}
                    onClick={() => handleViewLog(entry.id.toString())}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-8"
              >
                <p className="text-big-text text-dark-grey mb-2">
                  No history entries yet
                </p>
                <p className="text-fill-text text-muted-purple">
                  Your past generations will appear here once you start using the app.
                </p>
              </motion.div>
            )}
          </div>
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

export default HistoryPage;