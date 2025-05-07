
    document.addEventListener("DOMContentLoaded", async () => {
      const uuid = localStorage.getItem("uuid");
      const masterPassword = localStorage.getItem("masterpassword");
      const searchTerm = localStorage.getItem("searchterm")?.toLowerCase() || "";

      const resultContainer = document.getElementById("search-results");
      const noResults = document.getElementById("no-results");

      try {
        const response = await fetch("http://localhost/KeyChain/js/sidebar.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.accounts) && result.accounts.length > 0) {
          let matches = 0;

          // Decrypt username, domain, timestamp from each matching account in database
          for (const account of result.accounts) {
            const encrypted_username = base64ToArrayBuffer(account.encrypted_username);
            const username_iv = new Uint8Array(base64ToArrayBuffer(account.username_iv));
            const username_salt = new Uint8Array(base64ToArrayBuffer(account.username_salt));
            const Ukey = await deriveEncryptionKey(masterPassword, username_salt);
            const decryptedUsername = await decrypt(encrypted_username, Ukey, username_iv);

            const encrypted_password = base64ToArrayBuffer(account.encrypted_password);
            const password_iv = new Uint8Array(base64ToArrayBuffer(account.password_iv));
            const password_salt = new Uint8Array(base64ToArrayBuffer(account.password_salt));
            const Pkey = await deriveEncryptionKey(masterPassword, password_salt);
            const decryptedPassword = await decrypt(encrypted_password, Pkey, password_iv);

            const encrypted_domain = base64ToArrayBuffer(account.encrypted_domain);
            const domain_iv = new Uint8Array(base64ToArrayBuffer(account.domain_iv));
            const domain_salt = new Uint8Array(base64ToArrayBuffer(account.domain_salt));
            const Dkey = await deriveEncryptionKey(masterPassword, domain_salt);
            const decryptedDomain = await decrypt(encrypted_domain, Dkey, domain_iv);

            const encrypted_timestamp = base64ToArrayBuffer(account.encrypted_timestamp);
            const timestamp_iv = new Uint8Array(base64ToArrayBuffer(account.timestamp_iv));
            const timestamp_salt = new Uint8Array(base64ToArrayBuffer(account.timestamp_salt));
            const Tkey = await deriveEncryptionKey(masterPassword, timestamp_salt);
            const decryptedTimestamp = await decrypt(encrypted_timestamp, Tkey, timestamp_iv);

            if (
              // Checks if search term is found in an decrypted domains or usernames
              decryptedUsername.toLowerCase().includes(searchTerm) ||
              decryptedDomain.toLowerCase().includes(searchTerm)
            ) {
              // List accounts
              matches++;
              const item = document.createElement("a");
              item.href = "#";
              item.classList.add("list-group-item", "list-group-item-action", "list-group-item-light", "p-3");
              item.textContent =  `Username: ${decryptedUsername} | Domain: ${decryptedDomain} | Last Edited ${decryptedTimestamp}`;
              // On clicking an account, information is saved to local storage to display on account.html
              item.addEventListener("click", () => {
                localStorage.setItem("accountpassword", decryptedPassword);
                localStorage.setItem("accountdomain", decryptedDomain);
                localStorage.setItem("accountusername", decryptedUsername);
                localStorage.setItem("accounttimestamp", decryptedTimestamp);
                window.location.href = "account.html";
              });
              // Add the account to the list
              resultContainer.appendChild(item);

              // Add an hr divider to separate listed accounts
              const divider = document.createElement("hr");
              resultContainer.appendChild(divider);
            }
          }

          if (matches === 0) {
            noResults.style.display = "block";
          }
        } else {
          noResults.style.display = "block";
        }

      } catch (error) {
        console.error("Error fetching search results:", error);
        noResults.style.display = "block";
      }
    });
