import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';
import { showAlertModal } from './global/modal';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();

        $('button.make-cart-and-add-items-button').on('click', (event) => {
            const string = $(event.currentTarget).data('confirmAdd');
            showAlertModal(string, {
                icon: 'info',
                showCancelButton: true,
                onConfirm: () => {
                    this.createCart('/api/storefront/carts', this.restructureProductsArr(this.context.products))
                        .then(data => console.log(JSON.stringify(data)))
                        // eslint-disable-next-line no-console
                        .catch(error => console.error(error));
                    // relaod page to see added to cart

                    setTimeout(() => {
                        location.reload(); 
                        return console.log('I was Added');
                    }, 1500);
                },
            });
            event.preventDefault();
        });

        $('button.delete-all').on('click', (event) => {
            const string = $(event.currentTarget).data('confirmDelete');
            showAlertModal(string, {
                icon: 'warning',
                showCancelButton: true,
                onConfirm: () => {
                    // remove item from cart
                    this.deleteCartItem('/api/storefront/carts/', this.context.cartID, this.context.cart)
                        .then(data => console.log(JSON.stringify(data)))
                        // eslint-disable-next-line no-console
                        .catch(error => console.error(error));
                    // relaod page to see removed to cart
                    setTimeout(() => {
                        console.log('I was deleted');
                        location.reload();
                    }, 2500);
                },
            });
            event.preventDefault();
        });
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }

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
    };

    addCartItem(url, cartId, cartItems) {
        return fetch(url + cartId + '/items', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartItems),
        })
            .then(response => response.json())
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
}
