'use client';

import { useState } from 'react';
import { Block, BlockType, Slide as VisualSlide } from '@/types/blocks';
import { createDefaultBlock, getBlocksByCategory, BLOCK_REGISTRY } from '@/lib/blockRegistry';
import { Plus, X } from 'lucide-react';

// Import block components
import HeadingBlock from './blocks/HeadingBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import ListBlock from './blocks/ListBlock';
import QuoteBlock from './blocks/QuoteBlock';
import ImageBlock from './blocks/ImageBlock';
import ChartBlock from './blocks/ChartBlock';

interface BlockEditorProps {
  slide: VisualSlide;
  onUpdate: (slide: VisualSlide) => void;
  isEditing: boolean;
}

export default function BlockEditor({ slide, onUpdate, isEditing }: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createDefaultBlock(type);
    const updatedBlocks = [...slide.blocks, newBlock];
    onUpdate({
      ...slide,
      blocks: updatedBlocks,
    });
    setShowBlockSelector(false);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<Block>) => {
    const updatedBlocks = slide.blocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    onUpdate({
      ...slide,
      blocks: updatedBlocks,
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = slide.blocks.filter((block) => block.id !== blockId);
    onUpdate({
      ...slide,
      blocks: updatedBlocks,
    });
    setSelectedBlockId(null);
  };

  const handleDuplicateBlock = (blockId: string) => {
    const blockToDuplicate = slide.blocks.find((b) => b.id === blockId);
    if (!blockToDuplicate) return;

    const newBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const blockIndex = slide.blocks.findIndex((b) => b.id === blockId);
    const updatedBlocks = [
      ...slide.blocks.slice(0, blockIndex + 1),
      newBlock,
      ...slide.blocks.slice(blockIndex + 1),
    ];

    onUpdate({
      ...slide,
      blocks: updatedBlocks,
    });
  };

  const renderBlock = (block: Block) => {
    const commonProps = {
      block,
      isEditing,
      isSelected: selectedBlockId === block.id,
      onUpdate: (updates: Partial<Block>) => handleUpdateBlock(block.id, updates),
      onDelete: () => handleDeleteBlock(block.id),
      onDuplicate: () => handleDuplicateBlock(block.id),
    };

    switch (block.type) {
      case 'heading':
        return <HeadingBlock key={block.id} {...commonProps} />;
      case 'paragraph':
        return <ParagraphBlock key={block.id} {...commonProps} />;
      case 'list':
        return <ListBlock key={block.id} {...commonProps} />;
      case 'quote':
        return <QuoteBlock key={block.id} {...commonProps} />;
      case 'image':
        return <ImageBlock key={block.id} {...commonProps} />;
      case 'chart':
        return <ChartBlock key={block.id} {...commonProps} />;
      default:
        return (
          <div key={block.id} className="p-4 bg-gray-100 rounded text-gray-600">
            Block type "{block.type}" not implemented yet
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Slide Title */}
      <div className="mb-6">
        {isEditing ? (
          <input
            type="text"
            value={slide.title}
            onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
            className="text-3xl font-bold w-full border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            placeholder="Slide Title"
          />
        ) : (
          <h1 className="text-3xl font-bold">{slide.title}</h1>
        )}
      </div>

      {/* Blocks */}
      <div
        className="flex-1 space-y-4 overflow-y-auto"
        style={{ backgroundColor: slide.backgroundColor }}
      >
        {slide.blocks.length === 0 && isEditing ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-4">No blocks yet. Add your first block below!</p>
          </div>
        ) : (
          slide.blocks.map((block) => (
            <div
              key={block.id}
              onClick={() => isEditing && setSelectedBlockId(block.id)}
            >
              {renderBlock(block)}
            </div>
          ))
        )}

        {/* Add Block Button */}
        {isEditing && (
          <div className="relative">
            <button
              onClick={() => setShowBlockSelector(!showBlockSelector)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Plus className="w-5 h-5" />
              Add Block
            </button>

            {/* Block Selector */}
            {showBlockSelector && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Add a Block</h3>
                  <button
                    onClick={() => setShowBlockSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Categories */}
                {(['text', 'layout', 'data', 'media', 'interactive'] as const).map(
                  (category) => {
                    const categoryBlocks = getBlocksByCategory(category);
                    if (categoryBlocks.length === 0) return null;

                    return (
                      <div key={category} className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          {category}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryBlocks.map((blockDef) => (
                            <button
                              key={blockDef.type}
                              onClick={() => handleAddBlock(blockDef.type)}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                            >
                              <span className="text-2xl">{blockDef.icon}</span>
                              <div>
                                <div className="font-medium text-sm">
                                  {blockDef.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {blockDef.description}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Speaker Notes (if editing) */}
      {isEditing && (
        <div className="mt-6 border-t pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Speaker Notes
          </label>
          <textarea
            value={slide.notes || ''}
            onChange={(e) => onUpdate({ ...slide, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Add notes for this slide..."
          />
        </div>
      )}
    </div>
  );
}
