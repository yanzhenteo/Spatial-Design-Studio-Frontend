import React from 'react';

interface IssueSelectionStepProps {
  selectedIssues: string[];
  onToggleIssue: (issue: string) => void;
}

const IssueSelectionStep: React.FC<IssueSelectionStepProps> = ({
  selectedIssues,
  onToggleIssue
}) => {
  const issueButtons = [
    'Way-finding',
    'Glare sensitivity', 
    'Misplacing items',
    'Forgetfulness',
    'Lack spatial perception'
  ];

  return (
    <>
      <div className="space-y-3 mb-6">
        {issueButtons.map((issue) => (
          <button
            key={issue}
            onClick={() => onToggleIssue(issue)}
            className={`w-full py-3 px-4 rounded-lg text-button-text transition-all duration-200 ${
              selectedIssues.includes(issue)
                ? 'bg-pink text-dark-grey shadow-md' 
                : 'bg-white text-dark-grey border-1'
            }`}
          >
            {issue}
          </button>
        ))}
      </div>

      {/* Selection count hint */}
      <p className="text-sm text-gray-500 text-center mt-3">
        {selectedIssues.length === 0 
          ? 'Select one or more options to continue' 
          : `${selectedIssues.length} option${selectedIssues.length !== 1 ? 's' : ''} selected`
        }
      </p>
    </>
  );
};

export default IssueSelectionStep;