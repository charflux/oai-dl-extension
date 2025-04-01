document.addEventListener('DOMContentLoaded', function() {
  const recordBtn = document.getElementById('recordBtn');
  const statusDiv = document.getElementById('status');
  const indicatorIcon = document.querySelector('.indicator-icon');
  let isRecording = false;

  // Check current recording state
  chrome.storage.local.get(['isRecording'], function(result) {
    isRecording = result.isRecording || false;
    updateUI();
  });

  // Toggle recording state
  recordBtn.addEventListener('click', function() {
    isRecording = !isRecording;
    
    // Save state to storage
    chrome.storage.local.set({isRecording: isRecording});
    
    // Send message to background script
    chrome.runtime.sendMessage({
      action: isRecording ? 'startRecording' : 'stopRecording'
    });
    
    updateUI();
  });

  // Update UI based on recording state
  function updateUI() {
    if (isRecording) {
      recordBtn.textContent = 'Stop';
      recordBtn.classList.add('recording');
      statusDiv.textContent = 'Recording in progress...';
      statusDiv.classList.add('pulsing');
      
      // Show and animate the red circle during recording
      indicatorIcon.classList.add('recording');
      
      // The stop icon is handled with CSS ::before on the button
    } else {
      recordBtn.textContent = 'Record';
      recordBtn.classList.remove('recording');
      statusDiv.textContent = '';
      statusDiv.classList.remove('pulsing');
      
      // Keep the red circle visible but not pulsing or glowing
      indicatorIcon.classList.remove('recording');
      indicatorIcon.classList.remove('stopped');
    }
  }
}); 