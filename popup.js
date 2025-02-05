document.addEventListener("DOMContentLoaded", () => {
    // Function to load media list from storage and build the UI.
    function loadMediaList() {
        chrome.storage.sync.get(["mediaList"], (data) => {
            let mediaItems = data.mediaList || [];
            let mediaListDiv = document.getElementById("mediaList");
            mediaListDiv.innerHTML = "";
    
            if (mediaItems.length === 0) {
                mediaListDiv.innerHTML = "<p>No media detected.</p>";
                return;
            }
    
            // Group media items by filename.
            const grouped = {};
            mediaItems.forEach(item => {
                let filename = item.url.split('/').pop();
                if (!grouped[filename]) {
                    grouped[filename] = [];
                }
                grouped[filename].push(item);
            });
    
            // For each group, create an entry.
            for (let filename in grouped) {
                let group = grouped[filename];
                let itemDiv = document.createElement("div");
                itemDiv.className = "media-item";
    
                let checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                // Set default value to the first URL.
                checkbox.value = group[0].url;
                checkbox.checked = true;
    
                let span = document.createElement("span");
                span.textContent = filename;
                span.className = "media-link";
    
                itemDiv.appendChild(checkbox);
                itemDiv.appendChild(span);
    
                // If more than one quality option is available, add a dropdown.
                if (group.length > 1) {
                    let select = document.createElement("select");
                    group.forEach(optionItem => {
                        let option = document.createElement("option");
                        option.value = optionItem.url;
                        // Display the quality label; if quality is "default" or null, show "Default"
                        option.textContent = (optionItem.quality && optionItem.quality !== "default") ? optionItem.quality : "Default";
                        select.appendChild(option);
                    });
                    // When selection changes, update the checkbox value.
                    select.addEventListener("change", function() {
                        checkbox.value = this.value;
                    });
                    itemDiv.appendChild(select);
                } else if (group[0].quality && group[0].quality !== "default" && group[0].quality !== "YouTube") {
                    // Optionally, for a single quality option that is not "default" or "YouTube", display it.
                    let qualityLabel = document.createElement("span");
                    qualityLabel.textContent = group[0].quality;
                    qualityLabel.style.marginLeft = "10px";
                    itemDiv.appendChild(qualityLabel);
                }
    
                mediaListDiv.appendChild(itemDiv);
            }
        });
    }
    
    // Reload button: add spin effect during reload.
    document.getElementById("reload").addEventListener("click", () => {
        let reloadIcon = document.querySelector("#reload i");
        if (reloadIcon) {
            reloadIcon.classList.add("spin-animation");
        }
        chrome.runtime.sendMessage({ action: "refreshMedia" }, () => {
            loadMediaList();
            setTimeout(() => {
                if (reloadIcon) {
                    reloadIcon.classList.remove("spin-animation");
                }
            }, 1000);
        });
    });
    
    // Download button: add loader effect during download.
    document.getElementById("downloadSelected").addEventListener("click", () => {
        let downloadIcon = document.querySelector("#downloadSelected i");
        if (downloadIcon) {
            downloadIcon.classList.add("downloading");
        }
    
        let selectedMedia = document.querySelectorAll(".media-item input:checked");
        selectedMedia.forEach(item => {
            chrome.runtime.sendMessage({
                action: "downloadMedia",
                url: item.value
            });
        });
    
        setTimeout(() => {
            if (downloadIcon) {
                downloadIcon.classList.remove("downloading");
            }
        }, 3000);
    });
    
    // Select All functionality.
    document.getElementById("selectAll").addEventListener("click", () => {
        let checkboxes = document.querySelectorAll(".media-item input[type='checkbox']");
        let allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    });
    
    // Initial load of media list.
    loadMediaList();
    
    // Handle settings popup.
    let settingsPopup = document.getElementById("settingsPopup");
    document.getElementById("settings").addEventListener("click", () => {
        let settingsIcon = document.querySelector("#settings i");
        if (settingsIcon) {
            settingsIcon.classList.add("button-clicked");
        }
        settingsPopup.style.display = "block";
        setTimeout(() => {
            if (settingsIcon) {
                settingsIcon.classList.remove("button-clicked");
            }
        }, 300);
    
        chrome.storage.sync.get(["theme", "mediaTypes"], (data) => {
            if (data.theme) {
                document.getElementById("themeSelect").value = data.theme;
            }
            if (data.mediaTypes) {
                document.getElementById("video").checked = data.mediaTypes.video || false;
                document.getElementById("audio").checked = data.mediaTypes.audio || false;
                document.getElementById("images").checked = data.mediaTypes.images || false;
            }
        });
    });
    
    document.getElementById("closeSettings").addEventListener("click", () => {
        settingsPopup.style.display = "none";
    });
    
    // Save settings and apply theme changes.
    document.getElementById("saveSettings").addEventListener("click", () => {
        const theme = document.getElementById("themeSelect").value;
        const mediaTypes = {
            video: document.getElementById("video").checked,
            audio: document.getElementById("audio").checked,
            images: document.getElementById("images").checked
        };
    
        chrome.storage.sync.set({ theme, mediaTypes }, () => {
            // Instead of alert(), show a styled message.
            showAlert("Settings saved!");
            settingsPopup.style.display = "none";
    
            applyTheme(theme);
        });
    });
    
    // Function to apply theme changes.
    function applyTheme(theme) {
        if (theme === "light") {
            document.body.classList.add("light-mode");
        } else {
            document.body.classList.remove("light-mode");
        }
    }
    
    // Function to show a styled alert message.
    function showAlert(message) {
        const alertDiv = document.getElementById("alertMessage");
        const alertText = document.getElementById("alertText");
        alertText.textContent = message;
        alertDiv.style.display = "flex";
    }
    
    // Close alert when clicking its close button.
    document.getElementById("alertClose").addEventListener("click", () => {
        document.getElementById("alertMessage").style.display = "none";
    });
    
    // Load saved theme on start.
    chrome.storage.sync.get(["theme"], (data) => {
        if (data.theme === "light") {
            document.body.classList.add("light-mode");
        }
    });
});
