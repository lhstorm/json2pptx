'use client';

import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';

export default function ListBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const { items = ['List item 1', 'List item 2'], ordered = false } = block.content;

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onUpdate({ content: { ...block.content, items: newItems } });
  };

  const handleAddItem = () => {
    onUpdate({
      content: {
        ...block.content,
        items: [...items, 'New item'],
      },
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_: string, i: number) => i !== index);
    onUpdate({ content: { ...block.content, items: newItems } });
  };

  const toggleListType = () => {
    onUpdate({
      content: {
        ...block.content,
        ordered: !ordered,
      },
    });
  };

  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <BaseBlockWrapper {...props}>
      {isEditing && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={toggleListType}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              !ordered
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bullet List
          </button>
          <button
            onClick={toggleListType}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              ordered
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Numbered List
          </button>
        </div>
      )}

      <ListTag className={ordered ? 'list-decimal pl-6 space-y-2' : 'list-disc pl-6 space-y-2'}>
        {items.map((item: string, index: number) => (
          <li key={index} className="text-gray-800">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List item"
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <span>{item}</span>
            )}
          </li>
        ))}
      </ListTag>

      {isEditing && (
        <button
          onClick={handleAddItem}
          className="mt-3 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add item
        </button>
      )}
    </BaseBlockWrapper>
  );
}
