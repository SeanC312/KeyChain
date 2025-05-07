// Method that saves the value inputted in the search bar to local memory,
// trims it, then redirects to searchaccount.html
    document.addEventListener("DOMContentLoaded", () => {
      const searchInput = document.getElementById("searchinput");
      const searchButton = document.getElementById("searchbutton");

      console.log("Loaded input:", searchInput);
      console.log("Loaded button:", searchButton);

      searchButton.addEventListener("click", () => {
        const term = searchInput.value.trim();
        // Debug statement
        console.log("Search term:", term);
        if (term) {
          localStorage.setItem("searchterm", term);
          window.location.href = "searchaccount.html";
        }
      });
    });
