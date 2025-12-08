// src/pages/ProfilePage.tsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import SideNavigation from '../components/SideNavigation';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

interface ProfileData {
  username: string;
  symptoms: string[];
  topicsOfInterest: string[];
  designPreferences: {
    colorAndContrast?: {
      user_preferences: string[];
      guideline_considerations: string[];
      balanced_recommendations: string[];
      confidence_level: 'high' | 'medium' | 'low';
    };
    familiarityAndIdentity?: {
      user_preferences: string[];
      guideline_considerations: string[];
      balanced_recommendations: string[];
      confidence_level: 'high' | 'medium' | 'low';
    };
    overallSummary?: string;
  } | null;
}

function ProfilePage({ onNavigate, currentPage }: ProfilePageProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'struggles' | 'topics'>('struggles');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userAuth = localStorage.getItem('userAuth');
        if (!userAuth) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const { token } = JSON.parse(userAuth);
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-lightpurple-to-lightblue flex items-center justify-center">
        <div className="text-dark-grey text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-lightpurple-to-lightblue flex items-center justify-center">
        <div className="text-red text-xl">{error || 'Failed to load profile'}</div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        key="profile-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen bg-gradient-lightpurple-to-lightblue flex flex-col"
      >
        {/* Sticky Menu Button */}
        <div className="sticky top-0 z-30 w-full bg-light-purple pt-4 sm:pt-6 pb-4 px-4 sm:px-6" style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}>
          <div className="w-full max-w-6xl mx-auto">
            <button
              onClick={toggleSideNav}
              className="text-dark-grey text-button-text flex items-center gap-1 sm:gap-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-sm sm:text-base">Menu</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 px-4 md:px-6 py-4">
          {/* User Info Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
          >
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                {profileData.username.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-3xl font-bold text-dark-grey">
                {profileData.username}
              </h1>
            </div>
          </motion.div>

          {/* Toggleable Carousel - Symptoms and Topics */}
          {(profileData.symptoms.length > 0 || profileData.topicsOfInterest.length > 0) && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
            >
              {/* Toggle Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActiveTab('struggles')}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                    activeTab === 'struggles'
                      ? 'bg-red/20 text-dark-grey border-2 border-red/40'
                      : 'bg-gray-100 text-dark-grey/60 border-2 border-transparent'
                  }`}
                >
                  What I Struggle With
                </button>
                <button
                  onClick={() => setActiveTab('topics')}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                    activeTab === 'topics'
                      ? 'bg-purple/20 text-dark-grey border-2 border-purple/40'
                      : 'bg-gray-100 text-dark-grey/60 border-2 border-transparent'
                  }`}
                >
                  Things I Like to Talk About
                </button>
              </div>

              {/* Content Area */}
              <div className="min-h-[200px]">
                {activeTab === 'struggles' && profileData.symptoms.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-3"
                  >
                    {profileData.symptoms.map((symptom, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-red/5 rounded-xl border border-red/20"
                      >
                        <div className="w-3 h-3 bg-red rounded-full flex-shrink-0"></div>
                        <span className="text-dark-grey text-lg">{symptom}</span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'topics' && profileData.topicsOfInterest.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-wrap gap-3"
                  >
                    {profileData.topicsOfInterest.map((topic, index) => (
                      <span
                        key={index}
                        className="px-5 py-3 bg-gradient-to-r from-light-purple to-light-blue text-dark-purple rounded-full text-lg font-medium border border-purple/20"
                      >
                        {topic}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Design Preferences Card */}
          {profileData.designPreferences && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/30"
            >
              <h2 className="text-2xl font-bold text-dark-grey mb-6">
                My Design Preferences
              </h2>

              {/* Simplified Color Preferences */}
              {profileData.designPreferences.colorAndContrast?.user_preferences &&
               profileData.designPreferences.colorAndContrast.user_preferences.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-dark-grey mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    Colors I Prefer
                  </h3>
                  <div className="space-y-3">
                    {profileData.designPreferences.colorAndContrast.user_preferences.map((pref, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-purple/5 rounded-xl">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-dark-grey text-lg">{pref}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simplified Familiarity Preferences */}
              {profileData.designPreferences.familiarityAndIdentity?.user_preferences &&
               profileData.designPreferences.familiarityAndIdentity.user_preferences.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-dark-grey mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏠</span>
                    Spaces That Feel Like Home
                  </h3>
                  <div className="space-y-3">
                    {profileData.designPreferences.familiarityAndIdentity.user_preferences.map((pref, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-blue/5 rounded-xl">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-dark-grey text-lg">{pref}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
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
