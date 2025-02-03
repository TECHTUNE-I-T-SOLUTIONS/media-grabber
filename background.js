const allowedExtensions = [".mp4", ".webm", ".mp3", ".wav", ".jpg", ".png", ".gif"];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "downloadMedia") {
        let { url, quality } = message;

        // Append quality to filename if applicable
        let filename = url.split('/').pop().split('?')[0];
        if (quality && quality !== "Original") {
            filename = filename.replace(/(\.[a-z0-9]+)$/i, `_${quality}$1`);
        }

        chrome.downloads.download({
            url: url,
            filename: filename
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download Error:", chrome.runtime.lastError.message);
                sendResponse({ status: "error", message: chrome.runtime.lastError.message });
            } else {
                sendResponse({ status: "success", downloadId });
            }
        });

        return true; // Keeps the message port open
    }

    if (message.action === "refreshMedia") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: scanForMedia
            }).then(() => {
                sendResponse({ status: "success", message: "Media refreshed" });
            }).catch((err) => {
                console.error("Error executing script:", err);
                sendResponse({ status: "error", message: err.message });
            });
        });

        return true; // Keeps the message port open
    }
});

// Function to scan media on the page
function scanForMedia() {
    let mediaElements = document.querySelectorAll("video, audio, img, source");
    let mediaList = [];

    mediaElements.forEach(media => {
        let src = media.src || media.getAttribute("src");
        if (src && allowedExtensions.some(ext => src.endsWith(ext))) {
            mediaList.push(src);
        }
    });

    // Store the list of media URLs in chrome storage
    chrome.storage.sync.set({ mediaList: mediaList }, () => {
        console.log("Media list updated:", mediaList);
    });
}
