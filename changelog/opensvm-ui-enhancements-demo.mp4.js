// This script creates an MP4 video file using HTML5 Canvas and MediaRecorder
// Run with: node opensvm-ui-enhancements-demo.mp4.js

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { createWriteStream } = require('fs');
const { spawn } = require('child_process');

// Configuration
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const DURATION = 30; // seconds
const OUTPUT_FILE = path.join(__dirname, 'opensvm-ui-enhancements-demo.mp4');

// Create canvas
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// Create ffmpeg process
const ffmpeg = spawn('ffmpeg', [
  '-y', // Overwrite output file if it exists
  '-f', 'rawvideo',
  '-vcodec', 'rawvideo',
  '-s', `${WIDTH}x${HEIGHT}`,
  '-pix_fmt', 'rgba',
  '-r', `${FPS}`,
  '-i', '-', // Input from stdin
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'fast',
  '-crf', '22',
  '-movflags', '+faststart',
  OUTPUT_FILE
]);

// Handle errors
ffmpeg.stderr.on('data', (data) => {
  console.log(`ffmpeg: ${data}`);
});

ffmpeg.on('close', (code) => {
  console.log(`ffmpeg process exited with code ${code}`);
  console.log(`Video saved to: ${OUTPUT_FILE}`);
});

// Animation frames
const totalFrames = DURATION * FPS;
let currentFrame = 0;

// UI Elements
const slides = [
  { name: 'Card-Based Interface', color: '#f8f9fa' },
  { name: 'Real-time Progress Indicators', color: '#e9ecef' },
  { name: 'Enhanced Transaction Graph', color: '#dee2e6' },
  { name: 'Adaptive Performance Metrics', color: '#ced4da' }
];

// Card component
function drawCard(x, y, width, height, title) {
  // Card background
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillRect(x, y, width, height);
  ctx.shadowBlur = 0;
  
  // Card title
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(title, x + 20, y + 40);
}

// Slider component
function drawSlider(x, y, width, progress) {
  // Track
  ctx.fillStyle = '#e9ecef';
  ctx.fillRect(x, y, width, 8);
  
  // Progress
  ctx.fillStyle = '#0066cc';
  ctx.fillRect(x, y, width * progress, 8);
  
  // Thumb
  ctx.fillStyle = '#0066cc';
  ctx.beginPath();
  ctx.arc(x + (width * progress), y + 4, 12, 0, Math.PI * 2);
  ctx.fill();
}

