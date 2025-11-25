import React from 'react';

interface IssueSelectionStepProps {
  selectedIssues: string[];
  onToggleIssue: (issue: string) => void;
  issues?: string[]; // NEW: subset to render, if provided
}

// Export full list so other modules can reuse it if needed
export const ALL_ISSUES = [
  'Depth misjudgment',      // q1
  'Pattern confusion',      // q2
  'Glare sensitivity',      // q3
  'Mirror confusion',       // q4
  'Door confusion',         // q5
  'Night misorientation',   // q6
  'Bathroom slips',         // q7
  'Stair difficulty',       // q8
  'Needs visibility',       // q9
  'Clutter sensitivity'     // q10
];

const IssueSelectionStep: React.FC<IssueSelectionStepProps> = ({
  selectedIssues,
  onToggleIssue,
  issues
}) => {
  // Use provided subset if given, else all 10
  const issueButtons = issues ?? ALL_ISSUES;

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