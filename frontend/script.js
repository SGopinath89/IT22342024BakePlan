document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://localhost:3000/api/v1';

    // Fetch and display products
    if (document.getElementById('product-list')) {
        fetch(`${apiUrl}/products`)
            .then(response => response.json())
            .then(data => {
                const productList = document.getElementById('product-list');
                data.forEach(product => {
                    const productDiv = document.createElement('div');
                    productDiv.innerHTML = `
                        <h3>${product.name}</h3>
                        <p>$${product.price}</p>
                        <button onclick="addToCart('${product.id}')">Add to Cart</button>
                    `;
                    productList.appendChild(productDiv);
                });
            });
    }

    // Fetch and display cart items
    if (document.getElementById('cart-items')) {
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        displayCartItems(cartItems);
    }

    // Handle login form submission
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch(`${apiUrl}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        alert('Login successful');
                    } else {
                        alert('Login failed');
                    }
                });
        });
    }

    // Handle signup form submission
    if (document.getElementById('signup-form')) {
        document.getElementById('signup-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch(`${apiUrl}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.id) {
                        alert('Sign up successful');
                    } else {
                        alert('Sign up failed');
                    }
                });
        });
    }
});

function addToCart(productId) {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    cartItems.push({ productId, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cartItems));
    alert('Product added to cart');
}

function displayCartItems(cartItems) {
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '';
    let totalPrice = 0;

    cartItems.forEach(item => {
        fetch(`http://localhost:3000/api/v1/products/${item.productId}`)
            .then(response => response.json())
