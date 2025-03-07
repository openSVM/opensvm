// Initialize Vanta.js Globe effect
document.addEventListener('DOMContentLoaded', function() {
  const chatElement = document.getElementById('ai-chat-container');
  
  if (chatElement && window.VANTA && window.VANTA.GLOBE) {
    window.vantaEffect = window.VANTA.GLOBE({
      el: chatElement,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0xe8e8e8,
      size: 1.60,
      backgroundColor: 0x0
    });
    
    // Clean up effect when page is unloaded
    window.addEventListener('beforeunload', function() {
      if (window.vantaEffect) {
        window.vantaEffect.destroy();
      }
    });
  }
});
