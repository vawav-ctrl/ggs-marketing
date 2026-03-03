/**
 * app.js - Main Application Logic
 */

// Global State
const State = {
    user: null, // { email, name, role }
    assets: [],
    categories: [],
    cart: [], // array of { asset, qty }
    myItems: [],
    pendingApprovals: [],
    dashboard: null
};

// Carousel State
const Carousel = {
    currentIndex: 0,
    totalItems: 0
};

// DOM Elements
const Elements = {
    loading: document.getElementById('loading-overlay'),
    screens: {
        login: document.getElementById('screen-login'),
        home: document.getElementById('screen-home'),
        checkout: document.getElementById('screen-checkout'),
        myItems: document.getElementById('screen-myitems'),
        admin: document.getElementById('screen-admin'),
        settings: document.getElementById('screen-settings')
    },
    // Login
    loginBtn: document.getElementById('btn-login'),
    emailInput: document.getElementById('input-email'),
    // Home
    categoryGrid: document.getElementById('category-grid'),
    assetListContainer: document.getElementById('asset-list-container'),
    assetList: document.getElementById('asset-list'),
    inputSearchAssets: document.getElementById('input-search-assets'),
    btnBackCat: document.getElementById('btn-back-cat'),
    catTitle: document.getElementById('cat-title'),
    // Cart
    cartBtn: document.getElementById('btn-cart'),
    cartBadge: document.getElementById('cart-badge'),
    cartModal: document.getElementById('cart-modal'),
    cartItems: document.getElementById('cart-items'),
    btnCheckout: document.getElementById('btn-checkout'),
    btnCloseCart: document.getElementById('btn-close-cart'),
    // Checkout
    checkoutItems: document.getElementById('checkout-items'),
    btnConfirmBorrow: document.getElementById('btn-confirm-borrow'),
    btnBackCart: document.getElementById('btn-back-cart'),
    inputPurpose: document.getElementById('input-purpose'),
    inputDate: document.getElementById('input-date'),
    // My Items
    myItemsTabs: document.querySelectorAll('.myitems-tab-btn'),
    myItemsListActive: document.getElementById('my-items-list-active'),
    myItemsListHistory: document.getElementById('my-items-list-history'),
    // Admin
    adminTabs: document.querySelectorAll('.tab-btn'),
    adminDashboard: document.getElementById('admin-tab-dashboard'),
    adminApprovals: document.getElementById('admin-tab-approvals'),
    dashTotal: document.getElementById('dash-total'),
    dashAssetsContainer: document.getElementById('dash-assets-container'),
    dashBorrowed: document.getElementById('dash-borrowed'),
    dashBorrowedContainer: document.getElementById('dash-borrowed-container'),
    dashOverdue: document.getElementById('dash-overdue'),
    dashOverdueContainer: document.getElementById('dash-overdue-container'),
    dashInactive: document.getElementById('dash-inactive'),
    dashDormantContainer: document.getElementById('dash-dormant-container'),
    approvalList: document.getElementById('approval-list'),
    adminBadgeNav: document.getElementById('admin-badge-nav'),
    adminBadgeTab: document.getElementById('admin-badge-tab'),
    // Navigation Bottom
    navItems: document.querySelectorAll('.nav-item'),

    // Asset Modal
    assetModal: document.getElementById('asset-modal'),
    btnCloseAssetModal: document.getElementById('btn-close-asset-modal'),
    modalAssetImg: document.getElementById('modal-asset-img'),
    modalAssetCat: document.getElementById('modal-asset-cat'),
    modalAssetName: document.getElementById('modal-asset-name'),
    modalAssetSku: document.getElementById('modal-asset-sku'),
    modalAssetQty: document.getElementById('modal-asset-qty'),
    modalAssetBorrowers: document.getElementById('modal-asset-borrowers'),
    modalAssetDots: document.getElementById('modal-asset-dots'),
    modalQtyMinus: document.getElementById('modal-qty-minus'),
    modalQtyPlus: document.getElementById('modal-qty-plus'),
    modalQtyVal: document.getElementById('modal-qty-val'),
    modalBtnAdd: document.getElementById('modal-btn-add'),

    // Transaction Modal
    transModal: document.getElementById('trans-modal'),
    btnCloseTransModal: document.getElementById('btn-close-trans-modal'),
    modalTransId: document.getElementById('modal-trans-id'),
    modalTransStatus: document.getElementById('modal-trans-status'),
    modalTransDate: document.getElementById('modal-trans-date'),
    modalTransReturn: document.getElementById('modal-trans-return'),
    modalTransPurpose: document.getElementById('modal-trans-purpose'),
    modalTransItems: document.getElementById('modal-trans-items'),
    modalTransReturnArea: document.getElementById('modal-trans-return-area'),
    modalBtnReturn: document.getElementById('modal-btn-return'),
    modalAdminActionArea: document.getElementById('modal-admin-action-area'),
    modalBtnApprove: document.getElementById('modal-btn-approve'),
    modalBtnReject: document.getElementById('modal-btn-reject'),

    // Admin Dashboard Modal
    adminDashModal: document.getElementById('admin-dash-modal'),
    btnCloseAdminDashModal: document.getElementById('btn-close-admin-dash-modal'),
    adminDashModalTitle: document.getElementById('admin-dash-modal-title'),
    inputSearchDash: document.getElementById('input-search-dash'),
    adminDashModalSummary: document.getElementById('admin-dash-modal-summary'),
    adminDashModalList: document.getElementById('admin-dash-modal-list'),
    dashClickables: document.querySelectorAll('.dash-clickable')
};

// Initialize App
function initApp() {
    // Check if user is saved in memory (simple session)
    const savedUser = localStorage.getItem('ggs_user');
    if (savedUser) {
        State.user = JSON.parse(savedUser);
        loadHomeData();
    } else {
        showScreen('login');
        hideLoading();
    }

    attachEvents();
}

function showLoading() {
    Elements.loading.classList.remove('hidden');
}

function hideLoading() {
    Elements.loading.classList.add('hidden');
}

function showScreen(screenName) {
    // Hide all screens
    Object.values(Elements.screens).forEach(s => s.classList.add('hidden'));

    // Show requested screen
    if (Elements.screens[screenName]) {
        Elements.screens[screenName].classList.remove('hidden');
    }

    // Update bottom nav active state
    Elements.navItems.forEach(nav => {
        if (nav.dataset.target === screenName) {
            nav.style.color = 'var(--primary-color)';
            nav.style.fontWeight = 'bold';
        } else {
            nav.style.color = 'var(--text-secondary)';
            nav.style.fontWeight = 'normal';
        }
    });
}

