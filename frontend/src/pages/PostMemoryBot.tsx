// src/pages/PostMemoryBot.tsx
import { motion } from 'framer-motion';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import DoubleButton from '../components/DoubleButton';

interface PostMemoryBotProps {
  onBack: () => void;
  onContinue: () => void;
}

function PostMemoryBot({ onBack, onContinue }: PostMemoryBotProps) {
  const handleLeftButton = () => {
    console.log('PostMemoryBot: Back to chat clicked');
    onBack();
  };

  const handleRightButton = () => {
    console.log('PostMemoryBot: Finish clicked');
    onContinue();
  };

  return (
    <motion.div
      key="postmemorybot-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-gradient-purple-to-blue flex flex-col items-center justify-center p-6 space-y-6"
    >
      {/* Header Card */}
      <HeaderCard>
        <h1 className="text-header text-dark-grey">Great job!</h1>
      </HeaderCard>

      {/* Content Card */}
      <ContentCard>
        <p className="text-big-text text-dark-grey text-center">
          Mei Ling now better understands your situation, and she will be helping us create personalized solutions to your problems.
        </p>
        
        <DoubleButton
          variant="primary"
          leftButton={{
            onClick: handleLeftButton,
            children: "Back to chat"
          }}
          rightButton={{
            onClick: handleRightButton,
            children: "Finish"
          }}
        />
      </ContentCard>
    </motion.div>
  );
}

export default PostMemoryBot;