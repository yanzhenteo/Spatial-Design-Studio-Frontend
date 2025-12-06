// src/pages/ProfilePage.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import SideNavigation from '../components/SideNavigation';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

function ProfilePage({ onNavigate, currentPage }: ProfilePageProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  // Mock user data - in a real app, this would come from an API or context
  const userProfile = {
    username: "Sarah Johnson",
    email: "sarah.j@email.com",
    joinDate: "January 2024",
    avatarColor: "bg-gradient-to-r from-purple-400 to-blue-400",
    
    // Symptoms (from questionnaire)
    symptoms: [
      { id: 1, name: "Memory Loss", severity: "Moderate", frequency: "Daily" },
      { id: 2, name: "Confusion", severity: "Mild", frequency: "Weekly" },
      { id: 3, name: "Difficulty Concentrating", severity: "Moderate", frequency: "Daily" },
      { id: 4, name: "Word Finding", severity: "Mild", frequency: "Occasional" },
    ],
    
    // Likes (from conversations)
    likes: [
      "Gardening and plants",
      "Classical music",
      "Morning walks in the park",
      "Baking cookies",
      "Reading mystery novels",
      "Spending time with grandchildren",
    ],
    
    // Dislikes (from conversations)
    dislikes: [
      "Loud noises",
      "Crowded places",
      "Fast-paced TV shows",
      "Spicy food",
      "Being rushed",
    ],
    
    // Activity preferences (selected topics)
    preferredActivities: [
      "Reminiscing about family",
      "Discussing past travels",
      "Music memories",
      "Life stories sharing",
    ],
    
    // Memory bot usage stats
    usageStats: {
      conversations: 24,
      memoryStories: 12,
      favoriteTopics: 3,
      totalHours: 8.5,
    }
  };

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
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 px-4 md:px-6 py-4">
          {/* Left Column - User Info Card */}
          <div className="lg:w-1/3">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/30"
            >
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center mb-6">
                <div className={`w-24 h-24 rounded-full ${userProfile.avatarColor} flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg`}>
                  {userProfile.username.charAt(0)}
                </div>
                <h1 className="text-2xl font-bold text-dark-grey mb-1">
                  {userProfile.username}
                </h1>
                <p className="text-muted-purple mb-3">{userProfile.email}</p>
                <div className="text-sm text-dark-grey/70 bg-light-purple/50 px-3 py-1 rounded-full border border-light-purple/30">
                  Member since {userProfile.joinDate}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="border-t border-gray-200/50 pt-6">
                <h3 className="text-lg font-semibold text-dark-grey mb-4">
                  Memory Bot Usage
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-light-purple/40 rounded-xl border border-light-purple/50">
                    <div className="text-2xl font-bold text-dark-purple">
                      {userProfile.usageStats.conversations}
                    </div>
                    <div className="text-sm text-dark-grey">Conversations</div>
                  </div>
                  <div className="text-center p-3 bg-light-blue/40 rounded-xl border border-light-blue/50">
                    <div className="text-2xl font-bold text-blue-600">
                      {userProfile.usageStats.memoryStories}
                    </div>
                    <div className="text-sm text-dark-grey">Memory Stories</div>
                  </div>
                  <div className="text-center p-3 bg-pink/30 rounded-xl border border-pink/40">
                    <div className="text-2xl font-bold text-pink-600">
                      {userProfile.usageStats.favoriteTopics}
                    </div>
                    <div className="text-sm text-dark-grey">Favorite Topics</div>
                  </div>
                  <div className="text-center p-3 bg-green/30 rounded-xl border border-green/40">
                    <div className="text-2xl font-bold text-green-600">
                      {userProfile.usageStats.totalHours}h
                    </div>
                    <div className="text-sm text-dark-grey">Total Time</div>
                  </div>
                </div>
              </div>

              {/* Preferred Activities */}
              <div className="border-t border-gray-200/50 pt-6">
                <h3 className="text-lg font-semibold text-dark-grey mb-3">
                  Preferred Activities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.preferredActivities.map((activity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-light-purple to-light-blue text-dark-purple rounded-full text-sm font-medium border border-purple/20"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Symptoms, Likes, Dislikes */}
          <div className="lg:w-2/3 space-y-6">
            {/* Symptoms Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark-grey">
                  Symptoms & Challenges
                </h2>
                <span className="px-3 py-1 bg-red/20 text-red rounded-full text-sm font-medium border border-red/30">
                  {userProfile.symptoms.length} symptoms
                </span>
              </div>
              
              <div className="space-y-4">
                {userProfile.symptoms.map((symptom) => (
                  <div
                    key={symptom.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-red/10 to-orange/10 rounded-xl border border-red/20 hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <h4 className="font-medium text-dark-grey">{symptom.name}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-dark-grey">
                          <span className="font-medium">Severity:</span> {symptom.severity}
                        </span>
                        <span className="text-sm text-dark-grey">
                          <span className="font-medium">Frequency:</span> {symptom.frequency}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {symptom.severity === "Moderate" && (
                        <div className="flex space-x-1">
                          <div className="w-2 h-6 bg-dark-yellow rounded-full"></div>
                          <div className="w-2 h-6 bg-dark-yellow rounded-full"></div>
                          <div className="w-2 h-4 bg-gray-300 rounded-full"></div>
                        </div>
                      )}
                      {symptom.severity === "Mild" && (
                        <div className="flex space-x-1">
                          <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-4 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-4 bg-gray-300 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200/50">
                <p className="text-sm text-dark-grey/70">
                  These symptoms were identified through your initial assessment and ongoing conversations with Memory Bot.
                </p>
              </div>
            </motion.div>

            {/* Likes & Dislikes Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/30"
            >
              <h2 className="text-xl font-bold text-dark-grey mb-6">
                Personal Preferences
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Likes */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green/30 rounded-lg flex items-center justify-center border border-green/40">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-dark-grey">
                      Likes & Interests
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {userProfile.likes.map((like, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-dark-grey">{like}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dislikes */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-red/30 rounded-lg flex items-center justify-center border border-red/40">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-dark-grey">
                      Dislikes & Sensitivities
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {userProfile.dislikes.map((dislike, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-dark-grey">{dislike}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200/50">
                <p className="text-sm text-dark-grey/70">
                  These preferences are gathered from your conversations to help personalize your Memory Bot experience.
                </p>
              </div>
            </motion.div>
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

export default ProfilePage;