chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "takeScreenshot") {
    console.log('>> [content] take screenshot')
    const sizes = [[300, 600], [300, 250], [970, 250], [320, 50], [160, 600]];
    const iframes = Array.from(document.querySelectorAll('iframe'));

    iframes.forEach((iframe) => {
      const rect = iframe.getBoundingClientRect();
      console.log('>> [content] for iframe ',rect)
      if (sizes.some(([width, height]) => rect.width === width && rect.height === height)) {
        chrome.runtime.sendMessage({
          command: "processScreenshot",
          iframeHTML: iframe.outerHTML,
          width: rect.width,
          height: rect.height,
        });
      }
    });
  }
});
