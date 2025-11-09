'use client';

import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function CalloutBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const { text = 'Important information...', type = 'info' } = block.content;

  const calloutTypes = [
    { value: 'info', label: 'Info', icon: Info, bgColor: 'bg-blue-50', borderColor: 'border-blue-500', textColor: 'text-blue-900', iconColor: 'text-blue-600' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500', textColor: 'text-yellow-900', iconColor: 'text-yellow-600' },
    { value: 'success', label: 'Success', icon: CheckCircle, bgColor: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-900', iconColor: 'text-green-600' },
    { value: 'error', label: 'Error', icon: XCircle, bgColor: 'bg-red-50', borderColor: 'border-red-500', textColor: 'text-red-900', iconColor: 'text-red-600' },
  ];

  const currentType = calloutTypes.find((t) => t.value === type) || calloutTypes[0];
  const Icon = currentType.icon;

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    onUpdate({ content: { ...block.content, text: newText } });
  };

  const handleTypeChange = (newType: string) => {
    onUpdate({ content: { ...block.content, type: newType } });
  };

  return (
    <BaseBlockWrapper {...props}>
      {isEditing && (
        <div className="flex gap-2 mb-3">
          {calloutTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                type === t.value
                  ? `${t.bgColor} ${t.textColor} border ${t.borderColor}`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div
        className={`flex gap-3 p-4 rounded-lg border-l-4 ${currentType.bgColor} ${currentType.borderColor}`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${currentType.iconColor}`} />
        <div
          contentEditable={isEditing}
          onInput={handleTextChange}
          suppressContentEditableWarning
          className={`flex-1 outline-none ${currentType.textColor}`}
        >
          {text}
        </div>
      </div>
    </BaseBlockWrapper>
  );
}
