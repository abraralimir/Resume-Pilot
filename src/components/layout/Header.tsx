import Link from 'next/link';
import { Logo } from "@/components/icons";
import { Button } from '@/components/ui/button';
import { Linkedin } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-6xl items-center">
        <Link href="/" className="mr-6 flex items-center">
          <Logo className="h-7 w-7 text-primary" />
          <span className="ml-3 font-headline text-xl font-bold">ResumePilot</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
           <Link href="/linkedin" className="text-muted-foreground transition-colors hover:text-foreground">
              LinkedIn Analyzer
           </Link>
        </nav>
      </div>
    </header>
  );
}
