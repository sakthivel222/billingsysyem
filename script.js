// Data Storage
let products = [];
let cart = [];
let users = [];
let orders = [];
let currentPaymentMethod = 'cash';

// Initialize with sample data
function init() {
    // Load from localStorage
    loadData();
    
    // Add sample products if empty
    if (products.length === 0) {
        products = [
            { id: 1, name: 'Onion', category: 'vegetables', price: 45.00, unit: 'kg', stock: 50, image: '' },
            { id: 2, name: 'Tomato', category: 'vegetables', price: 60.00, unit: 'kg', stock: 40, image: '' },
            { id: 3, name: 'Potato', category: 'vegetables', price: 35.00, unit: 'kg', stock: 60, image: '' },
            { id: 4, name: 'Brinjal', category: 'vegetables', price: 40.00, unit: 'kg', stock: 30, image: '' },
            { id: 5, name: 'Ladies Finger', category: 'vegetables', price: 50.00, unit: 'kg', stock: 25, image: '' },
            { id: 6, name: 'Carrot', category: 'vegetables', price: 55.00, unit: 'kg', stock: 20, image: '' },
            { id: 7, name: 'Rice', category: 'groceries', price: 120.00, unit: 'kg', stock: 100, image: '' },
            { id: 8, name: 'Wheat Flour', category: 'groceries', price: 45.00, unit: 'kg', stock: 80, image: '' },
            { id: 9, name: 'Sugar', category: 'groceries', price: 42.00, unit: 'kg', stock: 75, image: '' },
            { id: 10, name: 'Salt', category: 'groceries', price: 25.00, unit: 'pack', stock: 50, image: '' },
            { id: 11, name: 'Turmeric Powder', category: 'groceries', price: 180.00, unit: 'kg', stock: 30, image: '' },
            { id: 12, name: 'Cooking Oil', category: 'groceries', price: 140.00, unit: 'pack', stock: 40, image: '' }
        ];
        saveData();
    }
    
    // Migrate old products to include image field
    products.forEach(product => {
        if (!product.hasOwnProperty('image')) {
            product.image = '';
        }
    });
    saveData();
    
    renderProducts();
    updateCartBadge();
}

// LocalStorage Operations
function saveData() {
    localStorage.setItem('baluMaligai_products', JSON.stringify(products));
    localStorage.setItem('baluMaligai_cart', JSON.stringify(cart));
    localStorage.setItem('baluMaligai_users', JSON.stringify(users));
    localStorage.setItem('baluMaligai_orders', JSON.stringify(orders));
}

function loadData() {
    const savedProducts = localStorage.getItem('baluMaligai_products');
    const savedCart = localStorage.getItem('baluMaligai_cart');
    const savedUsers = localStorage.getItem('baluMaligai_users');
    const savedOrders = localStorage.getItem('baluMaligai_orders');
    
    if (savedProducts) products = JSON.parse(savedProducts);
    if (savedCart) cart = JSON.parse(savedCart);
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedOrders) orders = JSON.parse(savedOrders);
}

// QR Scanner instance
let qrScanner = null;

// Handle image loading errors
function handleImageError(img, productName) {
    // Try fallback placeholder
    const placeholderUrl = `https://via.placeholder.com/300x300/2ecc71/ffffff?text=${encodeURIComponent(productName)}`;
    img.src = placeholderUrl;
    img.onerror = function() {
        // If placeholder also fails, use data URI
        this.style.display = 'none';
        const container = this.parentElement;
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #ecf0f1; color: #7f8c8d; font-weight: bold;">${productName}</div>`;
    };
}

// Get product image URL
function getProductImage(product) {
    if (product.image && product.image.trim() !== '') {
        // Check if it's a local path
        if (product.image.startsWith('./') || product.image.startsWith('images/') || product.image.startsWith('/images/')) {
            return product.image;
        }
        return product.image;
    }
    // Try local image first, then fallback to online placeholder
    const productName = product.name.toLowerCase().replace(/\s+/g, '-');
    const localImagePath = `images/products/${productName}.jpg`;
    
    // Return local path with fallback
    return localImagePath;
}

