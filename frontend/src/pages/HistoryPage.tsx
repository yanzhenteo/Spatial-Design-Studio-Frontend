// src/pages/HistoryPage.tsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import SideNavigation from '../components/SideNavigation';
import HeaderCard from '../components/HeaderCard';
import HistoryCard from '../components/HistoryCard';
import { fetchFixMyHomeHistory, deleteFixMyHomeHistoryEntry } from '../services/fixMyHomeHistoryService';
import type { FixMyHomeHistoryEntry } from '../services/fixMyHomeHistoryService';
import ConfirmModal from '../components/ConfirmModal';

interface HistoryPageProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

function HistoryPage({ onNavigate, currentPage }: HistoryPageProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<FixMyHomeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch history from backend on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[HistoryPage] Fetching history from backend...');
        const result = await fetchFixMyHomeHistory(50, 0, 'desc');

        if ('success' in result && result.success) {
          console.log(`[HistoryPage] Loaded ${result.entries.length} history entries`);
          setHistoryEntries(result.entries);
        } else {
          console.error('[HistoryPage] Failed to fetch history:', result.error);
          setError(result.error || 'Failed to load history');
        }
      } catch (err) {
        console.error('[HistoryPage] Error loading history:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

  const handleViewLog = (historyId: string) => {
    console.log('Viewing history entry:', historyId);
    // Navigate to Fix My Home page with the history ID
    onNavigate(`fixmyhome-history-${historyId}`);
  };

  const handleDeleteEntry = (historyId: string) => {
    setDeleteTargetId(historyId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    console.log('[HistoryPage] Deleting entry:', deleteTargetId);

    try {
      const result = await deleteFixMyHomeHistoryEntry(deleteTargetId);

      if (result.success) {
        console.log('[HistoryPage] Entry deleted successfully');
        // Remove the entry from the local state
        setHistoryEntries(prev => prev.filter(entry => entry._id !== deleteTargetId));
        setShowDeleteModal(false);
        setDeleteTargetId(null);
      } else {
        console.error('[HistoryPage] Failed to delete entry:', result.error);
        setShowDeleteModal(false);
        setDeleteTargetId(null);
      }
    } catch (error) {
      console.error('[HistoryPage] Error deleting entry:', error);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Entry"
        message="Are you sure you want to delete this history entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <motion.div
        key="history-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen bg-gradient-green-to-blue flex flex-col items-center"
      >
        {/* Sticky Menu Button */}
        <div className="sticky top-0 z-30 w-full bg-green pt-4 sm:pt-6 pb-4 px-4 sm:px-6" style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}>
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
        <div className="w-full max-w-md sm:max-w-lg px-6 sm:px-6 py-4 mx-auto">
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
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-8"
              >
                <p className="text-big-text text-dark-grey">
                  Loading history...
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-8"
              >
                <p className="text-big-text text-dark-grey mb-2">
                  Error loading history
                </p>
                <p className="text-fill-text text-muted-purple">
                  {error}
                </p>
              </motion.div>
            ) : historyEntries.length > 0 ? (
              historyEntries.map((entry, index) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <HistoryCard
                    date={new Date(entry.createdAt)}
                    onClick={() => handleViewLog(entry._id)}
                    onDelete={() => handleDeleteEntry(entry._id)}
                    previewImage={entry.transformedImage}
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
                  Your past generations will appear here once you start using Fix My Home.
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