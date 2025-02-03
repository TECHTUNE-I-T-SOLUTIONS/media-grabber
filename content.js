const mediaElements = document.querySelectorAll("video, audio, img, source");

mediaElements.forEach((media) => {
    let url = media.src || media.getAttribute("src");
    if (url) {
        chrome.runtime.sendMessage({
            action: "downloadMedia",
            url: url
        });
    }
});
