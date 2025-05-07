document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("confirm-delete-btn").addEventListener("click", async () => {

        // Account username + password is stored in local memory already
        const accountusername = localStorage.getItem("accountusername");
        const accountpassword = localStorage.getItem("accountpassword");

        // Hash the username with the account's password to match the one contained in db
        const HMACkeyP = await deriveHMACKey(accountpassword);
        const hashed_username = await HMAChash(accountusername, HMACkeyP);
        const b64_hashed_username = await arrayBufferToBase64(hashed_username);

        try {
            const response = await fetch("http://localhost/KeyChain/js/deleteaccount.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hashed_username: b64_hashed_username })
            });

            const text = await response.text();
            if (text) {
                const result = JSON.parse(text);
                if (result.success) { 
                    alert("Sub-Account Deletion Successful");
                    window.location.href = "main-page.html";
                } else {
                    alert("Sub-Account Deletion Failed - Please Try Again");
                    console.error("Delete error:", result.error || result);
                }
            } else {
                alert("Deletion Failed");
                console.error("Empty response from deleteaccount.php");
            }
        } catch (error) {
            console.error("Error during delete:", error);
            alert("An error occurred during deletion.");
        }
    });
});
