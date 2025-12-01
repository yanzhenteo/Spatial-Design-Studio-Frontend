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
    console.log('PreMemoryBot: Not yet clicked - going back to home');
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
      className="min-h-screen bg-gradient-purple-to-blue flex flex-col items-center justify-center p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      {/* Header Card */}
      <HeaderCard>
        <h1 className="text-header text-dark-grey">Let's get started!</h1>
      </HeaderCard>

      {/* Content Card */}
      <ContentCard>
        <p className="text-big-text text-dark-grey text-center px-2 sm:px-0 mb-4 sm:mb-6">
          Let me introduce you to Mei Ling, your best companion and listener. She will be here to listen to your problems and keep you company!
        </p>
        <p className="text-big-text text-dark-grey text-center px-2 sm:px-0 mb-4 sm:mb-6">
          She will ask you questions to know you better, so do not hesitate to <u><strong>talk more about yourself</strong></u>!
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
      
      {/* Volume Reminder Card */}
      <ContentCard>
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {/* Volume Icon */}
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-dark-grey" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>

          <div className="text-center">
            <h3 className="text-header text-dark-grey mb-2 sm:mb-3">
              Turn Up Your Volume
            </h3>
            <p className="text-big-text text-dark-grey px-2 sm:px-0">
              Please ensure your device's volume is turned up for the best experience in the next section.
            </p>
          </div>
        </div>
      </ContentCard>
    </motion.div>
  );
}

export default PreMemoryBot;