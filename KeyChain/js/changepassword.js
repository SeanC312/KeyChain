// Method to change a sub-account's password
// Instead of going back and forth to web server to get salts/IVs, I chose to just delete the 
// subaccount and generate a new subaccount with the new password

// This way of performing a password change obtains the same result with fewer steps

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("change-password-btn").addEventListener("click", () => {

        //Reveals password change prompt once change password button is pressed
        const inputGroup = document.getElementById("password-input-group");
        inputGroup.style.display = "block";
      });

      // Get password from text prompt
      document.getElementById("submit-password-btn").addEventListener("click", async () => {
        const newPassword = document.getElementById("password").value;
        console.log("New password submitted:", newPassword);

        // Retrieve uuid and masterPassword
        const uuid = localStorage.getItem("uuid");
        const masterPassword = localStorage.getItem("masterpassword");

        // Retrieve username/domain and create new timestamp
        const accountusername = localStorage.getItem("accountusername");
        const accountdomain = localStorage.getItem("accountdomain");
        const old_accountpassword = localStorage.getItem("accountpassword");

        // Get old hashed username / domain
        const old_HMACkeyP = await deriveHMACKey(old_accountpassword);
        const old_hashed_username = await HMAChash(accountusername, old_HMACkeyP);
        const old_b64_hashed_username = await arrayBufferToBase64(old_hashed_username);

        try {
            const deleteResponse = await fetch("http://localhost/KeyChain/js/deleteaccount.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hashed_username: old_b64_hashed_username })
            });

            const deleteText = await deleteResponse.text();
            if (deleteText) {
                const deleteResult = JSON.parse(deleteText);
                if (deleteResult.success) {
                    console.log("Deletion Successful");
                } else {
                    console.error("Deletion Unsuccessful:", deleteResult.error || deleteResult);
                }
            } else {
                console.warn("Delete response was empty.");
            }
        } catch (error) {
            console.error("Error deleting account:", error);
        }
        
        // Add new account - modified version of addaccount.js

        const timestamp = new Date().toLocaleString();
        console.log("Created timestamp: ", timestamp);

        // Username is hashed with HMAC, using a key dervied from password as the secret key

        const HMACkeyP = await deriveHMACKey(newPassword);

        const hashed_username = await HMAChash(accountusername, HMACkeyP);
        const b64HashedUsername = arrayBufferToBase64(hashed_username);
        const hashed_domain = await HMAChash(accountdomain, HMACkeyP);
        const b64HashedDomain = arrayBufferToBase64(hashed_domain);

        //Get a random IV for encryption
        const username_iv = crypto.getRandomValues(new Uint8Array(12));
        const b64Username_iv = arrayBufferToBase64(username_iv);
        const domain_iv = crypto.getRandomValues(new Uint8Array(12));
        const b64Domain_iv = arrayBufferToBase64(domain_iv);
        const password_iv = crypto.getRandomValues(new Uint8Array(12));
        const b64Password_iv = arrayBufferToBase64(password_iv);
        const timestamp_iv = crypto.getRandomValues(new Uint8Array(12));
        const b64timestamp_iv = arrayBufferToBase64(timestamp_iv);

        //generate a salt for future key generation
        const username_salt = crypto.getRandomValues(new Uint8Array(16));
        const b64Username_salt = arrayBufferToBase64(username_salt);
        const domain_salt = crypto.getRandomValues(new Uint8Array(16));
        const b64Domain_salt = arrayBufferToBase64(domain_salt);
        const password_salt = crypto.getRandomValues(new Uint8Array(16));
        const b64Password_salt = arrayBufferToBase64(password_salt);
        const timestamp_salt = crypto.getRandomValues(new Uint8Array(16));
        const b64timestamp_salt = arrayBufferToBase64(timestamp_salt);

        //generate keys for encryption
        const usernameKey = await deriveEncryptionKey(masterPassword, username_salt); 
        const domainKey = await deriveEncryptionKey(masterPassword, domain_salt); 
        const passwordKey = await deriveEncryptionKey(masterPassword, password_salt);
        const timestampKey = await deriveEncryptionKey(masterPassword, timestamp_salt); 

        const encrypted_username = await encrypt(accountusername, usernameKey, username_iv);

        const encrypted_domain = await encrypt(accountdomain, domainKey, domain_iv);

        const encrypted_password = await encrypt(newPassword, passwordKey, password_iv);

        const encrypted_timestamp = await encrypt(timestamp, timestampKey, timestamp_iv);

        const requestBody = {

            uuid,
            encrypted_username : encrypted_username.encryptedData,
            username_iv: b64Username_iv,
            username_salt: b64Username_salt,
            hashed_username: b64HashedUsername,
            encrypted_password: encrypted_password.encryptedData,
            password_iv: b64Password_iv,
            password_salt: b64Password_salt,
            encrypted_domain: encrypted_domain.encryptedData,
            domain_iv: b64Domain_iv,
            domain_salt: b64Domain_salt,
            hashed_domain: b64HashedDomain,
            encrypted_timestamp: encrypted_timestamp.encryptedData,
            timestamp_salt: b64timestamp_salt,
            timestamp_iv: b64timestamp_iv
        };
            
        //Create JSON file to give to addaccount.php to insert the below values into db
        const response = await fetch("http://localhost/KeyChain/js/addaccount.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        if(result.success){
            alert("Password Updated Successfully");
            window.location.href = "main-page.html";
        }
        else{
            alert("Password Change Failed - Please Try Again");
        }

      });
});

