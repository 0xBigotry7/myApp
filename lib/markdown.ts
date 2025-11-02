/**
 * Simple markdown to HTML converter for Life Timeline events
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Headers: ## text
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-3 mb-2">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-2 mb-1">$1</h3>');

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // Code: `text`
  html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

  // Links: [text](url)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Blockquotes: > text
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-300 pl-3 py-1 italic text-gray-600 my-2">$1</blockquote>');

  // Unordered lists: - text or * text
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Ordered lists: 1. text
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li class="ml-4 list-disc">.+?<\/li>\n?)+/g, '<ul class="my-2">$&</ul>');
  html = html.replace(/(<li class="ml-4 list-decimal">.+?<\/li>\n?)+/g, '<ol class="my-2">$&</ol>');

  // Line breaks: convert double newlines to paragraphs
  html = html.split('\n\n').map(para => {
    // Don't wrap if it's already wrapped in a tag
    if (para.startsWith('<') || para.trim() === '') return para;
    return `<p class="my-2">${para.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return html;
}