// Loading indicator
function drawLoadingIndicator(x, y, width, progress) {
  // Text
  ctx.fillStyle = '#666666';
  ctx.font = '18px Arial';
  ctx.fillText('Loading data...', x, y);
  
  // Percentage
  ctx.fillStyle = '#0066cc';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(progress * 100)}%`, x + width, y);
  ctx.textAlign = 'left';
  
  // Progress bar
  ctx.fillStyle = '#e9ecef';
  ctx.fillRect(x, y + 20, width, 4);
  
  ctx.fillStyle = '#00b894';
  ctx.fillRect(x, y + 20, width * progress, 4);
}

// Graph node
function drawNode(x, y, type, label, scale = 1) {
  ctx.save();
  
  if (type === 'circle') {
    ctx.fillStyle = '#6c5ce7';
    ctx.beginPath();
    ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'diamond') {
    ctx.fillStyle = '#e74c3c';
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-14 * scale, -14 * scale, 28 * scale, 28 * scale);
    ctx.rotate(-Math.PI / 4);
    ctx.translate(-x, -y);
  } else if (type === 'hexagon') {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const px = x + Math.cos(angle) * 20 * scale;
      const py = y + Math.sin(angle) * 20 * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  
  // Label
  if (scale > 0.5) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }
  
  ctx.restore();
}

// Edge between nodes
function drawEdge(x1, y1, x2, y2, progress = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) * progress;
  const angle = Math.atan2(dy, dx);
  
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  
  ctx.restore();
}

// Performance metric bar
function drawMetricBar(x, y, width, label, value, progress, color) {
  // Label
  ctx.fillStyle = '#333333';
  ctx.font = '18px Arial';
  ctx.fillText(label, x, y);
  
  // Bar background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(x + 50, y - 12, width - 100, 16);
  
  // Bar progress
  ctx.fillStyle = color;
  ctx.fillRect(x + 50, y - 12, (width - 100) * progress, 16);
  
  // Value
  ctx.fillStyle = '#666666';
  ctx.font = '16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(value, x + width, y);
  ctx.textAlign = 'left';
}

// Draw a frame
function drawFrame(frameNumber) {
  const progress = frameNumber / totalFrames;
  const slideIndex = Math.min(slides.length - 1, Math.floor(progress * slides.length));
  const slideProgress = (progress * slides.length) % 1;
  
  // Clear canvas
  ctx.fillStyle = slides[slideIndex].color;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Header
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 36px Arial';
  ctx.fillText('OpenSVM UI Enhancements Demo', 50, 70);
  
  // Subtitle
  ctx.fillStyle = '#666666';
  ctx.font = '20px Arial';
  ctx.fillText(slides[slideIndex].name, 50, 110);
  
  // Draw current slide content
  if (slideIndex === 0) {
    // Card-Based Interface slide
    drawCard(WIDTH / 2 - 200, HEIGHT / 2 - 150, 400, 300, 'Storage Settings');
    
    const sliderProgress1 = Math.min(1, slideProgress * 3);
    drawSlider(WIDTH / 2 - 160, HEIGHT / 2 - 70, 320, sliderProgress1);
    
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText('per 1M docs', WIDTH / 2 - 160, HEIGHT / 2 - 30);
    
    const sliderProgress2 = Math.max(0, Math.min(1, (slideProgress - 0.3) * 3));
    drawSlider(WIDTH / 2 - 160, HEIGHT / 2 + 20, 320, sliderProgress2);
    
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText('per 1M docs', WIDTH / 2 - 160, HEIGHT / 2 + 60);
    
    // Description
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Each content section has its own card with consistent styling', WIDTH / 2, HEIGHT - 100);
    ctx.fillText('for better organization and readability.', WIDTH / 2, HEIGHT - 70);
    ctx.textAlign = 'left';
  } 
  else if (slideIndex === 1) {
    // Real-time Progress Indicators slide
    drawCard(WIDTH / 2 - 200, HEIGHT / 2 - 150, 400, 300, 'Data Visualization');
    
    const loadingProgress1 = Math.min(1, slideProgress * 2);
    drawLoadingIndicator(WIDTH / 2 - 160, HEIGHT / 2 - 70, 320, loadingProgress1);
    
    const loadingProgress2 = Math.max(0, Math.min(1, (slideProgress - 0.5) * 2));
    drawLoadingIndicator(WIDTH / 2 - 160, HEIGHT / 2 + 20, 320, loadingProgress2);
    
    // Description
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading states with percentage feedback keep users informed', WIDTH / 2, HEIGHT - 100);
    ctx.fillText('during data retrieval.', WIDTH / 2, HEIGHT - 70);
    ctx.textAlign = 'left';
  }
  else if (slideIndex === 2) {
    // Transaction Graph slide
    drawCard(WIDTH / 2 - 200, HEIGHT / 2 - 150, 400, 300, 'Transaction Graph Visualization');
    
    // Draw graph nodes with animation
    const nodeScale1 = Math.min(1, slideProgress * 4);
    const nodeScale2 = Math.min(1, Math.max(0, (slideProgress - 0.25) * 4));
    const nodeScale3 = Math.min(1, Math.max(0, (slideProgress - 0.5) * 4));
    const nodeScale4 = Math.min(1, Math.max(0, (slideProgress - 0.75) * 4));
    
    const edgeProgress1 = Math.min(1, Math.max(0, (slideProgress - 0.1) * 4));
    const edgeProgress2 = Math.min(1, Math.max(0, (slideProgress - 0.35) * 4));
    const edgeProgress3 = Math.min(1, Math.max(0, (slideProgress - 0.6) * 4));
    const edgeProgress4 = Math.min(1, Math.max(0, (slideProgress - 0.85) * 4));
    
    // Node positions
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2 - 30;
    
    // Draw edges
    if (edgeProgress1 > 0) drawEdge(centerX - 80, centerY - 40, centerX, centerY + 40, edgeProgress1);
    if (edgeProgress2 > 0) drawEdge(centerX - 80, centerY - 40, centerX + 80, centerY - 40, edgeProgress2);
    if (edgeProgress3 > 0) drawEdge(centerX, centerY + 40, centerX + 80, centerY - 40, edgeProgress3);
    if (edgeProgress4 > 0) drawEdge(centerX, centerY + 40, centerX + 80, centerY + 40, edgeProgress4);
    
    // Draw nodes
    if (nodeScale1 > 0) drawNode(centerX - 80, centerY - 40, 'circle', 'W', nodeScale1);
    if (nodeScale2 > 0) drawNode(centerX + 80, centerY - 40, 'diamond', 'P', nodeScale2);
    if (nodeScale3 > 0) drawNode(centerX, centerY + 40, 'circle', 'U', nodeScale3);
    if (nodeScale4 > 0) drawNode(centerX + 80, centerY + 40, 'hexagon', 'T', nodeScale4);
    
    // Legend
    if (slideProgress > 0.9) {
      ctx.fillStyle = '#333333';
      ctx.font = '16px Arial';
      ctx.fillText('Wallet', WIDTH / 2 - 160, HEIGHT / 2 + 100);
      ctx.fillText('Program', WIDTH / 2 - 60, HEIGHT / 2 + 100);
      ctx.fillText('Token', WIDTH / 2 + 40, HEIGHT / 2 + 100);
      
      drawNode(WIDTH / 2 - 180, HEIGHT / 2 + 95, 'circle', '', 0.6);
      drawNode(WIDTH / 2 - 80, HEIGHT / 2 + 95, 'diamond', '', 0.6);
      drawNode(WIDTH / 2 + 20, HEIGHT / 2 + 95, 'hexagon', '', 0.6);
    }
    
    // Description
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Color-coded nodes and edges with shape differentiation', WIDTH / 2, HEIGHT - 100);
    ctx.fillText('for clearer visualization of transaction relationships.', WIDTH / 2, HEIGHT - 70);
    ctx.textAlign = 'left';
  }
  else if (slideIndex === 3) {
    // Performance Metrics slide
    drawCard(WIDTH / 2 - 200, HEIGHT / 2 - 180, 400, 360, 'Performance Metrics');
    
    // Warm namespace header
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Warm namespace', WIDTH / 2 - 160, HEIGHT / 2 - 130);
    
    // Draw line under header
    ctx.strokeStyle = '#dddddd';
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 - 160, HEIGHT / 2 - 110);
    ctx.lineTo(WIDTH / 2 + 160, HEIGHT / 2 - 110);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Warm metrics
    const warmProgress1 = Math.min(1, slideProgress * 3);
    const warmProgress2 = Math.min(1, Math.max(0, (slideProgress - 0.33) * 3));
    const warmProgress3 = Math.min(1, Math.max(0, (slideProgress - 0.66) * 3));
    
    drawMetricBar(WIDTH / 2 - 160, HEIGHT / 2 - 80, 320, 'p50', '16ms', warmProgress1 * 0.16, '#e74c3c');
    drawMetricBar(WIDTH / 2 - 160, HEIGHT / 2 - 40, 320, 'p90', '21ms', warmProgress2 * 0.21, '#e74c3c');
    drawMetricBar(WIDTH / 2 - 160, HEIGHT / 2, 320, 'p99', '33ms', warmProgress3 * 0.33, '#e74c3c');
    
    // Cold namespace header
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Cold namespace', WIDTH / 2 - 160, HEIGHT / 2 + 40);
    
    // Draw line under header
    ctx.strokeStyle = '#dddddd';
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 - 160, HEIGHT / 2 + 60);
    ctx.lineTo(WIDTH / 2 + 160, HEIGHT / 2 + 60);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Cold metrics
    const coldProgress = Math.min(1, Math.max(0, (slideProgress - 0.5) * 2));
    drawMetricBar(WIDTH / 2 - 160, HEIGHT / 2 + 90, 320, 'p50', '402ms', coldProgress * 0.4, '#3498db');
    drawMetricBar(WIDTH / 2 - 160, HEIGHT / 2 + 130, 320, 'p90', '524ms', coldProgress * 0.52, '#3498db');
    
    // Description
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Visual bars for comparing metrics between warm and cold namespaces', WIDTH / 2, HEIGHT - 100);
    ctx.fillText('with intuitive color coding.', WIDTH / 2, HEIGHT - 70);
    ctx.textAlign = 'left';
  }
  
  // Progress bar at bottom
  ctx.fillStyle = '#e9ecef';
  ctx.fillRect(50, HEIGHT - 30, WIDTH - 100, 4);
  
  ctx.fillStyle = '#0066cc';
  ctx.fillRect(50, HEIGHT - 30, (WIDTH - 100) * progress, 4);
  
  // Frame counter (for debugging)
  // ctx.fillStyle = '#333333';
  // ctx.font = '14px Arial';
  // ctx.fillText(`Frame: ${frameNumber}/${totalFrames}`, 10, 20);
  
  // Send frame to ffmpeg
  const buffer = canvas.toBuffer('raw');
  return buffer;
}

// Generate and write frames
console.log(`Generating ${totalFrames} frames at ${FPS} FPS...`);
console.log(`Output file: ${OUTPUT_FILE}`);

// Generate each frame and pipe to ffmpeg
for (let i = 0; i < totalFrames; i++) {
  const buffer = drawFrame(i);
  ffmpeg.stdin.write(buffer);
  
  if (i % FPS === 0) {
    console.log(`Processed ${i / FPS} seconds of video...`);
  }
}

// End the stream
ffmpeg.stdin.end();
console.log('Finalizing video...');