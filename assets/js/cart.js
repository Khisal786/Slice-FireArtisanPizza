document.addEventListener('DOMContentLoaded', () => {
  // Cart state
  let cart = JSON.parse(localStorage.getItem('pizza_cart')) || [];
  updateCartBadge();

  // Modal elements
  const modalOverlay = document.getElementById('pizzaModalOverlay');
  const closeBtn = document.getElementById('closePizzaModal');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const modalQtyEl = document.getElementById('modalQty');
  const confirmBtn = document.getElementById('confirmAddToCartBtn');

  let currentSelectedItem = null;
  let selectedSizeIndex = 0;
  let selectedCrustIndex = 0;
  let currentQty = 1;

  // Expose function to open modal from menu cards
  window.openPizzaModal = function(itemData) {
    currentSelectedItem = itemData;
    selectedSizeIndex = 0;
    selectedCrustIndex = 0;
    currentQty = 1;
    modalQtyEl.textContent = currentQty;

    document.getElementById('modalItemName').textContent = itemData.name;
    document.getElementById('modalItemDesc').textContent = itemData.description;
    
    // Render sizes if available
    const sizesGroup = document.getElementById('sizesGroup');
    const sizesContainer = document.getElementById('sizesOptionsContainer');
    sizesContainer.innerHTML = '';

    if (itemData.has_sizes && itemData.sizes && itemData.sizes.length > 0) {
      sizesGroup.style.display = 'block';
      itemData.sizes.forEach((size, idx) => {
        const div = document.createElement('div');
        div.className = `option-card ${idx === 0 ? 'selected' : ''}`;
        div.innerHTML = `<span>${size.name}</span><span>+$${size.price_offset.toFixed(2)}</span>`;
        div.onclick = () => {
          document.querySelectorAll('#sizesOptionsContainer .option-card').forEach(el => el.classList.remove('selected'));
          div.classList.add('selected');
          selectedSizeIndex = idx;
          updateModalPrice();
        };
        sizesContainer.appendChild(div);
      });
    } else {
      sizesGroup.style.display = 'none';
    }

    // Render crusts if available
    const crustGroup = document.getElementById('crustGroup');
    const crustContainer = document.getElementById('crustOptionsContainer');
    crustContainer.innerHTML = '';

    if (itemData.crust_options && itemData.crust_options.length > 0) {
      crustGroup.style.display = 'block';
      itemData.crust_options.forEach((crust, idx) => {
        const div = document.createElement('div');
        div.className = `option-card ${idx === 0 ? 'selected' : ''}`;
        div.innerHTML = `<span>${crust}</span>`;
        div.onclick = () => {
          document.querySelectorAll('#crustOptionsContainer .option-card').forEach(el => el.classList.remove('selected'));
          div.classList.add('selected');
          selectedCrustIndex = idx;
        };
        crustContainer.appendChild(div);
      });
    } else {
      crustGroup.style.display = 'none';
    }

    updateModalPrice();
    modalOverlay.style.display = 'flex';
  };

  function updateModalPrice() {
    if (!currentSelectedItem) return;
    let base = currentSelectedItem.base_price;
    if (currentSelectedItem.has_sizes && currentSelectedItem.sizes[selectedSizeIndex]) {
      base += currentSelectedItem.sizes[selectedSizeIndex].price_offset;
    }
    const total = base * currentQty;
    document.getElementById('modalItemBasePrice').textContent = `$${base.toFixed(2)}`;
    document.getElementById('modalTotalPrice').textContent = `$${total.toFixed(2)}`;
  }

  // Quantity controls
  qtyPlus.onclick = () => { currentQty++; modalQtyEl.textContent = currentQty; updateModalPrice(); };
  qtyMinus.onclick = () => { if (currentQty > 1) { currentQty--; modalQtyEl.textContent = currentQty; updateModalPrice(); } };

  // Close Modal
  closeBtn.onclick = () => { modalOverlay.style.display = 'none'; };
  modalOverlay.onclick = (e) => { if (e.target === modalOverlay) modalOverlay.style.display = 'none'; };

  // Confirm Add to Cart
  confirmBtn.onclick = () => {
    if (!currentSelectedItem) return;

    const sizeObj = currentSelectedItem.has_sizes ? currentSelectedItem.sizes[selectedSizeIndex] : null;
    const crustName = currentSelectedItem.crust_options ? currentSelectedItem.crust_options[selectedCrustIndex] : null;
    
    let unitPrice = currentSelectedItem.base_price;
    if (sizeObj) unitPrice += sizeObj.price_offset;

    const cartItem = {
      id: currentSelectedItem.id + (sizeObj ? '-' + sizeObj.name : ''),
      name: currentSelectedItem.name,
      size: sizeObj ? sizeObj.name : null,
      crust: crustName,
      price: unitPrice,
      qty: currentQty
    };

    // Check existing item
    const existingIndex = cart.findIndex(i => i.id === cartItem.id && i.crust === cartItem.crust);
    if (existingIndex > -1) {
      cart[existingIndex].qty += currentQty;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('pizza_cart', JSON.stringify(cart));
    updateCartBadge();
    modalOverlay.style.display = 'none';
  };

  function updateCartBadge() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = totalCount;
  }

  // WhatsApp Cart Drawer Elements & Logic
  const openCartBtn = document.getElementById('openCartBtn');
  const cartOverlay = document.getElementById('whatsappCartOverlay');
  const closeCartModal = document.getElementById('closeCartModal');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartEmptyState = document.getElementById('cartEmptyState');
  const cartFooter = document.getElementById('cartFooter');
  const cartGrandTotal = document.getElementById('cartGrandTotal');
  const checkoutWhatsappBtn = document.getElementById('checkoutWhatsappBtn');

  if (openCartBtn && cartOverlay) {
    openCartBtn.onclick = () => {
      renderCartDrawer();
      cartOverlay.style.display = 'flex';
    };
  }

  if (closeCartModal) {
    closeCartModal.onclick = () => { cartOverlay.style.display = 'none'; };
  }

  if (cartOverlay) {
    cartOverlay.onclick = (e) => { if (e.target === cartOverlay) cartOverlay.style.display = 'none'; };
  }

  function renderCartDrawer() {
    cartItemsList.innerHTML = '';
    
    if (cart.length === 0) {
      cartEmptyState.style.display = 'block';
      cartFooter.style.display = 'none';
      return;
    }

    cartEmptyState.style.display = 'none';
    cartFooter.style.display = 'block';

    let grandTotal = 0;

    cart.forEach((item, index) => {
      const itemTotal = item.price * item.qty;
      grandTotal += itemTotal;

      const div = document.createElement('div');
      div.className = 'cart-item-card';
      div.innerHTML = `
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <p class="cart-item-meta">${item.size ? 'Size: ' + item.size : ''} ${item.crust ? '• Crust: ' + item.crust : ''}</p>
          <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <button type="button" onclick="adjustQty(${index}, -1)">-</button>
          <span>${item.qty}</span>
          <button type="button" onclick="adjustQty(${index}, 1)">+</button>
        </div>
      `;
      cartItemsList.appendChild(div);
    });

    cartGrandTotal.textContent = `$${grandTotal.toFixed(2)}`;
  }

  window.adjustQty = function(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    localStorage.setItem('pizza_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartDrawer();
  };

  // WhatsApp Checkout Trigger & Cleanup Workaround
  if (checkoutWhatsappBtn) {
    checkoutWhatsappBtn.onclick = () => {
      const customerName = document.getElementById('customerName').value.trim();
      const customerLocation = document.getElementById('customerTableOrAddress').value.trim();

      if (!customerName) {
        alert('Please enter your name to proceed.');
        document.getElementById('customerName').focus();
        return;
      }

      if (cart.length === 0) return;

      let message = `🍕 *NEW PIZZA ORDER*%0A`;
      message += `👤 *Name:* ${customerName}%0A`;
      if (customerLocation) {
        message += `📍 *Table/Address:* ${customerLocation}%0A`;
      }
      message += `------------------------%0A`;

      let total = 0;
      cart.forEach((item) => {
        const itemSum = item.price * item.qty;
        total += itemSum;
        message += `• ${item.qty}x ${item.name}`;
        if (item.size) message += ` (${item.size})`;
        if (item.crust) message += ` [${item.crust}]`;
        message += ` - $${itemSum.toFixed(2)}%0A`;
      });

      message += `------------------------%0A`;
      message += `💰 *Grand Total:* $${total.toFixed(2)}`;

      const whatsappNumber = "923049999325"; 
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      
      // 1. Open WhatsApp app/web window
      window.open(whatsappUrl, '_blank');

      // 2. Clear cart array & local storage storage instantly
      cart = [];
      localStorage.removeItem('pizza_cart');
      updateCartBadge();

      // 3. Close cart drawer overlay
      cartOverlay.style.display = 'none';

      // 4. Show user instructions toast notification regarding browser return
      showOrderNotification();
    };
  }

  function showOrderNotification() {
    let existingToast = document.getElementById('orderToast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'orderToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #18181b;
      color: #fafafa;
      border: 1px solid #ea580c;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      z-index: 9999;
      font-size: 13px;
      text-align: center;
      max-width: 90%;
      width: 340px;
      line-height: 1.45;
    `;
    toast.innerHTML = `🔥 <strong>Order Dispatched!</strong><br><span style="color: #a1a1aa; font-size: 12px; display: block; margin-top: 4px;">Once you send your order in WhatsApp, you can tap back to your browser to view your active order summary.</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 8000);
  }

  // Category Pills Filtering & Smooth Scrolling Logic
  const pillBtns = document.querySelectorAll('.pill-btn');
  pillBtns.forEach(btn => {
    btn.onclick = () => {
      pillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const targetId = btn.getAttribute('data-category');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const headerOffset = 110; 
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    };
  });
});