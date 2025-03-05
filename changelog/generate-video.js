const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OUTPUT_DIR = path.join(__dirname);
const HTML_PATH = path.join(__dirname, 'opensvm-ui-enhancements-demo.html');
const VIDEO_PATH = path.join(__dirname, 'opensvm-ui-enhancements-demo.mp4');
const DURATION = 30; // seconds
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

// Create a temporary directory for frames
const FRAMES_DIR = path.join(__dirname, 'temp_frames');
if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

async function captureFrames() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=${WIDTH},${HEIGHT}`]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  
  // Load the HTML file
  console.log(`Loading HTML from ${HTML_PATH}...`);
  await page.goto(`file://${HTML_PATH}`, { waitUntil: 'networkidle0' });
  
  // Inject animation control script
  await page.evaluate(() => {
    window.currentFrame = 0;
    window.totalFrames = 30 * 30; // 30 seconds at 30fps
    
    // Override the CSS animations with JavaScript for precise control
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => {
      slide.style.animation = 'none';
      slide.style.opacity = 0;
    });
    
    // Function to update the animation state for a specific frame
    window.setFrame = (frameNumber) => {
      const totalSlides = slides.length;
      const frameDuration = window.totalFrames / totalSlides;
      const currentSlideIndex = Math.floor(frameNumber / frameDuration);
      
      // Hide all slides
      slides.forEach(slide => {
        slide.style.opacity = 0;
      });
      
      // Show current slide
      if (currentSlideIndex < totalSlides) {
        slides[currentSlideIndex].style.opacity = 1;
      }
      
      // Add additional animations based on frame number
      // For example, move sliders, update progress bars, etc.
      const progress = (frameNumber % frameDuration) / frameDuration;
      
      // Animate sliders in slide 1
      if (currentSlideIndex === 0) {
        const sliders = document.querySelectorAll('.slide1 .slider-progress');
        const thumbs = document.querySelectorAll('.slide1 .slider-thumb');
        
        if (sliders.length > 0 && thumbs.length > 0) {
          const newWidth = 30 + progress * 50;
          sliders[0].style.width = `${newWidth}%`;
          thumbs[0].style.left = `${newWidth}%`;
        }
      }
      
      // Animate loading indicators in slide 2
      if (currentSlideIndex === 1) {
        const loadingBars = document.querySelectorAll('.slide2 .slider-progress');
        const percentages = document.querySelectorAll('.slide2 .loading-percentage');
        
        if (loadingBars.length > 0 && percentages.length > 0) {
          const newProgress1 = 20 + progress * 70;
          loadingBars[0].style.width = `${newProgress1}%`;
          percentages[0].textContent = `${Math.round(newProgress1)}%`;
          
          const newProgress2 = 40 + progress * 50;
          if (loadingBars.length > 1) {
            loadingBars[1].style.width = `${newProgress2}%`;
            percentages[1].textContent = `${Math.round(newProgress2)}%`;
          }
        }
      }
      
      // Animate graph in slide 3
      if (currentSlideIndex === 2) {
        const nodes = document.querySelectorAll('.slide3 .node, .slide3 .node-diamond, .slide3 .node-hexagon');
        
        nodes.forEach((node, index) => {
          const delay = index * 0.25;
          const nodeProgress = Math.max(0, Math.min(1, (progress - delay) * 2));
          
          if (nodeProgress > 0) {
            node.style.transform = node.className.includes('diamond') 
              ? `rotate(45deg) scale(${nodeProgress})` 
              : `scale(${nodeProgress})`;
            node.style.opacity = nodeProgress;
          } else {
            node.style.opacity = 0;
          }
        });
        
        const edges = document.querySelectorAll('.slide3 .edge');
        edges.forEach((edge, index) => {
          const delay = 0.5 + index * 0.15;
          const edgeProgress = Math.max(0, Math.min(1, (progress - delay) * 2));
          
          if (edgeProgress > 0) {
            const originalWidth = parseInt(edge.style.width);
            edge.style.width = `${originalWidth * edgeProgress}px`;
            edge.style.opacity = edgeProgress;
          } else {
            edge.style.opacity = 0;
          }
        });
      }
      
      // Animate metrics in slide 4
      if (currentSlideIndex === 3) {
        const metricBars = document.querySelectorAll('.slide4 [style*="position: absolute; height: 100%; width:"]');
        
        metricBars.forEach((bar, index) => {
          const delay = index * 0.2;
          const barProgress = Math.max(0, Math.min(1, (progress - delay) * 1.5));
          
          if (barProgress > 0) {
            const finalWidth = parseFloat(bar.style.width);
            bar.style.width = `${finalWidth * barProgress}%`;
          } else {
            bar.style.width = '0%';
          }
        });
      }
    };
  });
  
  // Capture frames
  console.log(`Capturing ${DURATION * FPS} frames...`);
  for (let i = 0; i < DURATION * FPS; i++) {
    // Set the current frame
    await page.evaluate((frame) => {
      window.setFrame(frame);
    }, i);
    
    // Wait for any animations to complete
    await page.waitForTimeout(10);
    
    // Capture screenshot
    const framePath = path.join(FRAMES_DIR, `frame_${String(i).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath });
    
    if (i % FPS === 0) {
      console.log(`Captured ${i / FPS} seconds of video...`);
    }
  }
  
  await browser.close();
  console.log('Frame capture complete!');
}

async function createVideo() {
  try {
    // Capture frames
    await captureFrames();
    
    // Use ffmpeg to create video from frames
    console.log('Creating video from frames...');
    const ffmpegCommand = `ffmpeg -y -framerate ${FPS} -i "${path.join(FRAMES_DIR, 'frame_%05d.png')}" -c:v libx264 -pix_fmt yuv420p -crf 23 "${VIDEO_PATH}"`;
    
    execSync(ffmpegCommand);
    console.log(`Video created at: ${VIDEO_PATH}`);
    
    // Clean up frames
    console.log('Cleaning up temporary files...');
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
    
    console.log('Video generation complete!');
  } catch (error) {
    console.error('Error creating video:', error);
  }
}

// Run the video creation process
createVideo().catch(console.error);