import type { Metadata } from 'next';
import './globals.css';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { RootLayoutClient } from './RootLayoutClient';

export const metadata: Metadata = {
  title: 'Markdown Slide Generator',
  description: 'Generate presentation slides from markdown content using AI',
  keywords: ['markdown', 'slides', 'presentation', 'AI', 'OpenAI', 'generator'],
  authors: [{ name: 'Markdown Slide Generator Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <SettingsProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </SettingsProvider>
      </body>
    </html>
  );
}
