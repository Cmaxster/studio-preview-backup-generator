console.log('>> [background] loaded!');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('>> [background] chrome runtime message heard!');
  
  if (request.command === "takeScreenshot") {
    console.log('>> [background] takeScreenshot heard, taking screenshot..')
    // Forward the takeScreenshot command to the content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {command: "takeScreenshot"});
      } else {
        console.log('>> [background] No active tabs found');
      }
    });
  } else if (request.command === "processScreenshot" && request.iframeHTML) {
    console.log('>> [background] processScreenshot heard, processing screenshot..')
    const {iframeHTML, width, height} = request;

    // Save the original page HTML and replace it with the iframe HTML
    chrome.tabs.query({currentWindow: true, highlighted: true}, function(tabs) {
      if (tabs.length > 0) {
        const tab = tabs[0];

        // Save the original page HTML
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: function() {
            return document.documentElement.outerHTML;
          }
        }, function([result]) {
          const originalHTML = result.result;
          // Store the original HTML to chrome.storage
          chrome.storage.local.set({originalHTML: originalHTML}, function() {
            console.log('Original HTML is set to ' + originalHTML);
          });

          // Replace the page HTML with the iframe HTML
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: function(iframeHTML) {
              document.documentElement.innerHTML = iframeHTML;
            },
            args: [iframeHTML]
          }, function() {
            console.log('>> [background] capturing the screenshot..')
            // Capture the screenshot
            chrome.tabs.captureVisibleTab(tab.windowId, {format: "jpeg"}, function(dataUrl) {
              // Handle the screenshot data
              const blob = dataURLtoBlob(dataUrl);
              const objectUrl = URL.createObjectURL(blob);

              // Generate a filename for the screenshot
              const filename = `screenshot_${width}x${height}.jpeg`;

              // Download the screenshot
              chrome.downloads.download({
                url: objectUrl,
                filename: filename
              });
            });
          });
        });
      } else {
        console.log('>> [background] No active tabs found');
      }
    });
  }
});

// Function to convert dataURL to Blob object
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}
