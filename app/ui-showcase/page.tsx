import { PaperThemeDemo } from '@/components/PaperThemeDemo';

export default function UIShowcasePage() {
  return (
    <div className="container mx-auto px-4 py-8 theme-paper">
      <h1 className="text-3xl font-bold mb-6">UI Design Concept Showcase</h1>
      <p className="mb-8 text-muted-foreground">
        This page demonstrates the implementation of UI components inspired by the clean, 
        minimalist interface design with refined metrics display, sophisticated components,
        and optimized information hierarchy.
      </p>
      
      <PaperThemeDemo />
    </div>
  );
}