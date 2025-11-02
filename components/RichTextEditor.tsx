"use client";

import { useState, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertListItem = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);

    // Add newline if not at start
    const prefix = beforeCursor && !beforeCursor.endsWith('\n') ? '\n' : '';
    const newText = beforeCursor + prefix + '- ' + afterCursor;

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length + 2, start + prefix.length + 2);
    }, 0);
  };

  const insertNumberedItem = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);

    const prefix = beforeCursor && !beforeCursor.endsWith('\n') ? '\n' : '';
    const newText = beforeCursor + prefix + '1. ' + afterCursor;

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length + 3, start + prefix.length + 3);
    }, 0);
  };

  const buttons = [
    { label: "B", title: "Bold", action: () => insertFormatting("**", "**") },
    { label: "I", title: "Italic", action: () => insertFormatting("*", "*") },
    { label: "≡", title: "Heading", action: () => insertFormatting("## ") },
    { label: "•", title: "Bullet List", action: insertListItem },
    { label: "1.", title: "Numbered List", action: insertNumberedItem },
    { label: "\"", title: "Quote", action: () => insertFormatting("> ") },
    { label: "</>", title: "Code", action: () => insertFormatting("`", "`") },
  ];

  return (
    <div className="border-2 border-gray-200 rounded-xl focus-within:border-purple-500 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {btn.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span>Markdown supported</span>
        </div>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full px-4 py-3 focus:outline-none resize-none rounded-b-xl"
      />

      {/* Preview hint */}
      {value && (
        <div className="px-4 py-2 bg-purple-50 border-t border-gray-200 text-xs text-gray-600 rounded-b-xl">
          <details className="cursor-pointer">
            <summary className="font-medium text-purple-700">Preview formatting</summary>
            <div className="mt-2 prose prose-sm max-w-none">
              {value.split('\n').map((line, i) => {
                // Bold: **text**
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Italic: *text*
                line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
                // Code: `text`
                line = line.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
                // Heading: ## text
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-bold mt-2" dangerouslySetInnerHTML={{ __html: line.substring(3) }} />;
                }
                // Quote: > text
                if (line.startsWith('> ')) {
                  return <blockquote key={i} className="border-l-4 border-purple-300 pl-3 italic text-gray-600" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
                }
                // List items: - text or 1. text
                if (line.match(/^[-*] /)) {
                  return <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
                }
                if (line.match(/^\d+\. /)) {
                  return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: line.substring(line.indexOf('. ') + 2) }} />;
                }
                // Regular paragraph
                return line ? <p key={i} dangerouslySetInnerHTML={{ __html: line }} /> : <br key={i} />;
              })}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
