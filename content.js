let observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.addedNodes.length) {
      let targetButtons = document.querySelectorAll(
        'button[name="add-to-cart"]:not([data-queue-button-added])'
      );

      targetButtons.forEach(function (targetButton) {
        let newButton = document.createElement("button");
        newButton.innerText = "Queue Button";
        newButton.classList.add("queue-button");

        newButton.addEventListener("click", function (event) {
          event.preventDefault();

          chrome.runtime.sendMessage({
            action: "addItem",
          });

          chrome.storage.local.set({ buttonClicked: true });
        });

        targetButton.parentNode.insertBefore(
          newButton,
          targetButton.nextSibling
        );
        targetButton.setAttribute("data-queue-button-added", "true");
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
