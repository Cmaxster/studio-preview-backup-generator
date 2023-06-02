console.log('>> [popup] extension loaded..')
document.getElementById("screenshot-button").addEventListener("click", function() {
  console.log('>> [popup] button pressed!');
  chrome.runtime.sendMessage({command: "takeScreenshot"});
});
