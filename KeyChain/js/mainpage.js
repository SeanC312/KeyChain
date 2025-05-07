document.addEventListener("DOMContentLoaded", async () => {

    const uuid = localStorage.getItem("uuid");
    const masterPassword = localStorage.getItem("masterpassword");
    

    try {
        const response = await fetch("http://localhost/KeyChain/js/sidebar.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uuid })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        // Record response from server for debugging - will be removed
        console.log("Full response from server:", result);

        if (result.success && result.accounts.length > 0) {
            for (let i = 0; i < result.accounts.length; i++){
            const account = result.accounts[i];

            //Username
        
            const encrypted_username = base64ToArrayBuffer(account.encrypted_username);
            const username_iv = new Uint8Array(base64ToArrayBuffer(account.username_iv));
            const username_salt = new Uint8Array(base64ToArrayBuffer(account.username_salt));
        
            const Ukey = await deriveEncryptionKey(masterPassword, username_salt);
            const decryptedUsername = await decrypt(encrypted_username, Ukey, username_iv);
        
            //Password

            const encrypted_password = base64ToArrayBuffer(account.encrypted_password);
            const password_iv = new Uint8Array(base64ToArrayBuffer(account.password_iv));
            const password_salt = new Uint8Array(base64ToArrayBuffer(account.password_salt));
        
            const Pkey = await deriveEncryptionKey(masterPassword, password_salt);
            const decryptedPassword = await decrypt(encrypted_password, Pkey, password_iv);

            //Domain    

            const encrypted_domain = base64ToArrayBuffer(account.encrypted_domain);
            const domain_iv = new Uint8Array(base64ToArrayBuffer(account.domain_iv));
            const domain_salt = new Uint8Array(base64ToArrayBuffer(account.domain_salt));
        
            const Dkey = await deriveEncryptionKey(masterPassword, domain_salt);
            const decryptedDomain = await decrypt(encrypted_domain, Dkey, domain_iv);

            //Timestamp

            const encrypted_timestamp = base64ToArrayBuffer(account.encrypted_timestamp);
            const timestamp_salt = new Uint8Array(base64ToArrayBuffer(account.timestamp_salt));
            const timestamp_iv = new Uint8Array(base64ToArrayBuffer(account.timestamp_iv));

            const Tkey = await deriveEncryptionKey(masterPassword, timestamp_salt);
            const decryptedTimestamp = await decrypt(encrypted_timestamp, Tkey, timestamp_iv);


            //Create list

            const accountList = document.getElementById("account-list");

            const listItem = document.createElement("a");
            listItem.classList.add("list-group-item", "list-group-item-action", "list-group-item-light", "p-3");

            // Display username and domain in the sidebar, have to use new divs for each to create new line
            listItem.innerHTML = `
            <div><b>Username:</b> ${decryptedUsername}</div>
            <div><b>Domain:</b> ${decryptedDomain}</div>
            <div><b>Last Updated:</b> ${decryptedTimestamp}</div>
            `;
            
            // Changes cursor to pointer - lets user know it's clickable
            listItem.style.cursor = "pointer";

                                    listItem.addEventListener("click", () => {
                                        // Set localstorage items to display on account.html
                                        localStorage.setItem("accountpassword", decryptedPassword);
                                        localStorage.setItem("accountdomain", decryptedDomain);
                                        localStorage.setItem("accountusername", decryptedUsername);
                                        localStorage.setItem("accounttimestamp", decryptedTimestamp);
                                    
                                        // Redirect to account.html
                                        window.location.href = "account.html";
                                    });

            // Append account to sidebar list
            accountList.appendChild(listItem);
            const hr = document.createElement("hr");
            accountList.appendChild(hr);

            }
            console.log("UUID:", uuid);

        } else {
            console.warn("No accounts found.");
        }

    } catch (error) {
        console.error("Error occurred:", error);
    }

});




