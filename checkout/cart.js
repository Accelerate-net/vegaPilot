$(document).ready(function() {

	/*** Cart Format
	[
	    {
	        "itemId": "C000002",
	        "title": "Dream IISER - IAT 2025 Crash Course",
	        "type": "COURSE",
	        "unitPrice": 599000,
	        "number": 1,
	        "displayImage": "",
	        "applicableTotalTax": 1800
	    },
	    {
	        "itemId": "C000005",
	        "title": "Gear Up for IISER - Mock Test 2025",
	        "type": "TEST",
	        "unitPrice": 99900,
	        "number": 1,
	        "displayImage": "",
	        "applicableTotalTax": 500
	    }
	]
	*/

	function getDiscountAmount() {
		var crisprCartDiscount = retrieveDiscount();
	    if (crisprCartDiscount && crisprCartDiscount.amount)
	    	return crisprCartDiscount.amount;

	    return 0;
	}

	function removeDiscount() {
		localStorage.setItem("crisprCartDiscount", JSON.stringify({}))
	}

	function setDiscountCache(amount, code) {
		var crisprCartDiscount = retrieveDiscount();
		crisprCartDiscount.amount = amount;
		crisprCartDiscount.code = code;
		localStorage.setItem("crisprCartDiscount", JSON.stringify(crisprCartDiscount));
	}

	function retrieveDiscount() {
	    var discountData = localStorage.getItem("crisprCartDiscount");
	    if (discountData) {
	        try {
	            return JSON.parse(discountData);
	        } catch (error) {
	            console.log('Error parsing discount data:', error);
	        }
	    } else {
	        console.log('No discount found in localStorage');
	    }	

	    return {
	    	"amount": 0,
	    	"code": ""
	    }
	}


	function retrieveCart() {
	    var cartItemsData = localStorage.getItem("crisprCart");
	    if (cartItemsData) {
	        try {
	            return JSON.parse(cartItemsData);
	        } catch (error) {
	            console.log('Error parsing cart data:', error);
	        }
	    } else {
	        console.log('No cart found in localStorage');
	    }		
	}

	function removeUrlParam(param) {
        const url = new URL(window.location);
		url.searchParams.delete(param);
		history.replaceState(null, '', url.toString());
    }


	function renderCheckoutPage() {
		//1. Check for any new add request
			const urlParams = new URLSearchParams(window.location.search);
			const itemId = urlParams.get('addItem');
			if (itemId) {
				addToCart(itemId)
				removeUrlParam('addItem')
			}
		//2. Render Cart
			renderCartForUser();
	}

	function renderCartForUser() {
        var myCart = retrieveCart();
        if (myCart.length > 0) {
            renderCartItems(myCart)
        } else {
            renderNoItemsInCartMessage();
        }
	}

	function addToCart(itemIdToAdd) {
		var itemData = {
	        "itemId": itemIdToAdd,
	        "title": "Dream IISER - IAT 2025 Crash Course",
	        "type": "COURSE",
	        "unitPrice": 599000,
	        "number": 1,
	        "displayImage": "",
	        "applicableTotalTax": 1800
	    }

	    removeDiscount();

	    var myCart = retrieveCart();
	    var isFound = false;
        for (var i = 0; i < myCart.length; i++) {
            var cartItem = myCart[i];
            if (cartItem.itemId == itemIdToAdd) {
                cartItem.number++;
                isFound = true;
            }
        }

        if(!isFound)
        	myCart.push(itemData);

        localStorage.setItem("crisprCart", JSON.stringify(myCart));
        renderCartForUser(myCart);
	}

	function removeFromCart(itemIdToRemove){
		removeDiscount();

        var myCart = retrieveCart();;
        for (var i = 0; i < myCart.length; i++) {
            var cartItem = myCart[i];
            if (cartItem.itemId == itemIdToRemove) {
                myCart.splice(i, 1);
                i--;
            }
        }

        localStorage.setItem("crisprCart", JSON.stringify(myCart));
        renderCartForUser(myCart);
	}


	function renderNoItemsInCartMessage() {
		document.getElementById("containerContent").innerHTML = '<h1 style=" font-size: 21px; font-weight: 300; text-align: center; width: 100%; margin: 50px 0; ">Oho! There is nothing here, something went wrong. <a href="https://crisprlearning.com" style=" display: block; font-size: 70%; margin-top: 20px; ">Take Me Home</a></h1>';
	}

	const DEFAULT_COURSE_PIC = 'https://img.icons8.com/color/96/book.png';
	const DEFAULT_TEST_PIC = 'https://img.icons8.com/color/96/system-information.png';
	function getCartImage(cartItem) {
		if(cartItem.displayImage)
			return cartItem.displayImage;

		if(cartItem.type == "TEST")
			return DEFAULT_TEST_PIC;

		return DEFAULT_COURSE_PIC;
	}

	function formatAmount(amount) {
	    return (amount / 100).toFixed(2);
	}


	function renderCartSummary(cartItems) {
		var totalTax = 0;
		var subTotal = 0;
		var discounts = getDiscountAmount();
		for(var i = 0; i < cartItems.length; i++) {
			var cartItem = cartItems[i];
			var rowPrice = cartItem.unitPrice * cartItem.number;

			totalTax +=  rowPrice * (cartItem.applicableTotalTax / 10000);
			subTotal += rowPrice;
		}
		var grandTotal = subTotal + totalTax - discounts;

		var htmlContent = '' +
				'<div class="summary-item"> <span>Subtotal</span> <span>₹'+formatAmount(subTotal)+'</span> </div>'+
                (discounts > 0 ? '<div class="summary-item"> <span>Discounts</span> <span>-₹'+formatAmount(discounts)+'</span> </div>' : '')+
                '<div class="summary-item"> <span>Applicable Taxes</span> <span>₹'+formatAmount(totalTax)+'</span> </div>'+
                '<div class="summary-item total"> <span>Total</span> <span class="price">₹'+formatAmount(grandTotal)+'</span> </div>';

        document.getElementById("crisprCartSummary").innerHTML = htmlContent;
	}

	function applyCouponCode() {
		var code = document.getElementById()
	}


	function renderCartItems(cartItems) {
		var htmlContent = '';
		for(var i = 0; i < cartItems.length; i++) {
			var cartItem = cartItems[i];
			htmlContent += '' +
				'<div class="summary-item">'+
                    '<span class="summary-item-remove" title="Remove" data-item-id="'+cartItem.itemId+'"><i class="fa fa-trash"></i></span>'+
                    '<div class="product-info">'+
                        '<img src="'+getCartImage(cartItem)+'" alt="">'+
                        '<div class="product-details">'+
                            '<span class="product-name">'+cartItem.title+'</span>'+
                            '<span class="product-size">x '+cartItem.number+'</span>'+
                        '</div>'+
                    '</div>'+
                    '<span class="price">₹'+formatAmount(cartItem.unitPrice)+'</span>'+
                '</div>';
		}

		document.getElementById("crisprCartItems").innerHTML = htmlContent;

		document.getElementById("crisprCartItems").addEventListener("click", function(event) {
		    if (event.target.closest(".summary-item-remove")) {
		        const itemId = event.target.closest(".summary-item-remove").dataset.itemId;
		        removeFromCart(itemId);
		    }
		});

		renderCouponSummary();
		renderCartSummary(cartItems);
	}

	function clearCoupon() {
		removeDiscount();
		renderCartForUser();
	}

	function checkForDiscounts(giftCode) {
		//Call API - pass cart
		setDiscountCache(10000, giftCode);
		renderCartForUser();
	}

	function getFormattedCouponCode(discountsData) {
		if(discountsData && discountsData.code)
			return discountsData.code;
		return "";
	}


	function renderCouponSummary() {
		var discountsData = retrieveDiscount();
		console.log(discountsData)
		var isApplied = discountsData.amount > 0;
		var htmlContent = '';

		if(isApplied) {
			htmlContent += '<input type="text" placeholder="Gift card or discount code" id="giftCodeUsed" value="'+getFormattedCouponCode(discountsData)+'" disabled>';
			htmlContent += '<button class="apply-btn" id="removeCodeButton">Remove</button>';
			document.getElementById("giftVoucherSection").innerHTML = htmlContent;

			document.getElementById("removeCodeButton").addEventListener("click", function(event) {
			    clearCoupon();
			});
		} else {
			htmlContent += '<input type="text" placeholder="Gift card or discount code" id="giftCodeUsed" value="'+getFormattedCouponCode(discountsData)+'">';
			htmlContent += '<button class="apply-btn" id="applyCodeButton">Apply</button>';
			document.getElementById("giftVoucherSection").innerHTML = htmlContent;

			document.getElementById("applyCodeButton").addEventListener("click", function(event) {
			    var giftCode = document.getElementById("giftCodeUsed").value;
			    checkForDiscounts(giftCode)
			});
		}
	}


	renderCheckoutPage();

	/**** TOASTER *****/
	function showToaster(message) {
        const toaster = document.getElementById('toaster');
        toaster.textContent = message;
        toaster.classList.add('show');

        setTimeout(() => {
            toaster.classList.remove('show');
        }, 3000);
    }



	/**** PAYMENT ****/
	function initiatePayment() {
		var myCart = retrieveCart();
		var discountsData = retrieveDiscount();
		console.log(JSON.stringify(myCart), JSON.stringify(discountsData))
		var mobile = document.getElementById("mobile").value;
		var name = document.getElementById("fullname").value;
		var address = document.getElementById("address").value;
		var locality = document.getElementById("locality").value;
		var city = document.getElementById("city").value;
		var pincode = document.getElementById("pincode").value;
		var state = document.getElementById("state").value;
		var email = document.getElementById("email").value;

		console.log(mobile, name, address, locality,city, pincode, state, email)
		//1. Call API to validate
		//2. If failed, clear cache
		//3. Else initiate payment

		showToaster("Please provide all the details");
	}


	document.getElementById("payNowButton").addEventListener("click", function(event) {
	    initiatePayment();
	});

});