// Product Management
function renderProducts(filterCategory = 'all') {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    const filteredProducts = filterCategory === 'all' 
        ? products 
        : products.filter(p => p.category === filterCategory);
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px;">No products found</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const productImage = getProductImage(product);
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${productImage}" alt="${product.name}" class="product-image" onerror="handleImageError(this, '${product.name}')">
            </div>
            <div class="product-name">${product.name}</div>
            <span class="product-category">${product.category}</span>
            <div class="product-price">₹${product.price.toFixed(2)}</div>
            <div class="product-unit">per ${product.unit}</div>
            <div class="product-stock">Stock: ${product.stock} ${product.unit}</div>
            <div class="product-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${product.id}, -0.5)">-</button>
                    <input type="number" class="quantity-input" id="qty_${product.id}" value="1" min="0.5" step="0.5" onchange="updateQuantityInput(${product.id})">
                    <button class="quantity-btn" onclick="updateQuantity(${product.id}, 0.5)">+</button>
                </div>
                <button class="btn btn-primary" onclick="addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Add
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProducts(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderProducts(category);
}

// Cart Operations
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quantityInput = document.getElementById(`qty_${productId}`);
    const quantity = parseFloat(quantityInput.value) || 1;
    
    if (quantity > product.stock) {
        alert(`Only ${product.stock} ${product.unit} available in stock!`);
        return;
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            alert(`Only ${product.stock} ${product.unit} available in stock!`);
            return;
        }
        existingItem.quantity = newQuantity;
        existingItem.total = newQuantity * product.price;
    } else {
        cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: quantity,
            unit: product.unit,
            total: quantity * product.price
        });
    }
    
    saveData();
    renderCart();
    updateCartBadge();
    quantityInput.value = 1;
}

function updateQuantity(productId, delta) {
    const input = document.getElementById(`qty_${productId}`);
    const currentValue = parseFloat(input.value) || 1;
    const newValue = Math.max(0.5, currentValue + delta);
    input.value = newValue;
}

function updateQuantityInput(productId) {
    const input = document.getElementById(`qty_${productId}`);
    const value = parseFloat(input.value) || 1;
    input.value = Math.max(0.5, value);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveData();
    renderCart();
    updateCartBadge();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        total += item.total;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">${item.quantity} ${item.unit} × ₹${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-price">₹${item.total.toFixed(2)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = total.toFixed(2);
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    sidebar.classList.toggle('open');
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.total, 0);
}

// Product CRUD Modal
function openProductModal() {
    document.getElementById('productModal').classList.add('active');
    renderProductsList();
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    resetProductForm();
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const unit = document.getElementById('productUnit').value;
    const stock = parseFloat(document.getElementById('productStock').value);
    const image = document.getElementById('productImage').value.trim();
    
    if (id) {
        // Update existing product
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], name, category, price, unit, stock, image };
        }
    } else {
        // Add new product
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, category, price, unit, stock, image: image || '' });
    }
    
    saveData();
    renderProducts();
    renderProductsList();
    resetProductForm();
    alert('Product saved successfully!');
});

function renderProductsList() {
    const list = document.getElementById('productsList');
    list.innerHTML = '';
    
    if (products.length === 0) {
        list.innerHTML = '<p>No products found</p>';
        return;
    }
    
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-list-item';
        item.innerHTML = `
            <div class="product-list-info">
                <strong>${product.name}</strong> - ${product.category}<br>
                <small>₹${product.price.toFixed(2)}/${product.unit} | Stock: ${product.stock}</small>
            </div>
            <div class="product-list-actions">
                <button class="btn btn-secondary" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productImage').value = product.image || '';
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveData();
        renderProducts();
        renderProductsList();
    }
}

// User Management Modal
function openUserModal() {
    document.getElementById('userModal').classList.add('active');
    renderUsersList();
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
    resetUserForm();
}

function resetUserForm() {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
}

document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('userId').value;
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    
    if (id) {
        // Update existing user
        const index = users.findIndex(u => u.id === parseInt(id));
        if (index !== -1) {
            users[index] = { ...users[index], name, phone };
        }
    } else {
        // Check if phone already exists
        const existing = users.find(u => u.phone === phone);
        if (existing) {
            alert('User with this phone number already exists!');
            return;
        }
        
        // Add new user
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({ id: newId, name, phone, orders: [] });
    }
    
    saveData();
    renderUsersList();
    updateCheckoutUsers();
    resetUserForm();
    alert('User saved successfully!');
});

function renderUsersList() {
    const list = document.getElementById('usersList');
    list.innerHTML = '';
    
    if (users.length === 0) {
        list.innerHTML = '<p>No users found</p>';
        return;
    }
    
    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'product-list-item';
        item.innerHTML = `
            <div class="product-list-info">
                <strong>${user.name}</strong><br>
                <small>${user.phone}</small>
            </div>
            <div class="product-list-actions">
                <button class="btn btn-secondary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userPhone').value = user.phone;
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(u => u.id !== id);
        saveData();
        renderUsersList();
        updateCheckoutUsers();
    }
}

