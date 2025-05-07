document.addEventListener("DOMContentLoaded", async () => {
    const accountpassword = localStorage.getItem("accountpassword");
    const accountusername = localStorage.getItem("accountusername");
    const accountdomain = localStorage.getItem("accountdomain");
    const accounttimestamp = localStorage.getItem("accounttimestamp");

    document.getElementById("account-username").textContent = accountusername;
    document.getElementById("account-domain").textContent = accountdomain;
    document.getElementById("account-password").textContent = accountpassword;
    document.getElementById("account-timestamp").textContent = accounttimestamp;



    const imageElement = document.querySelector(".keylogo");

    // Uses SerpAPI to get the first image in Google images to display in account.html
    fetch(`http://localhost/KeyChain/js/getimage.php?domain=${encodeURIComponent(accountdomain)}`)
    .then(res => res.json())
    .then(data => {
        if (data.success && data.image) {
            imageElement.src = data.image;
        } else {
            console.warn("Image not found, using default key logo.");
        }
    })
    .catch(err => {
        console.error("Image fetch failed:", err);
    });

    const compromised = await isPasswordCompromised(accountpassword);
    if (compromised) {
        const passwordElement = document.getElementById("account-password");
        passwordElement.style.color = "red";

        // Optionally add an exclamation mark
        const warningIcon = document.createElement("span");
        warningIcon.textContent = " ⚠️";
        warningIcon.title = "This password has been found in a data breach!";
        passwordElement.appendChild(warningIcon);
    }

    const deleteBtn = document.getElementById("delete-account-btn");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    deleteBtn.addEventListener("click", () => {
        deleteBtn.textContent = "Are you sure?";
        confirmDeleteBtn.style.display = "inline-block";
    });

    confirmDeleteBtn.addEventListener("click", () => {
        
        localStorage.removeItem("accountpassword");
        localStorage.removeItem("accountusername");
        localStorage.removeItem("accountdomain");
        localStorage.removeItem("accounttimestamp");
        
        alert("Account deleted.");
        window.location.href = "main-page.html";
    });
});



