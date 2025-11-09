'use client';

import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

export default function ParagraphBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const { text = 'Start typing...' } = block.content;

  const editor = useEditor({
    extensions: [StarterKit],
    content: text,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onUpdate({
        content: {
          ...block.content,
          text: editor.getHTML(),
        },
      });
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== text) {
      editor.commands.setContent(text);
    }
  }, [text, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  return (
    <BaseBlockWrapper {...props}>
      <div className="prose prose-sm max-w-none">
        <EditorContent
          editor={editor}
          className="outline-none"
          style={{
            color: block.style?.textColor,
          }}
        />
      </div>
    </BaseBlockWrapper>
  );
}
