'use client';

import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';
import { useState } from 'react';

export default function CodeBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const { code = '// Your code here', language = 'javascript' } = block.content;

  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'csharp',
    'cpp',
    'go',
    'rust',
    'sql',
    'html',
    'css',
    'json',
    'yaml',
    'markdown',
    'bash',
  ];

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: { ...block.content, code: e.target.value } });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ content: { ...block.content, language: e.target.value } });
  };

  return (
    <BaseBlockWrapper {...props}>
      {isEditing && (
        <div className="flex gap-2 mb-2">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono uppercase">{language}</span>
        </div>

        {isEditing ? (
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="w-full p-4 bg-gray-900 text-gray-100 font-mono text-sm outline-none resize-none min-h-[150px]"
            placeholder="Enter your code..."
            spellCheck={false}
          />
        ) : (
          <pre className="p-4 text-gray-100 overflow-x-auto">
            <code className={`language-${language} text-sm`}>{code}</code>
          </pre>
        )}
      </div>
    </BaseBlockWrapper>
  );
}
