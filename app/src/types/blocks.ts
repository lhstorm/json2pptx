export type BlockType =
  // Text blocks
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'quote'
  | 'code'
  | 'callout'
  // Layout blocks
  | 'columns'
  | 'tabs'
  | 'card'
  | 'divider'
  // Data blocks
  | 'table'
  | 'chart'
  | 'diagram'
  | 'timeline'
  | 'process'
  // Media blocks
  | 'image'
  | 'video'
  | 'embed'
  | 'gallery'
  // Interactive blocks
  | 'button'
  | 'form';

export interface BlockStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  shadow?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: any; // Type-specific content
  style?: BlockStyle;
  metadata?: {
    order?: number;
    locked?: boolean;
    hidden?: boolean;
  };
}

export interface Slide {
  id: string;
  title: string;
  blocks: Block[];
  backgroundColor?: string;
  backgroundImage?: string;
  transition?: string;
  notes?: string;
}

export interface BlockComponentProps {
  block: Block;
  isEditing: boolean;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}
