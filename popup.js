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
    
            let regexPattern = /(\d+)\s*total\s*(packs|count)/i;
            let totalQuantityMatch = details.productName.match(regexPattern);
            if (totalQuantityMatch) {
                let numberMatch = totalQuantityMatch[0].match(/\d+/);
                if (numberMatch) {
                    totalOrders = parseInt(numberMatch[0]);
                }
            } else {
                totalOrders = 10; // default value if not found
            }
    
            updateQueueProgress(currentOrders, 0);
            populateDropdown(details.productPrice, totalOrders, 0);
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
  let productName = document.getElementById("productDetails").innerText; // Fetch product name from DOM

  fetch(`http://34.28.211.41:8000/orders/count/?product_name=${encodeURIComponent(productName)}`)
      .then(response => response.json())
      .then(data => {
        currentOrders = data.count;
        let remainingQuantity = totalOrders - currentOrders;
        populateDropdown(remainingQuantity, 0);
        updateQueueProgress(currentOrders, 0);
      })
      .catch(error => {
        console.error('Failed to fetch order count:', error);
      });
}



function setupGeneralView() {
  document.getElementById("productDetails").style.display = "none";
  document.getElementById("quantityDropdown").style.display = "none";
  document.getElementById("confirmOrderButton").style.display = "none";
}

function getProductDetails() {
  let productName = document.querySelector('h1').innerText;
  let productPriceText = document.querySelector('#pull-right-price .value').innerText;
  let productPrice = parseFloat(productPriceText);
  return { productName: productName, productPrice: productPrice };
}


function populateDropdown(productPrice, totalPacks, userSelectedQuantity) {
  let dropdown = document.getElementById("quantityDropdown");
  dropdown.innerHTML = '';

  let pricePerPack = productPrice / totalPacks;

  for (let i = 1; i <= totalPacks; i++) {
      let option = document.createElement("option");
      option.value = i;
      option.innerText = `${i}: $${(i * pricePerPack).toFixed(2)}`;
      dropdown.appendChild(option);
  }
  dropdown.value = userSelectedQuantity;
}


let currentOrders = 0;
let totalOrders = 10;

document.getElementById('confirmOrderButton').addEventListener('click', function () {
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
      user_id: "j.beck.msic@gmail.com" // placeholder until you have a proper user system
    }),
  })
      .then(response => response.json())
      .then(data => {
        console.log('Order stored:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
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
