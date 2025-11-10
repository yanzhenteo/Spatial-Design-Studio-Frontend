// src/pages/PreMemoryBot.tsx
import { motion } from 'framer-motion';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import DoubleButton from '../components/DoubleButton';

interface PreMemoryBotProps {
  onBack: () => void;
  onContinue: () => void;
}

function PreMemoryBot({ onBack, onContinue }: PreMemoryBotProps) {
  const handleLeftButton = () => {
    console.log('PreMemoryBot: Not yet clicked - going back to welcome');
    onBack();
  };

  const handleRightButton = () => {
    console.log('PreMemoryBot: Let\'s go clicked - proceeding to next page');
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-purple-to-blue flex flex-col items-center justify-center p-6 space-y-6"
    >
      {/* Header Card */}
      <HeaderCard>
        <h1 className="text-header text-dark-grey">Let's get started!</h1>
      </HeaderCard>

      {/* Content Card */}
      <ContentCard>
        <p className="text-big-text text-dark-grey text-center">
          Let me introduce you to Mei Ling, your best companion and listener. She will be here to listen to your problems and keep you company!
        </p>
        
        <DoubleButton
          variant="primary"
          leftButton={{
            onClick: handleLeftButton,
            children: "Not yet"
          }}
          rightButton={{
            onClick: handleRightButton,
            children: "Let's go!"
          }}
        />
      </ContentCard>
    </motion.div>
  );
}

export default PreMemoryBot;