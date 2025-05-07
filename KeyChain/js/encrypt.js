// Uses AES-GCM to encrypt plaintext using an encryption key (based on master password),
// and an initialization vector (IV)
async function encrypt(plaintext, key, iv) {
    try {
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            new TextEncoder().encode(plaintext)
        );
        // Convert to base64 automatically for straightforward storage
        const encryptedBase64 = arrayBufferToBase64(encrypted);
        // Debugging statement
        console.log("Encrypted Username (b64):", encryptedBase64);

        return {
            encryptedData: encryptedBase64,
        };
    } catch (error) {
        console.error("Error encrypting:", error);
        return null;
    }
}


// Uses Password Based Key Derivation Function 2 (PBKDF2) to derive a key for encryption.
// Requires plaintext and a byte array salt 
async function deriveEncryptionKey(password, saltBuffer) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: saltBuffer, 
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    return key;
}





async function decrypt(encrypted, key, iv) {
    try {
        // Ensure 'iv' is 12 bytes long, for debugging
        if (iv.length !== 12) {
            throw new Error('IV must be 12 bytes long for decryption!');
        }

        // Log for debugging
        console.log("Decryption parameters:");
        console.log("Encrypted data:", encrypted);
        console.log("IV (12 bytes):", iv);
        console.log("Key:", key);

        // Perform decryption using the SubtleCrypto API
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encrypted
        );

        // Decode and return the result
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error("Decryption error:", error);
        throw error;  
    }
}

// Convert byte array to b64 in order to better see the state of stored data in db
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Need to convert queried database data (stored in b64) back to byte array 
// to use in encryption/decryption
function base64ToArrayBuffer(base64) {
    const binary = atob(base64); 
    const length = binary.length;
    const buffer = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return buffer.buffer;
}

// In order to use HaveIBeenPwned API, the password must be hashed using SHA1
// This allows the application to query the account's password without sending it in plaintext
async function sha1(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

// Uses HaveIBeenPwned API to query the subaccount's (hashed) password
// Uses the first 5 characters of the hash to query HaveIBeenPwned database

// I am using the free version of HIBP, so no key is required, though I can only 
// query once every 1.5 seconds
  async function isPasswordCompromised(password) {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
  
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) throw new Error("Failed to query HIBP");
  
    // HIBP API returns a list of hashed (SHA1) suffixes, along with count of times breached
    // Looks like: 003F2D5D9271B74F3F92A0573A33A5F9AD7:2
    // Since I dont care how many times its been breached, I just want to know if it was compromised 
    const result = await response.text();
    // Inserts new line character to split entries, .some() immediately returns true 
    // if any query result matches true (line 135)
    return result.split('\n').some(line => {
    // Only queries hash suffix, not breach count
      const [hashSuffix] = line.trim().split(':');
    // Return true if the hashed subaccount's password suffix matches any queried suffix
      return hashSuffix === suffix;
    });
  }
  




