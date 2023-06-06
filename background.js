console.log('>> [background] loaded!');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('>> [background] chrome runtime message heard!');
  
  if (request.command === "takeScreenshot") {
    console.log('>> [background] takeScreenshot heard, taking screenshot..')
    // Forward the takeScreenshot command to the content script
    chrome.tabs.query({active: true}, function(tabs) {
      console.log('>> [background] checking tabs: ',tabs)
      if (tabs.length > 0) {
        console.log('>> [background] sending message to tab: ', tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, {command: "takeScreenshot"}, function(response) {
          if (chrome.runtime.lastError) {
            console.log('>> [background] send message error: ', chrome.runtime.lastError.message);
          } else {
            console.log('>> [background] message sent successfully');
          }
        });
      } else {
        console.log('>> [background] No active tabs found');
      }
    });
  } else if (request.command === "processScreenshot" && request.iframeHTML) {
    console.log('>> [background] processScreenshot heard, processing screenshot..')
    const {iframeHTML, width, height} = request;

    // Save the original page HTML and replace it with the iframe HTML
    chrome.tabs.query({active:true}, function(tabs) {
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
            console.log('>> [background] (result of chrome scripting after active tab found) Original HTML is set to ',{originalHtml:originalHTML});
          });

          // Replace the page HTML with the iframe HTML
          // executeScript will run the script in the context of the page
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: function(iframeHTML) {
              console.log('>> [background] (scripting.executeScript) iframeHTML',iframeHTML);
              document.documentElement.innerHTML = iframeHTML;
            },
            args: [iframeHTML]
          }, function() {
            // this function is called after the previous executeScript has finished 
            // Capture the screenshot
            chrome.tabs.captureVisibleTab(tab.windowId, {format: "jpeg"}, function(dataUrl) {
              console.log('>> [background] capturing the screenshot.. dataURL:',dataUrl)
              // Handle the screenshot data
              let blob = dataURLtoBlob(dataUrl);
              console.log('>> [background] blob = ',blob);
              let objectUrl = URL.createObjectURL(blob);
              console.log('>> [background] createObjectURL = ',objectUrl);

              // Generate a filename for the screenshot
              let filename = `screenshot_${width}x${height}.jpeg`;
              console.log('>> [background] filename = ',filename);

              // Download the screenshot
              chrome.downloads.download({
                url: objectUrl,
                filename: filename
              });
              console.log('>> [background] screenshot downloaded..');
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
  // a blob is a file-like object that contains raw data
  // arr is an array of strings, where the first element is the mime type
  let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
  // bstr is a binary string representation of the data
  let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  // here we are returning a blob, which is a file-like object that contains raw data
  return new Blob([u8arr], {type:mime});
}
