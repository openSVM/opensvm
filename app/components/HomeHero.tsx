import { Inter } from 'next/font/google';

// Load Inter font with specific weight needed for the hero
const inter = Inter({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export default function HomeHero() {
  return (
    <div className="text-center mb-12">
      <h1 
        className={`${inter.className} text-4xl md:text-6xl font-bold text-foreground mb-4`}
      >
        OpenSVM Explorer
      </h1>
      <p className="text-xl text-muted-foreground">
        The quieter you become, the more you are able to hear.
      </p>
    </div>
  );
}