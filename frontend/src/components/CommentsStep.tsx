import React from 'react';

interface CommentsStepProps {
  comments: string;
  onCommentsChange: (comments: string) => void;
}

const CommentsStep: React.FC<CommentsStepProps> = ({
  comments,
  onCommentsChange
}) => {
  return (
    <div className="w-full mb-6">
      <textarea
        value={comments}
        onChange={(e) => onCommentsChange(e.target.value)}
        placeholder="Type your comments here..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-fill-text text-dark-grey bg-white resize-none"
        rows={4}
      />
    </div>
  );
};

export default CommentsStep;