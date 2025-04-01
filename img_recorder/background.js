// Image mime types to filter
const IMAGE_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp', 
  'image/svg+xml', 
  'image/bmp'
];

// Filter for webRequest API - now specifically targeting oaiusercontent.com
const requestFilter = {
  urls: ["*://*.oaiusercontent.com/*"],
  types: ["image", "media"]
};

// Track if we're recording
let isRecording = false;

// Set up listener for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startRecording') {
    startRecording();
  } else if (message.action === 'stopRecording') {
    stopRecording();
  }
});

// Check for initial state on startup
chrome.storage.local.get(['isRecording'], (result) => {
  if (result.isRecording) {
    startRecording();
  }
});

// Start recording images
function startRecording() {
  isRecording = true;
  chrome.storage.local.set({isRecording: true});
  
  // Add the webRequest listener
  chrome.webRequest.onCompleted.addListener(
    handleImageRequest,
    requestFilter
  );
  
  console.log('Image recording started - monitoring oaiusercontent.com only');
}

// Stop recording images
function stopRecording() {
  isRecording = false;
  chrome.storage.local.set({isRecording: false});
  
  // Remove the webRequest listener
  chrome.webRequest.onCompleted.removeListener(handleImageRequest);
  
  console.log('Image recording stopped');
}

// Handle image requests
function handleImageRequest(details) {
  if (!isRecording) return;
  
  // Only process successful requests
  if (details.statusCode !== 200) return;
  
  // Check if the URL is from oaiusercontent.com domain or subdomain
  const url = new URL(details.url);
  if (!url.hostname.endsWith('oaiusercontent.com')) {
    return; // Skip non-oaiusercontent.com domains
  }
  
  // Fetch the headers to check content type
  fetch(details.url, { method: 'HEAD' })
    .then(response => {
      const contentType = response.headers.get('content-type');
      
      // Check if this is an image
      if (contentType && IMAGE_TYPES.some(type => contentType.includes(type))) {
        downloadImage(details.url);
      }
    })
    .catch(error => {
      console.error('Error checking content type:', error);
    });
}

// Download the image
function downloadImage(url) {
  // Generate a filename based on the URL
  const filename = getFilenameFromUrl(url);
  
  chrome.downloads.download({
    url: url,
    filename: `oai_img_recorder/${filename}`,
    saveAs: false,
    conflictAction: 'uniquify'
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError);
    }
  });
}

// Generate a filename from URL
function getFilenameFromUrl(url) {
  try {
    // Try to extract filename from the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = pathname.split('/').pop();
    
    // If we couldn't get a filename or it doesn't look like an image
    if (!filename || !filename.includes('.')) {
      // Generate a unique filename with timestamp
      const date = new Date();
      const timestamp = date.toISOString().replace(/[:.]/g, '-');
      const extension = guessExtensionFromUrl(url) || 'jpg';
      filename = `image_${timestamp}.${extension}`;
    }
    
    return filename;
  } catch (e) {
    // Fallback if URL parsing fails
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    return `image_${timestamp}.jpg`;
  }
}

// Try to guess the file extension from URL or path
function guessExtensionFromUrl(url) {
  const extensionMatch = url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/i);
  return extensionMatch ? extensionMatch[1].toLowerCase() : null;
} 