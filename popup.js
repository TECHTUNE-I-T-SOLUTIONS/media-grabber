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
                // Default value is the first URL.
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
                        option.textContent = (optionItem.quality && optionItem.quality !== "default") ? optionItem.quality : "Default";
                        select.appendChild(option);
                    });
                    // When selection changes, update the checkbox value.
                    select.addEventListener("change", function() {
                        checkbox.value = this.value;
                    });
                    itemDiv.appendChild(select);
                } else if (group[0].quality && group[0].quality !== "default" && group[0].quality !== "YouTube") {
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
    
    // Clear Media functionality.
    document.getElementById("clearMedia").addEventListener("click", () => {
        chrome.storage.sync.remove("mediaList", () => {
            // Clear our in-memory media list as well.
            // Optionally, you could also set detectedMedia = [] in the background.
            loadMediaList();
            showAlert("Media list cleared.");
        });
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
    
    // Save settings and apply theme changes with a styled alert.
    document.getElementById("saveSettings").addEventListener("click", () => {
        const theme = document.getElementById("themeSelect").value;
        const mediaTypes = {
            video: document.getElementById("video").checked,
            audio: document.getElementById("audio").checked,
            images: document.getElementById("images").checked
        };
    
        chrome.storage.sync.set({ theme, mediaTypes }, () => {
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
        alertDiv.classList.remove("hide");
        // Automatically fade out after 7 seconds.
        setTimeout(() => {
            alertDiv.classList.add("hide");
            setTimeout(() => {
                alertDiv.style.display = "none";
            }, 1000);
        }, 3000);
    }
    
    // Close alert when clicking its close button.
    document.getElementById("alertClose").addEventListener("click", () => {
        const alertDiv = document.getElementById("alertMessage");
        alertDiv.classList.add("hide");
        setTimeout(() => {
            alertDiv.style.display = "none";
        }, 1000);
    });
    
    // Manual Download Popup handling.
    let manualPopup = document.getElementById("manualDownloadPopup");
    document.getElementById("openManual").addEventListener("click", () => {
        manualPopup.style.display = "block";
    });
    document.getElementById("closeManualPopup").addEventListener("click", () => {
        manualPopup.style.display = "none";
    });
    
    // Fetch manual data using Apify API.
    document.getElementById("fetchManualData").addEventListener("click", () => {
        const url = document.getElementById("manualUrl").value.trim();
        if (!url) {
            showAlert("Please enter a URL.");
            return;
        }
    
        // Call Apify API to run the actor with input { url: url }.
        fetch("https://api.apify.com/v2/acts/easyapi~all-in-one-media-downloader/runs?token=apify_api_xox3aUN4Q1klL4xBSst8dIxljwlhiX1Kuij6", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        })
        .then(response => response.json())
        .then(data => {
            // Assume the actor returns its output immediately in data.data.output.
            const output = data.data && data.data.output;
            const resultsDiv = document.getElementById("manualResults");
            resultsDiv.innerHTML = "";
    
            if (!output || !output.results || !output.results.length) {
                resultsDiv.innerHTML = "<p>No media found.</p>";
                document.getElementById("manualDownloadBtn").style.display = "none";
                return;
            }
    
            // Create a dropdown with the quality options.
            let select = document.createElement("select");
            output.results.forEach(item => {
                let option = document.createElement("option");
                option.value = item.downloadUrl;
                option.textContent = item.quality ? item.quality : "Default";
                select.appendChild(option);
            });
            resultsDiv.appendChild(select);
            document.getElementById("manualDownloadBtn").style.display = "block";
    
            // Optionally store the selection if needed.
        })
        .catch(err => {
            console.error(err);
            showAlert("Error fetching data from Apify.");
        });
    });
    
    // Manual download button.
    document.getElementById("manualDownloadBtn").addEventListener("click", () => {
        const select = document.querySelector("#manualResults select");
        if (select && select.value) {
            chrome.runtime.sendMessage({
                action: "downloadMedia",
                url: select.value
            });
        } else {
            showAlert("No download URL selected.");
        }
    });
    
    // Load saved theme on start.
    chrome.storage.sync.get(["theme"], (data) => {
        if (data.theme === "light") {
            document.body.classList.add("light-mode");
        }
    });
});
