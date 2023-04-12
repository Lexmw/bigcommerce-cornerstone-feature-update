# Additional Features
You can find the 2 main features added to this BigCommerce Cornerstone theme. Below you can find the details of each feature. To see the features in action visit the linke below to the live bigcommerce site.

[Lexs Favorite Store](https://lexius-great-shop.mybigcommerce.com/special-items/) to view the site, use the preview code: 1vowaexq47.

### Show second product image on hover
This feature shows the second product image upon hover of the product  card in the product listing container. This feature is applied to all products in every category. I was able to use the handlebar functions to pass the correct product images to the card and use conditionals to display the second image on hover.

```
  <a href="{{url}}" class="card-figure__link" aria-label="{{> components/products/product-info}}" {{#if
            settings.data_tag_enabled}} data-event-type="product-click" {{/if}}>
            <div class="card-img-container">
                {{> components/common/responsive-img
                image=image
                class="card-image"
                fallback_size=theme_settings.productgallery_size
                lazyload=theme_settings.lazyload_mode
                default_image=theme_settings.default_image_product
                }}
            </div>

            //This figcaption is holding the second image, and when the card is hovered over the figcaption display is set to block.
            <figcaption class="card-figcaption">
                <div class="card-figcaption-body">
                    {{#each (limit images 2)}} //This is iterating over the first two product images
                        {{#if @index '>' 0}}
                            <img src={{getImage this ‘productgallery_size’ (cdn theme_settings.default_image_product)}} alt=”{{this.alt}}” title=”{{this.alt}}” class=”second-img”>
                        {{/if}}
                    {{/each}}
                </div>
            </figcaption>
        </a>
```

### "Add All Items" & "Remove All Items" category button
This feature allows the user to add the special item, in the special items category to the cart. Once the item is added it is replaced with a "Remove all items" button to remove all itmes from the same cart. To add and remove items from the cart, I utilized the storefront api boilerplate code to structure the requests. To grab data from the cart and make it accessible to category.js, I used bigCommerce built in Handlebar Helpers. Below you can find the functions created for the functionality. There is an extra helper function that takes the category poroducts and makes them digestable to the api.

```
    createCart(url, cartItems) {
        return fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartItems),
        })
            .then(response => {
                return response.json();
            })
            .catch(error => console.error(error));
    }

    deleteCartItem(url, cartId, cart) {
        const itemId = cart.items[0].id;
        return fetch(`${url + cartId}/items/${itemId}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .catch(error => console.error(error));
    }

    // Changing the form of the products array to an array the api is expecting
    restructureProductsArr(products) {
        const obj = {};
        let newProdArr = [];
        for (let i = 0; i < products.length; i++) {
            let smallobj = {};
            smallobj['quantity'] = 1;
            smallobj['productId'] = products[i].id;
            newProdArr = [...newProdArr, smallobj];
        }

        obj['lineItems'] = newProdArr;

        return obj;
    }
```
