import fs from 'fs';
import path from 'path';
import MarkdownRenderer from './markdown-renderer';

export default async function NewsPage() {
  const filePath = path.join(process.cwd(), 'app', 'news', 'contents.md');
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading markdown file:', error);
    content = '# Error loading content';
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <MarkdownRenderer content={content} />
    </div>
  );
}