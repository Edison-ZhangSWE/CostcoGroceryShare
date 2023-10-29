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
      loggedInEmailElement.textContent = data.email;
      loggedInUniversityElement.textContent = data.campus;
      loginSection.style.display = "none";
      mainContent.style.display = "block";
      userId = data.email;
    }
    handleProductDetails();
  });





  // Login button event listener
  loginButton.addEventListener("click", function () {
    const email = emailInput.value.trim();
    const campus = campusSelect.value;

    if (validateLogin(email, campus)) {
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
    } else {
      // If login fails, display an error message
      loginError.textContent = "Invalid email or campus selection!";
    }
  });

  const logoutButton = document.getElementById("logoutButton");

  logoutButton.addEventListener("click", function () {
    // Remove the loggedIn flag
    chrome.storage.local.remove("loggedIn", function () {
      // Display the login section and hide the main content
      loginSection.style.display = "block";
      mainContent.style.display = "none";
    });
  });

  // ... (rest of your existing code)

  // Load the product details immediately on DOMContentLoaded
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentURL = tabs[0].url;

    if (currentURL.includes('costco.com') && currentURL.includes('.product.')) {
      chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: getProductDetails,
            args: [],
          },
          (results) => {
            if (results && results.length > 0) {
              let details = results[0].result;
              document.getElementById("productDetails").innerText = details.productName;

              fetch(
                  `http://34.28.211.41:8000/orders/count/?product_name=${encodeURIComponent(
                      details.productName
                  )}`
              )
                  .then((response) => response.json())
                  .then((data) => {
                    currentOrders = data.count;
                    let remainingQuantity = totalOrders - currentOrders;
                    populateDropdown(remainingQuantity, 0, details.productPrice);  // Pass the product price to populateDropdown
                    updateQueueProgress(currentOrders, 0);
                  })
                  .catch((error) => {
                    console.error("Failed to fetch order count:", error);
                  });
            }
          });




    } else {
      updatePopupForURL(currentURL);
    }
  });
});

document.getElementById('orderHistoryButton').addEventListener('click', function() {
  fetchOrderHistory();
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

async function handleProductDetails() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentURL = tabs[0].url;

    if (currentURL.includes('costco.com') && currentURL.includes('.product.')) {
      // Gather product details and set up the item page view
      const details = await getProductDetailsFromTab(tabs[0].id);
      document.getElementById("productDetails").innerText = details.productName;
      totalOrders = details.packCount;  // Update totalOrders with the pack count


      const data = await fetchOrderData(details.productName);
      const remainingQuantity = totalOrders - data.count;
      populateDropdown(remainingQuantity, 0, details.productPrice);
      updateQueueProgress(data.count, 0);
    } else {
      updatePopupForURL(currentURL);
    }
  } catch (error) {
    console.error("Error handling product details:", error);
  }
}

async function getProductDetailsFromTab(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: getProductDetails,
    args: []
  });
  if (results && results.length > 0) {
    return results[0].result;
  }
  throw new Error("Failed to get product details from tab");
}



function checkProductDetails() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentURL = tabs[0].url;

    if (currentURL.includes('costco.com') && currentURL.includes('.product.')) {
      // ... (rest of the product details logic)
    } else {
      updatePopupForURL(currentURL);
    }
  });
}


let ongoingFetch = null;
let fetchInProgress = false;

async function setupItemPageView() {
  try {
    const productName = document.getElementById("productDetails").innerText;
    const orderData = await fetchOrderData(productName);
    const remainingQuantity = totalOrders - orderData.count;

    populateDropdown(remainingQuantity, 0, orderData.productPrice);
    updateQueueProgress(orderData.count, 0);

  } catch (error) {
    console.error("Error setting up item page view:", error);
    // You can display some user-friendly error message here.
  }
}

async function fetchOrderData(productName) {
  const orderCountResponse = await fetch(`http://34.28.211.41:8000/orders/count/?product_name=${encodeURIComponent(productName)}`);
  const orderData = await orderCountResponse.json();
  return orderData;
}


async function initializeExtension() {
  try {
    await handleProductDetails();  // Handles product details fetching and UI setup
  } catch (error) {
    console.error("Error initializing extension:", error);
  }
}

document.addEventListener("DOMContentLoaded", initializeExtension);


function setupGeneralView() {
  document.getElementById("productDetails").style.display = "none";
  document.getElementById("quantityDropdown").style.display = "none";
  document.getElementById("confirmOrderButton").style.display = "none";
}

function getProductDetails() {
  let productName = document.querySelector("h1").innerText;
  let productPrice = document.querySelector('span[automation-id="productPriceOutput"]').innerText;

  // Extract pack count from productName
  let regexPattern = /(\d+\s*(total\s*(packs|count))|total\s*\d+\s*packs)/i;
  let totalQuantityMatch = productName.match(regexPattern);
  let packCount = totalQuantityMatch ? parseInt(totalQuantityMatch[1]) : 1; // Default to 1 if not found

  return { productName: productName, productPrice: productPrice, packCount: packCount };
}



function populateDropdown(remainingQuantity, userSelectedQuantity, productPrice) {
  console.log("Received productPrice:", productPrice);
  let dropdown = document.getElementById("quantityDropdown");
  dropdown.innerHTML = "";

  // Convert the product price string to a number (assuming the price string looks like "$200")
  let pricePerItem = 0;
  if (productPrice && typeof productPrice === 'string') {
    pricePerItem = parseFloat(productPrice.replace(/[^0-9.-]+/g, "")) / totalOrders;
  }


  // Add a default option of "0"
  let defaultOption = document.createElement("option");
  defaultOption.value = 0;
  defaultOption.innerText = "0";
  dropdown.appendChild(defaultOption);

  for (let i = 1; i <= remainingQuantity; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.innerText = `${i} - $${(pricePerItem * i).toFixed(2)}`;  // Display quantity and its corresponding price
    dropdown.appendChild(option);
  }
  dropdown.value = userSelectedQuantity;
}



function fetchOrderHistory() {

  fetch(`http://34.28.211.41:8000/orders/user/${encodeURIComponent(userId)}/`)
      .then(response => response.json())
      .then(orders => {
        displayOrderHistory(orders);
      })
      .catch(error => {
        console.error('Failed to fetch order history:', error);
      });
}

function displayOrderHistory(orders) {
  let container = document.getElementById("orderHistoryContainer");
  container.innerHTML = ''; // Clear any existing content
  orders.forEach(order => {
    let orderDiv = document.createElement('div');
    orderDiv.innerHTML = `Product: ${order.product_name}, Quantity: ${order.quantity}`;
    container.appendChild(orderDiv);
  });
  container.style.display = "block"; // Show the container
}






let currentOrders = 0;
let totalOrders = 10;
let userId;  // Declare at the top level of your script


document.getElementById('confirmOrderButton').addEventListener('click', function () {
  if (!userId) {
    console.error("User email is not defined.");
    // Handle the error, e.g., by showing a message to the user
    return;
  }
  let selectedQuantity = parseInt(document.getElementById('quantityDropdown').value);
  currentOrders += selectedQuantity;
  updateQueueProgress(currentOrders, totalOrders);
  let remainingQuantity = totalOrders - currentOrders;
  populateDropdown(remainingQuantity, 0);
  let productName = document.getElementById("productDetails").innerText;

  fetch('http://34.28.211.41:8000/orders/', { // Note the trailing slash
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_name: productName,
      quantity: selectedQuantity,
      user_id: userId
    }),
  })
      .then(response => response.json())
      .then(data => {
        console.log('Order stored:', data);
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