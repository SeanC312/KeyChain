// Method to copy password contents to clipboard

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("copy-password-btn").addEventListener("click", () => {
      const password = document.getElementById("account-password").textContent;
      if (password) {
        navigator.clipboard.writeText(password)
          .then(() => {
            alert("Password copied to clipboard!");
          })
          .catch(err => {
            console.error("Failed to copy password:", err);
            alert("Failed to copy password.");
          });
      } else {
        alert("No password to copy!");
      }
    });
  });