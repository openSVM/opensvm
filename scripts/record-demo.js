const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');
const fs = require('fs');

// Configuration for the recorder
const config = {
  followNewTab: true,
  fps: 30,
  videoFrame: {
    width: 1920,
    height: 1080,
  },
  aspectRatio: '16:9',
  recordDurationLimit: 300, // in seconds, maximum 5 minutes
  ffmpeg_Path: null, // uses default ffmpeg path
  quality: 100, // Higher quality, lower is faster
  format: 'mp4',
};

// Create the changelog directory if it doesn't exist
const CHANGELOG_DIR = path.join(__dirname, '..', 'changelog');
if (!fs.existsSync(CHANGELOG_DIR)) {
  fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
}

// Demo script with detailed steps
async function runDemoScript() {
  console.log('Starting demo recording...');
  
  // Launch browser with specific viewport for the recording
  const browser = await puppeteer.launch({
    headless: false, // Change to true for production
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Initialize recorder
  const outputPath = path.join(CHANGELOG_DIR, 'opensvm-ui-enhancements-demo.mp4');
  const recorder = new PuppeteerScreenRecorder(page, config);
  
  try {
    // Start recording
    await recorder.start(outputPath);
    console.log('Recording started...');
    
    // Add a brief pause at the beginning
    await page.waitForTimeout(1000);
    
    // DEMO SEQUENCE
    
    // 1. Visit the main demo page
    console.log('Visiting demo page...');
    await page.goto('http://localhost:3000/demo', { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForTimeout(5000); // Give time to view the page
    
    // Add text overlay to explain what's being shown
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.left = '10px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '20px';
      overlay.textContent = '1. Enhanced UI Design Showcase';
      document.body.appendChild(overlay);
      
      // Auto-remove after a few seconds
      setTimeout(() => overlay.remove(), 5000);
    });
    
    // Interact with sliders
    console.log('Interacting with sliders...');
    const sliderSelectors = [
      'input[type="range"]', // Assuming sliders are range inputs
    ];
    
    for (const selector of sliderSelectors) {
      const sliders = await page.$$(selector);
      for (const slider of sliders) {
        await page.evaluate((el) => {
          // Scroll to the element
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, slider);
        
        await page.waitForTimeout(1000);
        
        // Simulate interaction with the slider
        await slider.click();
        await page.waitForTimeout(500);
        
        // Move slider to different positions
        await page.evaluate((el) => {
          el.value = Math.floor(el.min) + Math.floor((el.max - el.min) * 0.75);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, slider);
        
        await page.waitForTimeout(1500);
      }
    }
    
    // Overlay explaining slider interaction
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.left = '10px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '20px';
      overlay.textContent = 'Interactive sliders with visual feedback';
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.remove(), 5000);
    });
    
    await page.waitForTimeout(3000);
    
    // Scroll down to show more content
    console.log('Scrolling to show more content...');
    await page.evaluate(() => {
      window.scrollBy({
        top: 500,
        behavior: 'smooth'
      });
    });
    
    await page.waitForTimeout(3000);
    
    // Show performance metrics
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.left = '10px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '20px';
      overlay.textContent = 'Performance metrics visualization';
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.remove(), 5000);
    });
    
    await page.waitForTimeout(3000);
    
    // Scroll to the testimonials section
    await page.evaluate(() => {
      window.scrollBy({
        top: 700,
        behavior: 'smooth'
      });
    });
    
    await page.waitForTimeout(3000);
    
    // Show testimonials section
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.left = '10px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '20px';
      overlay.textContent = 'Testimonial cards with enhanced styling';
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.remove(), 5000);
    });
    
    await page.waitForTimeout(5000);
    
    // Navigate to the transaction graph demo
    console.log('Navigating to transaction graph demo...');
    await page.goto('http://localhost:3000/demo-graph', { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Show transaction graph visualization
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.left = '10px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '20px';
      overlay.textContent = '2. Transaction Graph Visualization';
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.remove(), 5000);
    });
    
    await page.waitForTimeout(5000);
    
    // Interact with the graph (click a node if available)
    try {
      const nodes = await page.$$('svg circle, svg path, svg rect');
      if (nodes.length > 0) {
        const randomNodeIndex = Math.floor(Math.random() * nodes.length);
        const node = nodes[randomNodeIndex];
        
        await page.evaluate((el) => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, node);
        
        await page.waitForTimeout(1000);
        await node.click();
        await page.waitForTimeout(3000);
        
        // Explain node interaction
        await page.evaluate(() => {
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '10px';
          overlay.style.left = '10px';
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          overlay.style.color = 'white';
          overlay.style.padding = '10px';
          overlay.style.borderRadius = '5px';
          overlay.style.zIndex = '9999';
          overlay.style.fontSize = '20px';
          overlay.textContent = 'Interactive graph nodes with color coding';
          document.body.appendChild(overlay);
          
          setTimeout(() => overlay.remove(), 5000);
        });
      }
    } catch (e) {
      console.log('Could not interact with graph nodes:', e);
    }
    
    await page.waitForTimeout(3000);
    
    // Navigate to a transaction page to show the error handling
    console.log('Navigating to transaction page...');
    await page.goto('http://localhost:3000/tx/4RwR2w12LydcoutGYJz2TbVxY8HVV44FCN2xoo1L9xu7ZcFxFBpoxxpSFTRWf9MPwMzmr9yTuJZjGqSmzcrawF43', { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Show transaction page
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.left = '10px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '20px';
      overlay.textContent = '3. Transaction Details with Demo Data Support';
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.remove(), 5000);
    });
    
    await page.waitForTimeout(5000);
    
    // Show future roadmap
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.bottom = '50px';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      overlay.style.color = 'white';
      overlay.style.padding = '20px';
      overlay.style.borderRadius = '8px';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '24px';
      overlay.style.width = '80%';
      overlay.style.maxWidth = '1200px';
      overlay.style.textAlign = 'center';
      overlay.innerHTML = `
        <h2 style="margin-bottom: 20px; font-size: 32px;">Future Development Roadmap</h2>
        <ul style="list-style-type: none; padding: 0; text-align: left; margin: 0 auto; max-width: 800px;">
          <li style="margin-bottom: 15px;">✅ Advanced transaction graph animations and interactions</li>
          <li style="margin-bottom: 15px;">✅ Enhanced data visualization for complex transactions</li>
          <li style="margin-bottom: 15px;">✅ Real-time data streaming with visual progress indicators</li>
          <li style="margin-bottom: 15px;">✅ Accessibility improvements for all UI components</li>
          <li style="margin-bottom: 15px;">✅ Performance optimizations for mobile responsiveness</li>
        </ul>
      `;
      document.body.appendChild(overlay);
      
      setTimeout(() => overlay.remove(), 10000);
    });
    
    await page.waitForTimeout(10000);
    
    // Final summary screen
    await page.evaluate(() => {
      // Create a full-page overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      overlay.style.color = 'white';
      overlay.style.zIndex = '10000';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.padding = '40px';
      overlay.style.textAlign = 'center';
      
      overlay.innerHTML = `
        <h1 style="font-size: 48px; margin-bottom: 30px;">OpenSVM UI Enhancements</h1>
        <p style="font-size: 24px; max-width: 800px; line-height: 1.6; margin-bottom: 40px;">
          This demonstration showcased our new UI design enhancements inspired by modern interface patterns,
          including card-based layouts, visual progress indicators, and intuitive data visualization.
        </p>
        <div style="font-size: 18px; margin-top: 20px;">
          <p>Stay up to date with our latest developments</p>
          <p style="color: #4f90ff; margin-top: 10px;">opensvm.io</p>
        </div>
      `;
      
      document.body.appendChild(overlay);
    });
    
    await page.waitForTimeout(8000);
    
    // Stop recording
    await recorder.stop();
    console.log(`Recording saved to: ${outputPath}`);
    
    // Create accompanying social media text file
    const socialMediaText = `
# OpenSVM UI Enhancement Demo
    
📢 Exciting update to OpenSVM! We've revamped our user interface with modern design patterns and enhanced visualizations.
    
🔹 New card-based layout for better content organization
🔹 Interactive sliders with visual feedback
🔹 Enhanced transaction graph visualization
🔹 Performance metrics with intuitive visual indicators
🔹 Improved error handling and fallback demo data
    
This update focuses on creating a more intuitive and visually appealing experience while maintaining the powerful capabilities you rely on.
    
Check out the full demo video for a detailed walkthrough of all the new features and improvements! #OpenSVM #UIEnhancement #Blockchain #Solana
    `;
    
    fs.writeFileSync(path.join(CHANGELOG_DIR, 'social-media-announcement.md'), socialMediaText);
    console.log('Social media text created.');
    
  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    // Ensure browser is closed
    await browser.close();
    console.log('Demo recording completed.');
  }
}

// Run the demo script
runDemoScript().catch(console.error);