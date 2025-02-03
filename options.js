document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["mediaTypes"], (data) => {
        if (data.mediaTypes) {
            document.getElementById("mp4").checked = data.mediaTypes.mp4;
            document.getElementById("mp3").checked = data.mediaTypes.mp3;
            document.getElementById("images").checked = data.mediaTypes.images;
        }
    });

    document.getElementById("save").addEventListener("click", () => {
        const mediaTypes = {
            mp4: document.getElementById("mp4").checked,
            mp3: document.getElementById("mp3").checked,
            images: document.getElementById("images").checked
        };

        chrome.storage.sync.set({ mediaTypes }, () => {
            alert("Settings saved!");
        });
    });
});
