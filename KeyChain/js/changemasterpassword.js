document.addEventListener("DOMContentLoaded", () => {
    const changePasswordBtn = document.getElementById("changepasswordbutton");

    changePasswordBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;
        const memorypassword = localStorage.getItem("masterpassword");

        if(!oldPassword | !newPassword | !confirmNewPassword){
            alert("Please fill all forms to continue");
            return;
        }

        if(memorypassword !== oldPassword){
            alert("Authentication Failed!");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert("New passwords do not match.");
            return;
        }
        const username = localStorage.getItem("masterusername");
        if (!username) {
            alert("Username not found in local storage.");
            return;
        }

        const uuid = localStorage.getItem("uuid");

        try {
            // Derive key and decrypt subaccounts
            const response = await fetch("http://localhost/KeyChain/js/fetchsubaccounts.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uuid })
            });

            const result = await response.json();

            if (!result.success) {
                alert("Failed to fetch subaccounts.");
                return;
            }
            
            // Array to store decrypted subaccounts
            const decryptedSubaccounts = [];
            
            // Insert decrypted data into array - get salts + IVs, get encryption key, then decrypt
            for (let i = 0; i < result.accounts.length; i++){
                const account = result.accounts[i];
                const decrypted = {};

                decrypted.hashed_username = account.hashed_username;
                decrypted.hashed_domain = account.hashed_domain;
            try{
                const old_encrypted_username = base64ToArrayBuffer(account.encrypted_username);
                const old_username_salt = new Uint8Array(base64ToArrayBuffer(account.username_salt));
                const old_username_iv = new Uint8Array(base64ToArrayBuffer(account.username_iv));

                const old_username_key = await deriveEncryptionKey(oldPassword, old_username_salt);

                decrypted.username = await decrypt(old_encrypted_username, old_username_key, old_username_iv);
            }
            catch (e) {
                console.error("Failed to decrypt username:", e);
            }
            try{
                const old_encrypted_password = base64ToArrayBuffer(account.encrypted_password);
                const old_password_salt = new Uint8Array(base64ToArrayBuffer(account.password_salt));
                const old_password_iv = new Uint8Array(base64ToArrayBuffer(account.password_iv));

                const old_password_key = await deriveEncryptionKey(oldPassword, old_password_salt);

                decrypted.password = await decrypt(old_encrypted_password, old_password_key, old_password_iv);
            } catch (e) {
                console.error("Failed to decrypt password:", e);
            }
            try {
                const old_encrypted_domain = base64ToArrayBuffer(account.encrypted_domain);
                const old_domain_salt = new Uint8Array(base64ToArrayBuffer(account.domain_salt));
                const old_domain_iv = new Uint8Array(base64ToArrayBuffer(account.domain_iv));

                const old_domain_key = await deriveEncryptionKey(oldPassword, old_domain_salt);

                decrypted.domain = await decrypt(old_encrypted_domain, old_domain_key, old_domain_iv);
            } catch (e) {
            console.error("Failed to decrypt domain:", e);
            }

            try {
                const old_encrypted_timestamp = base64ToArrayBuffer(account.encrypted_timestamp);
                const old_timestamp_salt = new Uint8Array(base64ToArrayBuffer(account.timestamp_salt));
                const old_timestamp_iv = new Uint8Array(base64ToArrayBuffer(account.timestamp_iv));
                const old_timestamp_key = await deriveEncryptionKey(oldPassword, old_timestamp_salt);

                decrypted.timestamp = await decrypt(old_encrypted_timestamp, old_timestamp_key, old_timestamp_iv);
            } catch (e) {
                console.error("Failed to decrypt timestamp:", e);
            }
                decryptedSubaccounts.push(decrypted);
            }
            
            // Re-encrypt subaccounts with new password
            const updatedSubaccounts = [];




for (const sub of decryptedSubaccounts) {
    if (!sub.username || !sub.domain || !sub.password || !sub.timestamp) {
        console.warn("Missing field(s) in subaccount:", sub);
        continue; 
    }

    const requiredFields = ['username', 'domain', 'password', 'timestamp'];
    const missingFields = requiredFields.filter(field => sub[field] === undefined || sub[field] === null);

    if (missingFields.length > 0) {
        console.warn("Missing field(s) in subaccount:", missingFields, sub);
        continue;
    }

    // Debugging
    console.log("Decrypted subaccount:", sub);
    

    const newSub = {};
    const salts = {};
    const ivs = {};

    // Debugging
    console.log("username:", sub.username);
    console.log("domain:", sub.domain);


    const hmacKey = await deriveHMACKey(newPassword);
    newSub.hashed_username = arrayBufferToBase64(await HMAChash(sub.username, hmacKey));
    newSub.hashed_domain = arrayBufferToBase64(await HMAChash(sub.domain, hmacKey));

    // Adds data for each field
    for (const field of ['username', 'password', 'domain', 'timestamp']) {
        salts[field] = crypto.getRandomValues(new Uint8Array(16));
        ivs[field] = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveEncryptionKey(newPassword, salts[field]);
        const enc = await encrypt(sub[field], key, ivs[field]);
        console.log("result of subaccount encryption", enc.encryptedData);
        newSub[`encrypted_${field}`] = enc.encryptedData;
        newSub[`${field}_salt`] = arrayBufferToBase64(salts[field]);
        newSub[`${field}_iv`] = arrayBufferToBase64(ivs[field]);
    }

    updatedSubaccounts.push(newSub);
}

// Re-encrypt master username
const encUsernameSalt = crypto.getRandomValues(new Uint8Array(16));
const encUsernameIV = crypto.getRandomValues(new Uint8Array(12));
const encUsernameKey = await deriveEncryptionKey(newPassword, encUsernameSalt);
const encryptedUsername = await encrypt(username, encUsernameKey, encUsernameIV);

// Hash new username and password
const HMACkeyP = await deriveHMACKey(newPassword);
const HMACkeyU = await deriveHMACKey(username);
const b64hashedUsername = arrayBufferToBase64(await HMAChash(username, HMACkeyP));
const b64hashedPassword = arrayBufferToBase64(await HMAChash(newPassword, HMACkeyU));

const requestBody = {
    uuid,
    newHashedUsername: b64hashedUsername,
    newHashedPassword: b64hashedPassword,
    newEncryptedUsername: encryptedUsername.encryptedData,    
    newEncryptedUsernameSalt: arrayBufferToBase64(encUsernameSalt),
    newEncryptedUsernameIV: arrayBufferToBase64(encUsernameIV),
    updatedSubaccounts
};


            const updateResponse = await fetch("http://localhost/KeyChain/js/changemasterpassword.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            const result2 = await updateResponse.json();
            if (result2.success) {
                alert("Password changed successfully.");
                localStorage.setItem("masterpassword", newPassword);
                window.location.href = "main-page.html";
            } else {
                alert("Error: " + result2.error);
            }

        } catch (err) {
            console.error("Password change failed:", err);
            alert("An error occurred.");
        }
    });
});
