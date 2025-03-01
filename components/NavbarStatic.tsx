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

      <div className="flex w-full items-center">
        <div className="flex items-center gap-2">
          <a 
            href="/" 
            className="flex items-center gap-2"
            aria-label="OPENSVM Home"
          >
            <span className="font-bold text-lg text-foreground">OPENSVM</span>
            <span className="text-sm text-muted-foreground">[AI]</span>
          </a>
        </div>
        
        {/* Empty placeholder for interactive elements */}
        <div className="flex-1" />
      </div>
    </>
  );
}
