import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'ResumePilot | AI-Powered ATS Resume Scanner & Enhancer',
  description: 'Boost your job application with ResumePilot. Get an instant ATS score, AI-driven feedback, and an enhanced resume tailored to your dream job. Supports PDF, DOCX, and more.',
  keywords: ['resume builder', 'ATS scanner', 'resume enhancer', 'AI resume', 'Gemini', 'job application', 'career tools'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Lexend:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
