document.addEventListener("DOMContentLoaded", () => {
    let settingsPage = document.getElementById("settingsPage");
    if (!settingsPage) {
        console.error("settingsPage element not found!");
        return;
    }

    function loadMediaList() {
        chrome.storage.sync.get(["mediaList"], (data) => {
            let mediaUrls = data.mediaList || [];
            let mediaListDiv = document.getElementById("mediaList");
            if (!mediaListDiv) {
                console.error("mediaList element not found!");
                return;
            }

            mediaListDiv.innerHTML = ""; // Clear previous list
            if (mediaUrls.length === 0) {
                mediaListDiv.innerHTML = "<p>No media detected.</p>";
                return;
            }

            mediaUrls.forEach(url => {
                let item = document.createElement("div");
                item.className = "media-item";

                let qualitySelect = document.createElement("select");
                qualitySelect.innerHTML = `
                    <option value="Original">Original</option>
                    <option value="HD">HD</option>
                    <option value="SD">SD</option>
                `;

                let checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = url;
                checkbox.checked = true;

                let link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.textContent = url.split('/').pop();
                link.style.marginLeft = "10px";

                item.appendChild(checkbox);
                item.appendChild(link);
                item.appendChild(qualitySelect);
                mediaListDiv.appendChild(item);
            });
        });
    }

    // Reload media list on "Reload" button click
    document.getElementById("reload").addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "refreshMedia" }, () => {
            setTimeout(loadMediaList, 500); // Delay to ensure media list updates
        });
    });

    // Handle download selected media
    document.getElementById("downloadSelected").addEventListener("click", () => {
        let selectedMedia = document.querySelectorAll(".media-item");
        selectedMedia.forEach(item => {
            let checkbox = item.querySelector("input[type='checkbox']");
            let quality = item.querySelector("select").value;

            if (checkbox.checked) {
                chrome.runtime.sendMessage({
                    action: "downloadMedia",
                    url: checkbox.value,
                    quality: quality
                });
            }
        });
    });

    // Handle settings page
    document.getElementById("settings").addEventListener("click", () => {
        settingsPage.classList.add("active");
        document.getElementById("mainPage").classList.remove("active");
    });

    document.getElementById("back").addEventListener("click", () => {
        settingsPage.classList.remove("active");
        document.getElementById("mainPage").classList.add("active");
    });

    document.getElementById("saveSettings").addEventListener("click", () => {
        const mediaTypes = {
            mp4: document.getElementById("mp4").checked,
            mp3: document.getElementById("mp3").checked,
            images: document.getElementById("images").checked
        };

        chrome.storage.sync.set({ mediaTypes }, () => {
            alert("Settings saved!");
        });
    });

    // Theme toggle
    let themeToggle = document.getElementById("themeToggle");
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        let mode = document.body.classList.contains("light-mode") ? "light" : "dark";
        chrome.storage.sync.set({ theme: mode });
    });

    // Load saved theme
    chrome.storage.sync.get(["theme"], (data) => {
        if (data.theme === "light") {
            document.body.classList.add("light-mode");
        }
    });

    loadMediaList(); // Load media list initially
});
