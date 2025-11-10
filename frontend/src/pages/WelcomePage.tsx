// src/pages/WelcomePage.tsx
import { motion } from 'framer-motion';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import Button from '../components/Button';

interface WelcomePageProps {
  onGetStarted: () => void;
}

function WelcomePage({ onGetStarted }: WelcomePageProps) {
  const handleGetStarted = () => {
    console.log('Welcome: Get Started button clicked!');
    onGetStarted();
  };

  return (
    <motion.div
      key="welcome-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-pink-to-purple flex flex-col items-center justify-center p-6 space-y-6"
    >
      {/* Header Card */}
      <HeaderCard>
        <h1 className="text-header text-dark-grey">Hello there!</h1>
      </HeaderCard>

      {/* Content Card */}
      <ContentCard>
        <p className="text-big-text text-dark-grey text-center">
          I will be here to assist you in making your space more dementia-friendly and memory-supportive via customized space solutions.
        </p>
        
        <Button onClick={handleGetStarted}>
          I'm ready!
        </Button>
      </ContentCard>
    </motion.div>
  );
}

export default WelcomePage;