function attachEvents() {
    // Login
    Elements.loginBtn.addEventListener('click', handleLogin);

    // Bottom Nav
    Elements.navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            if (!State.user && target !== 'login') return; // Must login first

            if (target === 'home') loadHomeData();
            else if (target === 'myItems') loadMyItems();
            else if (target === 'settings') loadSettings();
            else if (target === 'admin') {
                if (State.user.role === 'Admin') loadAdminDash();
                else alert('Only admins can access this page.');
            }
        });
    });

    // Sub-navigation inside home
    Elements.btnBackCat.addEventListener('click', () => {
        Elements.categoryGrid.classList.remove('hidden');
        Elements.assetListContainer.classList.add('hidden');
        Elements.catTitle.textContent = 'Categories';
        Elements.btnBackCat.classList.add('hidden');
        State.currentCategory = null; // Clear current category when going back
        Elements.inputSearchAssets.value = ''; // Clear search field
    });

    // Cart Navigation
    Elements.cartBtn.addEventListener('click', openCart);
    Elements.btnCloseCart.addEventListener('click', closeCart);
    Elements.btnCheckout.addEventListener('click', () => {
        if (State.cart.length === 0) return alert('Your cart is empty');
        closeCart();
        prepareCheckout();
    });

    // Checkout Navigation
    Elements.btnBackCart.addEventListener('click', () => {
        showScreen('home');
    });
    Elements.btnConfirmBorrow.addEventListener('click', submitCheckout);

    // Admin Tabs
    Elements.adminTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // style tabs
            Elements.adminTabs.forEach(t => t.style.borderColor = 'transparent');
            const target = e.target;
            target.style.borderColor = 'var(--primary-color)';

            if (target.dataset.tab === 'dashboard') {
                Elements.adminDashboard.classList.remove('hidden');
                Elements.adminApprovals.classList.add('hidden');
            } else {
                Elements.adminDashboard.classList.add('hidden');
                Elements.adminApprovals.classList.remove('hidden');
                loadApprovals();
            }
        });
    });

    // Logout Events
    const btnLogoutUser = document.getElementById('btn-logout-user');

    if (btnLogoutUser) btnLogoutUser.addEventListener('click', doLogout);

    // Modal close events
    Elements.btnCloseAssetModal.addEventListener('click', () => Elements.assetModal.classList.add('hidden'));
    Elements.btnCloseTransModal.addEventListener('click', () => Elements.transModal.classList.add('hidden'));
    Elements.btnCloseAdminDashModal.addEventListener('click', () => Elements.adminDashModal.classList.add('hidden'));

    // (Removed dashClickables, replacing with dynamic bindings in loadAdminDash)

    Elements.inputSearchDash.addEventListener('input', (e) => {
        const val = e.target.value;
        renderAdminDashList(State.currentDashType, val);
    });

    // Asset Carousel Events
    let touchStartX = 0;
    Elements.modalAssetBorrowers.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    Elements.modalAssetBorrowers.addEventListener('touchend', e => {
        let touchEndX = e.changedTouches[0].screenX;

        // Swipe left (Next item)
        if (touchStartX - touchEndX > 50) {
            if (Carousel.currentIndex < Carousel.totalItems - 1) Carousel.currentIndex++;
            else Carousel.currentIndex = 0;
            updateCarouselUI();
        }
        // Swipe right (Prev item)
        else if (touchEndX - touchStartX > 50) {
            if (Carousel.currentIndex > 0) Carousel.currentIndex--;
            else Carousel.currentIndex = Carousel.totalItems - 1;
            updateCarouselUI();
        }
    });

    // Search Assets Event Trigger
    Elements.inputSearchAssets.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        // The current category being viewed is stored or can be derived.
        // For simplicity, we just filter what's currently rendered, or re-render based on State.currentCategory
        if (State.currentCategory) {
            renderAssetsInsideCategory(State.currentCategory, query);
        }
    });

    // My Items Tabs Toggle
    Elements.myItemsTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;

            // Reset tabs
            Elements.myItemsTabs.forEach(b => {
                b.style.borderBottomColor = 'transparent';
                b.style.color = 'var(--text-color)';
            });

            // Set active
            target.style.borderBottomColor = 'var(--primary-color)';

            if (target.dataset.tab === 'active') {
                Elements.myItemsListActive.classList.remove('hidden');
                Elements.myItemsListHistory.classList.add('hidden');
            } else {
                Elements.myItemsListActive.classList.add('hidden');
                Elements.myItemsListHistory.classList.remove('hidden');
            }
        });
    });

    // Asset Modal Quantity Controls
    Elements.modalQtyMinus.addEventListener('click', () => {
        let val = parseInt(Elements.modalQtyVal.textContent, 10);
        if (val > 1) Elements.modalQtyVal.textContent = val - 1;
    });
    Elements.modalQtyPlus.addEventListener('click', () => {
        let val = parseInt(Elements.modalQtyVal.textContent, 10);
        let max = parseInt(Elements.modalAssetQty.textContent, 10) || 0;
        if (val < max) Elements.modalQtyVal.textContent = val + 1;
    });
}

