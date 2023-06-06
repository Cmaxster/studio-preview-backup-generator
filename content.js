console.log('>> [content] script loaded..')
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('>> [content] received a message: ', request);
  sendResponse({status: "message received, processing..."});

  if (request.command === "takeScreenshot") {
    console.log('>> [content] take screenshot')
    const sizes = [[304, 604], [300, 250], [970, 250], [320, 50], [160, 600]];
    const iframes = Array.from(document.querySelectorAll('iframe'));
    console.log('>> [content] (take screenshot) gathering up all iframes: ',iframes);

    iframes.forEach((iframe) => {
      const rect = iframe.getBoundingClientRect();
      console.log('>> [content] for iframe ', rect)
      const roundedWidth = Math.round(rect.width);
      const roundedHeight = Math.round(rect.height);
      if (sizes.some(([width, height]) => roundedWidth === width && roundedHeight === height)) {
        console.log('>> [content] sending runtime message (processScreenshot) with an iframe of size:',{width: roundedWidth, height: roundedHeight})
        chrome.runtime.sendMessage({
          command: "processScreenshot",
          iframeHTML: iframe.outerHTML,
          width: roundedWidth,
          height: roundedHeight,
        });
      }
    });
  }
});
