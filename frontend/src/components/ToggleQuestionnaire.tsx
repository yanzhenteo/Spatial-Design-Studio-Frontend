// src/components/ToggleQuestionnaire.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export interface QuestionItem {
  id: string;
  question: string;
  selected: boolean;
}

interface ToggleQuestionnaireProps {
  initialMessage: string;
  questions: QuestionItem[];
  onComplete: (selectedQuestions: QuestionItem[]) => void;
  maxSelections?: number;
}

function ToggleQuestionnaire({
  initialMessage,
  questions: initialQuestions,
  onComplete,
  maxSelections
}: ToggleQuestionnaireProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);

  const handleToggle = (id: string) => {
    setQuestions(prev => {
      const currentQuestion = prev.find(q => q.id === id);
      const selectedCount = prev.filter(q => q.selected).length;

      // If max selections is set and user tries to select more than allowed (and it's currently not selected)
      if (maxSelections && !currentQuestion?.selected && selectedCount >= maxSelections) {
        return prev; // Don't allow more selections
      }

      return prev.map(q =>
        q.id === id ? { ...q, selected: !q.selected } : q
      );
    });
  };

  const handleDone = () => {
    const selectedQuestions = questions.filter(q => q.selected);
    onComplete(selectedQuestions);
  };

  const selectedCount = questions.filter(q => q.selected).length;
  const selectedQuestions = questions.filter(q => q.selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 mb-4"
    >
      {/* Main questionnaire bubble */}
      <div className="flex-1 max-w-[70%]">
        <div className="bg-light-yellow text-dark-grey rounded-2xl rounded-bl-none p-6 space-y-4">
          {/* Header message */}
          <div className="mb-4">
            <p className="text-big-text font-medium">{initialMessage}</p>
          </div>

          {/* Questions with toggles */}
          <div className="space-y-3">
            {questions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(q.id)}
                  className={`w-10 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                    q.selected
                      ? 'bg-orange-400'
                      : 'bg-gray-300'
                  }`}
                  style={{
                    position: 'relative',
                  }}
                >
                  <motion.div
                    animate={{
                      x: q.selected ? 16 : 2,
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                  />
                </button>

                {/* Question Text */}
                <label
                  onClick={() => handleToggle(q.id)}
                  className="flex-1 text-big-text cursor-pointer select-none"
                >
                  {q.question}
                </label>
              </motion.div>
            ))}
          </div>

          {/* Done Button */}
          <div className="pt-4">
            <button
              onClick={handleDone}
              className="w-full bg-orange-400 text-white text-button-text font-semibold py-3 px-6 rounded-full hover:bg-orange-500 transition-colors duration-200"
            >
              I'm done
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ToggleQuestionnaire;
