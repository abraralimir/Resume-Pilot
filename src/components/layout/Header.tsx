import { Logo } from "@/components/icons";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-6xl items-center">
        <div className="mr-4 flex items-center">
          <Logo className="h-7 w-7 text-primary" />
          <span className="ml-3 font-headline text-xl font-bold">ResumePilot</span>
        </div>
      </div>
    </header>
  );
}
