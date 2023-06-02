console.log('>> [background] loaded!');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('>> [background] chrome runtime message heard!');
  
  if (request.command === "takeScreenshot") { // t
    console.log('>> [background] takeScreenshot heard, taking screenshot..')
    // Forward the takeScreenshot command to the content script
    chrome.tabs.query({active:true, currentWindow: true, highlighted: true}, function(tabs) {
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
            });
          });
        });
      } else {
        console.log('>> [background] No active tabs found');
      }
    });
  }
});
