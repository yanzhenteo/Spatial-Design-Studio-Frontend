import React from 'react';

interface CommentsStepProps {
  comments: string;
  onCommentsChange: (comments: string) => void;
  noChangeComments: string;
  onNoChangeCommentsChange: (comments: string) => void;
  secondQuestion?: string;
}

const CommentsStep: React.FC<CommentsStepProps> = ({
  comments,
  onCommentsChange,
  noChangeComments,
  onNoChangeCommentsChange,
  secondQuestion
}) => {
  return (
    <div className="w-full mb-6 space-y-6">
      <div className="space-y-4">
        <textarea
          value={comments}
          onChange={(e) => onCommentsChange(e.target.value)}
          placeholder="Type your comments here..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-fill-text text-dark-grey bg-white resize-none"
          rows={4}
        />
        
        {secondQuestion && (
          <div className="space-y-2">
            <p className="text-big-text text-dark-grey text-center">
              {secondQuestion}
            </p>
            <textarea
              value={noChangeComments}
              onChange={(e) => onNoChangeCommentsChange(e.target.value)}
              placeholder="Do not change my..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-fill-text text-dark-grey bg-white resize-none"
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsStep;