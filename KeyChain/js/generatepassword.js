// Method that suggests a password for a user's subaccount

document.addEventListener("DOMContentLoaded", () => {
    const suggestBtn = document.getElementById("suggestPasswordBtn");
    const passwordField = document.getElementById("password");

    suggestBtn.addEventListener("click", () => {
        // 16 characters long - could be longer but that seems secure enough
        const suggestedPassword = generateRandomPassword(16);  
        passwordField.value = suggestedPassword;
    });

    function generateRandomPassword(length) {
        // Characters that will be generated in suggested password
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&.?";
        let password = "";
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }
        return password;
    }
});