document.addEventListener("DOMContentLoaded", () => {

    const registerButton = document.getElementById("registerbutton");

    registerButton.addEventListener("click", async (event) => {
        event.preventDefault();

        // Get the CAPTCHA token
        const captchaToken = document.querySelector('#g-recaptcha-response').value;

        if (!captchaToken) {
            alert('Please complete the CAPTCHA.');
            registerButton.disabled = false;
            return;
        }

        // Get registration information
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Make sure all forms are filled
        if(!username | !password | !confirmPassword){
            alert("Please fill all fields to register!");
            return;
        }


        // Make sure passwords match 
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Generate hashed password, hashed username, uuid,
        // and encrypt username with generated salt and IV
        try {
            
            const uuid = crypto.randomUUID();

            const HMACkeyU = await deriveHMACKey(username);

            const hashedPassword = await HMAChash(password, HMACkeyU);
            const base64Password = arrayBufferToBase64(hashedPassword);

            const HMACkeyP = await deriveHMACKey(password);

            const hashedUsername = await HMAChash(username, HMACkeyP);
            const base64Username = arrayBufferToBase64(hashedUsername);


            const salt = crypto.getRandomValues(new Uint8Array(16));
            const base64Salt = arrayBufferToBase64(salt);

            const key = await deriveEncryptionKey(password, salt); 

            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const base64Iv = arrayBufferToBase64(iv);

            const encryptedUsername = await encrypt(username, key, iv);


            const requestBody = {
                uuid,
                encryptedUsername : encryptedUsername.encryptedData,
                salt: base64Salt,
                iv: base64Iv,
                hashedUsername: base64Username,
                hashedPassword: base64Password,
                captcha: captchaToken
            };

            // More debugging
            console.log("Encrypted Username (Base64):", encryptedUsername.encryptedData);


            // Send data to registration.php to insert into db
            console.log("Request Body:", JSON.stringify(requestBody));

            const response = await fetch("http://localhost/KeyChain/js/registration.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });
            

            const result = await response.json();

            if (result.success) {
                alert("Registration successful!");
                window.location.href = "login.html";
            } else {
                alert("Registration failed: " + result.error);
            }

        } catch (error) {
            console.error("Error in registration:", error);
            alert("An error occurred during registration.");
        }
    });
});
