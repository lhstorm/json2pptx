'use client';

import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';
import { useState } from 'react';
import { Upload, Link as LinkIcon } from 'lucide-react';

export default function ImageBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const { url = '', alt = 'Image', caption = '' } = block.content;
  const [showUrlInput, setShowUrlInput] = useState(!url);

  const handleUrlSubmit = (newUrl: string) => {
    onUpdate({
      content: {
        ...block.content,
        url: newUrl,
      },
    });
    setShowUrlInput(false);
  };

  return (
    <BaseBlockWrapper {...props}>
      <div className="space-y-2">
        {!url || showUrlInput ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Upload className="w-8 h-8 text-gray-400" />
                <LinkIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Add image from URL</p>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlSubmit(e.currentTarget.value);
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Or use Unsplash (coming soon)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative group">
              <img
                src={url}
                alt={alt}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                }}
              />
              {isEditing && (
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="absolute top-2 right-2 px-3 py-1 bg-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                >
                  Change Image
                </button>
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                placeholder="Image caption (optional)"
                value={caption}
                onChange={(e) =>
                  onUpdate({
                    content: {
                      ...block.content,
                      caption: e.target.value,
                    },
                  })
                }
                className="w-full px-2 py-1 text-sm text-gray-600 italic border-none outline-none"
              />
            ) : caption ? (
              <p className="text-sm text-gray-600 italic text-center">{caption}</p>
            ) : null}
          </div>
        )}
      </div>
    </BaseBlockWrapper>
  );
}
