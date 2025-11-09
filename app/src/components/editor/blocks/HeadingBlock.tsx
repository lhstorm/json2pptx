'use client';

import React from 'react';
import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';
import { useEffect, useRef } from 'react';

export default function HeadingBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const inputRef = useRef<HTMLHeadingElement>(null);

  const { text = 'Heading', level = 1 } = block.content;
  const headingLevel = (level as number) || 1;

  const handleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    const newText = e.currentTarget.textContent || '';
    onUpdate({
      content: {
        ...block.content,
        text: newText,
      },
    });
  };

  const handleLevelChange = (newLevel: number) => {
    onUpdate({
      content: {
        ...block.content,
        level: newLevel,
      },
    });
  };

  const HeadingTag = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const fontSizeMap: Record<number, string> = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base',
  };
  const fontSize = fontSizeMap[headingLevel] || 'text-4xl';

  return (
    <BaseBlockWrapper {...props}>
      <div className="space-y-2">
        {isEditing && (
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6].map((h) => (
              <button
                key={h}
                onClick={() => handleLevelChange(h)}
                className={`px-3 py-1 text-xs rounded ${
                  headingLevel === h
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                H{h}
              </button>
            ))}
          </div>
        )}

        <HeadingTag
          ref={inputRef as any}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={handleInput}
          className={`${fontSize} font-bold outline-none ${
            isEditing ? 'cursor-text' : ''
          }`}
          style={{
            color: block.style?.textColor,
          }}
        >
          {text}
        </HeadingTag>
      </div>
    </BaseBlockWrapper>
  );
}
