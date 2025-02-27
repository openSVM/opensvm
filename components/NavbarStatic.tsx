// Server component for static navbar content
export function NavbarStatic() {
  // Preload critical navigation paths
  const criticalPaths = [
    '/networks',
    '/tokens',
    '/nfts',
    '/analytics'
  ];

  return (
    <>
      {/* Preload hints for critical navigation */}
      {criticalPaths.map(path => (
        <link 
          key={path}
          rel="preload" 
          href={path} 
          as="document"
        />
      ))}

      <nav className="w-full border-b border-border bg-background fixed top-0 left-0 right-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          {/* Left section - Logo */}
          <div className="flex items-center gap-2">
            <a 
              href="/" 
              className="flex items-center gap-2"
              aria-label="OPENSVM Home"
            >
              <span className="font-bold text-lg text-foreground">OPENSVM</span>
            </a>
          </div>

          {/* Center section - Static search placeholder */}
          <div className="flex-1 max-w-xl px-4">
            <div className="relative">
              <div 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              >
                {/* Optimized search icon SVG */}
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="opacity-70"
                >
                  <path d="M19 19l-4.35-4.35M11 5a6 6 0 100 12 6 6 0 000-12z" />
                </svg>
              </div>
              <div 
                className="w-full bg-background border border-border hover:border-foreground/20 pl-10 h-9 rounded-md flex items-center text-muted-foreground"
                aria-hidden="true"
              >
                Search accounts, tokens, or programs...
              </div>
            </div>
          </div>

          {/* Right section - Static navigation */}
          <div className="hidden sm:flex items-center gap-4">
            {criticalPaths.map(path => (
              <a 
                key={path}
                href={path}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
              </a>
            ))}
            {/* Static placeholder for interactive elements */}
            <div className="w-[200px] h-9" aria-hidden="true" />
          </div>

          {/* Mobile menu button placeholder */}
          <div className="flex sm:hidden">
            <div className="w-8 h-8" aria-hidden="true" />
          </div>
        </div>
      </nav>
    </>
  );
}