let detectedMedia = [];


// Listens for completed web requests and add media URLs based on extensions.
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const url = details.url;
    const mediaExtensions = ["mp4", "mp3", "webm", "ogg", "wav", "avi", "mov", "mkv", "jpg", "png", "gif", "jpeg"];
    if (mediaExtensions.some(ext => url.toLowerCase().includes("." + ext)) &&
        !detectedMedia.some(item => item.url === url)) {
      // Determine quality for video files
      const videoExtensions = ["mp4", "webm", "ogg", "avi", "mov", "mkv"];
      let quality = null;
      if (videoExtensions.some(ext => url.toLowerCase().includes("." + ext))) {
        quality = "default";
      }
      detectedMedia.push({ url: url, quality: quality });
      chrome.storage.sync.set({ mediaList: detectedMedia });
    }
  },
  { urls: ["<all_urls>"] }
);

// Function to scan page for media links including <a>, <iframe>, and <video> elements.
function scanForMediaLinks() {
  const mediaLinks = [];
  // Scan <a> elements.
  const linkElements = document.querySelectorAll("a");
  const mediaExtensions = ["mp4", "mp3", "webm", "jpg", "png", "gif", "jpeg", "avi", "mkv"];
  linkElements.forEach(link => {
    const href = link.href;
    if (href && mediaExtensions.some(ext => href.toLowerCase().includes("." + ext))) {
      mediaLinks.push({ url: href, quality: null });
    }
  });
  
  // Scan <iframe> elements for YouTube links.
  const iframeElements = document.querySelectorAll("iframe");
  iframeElements.forEach(iframe => {
    const src = iframe.src;
    if (src && src.toLowerCase().includes("youtube.com")) {
      mediaLinks.push({ url: src, quality: "YouTube" });
    }
  });
  
  // Scan <video> elements.
  const videoElements = document.querySelectorAll("video");
  videoElements.forEach(video => {
    const sources = video.querySelectorAll("source");
    if (sources.length > 0) {
      sources.forEach(source => {
        const src = source.src;
        // Use a custom data attribute (data-quality) if provided; otherwise default.
        let quality = source.getAttribute("data-quality") || "default";
        if (src) {
          mediaLinks.push({ url: src, quality: quality });
        }
      });
    } else if (video.src) {
      mediaLinks.push({ url: video.src, quality: "default" });
    }
  });
  
  if (mediaLinks.length) {
    detectedMedia = mediaLinks; // Replace current list with scanned results.
    chrome.storage.sync.set({ mediaList: detectedMedia });
  }
}

// Listen for messages to refresh media or download media.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshMedia") {
    // Query for the active tab in the current window.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: scanForMediaLinks
        }, () => {
          sendResponse({ mediaList: detectedMedia });
        });
      } else {
        sendResponse({ mediaList: detectedMedia });
      }
    });
    return true; // Indicates asynchronous response.
  } else if (message.action === "downloadMedia") {
    // message.url is the chosen URL (e.g., corresponding to the selected quality)
    chrome.downloads.download({ url: message.url });
  }
});
