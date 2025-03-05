# OpenSVM UI Enhancements Demo Video

This directory contains files related to the demonstration video of the UI enhancements implemented in OpenSVM.

## Video Generation Instructions

### Prerequisites

- Node.js 16+
- npm or yarn
- Puppeteer and Puppeteer Screen Recorder (installed via package.json)
- Running OpenSVM development server

### How to Generate the Demo Video

1. Ensure the OpenSVM development server is running:
   ```
   npm run dev
   ```

2. Open a new terminal and run the recording script:
   ```
   node scripts/record-demo.js
   ```

3. The script will:
   - Launch a headless browser
   - Navigate through the UI enhancements
   - Add explanatory overlays
   - Record interactions with the components
   - Save an MP4 file in this directory named `opensvm-ui-enhancements-demo.mp4`

4. After recording, you may want to add narration or additional editing with a video editing tool

### Recording Script Details

The recording script (`scripts/record-demo.js`) automates the following process:

1. Launches Puppeteer browser with 1920x1080 resolution
2. Visits the demo page to showcase the enhanced UI components
3. Interacts with sliders and other UI elements
4. Navigates to the transaction graph demo
5. Shows transaction details with demo data support
6. Displays the future development roadmap
7. Ends with a summary screen

The script adds text overlays to explain features during the recording.

### Video Content Structure

The video follows the structure outlined in `demo-video-script.md`:

1. Introduction (0:00-0:30)
2. Enhanced UI Design Showcase (0:30-2:00)
3. Data Visualization Enhancements (2:00-3:30)
4. Transaction Graph Demo (3:30-5:00)
5. Transaction Details with Demo Data (5:00-6:30)
6. Future Development Roadmap (6:30-7:30)
7. Conclusion (7:30-8:00)

### Output

The recording process generates:

1. `opensvm-ui-enhancements-demo.mp4` - The demonstration video file
2. `social-media-announcement.md` - Text for social media announcements

## Manual Walkthrough Alternative

If automatic recording fails, you can manually walk through the application while screen recording:

1. Start a screen recording application
2. Visit http://localhost:3000/demo in your browser
3. Interact with the UI components following the script in `demo-video-script.md`
4. Visit http://localhost:3000/demo-graph to show the transaction graph
5. Visit http://localhost:3000/tx/4RwR2w12LydcoutGYJz2TbVxY8HVV44FCN2xoo1L9xu7ZcFxFBpoxxpSFTRWf9MPwMzmr9yTuJZjGqSmzcrawF43 to show transaction details
6. Stop the recording and save as MP4

## Related Files

- `demo-video-script.md` - Detailed script for the video demonstration
- `social-media-announcement.md` - Text for social media posts about the updates
- `../scripts/record-demo.js` - Script to automatically record the demo