// Checkout
function openCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    updateCheckoutUsers();
    renderCheckoutItems();
    document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckout() {
    // Stop QR scanner if running
    if (qrScanner) {
        stopQRScanner();
    }
    
    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('qrCodeContainer').innerHTML = '';
    document.getElementById('qrScannerContainer').innerHTML = '';
    currentPaymentMethod = 'cash';
}

function updateCheckoutUsers() {
    const select = document.getElementById('checkoutCustomer');
    select.innerHTML = '<option value="">Walk-in Customer</option>';
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.phone})`;
        select.appendChild(option);
    });
}

function renderCheckoutItems() {
    const container = document.getElementById('checkoutItems');
    const total = document.getElementById('checkoutTotal');
    
    container.innerHTML = '';
    let totalAmount = 0;
    
    cart.forEach(item => {
        totalAmount += item.total;
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'checkout-item';
        checkoutItem.innerHTML = `
            <span>${item.name} - ${item.quantity} ${item.unit}</span>
            <span>₹${item.total.toFixed(2)}</span>
        `;
        container.appendChild(checkoutItem);
    });
    
    total.textContent = totalAmount.toFixed(2);
}

function selectPayment(method) {
    currentPaymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const qrContainer = document.getElementById('qrCodeContainer');
    const qrScannerContainer = document.getElementById('qrScannerContainer');
    
    // Stop any existing scanner
    if (qrScanner) {
        stopQRScanner();
    }
    
    if (method === 'qr') {
        qrScannerContainer.innerHTML = '';
        generateQRCode();
    } else if (method === 'qr-scan') {
        qrContainer.innerHTML = '';
        startQRScanner();
    } else {
        qrContainer.innerHTML = '';
        qrScannerContainer.innerHTML = '';
    }
}

function startQRScanner() {
    const qrScannerContainer = document.getElementById('qrScannerContainer');
    qrScannerContainer.innerHTML = `
        <div class="qr-scanner-wrapper">
            <h4>Scan Payment QR Code</h4>
            <div id="qr-reader" style="width: 100%; max-width: 400px; margin: 0 auto;"></div>
            <p id="qr-result" style="margin-top: 10px; text-align: center; color: green; font-weight: bold;"></p>
            <button class="btn btn-secondary" onclick="stopQRScanner()" style="margin-top: 10px;">
                <i class="fas fa-stop"></i> Stop Scanner
            </button>
        </div>
    `;
    
    const qrReaderElement = document.getElementById('qr-reader');
    
    // Initialize QR Scanner
    if (typeof Html5Qrcode !== 'undefined') {
        qrScanner = new Html5Qrcode("qr-reader");
        
        qrScanner.start(
            { facingMode: "environment" }, // Use back camera
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                // QR Code scanned successfully
                handleQRScanResult(decodedText);
            },
            (errorMessage) => {
                // Error handling - ignore for now
            }
        ).catch((err) => {
            console.error("Unable to start QR scanner:", err);
            qrScannerContainer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p style="color: red;">Unable to access camera. Please ensure you have granted camera permissions.</p>
                    <button class="btn btn-secondary" onclick="stopQRScanner()">Close</button>
                </div>
            `;
        });
    } else {
        qrScannerContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: red;">QR Scanner library not loaded. Please check your internet connection.</p>
                <button class="btn btn-secondary" onclick="stopQRScanner()">Close</button>
            </div>
        `;
    }
}

function stopQRScanner() {
    if (qrScanner) {
        qrScanner.stop().then(() => {
            qrScanner.clear();
            qrScanner = null;
            const qrScannerContainer = document.getElementById('qrScannerContainer');
            qrScannerContainer.innerHTML = '';
        }).catch((err) => {
            console.error("Error stopping scanner:", err);
            qrScanner = null;
            const qrScannerContainer = document.getElementById('qrScannerContainer');
            qrScannerContainer.innerHTML = '';
        });
    }
}

function handleQRScanResult(decodedText) {
    const resultElement = document.getElementById('qr-result');
    resultElement.textContent = 'QR Code scanned successfully!';
    resultElement.style.color = 'green';
    
    // Parse payment data (assuming UPI QR format or custom format)
    try {
        const paymentData = JSON.parse(decodedText);
        if (paymentData.amount && paymentData.amount === getCartTotal()) {
            resultElement.textContent = 'Payment verified! Amount matches.';
            // Auto-complete payment after 2 seconds
            setTimeout(() => {
                stopQRScanner();
                processPayment();
            }, 2000);
        } else {
            resultElement.textContent = `Payment QR scanned. Amount: ₹${paymentData.amount || 'N/A'}`;
            resultElement.style.color = 'orange';
        }
    } catch (e) {
        // Not JSON, might be UPI QR or other format
        resultElement.textContent = 'QR Code scanned: ' + decodedText.substring(0, 50) + '...';
        resultElement.style.color = 'blue';
        // You can manually complete payment
        setTimeout(() => {
            const confirmPayment = confirm('QR Code scanned. Complete payment?');
            if (confirmPayment) {
                stopQRScanner();
                processPayment();
            }
        }, 1000);
    }
}

function generateQRCode() {
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = '<p>Generating QR Code...</p>';
    
    const total = getCartTotal();
    const paymentData = {
        amount: total,
        shop: 'Balu Maligai',
        timestamp: new Date().toISOString()
    };
    
    QRCode.toCanvas(qrContainer, JSON.stringify(paymentData), {
        width: 250,
        margin: 2
    }, function (error) {
        if (error) {
            qrContainer.innerHTML = '<p>Error generating QR code. Please try again.</p>';
        } else {
            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
                qrContainer.innerHTML = '<h4>Scan to Pay</h4>';
                qrContainer.appendChild(canvas);
                qrContainer.innerHTML += `<p>Amount: ₹${total.toFixed(2)}</p>`;
            }
        }
    });
}

function processPayment() {
    const customerId = document.getElementById('checkoutCustomer').value;
    const customer = customerId ? users.find(u => u.id === parseInt(customerId)) : null;
    
    const order = {
        id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
        customerId: customerId ? parseInt(customerId) : null,
        customerName: customer ? customer.name : 'Walk-in Customer',
        customerPhone: customer ? customer.phone : '',
        items: [...cart],
        total: getCartTotal(),
        paymentMethod: currentPaymentMethod,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    orders.push(order);
    
    // Update user's order history
    if (customer) {
        if (!customer.orders) customer.orders = [];
        customer.orders.push(order.id);
    }
    
    // Update stock
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.productId);
        if (product) {
            product.stock = Math.max(0, product.stock - cartItem.quantity);
        }
    });
    
    saveData();
    cart = [];
    renderCart();
    updateCartBadge();
    renderProducts();
    closeCheckout();
    
    // Show receipt
    showReceipt(order);
}

function showReceipt(order) {
    const receiptContent = document.getElementById('receiptContent');
    const date = new Date(order.date);
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>BALU MALIGAI</h2>
            <p>Local Grocery & Vegetables Shop</p>
            <p>Receipt #${order.id}</p>
        </div>
        <div class="receipt-details">
            <p><strong>Date:</strong> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
            <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
            <hr style="margin: 15px 0;">
            <div style="margin-top: 15px;">
                ${order.items.map(item => `
                    <div class="receipt-item">
                        <span>${item.name} (${item.quantity} ${item.unit})</span>
                        <span>₹${item.total.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="receipt-total">
                <span>Total: ₹${order.total.toFixed(2)}</span>
            </div>
        </div>
        <div class="receipt-footer">
            <p>Thank you for shopping with us!</p>
            <p>Visit us again!</p>
        </div>
    `;
    
    document.getElementById('receiptModal').classList.add('active');
    window.currentOrder = order;
}

function closeReceipt() {
    document.getElementById('receiptModal').classList.remove('active');
    window.currentOrder = null;
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt - Balu Maligai</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                    .receipt-item { display: flex; justify-content: space-between; padding: 5px 0; }
                    .receipt-total { margin-top: 15px; padding-top: 15px; border-top: 2px solid #000; font-weight: bold; font-size: 1.2rem; text-align: center; }
                </style>
            </head>
            <body>
                ${receiptContent.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function downloadBill() {
    const order = window.currentOrder;
    if (!order) {
        alert('No receipt available to download');
        return;
    }
    
    const receiptContent = document.getElementById('receiptContent');
    const date = new Date(order.date);
    const fileName = `Balu_Maligai_Bill_${order.id}_${date.toISOString().split('T')[0]}.pdf`;
    
    // Configure html2pdf options
    const options = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Create a clone of receipt content for PDF
    const receiptClone = receiptContent.cloneNode(true);
    receiptClone.style.padding = '20px';
    receiptClone.style.maxWidth = '100%';
    
    // Temporarily append to body for rendering
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.appendChild(receiptClone);
    document.body.appendChild(tempDiv);
    
    // Generate and download PDF
    html2pdf().set(options).from(receiptClone).save().then(() => {
        document.body.removeChild(tempDiv);
    }).catch(err => {
        console.error('Error generating PDF:', err);
        alert('Error downloading bill. Please try printing instead.');
        document.body.removeChild(tempDiv);
    });
}

function sendWhatsApp() {
    const order = window.currentOrder;
    if (!order) return;
    
    const phone = order.customerPhone || '';
    const message = `Thank you for shopping at Balu Maligai!\n\nReceipt #${order.id}\nDate: ${new Date(order.date).toLocaleString()}\nTotal: ₹${order.total.toFixed(2)}\n\nThank you!`;
    
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    if (phone) {
        window.open(whatsappUrl, '_blank');
    } else {
        // Copy to clipboard if no phone
        navigator.clipboard.writeText(message).then(() => {
            alert('Receipt details copied to clipboard! You can now paste it in WhatsApp manually.');
        });
    }
}

// Purchase History
function openHistoryModal() {
    document.getElementById('historyModal').classList.add('active');
    updateHistoryFilters();
    renderHistory();
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('active');
}

function updateHistoryFilters() {
    const userSelect = document.getElementById('historyUser');
    const monthSelect = document.getElementById('historyMonth');
    
    // Update users
    userSelect.innerHTML = '<option value="">All Users</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.phone})`;
        userSelect.appendChild(option);
    });
    
    // Update months
    const months = [];
    orders.forEach(order => {
        const date = new Date(order.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!months.includes(monthYear)) {
            months.push(monthYear);
        }
    });
    
    months.sort().reverse();
    monthSelect.innerHTML = '<option value="">All Months</option>';
    months.forEach(month => {
        const date = new Date(month + '-01');
        const option = document.createElement('option');
        option.value = month;
        option.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthSelect.appendChild(option);
    });
}

