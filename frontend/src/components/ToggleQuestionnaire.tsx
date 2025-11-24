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
  const [selectionOrder, setSelectionOrder] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setQuestions(prev => {
      const currentQuestion = prev.find(q => q.id === id);
      const selectedCount = prev.filter(q => q.selected).length;

      // If clicking to deselect
      if (currentQuestion?.selected) {
        setSelectionOrder(prevOrder => prevOrder.filter(itemId => itemId !== id));
        return prev.map(q =>
          q.id === id ? { ...q, selected: false } : q
        );
      }

      // If trying to select more than maxSelections allows
      if (maxSelections && selectedCount >= maxSelections) {
        // Remove the first (oldest) selected item
        const firstSelectedId = selectionOrder[0];
        setSelectionOrder(prevOrder => prevOrder.slice(1));

        return prev.map(q => {
          if (q.id === id) {
            // Select the new item
            return { ...q, selected: true };
          } else if (q.id === firstSelectedId) {
            // Deselect the oldest item
            return { ...q, selected: false };
          }
          return q;
        });
      }

      // Normal selection within limits
      setSelectionOrder(prevOrder => [...prevOrder, id]);
      return prev.map(q =>
        q.id === id ? { ...q, selected: true } : q
      );
    });
  };

  const handleDone = () => {
    const selectedQuestions = questions.filter(q => q.selected);
    onComplete(selectedQuestions);
  };

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
