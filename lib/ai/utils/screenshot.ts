import html2canvas from 'html2canvas';

export async function generateAndShareScreenshot(element: HTMLElement, text: string) {
  try {
    // Generate screenshot
    const canvas = await html2canvas(element, {
      backgroundColor: '#000000',
      scale: 2, // Higher quality
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });

    // Create file from blob
    const file = new File([blob], 'screenshot.png', { type: 'image/png' });

    // Construct Twitter share URL with text
    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;

    // Open Twitter in new window
    window.open(twitterUrl, '_blank');

  } catch (error) {
    console.error('Error generating screenshot:', error);
    throw error;
  }
} 