function filterHistory() {
    renderHistory();
}

function renderHistory() {
    const content = document.getElementById('historyContent');
    const userId = document.getElementById('historyUser').value;
    const month = document.getElementById('historyMonth').value;
    
    let filteredOrders = [...orders];
    
    if (userId) {
        filteredOrders = filteredOrders.filter(o => o.customerId === parseInt(userId));
    }
    
    if (month) {
        filteredOrders = filteredOrders.filter(o => {
            const orderDate = new Date(o.date);
            const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            return orderMonth === month;
        });
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => b.timestamp - a.timestamp);
    
    if (filteredOrders.length === 0) {
        content.innerHTML = '<p style="text-align: center; padding: 40px;">No purchase history found</p>';
        return;
    }
    
    content.innerHTML = '';
    
    // Calculate monthly totals
    const monthlyTotals = {};
    filteredOrders.forEach(order => {
        const date = new Date(order.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += order.total;
    });
    
    // Display monthly totals
    if (Object.keys(monthlyTotals).length > 0) {
        const totalsDiv = document.createElement('div');
        totalsDiv.style.cssText = 'background: #2ecc71; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;';
        totalsDiv.innerHTML = '<h3 style="margin-bottom: 10px;">Monthly Summary</h3>';
        Object.keys(monthlyTotals).sort().reverse().forEach(monthKey => {
            const date = new Date(monthKey + '-01');
            totalsDiv.innerHTML += `<p><strong>${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}:</strong> ₹${monthlyTotals[monthKey].toFixed(2)}</p>`;
        });
        content.appendChild(totalsDiv);
    }
    
    // Display individual orders
    filteredOrders.forEach(order => {
        const date = new Date(order.date);
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-header">
                <span>Order #${order.id}</span>
                <span>₹${order.total.toFixed(2)}</span>
            </div>
            <div class="history-details">
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Date:</strong> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
                <p><strong>Items:</strong> ${order.items.length} item(s)</p>
                <button class="btn btn-secondary" onclick="viewOrderDetails(${order.id})" style="margin-top: 10px;">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        `;
        content.appendChild(item);
    });
}

function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const details = order.items.map(item => 
        `${item.name} - ${item.quantity} ${item.unit} × ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}`
    ).join('\n');
    
    alert(`Order #${order.id} Details:\n\n${details}\n\nTotal: ₹${order.total.toFixed(2)}`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

