// Hash Key needs to be 16 bytes, this function translates the password to a 16 byte array
async function deriveHMACKey(password) {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    const hmacKey = await crypto.subtle.importKey(
        "raw", 
        passwordBytes, 
        { name: "HMAC", hash: "SHA-256" }, 
        false, 
        ["sign", "verify"]
    );

    return hmacKey;
}

// Salts a SHA-256 hash with a string, password in this case
async function HMAChash(username, password) {
    try {
        // Convert to byte array
        const encoder = new TextEncoder();
        const usernameArray = encoder.encode(username);
        const passwordArray = encoder.encode(password);

        // Concatenate the username and password arrays
        const data = new Uint8Array(usernameArray.length + passwordArray.length);
        data.set(usernameArray);
        data.set(passwordArray, usernameArray.length);

        // Create HMAC using the password and username combined data
        const hmacKey = await deriveHMACKey(password);

        // Perform the HMAC hashing
        const hmacResult = await crypto.subtle.sign(
            "HMAC",
            hmacKey,
            data
        );

        const hashArray = new Uint8Array(hmacResult);
        return hashArray;

    } catch (error) {
        console.error("HMAC hashing error:", error);
        return null;
    }
}