// ============== UTILS ==============
function updateCarouselUI() {
    Elements.modalAssetBorrowers.style.transform = `translateX(-${Carousel.currentIndex * 100}%)`;

    const dots = Elements.modalAssetDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
        if (idx === Carousel.currentIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    if (Carousel.totalItems > 1) {
        Elements.modalAssetDots.classList.remove('hidden');
    } else {
        Elements.modalAssetDots.classList.add('hidden');
    }
}

function formatDateStr(dateStr) {
    if (!dateStr) return "Unknown";
    try {
        if (dateStr.indexOf('-') === 4 && dateStr.length <= 10) {
            const parts = dateStr.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            if (!isNaN(d.getTime())) return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        }
    } catch (e) { }
    return dateStr;
}

// ============== LOGIC: Logout ==============
function doLogout() {
    if (!confirm("Are you sure you want to log out?")) return;
    State.user = null;
    State.cart = [];
    localStorage.removeItem('ggs_user');
    showScreen('login');
}

// ============== LOGIC: Login ==============
async function handleLogin() {
    const email = Elements.emailInput.value.trim();
    if (!email) return alert("Please enter your email");

    try {
        showLoading();
        const userData = await API.login(email);
        State.user = userData;
        localStorage.setItem('ggs_user', JSON.stringify(userData));

        // Show Admin tab if admin
        const adminNav = document.querySelector('.nav-item[data-target="admin"]');
        if (State.user.role === 'Admin') {
            adminNav.classList.remove('hidden');
        } else {
            adminNav.classList.add('hidden');
        }

        loadHomeData();
    } catch (error) {
        alert("Login failed: " + error.message);
        hideLoading();
    }
}

// ============== LOGIC: Home & Cart ==============
async function loadHomeData() {
    try {
        // Show Skeleton loaders for Categories
        Elements.categoryGrid.innerHTML = `
            <div class="card skeleton" style="height: 140px;"></div>
            <div class="card skeleton" style="height: 140px;"></div>
            <div class="card skeleton" style="height: 140px;"></div>
            <div class="card skeleton" style="height: 140px;"></div>
        `;
        Elements.categoryGrid.classList.remove('hidden');
        Elements.assetListContainer.classList.add('hidden');
        Elements.catTitle.textContent = 'Categories';
        Elements.btnBackCat.classList.add('hidden');
        showScreen('home');

        const data = await API.getAssets();
        State.assets = data.assets;
        State.categories = data.categories;

        renderCategories();

        State.currentCategory = null; // Ensure no category is selected initially
        Elements.inputSearchAssets.value = ''; // Clear search field
        updateCartBadge();
    } catch (error) {
        alert("Error loading data: " + error.message);
    }
}

function renderCategories() {
    Elements.categoryGrid.innerHTML = '';
    State.categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <img class="card-img" src="${cat.CoverImage || 'assets/placeholder-folder.png'}" onerror="this.src='https://placehold.co/400x300?text=Folder'" />
            <div class="card-body">
                <div class="card-title">${cat.Name}</div>
            </div>
        `;
        div.addEventListener('click', () => showAssetsInCategory(cat));
        Elements.categoryGrid.appendChild(div);
    });
}

function showAssetsInCategory(category) {
    Elements.catTitle.textContent = category.Name;
    Elements.btnBackCat.classList.remove('hidden');
    Elements.categoryGrid.classList.add('hidden');
    Elements.assetListContainer.classList.remove('hidden');

    State.currentCategory = category; // Save state for filtering
    Elements.inputSearchAssets.value = ''; // Reset search field on enter

    // Show skeletons briefly
    Elements.assetList.innerHTML = `
        <div class="list-item skeleton" style="height: 80px; margin-bottom: 0.5rem; background: rgba(255,255,255,0.05); border: none;"></div>
        <div class="list-item skeleton" style="height: 80px; margin-bottom: 0.5rem; background: rgba(255,255,255,0.05); border: none;"></div>
        <div class="list-item skeleton" style="height: 80px; margin-bottom: 0.5rem; background: rgba(255,255,255,0.05); border: none;"></div>
    `;

    setTimeout(() => {
        renderAssetsInsideCategory(category, '');
    }, 150); // Small delay to show smooth skeleton fade-in
}

function renderAssetsInsideCategory(category, searchQuery = '') {
    let filteredAssets = State.assets.filter(a => a.CategoryID === category.CategoryID);

    if (searchQuery) {
        filteredAssets = filteredAssets.filter(a =>
            (a.Name && a.Name.toLowerCase().includes(searchQuery)) ||
            (a.SKU && a.SKU.toLowerCase().includes(searchQuery))
        );
    }

    Elements.assetList.innerHTML = '';

    if (filteredAssets.length === 0) {
        if (searchQuery) {
            Elements.assetList.innerHTML = `<div class="text-center p-4">ไม่พบสินค้า "${searchQuery}" ในหมวดหมู่นี้.</div>`;
        } else {
            Elements.assetList.innerHTML = '<div class="text-center p-4">No items in this category.</div>';
        }
        return;
    }

    filteredAssets.forEach(asset => {
        const available = parseInt(asset.AvailableQty, 10) || 0;
        const disabled = available <= 0 ? 'disabled' : '';
        const opacStyle = available <= 0 ? 'opacity: 0.5;' : '';

        const div = document.createElement('div');
        div.className = 'list-item flex flex-col align-center';
        div.style.cssText = opacStyle + " flex-direction: row; justify-content: space-between; cursor: pointer;";

        // Clicking the item opens the modal (except if clicking the Add button)
        div.innerHTML = `
            <div class="flex gap-4 align-center w-full" onclick="openAssetModal('${asset.SKU}')">
                <img class="list-item-img" src="${asset.ImageURL}" onerror="this.src='https://placehold.co/100x100?text=Item'" />
                <div class="list-item-content">
                    <div class="list-item-title">${asset.Name}</div>
                    <div class="list-item-desc">Available: <span class="${available > 0 ? 'text-success' : 'text-danger'}">${available}</span></div>
                    ${asset.Notes ? `<div style="font-size:0.75rem; color:var(--text-secondary);">${asset.Notes}</div>` : ''}
                </div>
            </div>
            <div>
                 <button class="btn btn-primary" style="padding: 0.5rem;" ${disabled} onclick="event.stopPropagation(); addToCart('${asset.SKU}')">Add</button>
            </div>
        `;
        Elements.assetList.appendChild(div);
    });
}

function openAssetModal(sku) {
    const asset = State.assets.find(a => a.SKU === sku);
    if (!asset) return;

    // Find category name
    const cat = State.categories.find(c => c.CategoryID === asset.CategoryID);

    Elements.modalAssetCat.textContent = cat ? cat.Name : 'Item';
    Elements.modalAssetImg.src = asset.ImageURL || 'https://placehold.co/400x300?text=Item';
    Elements.modalAssetName.textContent = asset.Name;
    Elements.modalAssetSku.textContent = asset.SKU;

    const available = parseInt(asset.AvailableQty, 10) || 0;
    Elements.modalAssetQty.textContent = available;
    Elements.modalAssetQty.className = available > 0 ? 'text-success font-bold' : 'text-danger font-bold';

    Elements.modalQtyVal.textContent = "1";

    // Setup Borrowers List (Carousel)
    Elements.modalAssetBorrowers.innerHTML = '';
    Elements.modalAssetDots.innerHTML = '';
    Carousel.currentIndex = 0;
    Carousel.totalItems = asset.borrowers ? asset.borrowers.length : 0;

    if (Carousel.totalItems > 0) {
        asset.borrowers.forEach((b, idx) => {
            const dateStr = formatDateStr(b.expectedReturn);

            let badgeClass = 'badge-pending';
            if (b.status === 'Approved') badgeClass = 'badge-approved';
            if (b.status === 'Returned') badgeClass = 'badge-returned';
            if (b.status === 'Rejected') badgeClass = 'badge-rejected';

            const div = document.createElement('div');
            div.className = 'carousel-item';
            div.innerHTML = `
                <div style="background:var(--card-background); border-radius:1rem; padding:1.25rem; border:1px solid var(--card-border); display:flex; justify-content:space-between; box-shadow:var(--shadow-sm); margin:0 2px;">
                    <div style="flex: 1;">
                      <div style="font-weight:bold; color:var(--text-primary);">${b.name || b.email}</div>
                      <div style="color:var(--text-secondary); font-size:0.8rem; margin-top:0.25rem;">Purpose: ${b.purpose || '-'}</div>
                      <div style="color:var(--text-secondary); font-size:0.8rem; margin-top:0.5rem;">Status: <span class="badge ${badgeClass}" style="padding:0.2rem 0.6rem; font-size:0.7rem;">${b.status}</span></div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-weight:bold; font-size:1.1rem; color:var(--primary-color);">x${b.qty}</div>
                      <div style="color:var(--text-secondary); font-size:0.8rem; margin-top:0.25rem;">Due: ${dateStr}</div>
                    </div>
                </div>
             `;
            Elements.modalAssetBorrowers.appendChild(div);

            // Add Dot
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            if (idx === 0) dot.classList.add('active');
            dot.onclick = () => {
                Carousel.currentIndex = idx;
                updateCarouselUI();
            };
            Elements.modalAssetDots.appendChild(dot);
        });
    } else {
        Elements.modalAssetBorrowers.innerHTML = '<div class="carousel-item flex justify-center mt-2"><div class="text-secondary text-center">No one is currently borrowing this item.</div></div>';
    }
    updateCarouselUI();

    // Configure Add Button
    Elements.modalBtnAdd.disabled = available <= 0;
    Elements.modalBtnAdd.onclick = () => {
        const qtyToAdd = parseInt(Elements.modalQtyVal.textContent, 10);
        addMultipleToCart(sku, qtyToAdd);
        Elements.assetModal.classList.add('hidden');
    };

    Elements.assetModal.classList.remove('hidden');
}

function addMultipleToCart(sku, qty) {
    const asset = State.assets.find(a => a.SKU === sku);
    if (!asset) return;

    const existing = State.cart.find(item => item.asset.SKU === sku);
    const available = parseInt(asset.AvailableQty, 10);

    let currentCartQty = existing ? existing.qty : 0;

    if (currentCartQty + qty > available) {
        alert("Cannot add more than available quantity.");
        return;
    }

    if (existing) {
        existing.qty += qty;
    } else {
        State.cart.push({ asset: asset, qty: qty });
    }
    updateCartBadge();
}

function addToCart(sku) {
    const asset = State.assets.find(a => a.SKU === sku);
    if (!asset) return;

    // Check if already in cart
    const existing = State.cart.find(item => item.asset.SKU === sku);
    const available = parseInt(asset.AvailableQty, 10);

    if (existing) {
        if (existing.qty < available) {
            existing.qty += 1;
        } else {
            alert("Cannot add more than available quantity.");
        }
    } else {
        if (available > 0) {
            State.cart.push({ asset: asset, qty: 1 });
        }
    }
    updateCartBadge();
}

function updateCartBadge() {
    const total = State.cart.reduce((sum, item) => sum + item.qty, 0);
    Elements.cartBadge.textContent = total;
    Elements.cartBadge.classList.toggle('hidden', total === 0);
}

function openCart() {
    renderCart();
    Elements.cartModal.style.display = 'block';
}

function closeCart() {
    Elements.cartModal.style.display = 'none';
}

function renderCart() {
    Elements.cartItems.innerHTML = '';

    if (State.cart.length === 0) {
        Elements.cartItems.innerHTML = '<div class="text-center p-4">Cart is empty.</div>';
        return;
    }

    State.cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'list-item flex-col';
        div.style.cssText = "flex-direction:row; justify-content: space-between;";
        div.innerHTML = `
            <div class="flex gap-2 align-center">
                 <img class="list-item-img" src="${item.asset.ImageURL}" onerror="this.src='https://placehold.co/100'" style="width:40px;height:40px;" />
                 <div>
                     <div style="font-size:0.9rem; font-weight:600; line-height:1.2;">${item.asset.Name}</div>
                 </div>
            </div>
            <div class="qty-control">
                 <button class="qty-btn" onclick="updateCartQty(${index}, -1)">-</button>
                 <div class="qty-val">${item.qty}</div>
                 <button class="qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
            </div>
        `;
        Elements.cartItems.appendChild(div);
    });

    const totalQty = State.cart.reduce((sum, item) => sum + item.qty, 0);
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'flex justify-between mt-4 p-3 font-bold';
    summaryDiv.style.cssText = "background-color: rgba(255,255,255,0.05); border-radius: 0.5rem; border: 1px dashed var(--primary-color);";
    summaryDiv.innerHTML = `
        <div>Total Quantity:</div>
        <div class="text-primary">${totalQty} items</div>
    `;
    Elements.cartItems.appendChild(summaryDiv);
}

function updateCartQty(index, change) {
    const item = State.cart[index];
    const available = parseInt(item.asset.AvailableQty, 10);

    const newQty = item.qty + change;

    if (newQty <= 0) {
        State.cart.splice(index, 1);
    } else if (newQty > available) {
        alert("Cannot exceed available quantity.");
    } else {
        item.qty = newQty;
    }

    renderCart();
    updateCartBadge();
}

// ============== LOGIC: Checkout ==============
function prepareCheckout() {
    showScreen('checkout');

    Elements.checkoutItems.innerHTML = '';
    State.cart.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between mt-2 pb-2';
        div.style.borderBottom = "1px solid var(--card-border)";
        div.innerHTML = `
            <div>${item.asset.Name}</div>
            <div style="font-weight:bold;">x${item.qty}</div>
        `;
        Elements.checkoutItems.appendChild(div);
    });

    const totalQty = State.cart.reduce((sum, item) => sum + item.qty, 0);
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'flex justify-between mt-4 p-3 font-bold';
    summaryDiv.style.cssText = "background-color: rgba(255,255,255,0.05); border-radius: 0.5rem; text-align:right; border: 1px solid var(--card-border);";
    summaryDiv.innerHTML = `
        <div>Total:</div>
        <div class="text-primary">${totalQty} items</div>
    `;
    Elements.checkoutItems.appendChild(summaryDiv);

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    Elements.inputDate.min = today;
    Elements.inputDate.value = today;
}

async function submitCheckout() {
    const purpose = Elements.inputPurpose.value;
    const date = Elements.inputDate.value;

    if (!purpose || !date) return alert("Please fill in all fields.");

    // Format items for backend: [{id: SKU, qty: num}]
    const itemsData = State.cart.map(item => ({
        id: item.asset.SKU,
        qty: item.qty,
        name: item.asset.Name // sending name for easier debugging/viewing later
    }));

    try {
        showLoading();
        const response = await API.checkout(State.user.email, itemsData, purpose, date);
        alert(`Success! Request Sent. TXN: ${response.transaction_id}`);

        // Clear cart and go to My Items
        State.cart = [];
        updateCartBadge();
        loadMyItems();
    } catch (error) {
        alert("Error submitting request: " + error.message);
    } finally {
        hideLoading();
    }
}

async function loadMyItems() {
    try {
        showScreen('myItems');

        Elements.myItemsListActive.innerHTML = `
            <div class="card skeleton" style="height: 120px; margin-bottom: 1rem;"></div>
            <div class="card skeleton" style="height: 120px; margin-bottom: 1rem;"></div>
        `;

        const data = await API.getMyItems(State.user.email);
        State.myItems = data.transactions;
        renderMyItems();
    } catch (error) {
        alert("Error loading My Items: " + error.message);
    }
}

function renderMyItems() {
    Elements.myItemsListActive.innerHTML = '';
    Elements.myItemsListHistory.innerHTML = '';

    const activeItems = State.myItems.filter(t => t.Status === 'Pending' || t.Status === 'Approved');
    const historyItems = State.myItems.filter(t => t.Status === 'Returned' || t.Status === 'Rejected');

    // Render Active
    if (activeItems.length === 0) {
        Elements.myItemsListActive.innerHTML = '<div class="text-center p-4">You have no active item requests.</div>';
    } else {
        const sortedActive = [...activeItems].sort((a, b) => new Date(b.BorrowDate) - new Date(a.BorrowDate));
        sortedActive.forEach(t => {
            Elements.myItemsListActive.appendChild(createMyItemCard(t));
        });
    }

    // Render History
    if (historyItems.length === 0) {
        Elements.myItemsListHistory.innerHTML = '<div class="text-center p-4">You have no past transaction history.</div>';
    } else {
        const sortedHistory = [...historyItems].sort((a, b) => new Date(b.BorrowDate) - new Date(a.BorrowDate));
        sortedHistory.forEach(t => {
            Elements.myItemsListHistory.appendChild(createMyItemCard(t));
        });
    }
}

function createMyItemCard(t) {
    let itemsListStr = t.Items.map(i => `${i.name} (x${i.qty})`).join(', ');
    if (t.Items.length > 2) {
        const firstTwo = t.Items.slice(0, 2).map(i => `${i.name} (x${i.qty})`).join(', ');
        itemsListStr = `${firstTwo} และอื่นๆ อีก +${t.Items.length - 2} รายการ...`;
    }
    const isApproved = t.Status === 'Approved';

    let badgeClass = 'badge-pending';
    if (t.Status === 'Approved') badgeClass = 'badge-approved';
    if (t.Status === 'Returned') badgeClass = 'badge-returned';
    if (t.Status === 'Rejected') badgeClass = 'badge-rejected';

    // Check if overdue
    let overdueWarning = '';
    if (isApproved && new Date(t.ExpectedReturn) < new Date(new Date().setHours(0, 0, 0, 0))) {
        overdueWarning = '<div class="text-danger" style="font-size:0.8rem; font-weight:bold; margin-top:0.25rem;">⚠️ OVERDUE</div>';
    }

    const div = document.createElement('div');
    div.className = 'card mt-4';
    div.style.cursor = "pointer";
    div.onclick = () => openTransModal(t.TransID);
    div.innerHTML = `
        <div class="card-body">
            <div class="flex justify-between">
                <strong style="font-size:0.85rem; color:var(--text-secondary)">${t.TransID}</strong>
                <span class="badge ${badgeClass}">${t.Status}</span>
            </div>
            <div class="mt-2 mb-2" style="font-size: 0.95rem;">
                <strong>Items:</strong> ${itemsListStr}
                <div style="margin-top:0.25rem; font-size:0.85rem; color:var(--primary-color); font-weight:bold;">
                    Total: ${t.Items.reduce((sum, i) => sum + i.qty, 0)} items
                </div>
            </div>
            <div style="font-size:0.85rem; color:var(--text-secondary)">
                <div>Purpose: ${t.Purpose}</div>
                <div>Return By: ${formatDateStr(t.ExpectedReturn)}</div>
                ${overdueWarning}
            </div>
        </div>
    `;
    return div;
}

function openTransModal(transId) {
    try {
        let t = null;
        if (State.myItems) t = State.myItems.find(x => x.TransID === transId);
        if (!t && State.pendingApprovals) t = State.pendingApprovals.find(x => x.TransID === transId);

        // Also check Admin Dashboard borrowed and overdue lists
        if (!t && State.dashData && State.dashData.borrowed_list) t = State.dashData.borrowed_list.find(x => x.TransID === transId);
        if (!t && State.dashData && State.dashData.overdue_list) t = State.dashData.overdue_list.find(x => x.TransID === transId);

        if (!t) {
            alert("Error: Transaction data not found for ID: " + transId);
            return;
        }

        Elements.modalTransId.textContent = t.TransID;

        let badgeClass = 'badge-pending';
        if (t.Status === 'Approved') badgeClass = 'badge-approved';
        if (t.Status === 'Returned') badgeClass = 'badge-returned';
        if (t.Status === 'Rejected') badgeClass = 'badge-rejected';

        let borrowDateStr = formatDateStr(t.BorrowDate);
        let returnDateStr = formatDateStr(t.ExpectedReturn);

        Elements.modalTransStatus.innerHTML = `<span class="badge ${badgeClass}">${t.Status}</span>`;
        Elements.modalTransDate.textContent = borrowDateStr;
        Elements.modalTransReturn.textContent = returnDateStr;
        Elements.modalTransPurpose.textContent = t.Purpose;

        Elements.modalTransItems.innerHTML = '';
        Elements.modalTransItems.style.cssText = "max-height: 250px; overflow-y: auto; padding-right: 0.5rem;";

        t.Items.forEach(item => {
            const asset = State.assets.find(a => a.SKU === item.id);
            const img = asset ? asset.ImageURL : 'https://placehold.co/100';

            const div = document.createElement('div');
            div.style.cssText = "display:flex; align-items:center; gap:10px; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--card-border); color:var(--text-primary);";
            div.innerHTML = `
            <img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.src='https://placehold.co/100'">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:0.9rem;">${item.name} <span class="text-secondary" style="font-size:0.8rem;">(${item.id})</span></div>
                <div style="font-size:0.85rem;">Qty: ${item.qty}</div>
            </div>
        `;
            Elements.modalTransItems.appendChild(div);
        });

        const totalQty = t.Items.reduce((sum, i) => sum + i.qty, 0);
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'flex justify-between mt-2 pt-2';
        summaryDiv.style.cssText = "font-weight:bold; font-size:1rem; border-top:1px solid var(--card-border); color:var(--primary-color);";
        summaryDiv.innerHTML = `
        <div>Total Quantity:</div>
        <div>${totalQty}</div>
    `;
        Elements.modalTransItems.appendChild(summaryDiv);

        // Button container logic
        Elements.modalTransReturnArea.classList.add('hidden');
        Elements.modalAdminActionArea.classList.add('hidden');

        if (t.Status === 'Approved') {
            Elements.modalTransReturnArea.classList.remove('hidden');
            Elements.modalBtnReturn.onclick = () => {
                Elements.transModal.classList.add('hidden');
                returnItem(t.TransID);
            };
        } else if (t.Status === 'Pending' && State.user && State.user.role === 'Admin') {
            Elements.modalAdminActionArea.classList.remove('hidden');
            Elements.modalBtnApprove.onclick = () => {
                Elements.transModal.classList.add('hidden');
                adminApprove(t.TransID, 'Approved');
            };
            Elements.modalBtnReject.onclick = () => {
                Elements.transModal.classList.add('hidden');
                adminApprove(t.TransID, 'Rejected');
            };
        }

        Elements.transModal.classList.remove('hidden');
    } catch (err) {
        alert("UI Dev Error: " + err.message + "\nPlease take a screenshot of this error.");
        console.error(err);
    }
}

async function returnItem(transId) {
    if (!confirm("Are you sure you want to return all items in this transaction?")) return;
    try {
        showLoading();
        await API.returnItems(transId);
        alert("Items returned successfully!");
        loadMyItems(); // Reload
    } catch (error) {
        alert("Error returning items: " + error.message);
        hideLoading();
    }
}

// ============== LOGIC: Admin ==============
async function loadAdminDash() {
    showScreen('admin');
    try {
        // Render Skeletons for top stats
        Elements.dashTotal.innerHTML = `<span class="skeleton" style="display:inline-block; width:50px; height:30px;"></span>`;
        Elements.dashBorrowed.innerHTML = `<span class="skeleton" style="display:inline-block; width:50px; height:30px;"></span>`;
        Elements.dashOverdue.innerHTML = `<span class="skeleton" style="display:inline-block; width:50px; height:30px;"></span>`;
        Elements.dashInactive.innerHTML = `<span class="skeleton" style="display:inline-block; width:50px; height:30px;"></span>`;

        Elements.dashAssetsContainer.innerHTML = `
             <div class="cat-card skeleton" style="height: 120px;"></div>
             <div class="cat-card skeleton" style="height: 120px;"></div>
        `;

        const data = await API.getDashboard(State.user.email);
        State.dashData = data;

        Elements.dashTotal.textContent = data.total || 0;
        Elements.dashBorrowed.textContent = data.borrowed || 0;
        Elements.dashOverdue.textContent = data.overdue_count || 0;
        Elements.dashInactive.textContent = data.inactive_count || 0;

        // 1. Render Total Assets (Category Sub-Cards)
        Elements.dashAssetsContainer.innerHTML = '';
        if (data.category_breakdown) {
            data.category_breakdown.forEach(cat => {
                if (cat.count === 0) return; // Hide empty categories

                const div = document.createElement('div');
                div.className = 'cat-card';
                div.style.padding = '1rem';
                div.style.textAlign = 'left';
                const catImg = State.categories.find(c => c.Name === cat.name)?.CoverImage || 'https://via.placeholder.com/150';

                div.innerHTML = `
                    <img src="${catImg}" style="width:100%; height:80px; object-fit:cover; border-radius:4px; margin-bottom:0.5rem;" alt="cat">
                    <div style="font-weight:bold; font-size:1rem;">${cat.name}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">Total: ${cat.count} items</div>
                `;
                div.onclick = () => openAdminDashModal('total', cat.name);
                Elements.dashAssetsContainer.appendChild(div);
            });
            // Handle if all are empty
            if (Elements.dashAssetsContainer.innerHTML === '') {
                Elements.dashAssetsContainer.innerHTML = '<div class="text-secondary" style="font-size:0.9rem; grid-column: 1 / -1;">No assets found in any category.</div>';
            }
        }

        // 2. Render Currently Borrowed (User Sub-Cards)
        Elements.dashBorrowedContainer.innerHTML = '';
        if (data.borrowed_list) {
            // Group by User
            const userGroups = {};
            data.borrowed_list.forEach(t => {
                const emailKey = t.Email.toLowerCase();
                if (!userGroups[emailKey]) userGroups[emailKey] = { Name: t.Name, transactions: 0, items: 0 };
                userGroups[emailKey].transactions += 1;
                t.Items.forEach(i => userGroups[emailKey].items += parseInt(i.qty, 10));
            });

            Object.keys(userGroups).forEach(email => {
                const u = userGroups[email];
                const div = document.createElement('div');
                div.className = 'card dash-clickable';
                div.style.padding = '1rem';
                div.innerHTML = `
                    <div class="flex justify-between align-center">
                        <div class="flex align-center gap-3">
                            <div style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👤</div>
                            <div>
                                <div style="font-weight:bold; color:var(--text-primary);">${u.Name}</div>
                                <div style="font-size:0.8rem; color:var(--text-secondary);">${email}</div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span class="badge badge-pending" style="background:#e0e7ff; color:#3730a3;">${u.items} items</span>
                        </div>
                    </div>
                `;
                div.onclick = () => openAdminDashModal('borrowed_user', email, u.Name);
                Elements.dashBorrowedContainer.appendChild(div);
            });
            if (Object.keys(userGroups).length === 0) Elements.dashBorrowedContainer.innerHTML = '<div class="text-secondary" style="font-size:0.9rem;">No active borrowers.</div>';
        }

        // 3. Render Overdue (User Sub-Cards)
        Elements.dashOverdueContainer.innerHTML = '';
        if (data.overdue_list) {
            const overdueGroups = {};
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            data.overdue_list.forEach(t => {
                const emailKey = t.Email.toLowerCase();
                const daysLate = Math.floor((today - new Date(t.ExpectedReturn)) / (1000 * 60 * 60 * 24));
                if (!overdueGroups[emailKey]) overdueGroups[emailKey] = { Name: t.Name, maxDaysLate: 0, items: 0 };

                overdueGroups[emailKey].items += t.Items.reduce((sum, i) => sum + parseInt(i.qty, 10), 0);
                if (daysLate > overdueGroups[emailKey].maxDaysLate) overdueGroups[emailKey].maxDaysLate = daysLate;
            });

            Object.keys(overdueGroups).forEach(email => {
                const u = overdueGroups[email];
                const div = document.createElement('div');
                div.className = 'card dash-clickable';
                div.style.padding = '1rem';
                div.innerHTML = `
                    <div class="flex justify-between align-center">
                        <div class="flex align-center gap-3">
                            <div style="width:40px; height:40px; border-radius:50%; background:#fee2e2; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👤</div>
                            <div>
                                <div style="font-weight:bold;">${u.Name}</div>
                                <div style="font-size:0.8rem; color:#888;">${email}</div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div class="text-danger font-bold text-sm">⚠️ ${u.maxDaysLate} days late</div>
                            <div style="font-size:0.8rem; color:var(--text-secondary);">${u.items} items</div>
                        </div>
                    </div>
                `;
                div.onclick = () => openAdminDashModal('overdue_user', email, u.Name);
                Elements.dashOverdueContainer.appendChild(div);
            });
            if (Object.keys(overdueGroups).length === 0) Elements.dashOverdueContainer.innerHTML = '<div class="text-secondary" style="font-size:0.9rem;">No overdue items.</div>';
        }

        // 4. Render Dormant Assets (Category Sub-Cards)
        Elements.dashDormantContainer.innerHTML = '';
        if (data.inactive_list) {
            const dormantCatGroups = {};
            data.inactive_list.forEach(a => {
                if (!dormantCatGroups[a.CategoryID]) {
                    const c = State.categories.find(c => c.CategoryID === a.CategoryID);
                    dormantCatGroups[a.CategoryID] = { name: c ? c.Name : 'Unknown', count: 0 };
                }
                dormantCatGroups[a.CategoryID].count += 1;
            });

            Object.keys(dormantCatGroups).forEach(catId => {
                const catGroup = dormantCatGroups[catId];
                const c = State.categories.find(c => c.CategoryID === catId);
                const catImg = c ? c.CoverImage : 'https://via.placeholder.com/150';

                const div = document.createElement('div');
                div.className = 'cat-card';
                div.style.padding = '1rem';
                div.style.textAlign = 'left';
                div.innerHTML = `
                    <img src="${catImg}" style="width:100%; height:80px; object-fit:cover; border-radius:4px; margin-bottom:0.5rem;" alt="cat">
                    <div style="font-weight:bold; font-size:1rem;">${catGroup.name}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">Dormant: ${catGroup.count} assets</div>
                `;
                div.onclick = () => openAdminDashModal('dormant_cat', catGroup.name);
                Elements.dashDormantContainer.appendChild(div);
            });
            if (Object.keys(dormantCatGroups).length === 0) Elements.dashDormantContainer.innerHTML = '<div class="text-secondary" style="font-size:0.9rem;" style="grid-column: 1 / -1;">No dormant assets.</div>';
        }

        // Default to loading pending approvals list
        loadApprovals();
    } catch (error) {
        alert("Error loading dashboard: " + error.message);
    }
}

function openAdminDashModal(type, subKey, displayTitle = null) {
    if (!State.dashData) return;
    State.currentDashType = type;
    State.currentDashSubKey = subKey; // Store the clicked category or user email
    Elements.inputSearchDash.value = '';

    const titleText = displayTitle || subKey;

    if (type === 'total') Elements.adminDashModalTitle.textContent = `Assets in ${titleText}`;
    if (type === 'borrowed_user') Elements.adminDashModalTitle.textContent = `Borrowed by ${titleText}`;
    if (type === 'overdue_user') Elements.adminDashModalTitle.textContent = `Overdue Items for ${titleText}`;
    if (type === 'dormant_cat') Elements.adminDashModalTitle.textContent = `Dormant in ${titleText}`;

    renderAdminDashList(type, '');
    Elements.adminDashModal.classList.remove('hidden');
}

function renderAdminDashList(type, filter) {
    const listEl = Elements.adminDashModalList;
    const summaryEl = Elements.adminDashModalSummary;
    listEl.innerHTML = '';
    summaryEl.textContent = '';
    filter = (filter || '').toLowerCase();
    const subKey = State.currentDashSubKey; // string: category name or user email

    const drawCard = (html) => {
        const div = document.createElement('div');
        div.className = 'card mb-3';
        div.style.padding = '1rem';
        div.innerHTML = html;
        listEl.appendChild(div);
    };

    if (type === 'total') {
        // Filter active assets by the selected Category Name
        const allActiveAssets = State.dashData.all_active_assets || []; // wait, backend needs to send all assets, or we rely on the global activeAssets
        // Actually, we can fetch from State.assets
        const catObj = State.categories.find(c => c.Name === subKey);
        const catId = catObj ? catObj.CategoryID : '';
        const rawAssets = State.assets.filter(a => a.Status !== 'Retired' && a.CategoryID === catId);

        const filtered = rawAssets.filter(a => a.Name.toLowerCase().includes(filter) || a.SKU.toLowerCase().includes(filter));
        summaryEl.textContent = `Showing ${filtered.length} items`;
        if (filtered.length === 0) return drawCard('<div>No items found.</div>');

        filtered.forEach(a => {
            drawCard(`
                <div class="flex justify-between">
                    <strong>${a.Name}</strong>
                    <span style="font-size:0.85rem; color:var(--text-secondary);">SKU: ${a.SKU}</span>
                </div>
                <div class="mt-2 text-sm">
                    <strong>Total Qty:</strong> ${a.TotalQty} | 
                    <strong>Available:</strong> ${a.AvailableQty}
                </div>
            `);
        });
    }

    else if (type === 'borrowed_user' || type === 'overdue_user') {
        const isOverdue = type === 'overdue_user';
        const rawList = isOverdue ? (State.dashData.overdue_list || []) : (State.dashData.borrowed_list || []);

        // Filter by the specific user clicked
        let userRawList = rawList.filter(t => t.Email.toLowerCase() === subKey.toLowerCase());

        const filtered = userRawList.filter(t => {
            const itemsStr = t.Items.map(i => i.name.toLowerCase()).join(' ');
            return itemsStr.includes(filter) || t.TransID.toLowerCase().includes(filter);
        });

        summaryEl.textContent = `Showing ${filtered.length} transactions`;
        if (filtered.length === 0) return drawCard('<div>No transactions found.</div>');

        filtered.forEach(t => {
            const userName = t.Name || t.Email;
            let itemsListStr = t.Items.map(i => `${i.name} (x${i.qty})`).join(', ');
            let totalQty = t.Items.reduce((sum, i) => sum + parseInt(i.qty, 10), 0);

            let overdueStr = '';
            if (isOverdue) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const days = Math.floor((today - new Date(t.ExpectedReturn)) / (1000 * 60 * 60 * 24));
                overdueStr = `<div class="mt-1 text-danger font-bold text-sm">⚠️ Overdue by ${days} days</div>`;
            }

            drawCard(`
                <div style="font-size:0.85rem; color:var(--text-secondary)">${t.TransID} | Return By: ${formatDateStr(t.ExpectedReturn)}</div>
                <div class="mt-1 text-sm text-secondary">
                    <strong>Items:</strong> ${itemsListStr}
                </div>
                <div class="mt-2" style="font-size:0.85rem; color:var(--primary-color); font-weight:bold;">
                    Total: ${totalQty} items
                </div>
                ${overdueStr}
            `);
        });
    }

    else if (type === 'dormant_cat') {
        const items = State.dashData.inactive_list || [];
        const catObj = State.categories.find(c => c.Name === subKey);
        const catId = catObj ? catObj.CategoryID : '';

        // Filter dormant items by specific Category
        let catDormantItems = items.filter(a => a.CategoryID === catId);

        const filtered = catDormantItems.filter(a => a.Name.toLowerCase().includes(filter) || a.SKU.toLowerCase().includes(filter));

        summaryEl.textContent = `Showing ${filtered.length} dormant items`;
        if (filtered.length === 0) return drawCard('<div>No items found.</div>');

        filtered.forEach(a => {
            drawCard(`
                <div class="flex justify-between">
                    <strong>${a.Name}</strong>
                    <span style="font-size:0.85rem; color:var(--text-secondary);">SKU: ${a.SKU}</span>
                </div>
                <div class="mt-2 text-sm">
                    <strong>Total Qty:</strong> ${a.TotalQty} | 
                    <strong>Available:</strong> ${a.AvailableQty}
                </div>
                <div class="mt-1 text-sm text-secondary">
                    <em>Last Active: ${formatDateStr(a.LastActive)}</em>
                </div>
            `);
        });
    }
}

function updateAdminBadges(count) {
    if (count > 0) {
        if (Elements.adminBadgeNav) { Elements.adminBadgeNav.textContent = count; Elements.adminBadgeNav.classList.remove('hidden'); }
        if (Elements.adminBadgeTab) { Elements.adminBadgeTab.textContent = count; Elements.adminBadgeTab.classList.remove('hidden'); }
    } else {
        if (Elements.adminBadgeNav) { Elements.adminBadgeNav.classList.add('hidden'); }
        if (Elements.adminBadgeTab) { Elements.adminBadgeTab.classList.add('hidden'); }
    }
}

async function loadApprovals() {
    try {
        const data = await API.getApprovals(State.user.email);
        // Sort approvals oldest first (First In, First Out)
        State.pendingApprovals = (data.pending_list || []).sort((a, b) => new Date(a.BorrowDate) - new Date(b.BorrowDate));
        const list = State.pendingApprovals;

        updateAdminBadges(list.length);

        Elements.approvalList.innerHTML = '';
        if (list.length === 0) {
            Elements.approvalList.innerHTML = '<div class="text-center p-4">No pending approvals.</div>';
            return;
        }

        list.forEach(t => {
            let itemsListStr = t.Items.map(i => `${i.name} (x${i.qty})`).join(', ');
            if (t.Items.length > 2) {
                const firstTwo = t.Items.slice(0, 2).map(i => `${i.name} (x${i.qty})`).join(', ');
                itemsListStr = `${firstTwo} และอื่นๆ อีก +${t.Items.length - 2} รายการ...`;
            }

            const userName = t.Name || t.Email;

            const div = document.createElement('div');
            div.className = 'card mt-4';
            div.style.cursor = 'pointer';
            // Click card body to view details
            div.onclick = () => openTransModal(t.TransID);

            div.innerHTML = `
                <div class="card-body">
                    <div style="font-size:0.85rem; color:var(--text-secondary)">${t.TransID} | ${formatDateStr(t.BorrowDate)}</div>
                    <div class="mt-2" style="font-weight:bold;">User: ${userName} <span style="font-size:0.8rem; font-weight:normal; color:#888;">(${t.Email})</span></div>
                    
                    <div class="mt-2" style="font-size: 0.95rem;">
                        <strong>Items:</strong> ${itemsListStr}
                        <div style="margin-top:0.25rem; font-size:0.85rem; color:var(--primary-color); font-weight:bold;">
                            Total: ${t.Items.reduce((sum, i) => sum + i.qty, 0)} items
                        </div>
                    </div>
                    
                    <div class="mt-2" style="font-size:0.85rem;">
                        <span style="display:inline-block; padding:0.3rem 0.6rem; background-color:#f8f9fa; border:1px solid #e9ecef; border-radius:4px; font-weight:500; color:#495057;">
                            Purpose: ${t.Purpose}
                        </span>
                    </div>
                    
                    <div class="mt-2" style="font-size:0.85rem; color:var(--text-secondary)">
                        <div>Return By: ${formatDateStr(t.ExpectedReturn)}</div>
                    </div>
                    
                    <div class="flex gap-4 mt-4 text-center">
                        <button class="btn btn-outline" style="flex:1; border-color:var(--danger-color); color:var(--danger-color);" onclick="event.stopPropagation(); adminApprove('${t.TransID}', 'Rejected')">Reject</button>
                        <button class="btn btn-primary" style="flex:1;" onclick="event.stopPropagation(); adminApprove('${t.TransID}', 'Approved')">Approve</button>
                    </div>
                </div>
            `;
            Elements.approvalList.appendChild(div);
        });

    } catch (error) {
        console.error(error);
    }
}

async function adminApprove(transId, status) {
    if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;
    try {
        showLoading();
        // Adjust the parameters to match API: (email, transactionId, status)
        await API.approveItem(State.user.email, transId, status);
        alert(`Successfully marked as ${status}`);

        // Optimistically update badges
        if (State.pendingApprovals) {
            State.pendingApprovals = State.pendingApprovals.filter(t => t.TransID !== transId);
            updateAdminBadges(State.pendingApprovals.length);
        }

        loadApprovals(); // Reload list
        loadAdminDash(); // Refresh numbers
    } catch (error) {
        alert("Error processing approval: " + error.message);
        hideLoading();
    }
}

// ============== LOGIC: Settings (User Only) ==============
function loadSettings() {
    showScreen('settings');
    const nameLabel = document.getElementById('settings-name');
    const emailLabel = document.getElementById('settings-email');

    if (State.user) {
        nameLabel.textContent = State.user.name || "User";
        emailLabel.textContent = State.user.email || "";
    }
}

// Start App
document.addEventListener('DOMContentLoaded', initApp);
