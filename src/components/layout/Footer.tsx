export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex items-center justify-center">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          &copy; {currentYear} Built by SASHA and powered by MIR BIN ALI. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
