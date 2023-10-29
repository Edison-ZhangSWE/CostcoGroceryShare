import requests
from bs4 import BeautifulSoup
import json

# Define the URL of the Costco Beef category
url = "https://www.costco.com/beef.html"

# Send an HTTP GET request to the URL
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Parse the HTML content of the page
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the product elements on the page (you may need to inspect the HTML structure of the page to locate the right elements)
    products = soup.find_all('div', class_='product')

    # Create a list to store the scraped data
    beef_data = []

    # Loop through the product elements and extract data
    for product in products:
        product_name = product.find('span', class_='description').text.strip()
        product_price = product.find('span', class_='price').text.strip()
        
        # Create a dictionary to store the data for each product
        product_info = {
            'name': product_name,
            'price': product_price
        }

        # Append the product data to the list
        beef_data.append(product_info)

    # Save the scraped data to a JSON file
    with open('costco_beef_data.json', 'w') as json_file:
        json.dump(beef_data, json_file, indent=4)

    print("Scraping completed. Data saved to costco_beef_data.json.")
else:
    print("Failed to retrieve the webpage. Status code:", response.status_code)
