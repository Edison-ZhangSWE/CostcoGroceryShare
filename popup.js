document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get("buttonClicked", function (data) {
    if (data.buttonClicked) {
      let placeholderItem = {
        name: "Placeholder Item Name",
      };
      addItemToQueue(placeholderItem);

      // Optionally, reset the flag so the placeholder isn't shown the next time
      chrome.storage.local.set({ buttonClicked: false });
    }
  });

  // Load the product details immediately on DOMContentLoaded
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentURL = tabs[0].url;
    if (currentURL.includes('costco.com') && currentURL.includes('.product.')) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: getProductDetails,
        args: []
      }, (results) => {
        if (results && results.length > 0) {
          let details = results[0].result;
          document.getElementById("productDetails").innerText = details.productName;

          let totalQuantityMatch = details.productName.match(/\d+\s*total\s*packs/i);
          if (totalQuantityMatch) {
            totalOrders = parseInt(totalQuantityMatch[0]);
          } else {
            totalOrders = 14; // default value if not found
          }

          updateQueueProgress(currentOrders, 0);
          updatePopupForURL(currentURL);
        }
      });
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
  let totalWidth = document.getElementById("queueProgressContainer").offsetWidth;
  let existingWidth = (currentOrders / totalOrders) * totalWidth;
  let userWidth = (userSelectedQuantity / totalOrders) * totalWidth;

  document.getElementById("existingOrders").style.width = `${existingWidth}px`;
  document.getElementById("userOrders").style.left = `${existingWidth}px`;
  document.getElementById("userOrders").style.width = `${userWidth}px`;

  let label = document.getElementById("queueProgressLabel");
  label.innerText = `${currentOrders + userSelectedQuantity}/${totalOrders}`;
}

function updatePopupForURL(url) {
  if (url.includes('costco.com') && url.includes('.product.')) {
    setupItemPageView();
  } else {
    setupGeneralView();
  }
}

function setupItemPageView() {
  let remainingQuantity = totalOrders - currentOrders;
  populateDropdown(remainingQuantity, 0);
}

function setupGeneralView() {
  document.getElementById("productDetails").style.display = "none";
  document.getElementById("quantityDropdown").style.display = "none";
  document.getElementById("confirmOrderButton").style.display = "none";
}

function getProductDetails() {
  let productName = document.querySelector('h1').innerText;
  return { productName: productName };
}

function populateDropdown(remainingQuantity, userSelectedQuantity) {
  let dropdown = document.getElementById("quantityDropdown");
  dropdown.innerHTML = '';

  // Add a default option of "0"
  let defaultOption = document.createElement("option");
  defaultOption.value = 0;
  defaultOption.innerText = "0";
  dropdown.appendChild(defaultOption);

  let maxOptionValue = remainingQuantity + userSelectedQuantity;
  for (let i = 1; i <= maxOptionValue; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.innerText = i;

    if (i > remainingQuantity) {
      option.classList.add("user-added");
    }

    dropdown.appendChild(option);
  }
  dropdown.value = userSelectedQuantity;
}


let currentOrders = 5;
let totalOrders = 14;

document.getElementById('confirmOrderButton').addEventListener('click', function () {
  let selectedQuantity = parseInt(document.getElementById('quantityDropdown').value);
  currentOrders += selectedQuantity;
  updateQueueProgress(currentOrders, totalOrders);
  let remainingQuantity = totalOrders - currentOrders;
  populateDropdown(remainingQuantity, 0);
});

document.getElementById('quantityDropdown').addEventListener('change', function () {
  let selectedQuantity = parseInt(document.getElementById('quantityDropdown').value);
  updateQueueProgress(currentOrders, selectedQuantity);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "addItem") {
    addItemToQueue(request.imageUrl);
  }
});
