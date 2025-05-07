document.addEventListener("DOMContentLoaded", () => {

    const loginButton = document.getElementById("loginbutton");

    loginButton.addEventListener("click", async (event) => {
        event.preventDefault();


        // Get login information
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        if(!username | !password){
            alert("Please fill all fields to login!");
        }

        const HMACkeyP = await deriveHMACKey(password);

        const hashedUsername = await HMAChash(username,HMACkeyP);
        const enteredUsername = arrayBufferToBase64(hashedUsername);

        const HMACkeyU = await deriveHMACKey(username);

        const hashedPassword = await HMAChash(password, HMACkeyU);
        const enteredPassword = arrayBufferToBase64(hashedPassword);

        // Send hashed username and password to web server - login.php will
        // find a row that contains the hashed username and see if hashed passwords match
        try {
        const response = await fetch("http://localhost/KeyChain/js/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enteredUsername, enteredPassword })
            });

        // If the response is recieved with an error, throw an error
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        //Debug statement
        console.log("Full response from server:", result);

        // If no errors in result, then authentication was successful
        if(result.success){

        // Convert stored b64 data in database back to an array buffer
        // Decrypting requires array buffers as input, base64 will not work
        const encryptedUsername = base64ToArrayBuffer(result.encrypted_username);
        const iv = new Uint8Array(base64ToArrayBuffer(result.encryption_iv));
        const salt = new Uint8Array(base64ToArrayBuffer(result.encryption_salt));

        const key = await deriveEncryptionKey(password, salt);

        const decryptedUsername =  await decrypt(encryptedUsername, key, iv);
        

        console.log("Decrypted Username: " , decryptedUsername);

        alert("Login Successful, Welcome " + decryptedUsername);

        // Return the decrypted username and redirect to main page
        // Store uuid and master password in local storage for later 
        // cryptographic operations (deriving encryption keys)
        localStorage.setItem("masterusername", username);
        localStorage.setItem("masterpassword", password);
        localStorage.setItem("uuid", result.uuid);

        window.location.href = "main-page.html";

        }
        else{
            alert("Authentication Failure, please try again.");
            return;
        }
         
        } catch (error) { 
            console.error("Error:", error);
            alert("Authentication failure");
            return;
        }
    });


});


