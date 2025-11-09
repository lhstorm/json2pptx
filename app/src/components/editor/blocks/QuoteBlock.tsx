'use client';

import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';

export default function QuoteBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const { text = 'Enter a quote...', author = '', citation = '' } = block.content;

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    onUpdate({ content: { ...block.content, text: newText } });
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ content: { ...block.content, author: e.target.value } });
  };

  const handleCitationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ content: { ...block.content, citation: e.target.value } });
  };

  return (
    <BaseBlockWrapper {...props}>
      <blockquote className="border-l-4 border-blue-500 pl-6 py-2 bg-blue-50 rounded-r">
        <div
          contentEditable={isEditing}
          onInput={handleTextChange}
          suppressContentEditableWarning
          className="text-lg text-gray-800 italic mb-3 outline-none focus:bg-blue-100 px-2 py-1 rounded"
        >
          {text}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={author}
              onChange={handleAuthorChange}
              placeholder="Author (optional)"
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={citation}
              onChange={handleCitationChange}
              placeholder="Citation (optional)"
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <>
            {author && (
              <cite className="block text-sm font-semibold text-gray-700 not-italic">
                — {author}
              </cite>
            )}
            {citation && (
              <p className="text-xs text-gray-600 mt-1">{citation}</p>
            )}
          </>
        )}
      </blockquote>
    </BaseBlockWrapper>
  );
}
