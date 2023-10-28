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
});

function addItemToQueue(item, imageUrl) {
  // Create a new element for the item
  let itemElement = document.createElement("div");
  itemElement.innerText = item.name;
  document.getElementById("queueStatus").appendChild(itemElement);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "addItem") {
    addItemToQueue(request.imageUrl);
  }
});
