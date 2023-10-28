console.log("Testing content script execution...");

// Extracting product name and price based on the provided HTML structure
let productNameElement = document.querySelector('h1[itemprop="name"][automation-id="productName"]');
let productPriceElement = document.querySelector('span.value[automation-id="productPriceOutput"]');

console.log("Content script running...");  // This will confirm the script is running on the page

if (productNameElement && productPriceElement) {
    let productName = productNameElement.textContent;
    let productPrice = productPriceElement.textContent;

    console.log("Product Name:", productName);  // Log the extracted product name
    console.log("Product Price:", productPrice);  // Log the extracted product price

    // Check if the product name matches the "Number Total Packs" format
    let packRegex = /\d+ Total Packs/;
    if (packRegex.test(productName)) {
        // Extract the number of packs
        let packs = productName.match(/\d+/)[0];  // This gets the first number in the string, which should be the number of packs

        console.log("Number of Packs:", packs);  // Log the extracted number of packs

        // Send this data to your popup or background script
        chrome.runtime.sendMessage({
            productName: productName,
            productPrice: productPrice,
            packs: packs
        });
    } else {
        console.log("Product does not match the 'Number Total Packs' format.");
    }
} else {
    console.log("Failed to extract product details.");
}
