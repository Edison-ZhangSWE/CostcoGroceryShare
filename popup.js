document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const loginButton = document.getElementById("loginButton");
  const emailInput = document.getElementById("email");
  const campusSelect = document.getElementById("campus");
  const loginError = document.getElementById("loginError");
  const loginSection = document.getElementById("loginSection");
  const mainContent = document.getElementById("mainContent");
  const loggedInEmailElement = document.getElementById("loggedInEmail");
  const loggedInUniversityElement =
    document.getElementById("loggedInUniversity");

  // Mock validation (for this example)
  function validateLogin(email, campus) {
    return (
      email.includes("@") &&
      ["UC Berkeley", "UC Merced", "UC Davis"].includes(campus)
    );
  }

  chrome.storage.local.get(["loggedIn", "email", "campus"], function (data) {
    if (data.loggedIn) {
      // If user is already logged in, display the email and campus, hide login section, and show main content
      loggedInEmailElement.textContent = data.email;
      loggedInUniversityElement.textContent = data.campus;
      loginSection.style.display = "none";
      mainContent.style.display = "block";
    }
  });

  // Login button event listener
  loginButton.addEventListener("click", function () {
    const email = emailInput.value.trim();
    const campus = campusSelect.value;

    if (validateLogin(email, campus)) {
      // Call the backend to store the user's information
      fetch('http://localhost:8000/users/', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              email: email,
              campus: campus
          }),
      })
      .then(response => response.json())
      .then(data => {
          // After successful storage in the backend, continue with the following operations
  
          // If login is successful, store the loggedIn flag, email, and campus in chrome.storage.local
          chrome.storage.local.set({
              loggedIn: true,
              email: email,
              campus: campus,
          });
  
          // Display the email and campus in the popup
          loggedInEmailElement.textContent = email;
          loggedInUniversityElement.textContent = campus;
  
          // Hide the login section and show the main content
          loginSection.style.display = "none";
          mainContent.style.display = "block";
      })
      .catch((error) => {
          console.error('Error:', error);
          // If backend storage fails, display an error message
          loginError.textContent = "Error saving user data!";
      });
  } else {
      // If login validation fails, display an error message
      loginError.textContent = "Invalid email or campus selection!";
  }

  const logoutButton = document.getElementById("logoutButton");

  logoutButton.addEventListener("click", function () {
    // Remove the loggedIn flag
    chrome.storage.local.remove("loggedIn", function () {
      // Display the login section and hide the main content
      loginSection.style.display = "block";
      mainContent.style.display = "none";
    });
  });


  // Load the product details immediately on DOMContentLoaded
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentURL = tabs[0].url;
    if (currentURL.includes("costco.com") && currentURL.includes(".product.")) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: getProductDetails,
          args: [],
        },
        (results) => {
          if (results && results.length > 0) {
            let details = results[0].result;
            document.getElementById("productDetails").innerText =
              details.productName;

            let totalQuantityMatch =
              details.productName.match(/\d+\s*total\s*packs/i);
            if (totalQuantityMatch) {
              totalOrders = parseInt(totalQuantityMatch[0]);
            } else {
              totalOrders = 14; // default value if not found
            }

            updateQueueProgress(currentOrders, 0);
            updatePopupForURL(currentURL);
          }
        }
      );
    } else {
      updatePopupForURL(currentURL);
    }
  });
});

function addItemToQueue(item, imageUrl) {
  let itemElement = document.createElement("div");
  itemElement.innerText = item.name;
  document.getElementById("queueStatus").appendChild(itemElement);
}

function updateQueueProgress(currentOrders, userSelectedQuantity) {
  let totalWidth = document.getElementById(
    "queueProgressContainer"
  ).offsetWidth;
  let existingWidth = (currentOrders / totalOrders) * totalWidth;
  let userWidth = (userSelectedQuantity / totalOrders) * totalWidth;

  document.getElementById("existingOrders").style.width = `${existingWidth}px`;
  document.getElementById("userOrders").style.left = `${existingWidth}px`;
  document.getElementById("userOrders").style.width = `${userWidth}px`;

  let label = document.getElementById("queueProgressLabel");
  label.innerText = `${currentOrders + userSelectedQuantity}/${totalOrders}`;
}

function updatePopupForURL(url) {
  if (url.includes("costco.com") && url.includes(".product.")) {
    setupItemPageView();
  } else {
    setupGeneralView();
  }
}

function setupItemPageView() {
  let productName = document.getElementById("productDetails").innerText; // Fetch product name from DOM

  fetch(
    `http://34.28.211.41:8000/orders/count/?product_name=${encodeURIComponent(
      productName
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      currentOrders = data.count;
      let remainingQuantity = totalOrders - currentOrders;
      populateDropdown(remainingQuantity, 0);
      updateQueueProgress(currentOrders, 0);
    })
    .catch((error) => {
      console.error("Failed to fetch order count:", error);
    });
}

function setupGeneralView() {
  document.getElementById("productDetails").style.display = "none";
  document.getElementById("quantityDropdown").style.display = "none";
  document.getElementById("confirmOrderButton").style.display = "none";
}

function getProductDetails() {
  let productName = document.querySelector("h1").innerText;
  return { productName: productName };
}

function populateDropdown(remainingQuantity, userSelectedQuantity) {
  let dropdown = document.getElementById("quantityDropdown");
  dropdown.innerHTML = "";

  // Add a default option of "0"
  let defaultOption = document.createElement("option");
  defaultOption.value = 0;
  defaultOption.innerText = "0";
  dropdown.appendChild(defaultOption);

  for (let i = 1; i <= remainingQuantity; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.innerText = i;
    dropdown.appendChild(option);
  }
  dropdown.value = userSelectedQuantity;
}

let currentOrders = 5;
let totalOrders = 14;

document
  .getElementById("confirmOrderButton")
  .addEventListener("click", function () {
    let selectedQuantity = parseInt(
      document.getElementById("quantityDropdown").value
    );
    currentOrders += selectedQuantity;
    updateQueueProgress(currentOrders, totalOrders);
    let remainingQuantity = totalOrders - currentOrders;
    populateDropdown(remainingQuantity, 0);
    let productName = document.getElementById("productDetails").innerText;

    fetch("http://34.28.211.41:8000/orders/", {
      // Note the trailing slash
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_name: productName,
        quantity: selectedQuantity,
        user_id: "dummy_user_id", // placeholder until you have a proper user system
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Order stored:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

document
  .getElementById("quantityDropdown")
  .addEventListener("change", function () {
    let selectedQuantity = parseInt(
      document.getElementById("quantityDropdown").value
    );
    updateQueueProgress(currentOrders, selectedQuantity);
  });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "addItem") {
    addItemToQueue(request.imageUrl);
  }
});
