const productLists = Array.from(document.querySelectorAll(".product-list"));
const cart = new Map();
let cashReceived = null;

if (productLists.length === 0) {
  console.error('Could not find any elements with class "product-list".');
} else {
  fetch("supermarket.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`Could not load products: ${response.status}`);
      }
      return response.json();
    })
    .then(products => {
      if (!Array.isArray(products)) {
        throw new Error("The product list must be an array.");
      }

      productLists.forEach(productList => {
        const category = productList.dataset.category;
        const matchingProducts = category === "all"
          ? products
          : products.filter(product =>
            String(product.Category).trim().toLowerCase() === category.trim().toLowerCase()
          );

        matchingProducts.forEach(product => {
          productList.append(createProductCard(product));
        });

        if (matchingProducts.length === 0) {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "empty-category";
          emptyMessage.textContent = `No products found in ${category}.`;
          productList.append(emptyMessage);
        }
      });
    })
    .catch(error => {
      console.error("Failed to load products:", error);
    });
}

function createProductCard(product) {
  const price = Number.parseFloat(String(product.price).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Invalid price for product "${product.itemName}".`);
  }

  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.itemId = String(product.itemID);
  card.dataset.itemName = String(product.itemName);
  card.dataset.price = String(price);

  const description = document.createElement("div");
  description.className = "product-description";

  [
    ["product-name", product.itemName],
    ["product-id", product.itemID],
    ["product-category", product.Category],
    ["product-price", formatMoney(price)]
  ].forEach(([className, value]) => {
    const text = document.createElement("p");
    text.className = className;
    text.textContent = String(value);
    description.append(text);
  });

  const quantitySection = document.createElement("div");
  quantitySection.className = "quantity-section";

  const decreaseButton = document.createElement("button");
  decreaseButton.type = "button";
  decreaseButton.className = "btn-minus";
  decreaseButton.textContent = "-";
  decreaseButton.setAttribute("aria-label", "Decrease quantity");
  decreaseButton.addEventListener("click", () => changeQuantity(card, -1));

  const quantity = document.createElement("output");
  quantity.className = "quantity";
  quantity.setAttribute("aria-live", "polite");
  quantity.textContent = "1";

  const increaseButton = document.createElement("button");
  increaseButton.type = "button";
  increaseButton.className = "btn-plus";
  increaseButton.textContent = "+";
  increaseButton.setAttribute("aria-label", "Increase quantity");
  increaseButton.addEventListener("click", () => changeQuantity(card, 1));

  quantitySection.append(decreaseButton, quantity, increaseButton);

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-to-cart";
  addButton.textContent = "Add To Cart";
  addButton.addEventListener("click", () => addItemsOnAction(addButton));

  card.append(description, quantitySection, addButton);
  return card;
}

function changeQuantity(productCard, amount) {
  const quantity = productCard.querySelector(".quantity");
  const currentQuantity = Number(quantity.textContent);
  quantity.textContent = String(Math.max(0, currentQuantity + amount));
}

function addItemsOnAction(button) {
  const productCard = button.closest(".product-card");
  const quantity = Number(productCard.querySelector(".quantity").textContent);

  if (quantity < 1) {
    window.alert("Choose a quantity greater than zero.");
    return;
  }

  const itemId = productCard.dataset.itemId;
  const existingItem = cart.get(itemId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.set(itemId, {
      name: productCard.dataset.itemName,
      price: Number(productCard.dataset.price),
      quantity
    });
  }

  cashReceived = null;
  renderCart();
}

function renderCart() {
  const itemList = document.getElementById("item-list");
  itemList.replaceChildren();

  if (cart.size === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-cart";
    emptyMessage.textContent = "No items added yet.";
    itemList.append(emptyMessage);
  } else {
    cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-item";

      const name = document.createElement("span");
      name.className = "cart-item-name";
      name.textContent = item.name;

      const details = document.createElement("span");
      details.className = "cart-item-details";
      details.textContent = `${item.quantity} × ${formatMoney(item.price)}`;

      const lineTotal = document.createElement("strong");
      lineTotal.textContent = formatMoney(item.quantity * item.price);

      row.append(name, details, lineTotal);
      itemList.append(row);
    });
  }

  const total = getCartTotal();
  document.getElementById("cart-total").textContent = formatMoney(total);
  document.getElementById("cart-subtotal").textContent = formatMoney(total);
  document.getElementById("cash-amount").textContent =
    cashReceived === null ? "Not entered" : formatMoney(cashReceived);
  document.getElementById("cash-change").textContent =
    formatMoney(cashReceived === null ? 0 : cashReceived - total);
}

function clearCartOnAction() {
  cart.clear();
  cashReceived = null;
  document.querySelectorAll(".product-card .quantity").forEach(quantity => {
    quantity.textContent = "1";
  });
  renderCart();
}

function getCartTotal() {
  let total = 0;
  cart.forEach(item => {
    total += item.quantity * item.price;
  });
  return Math.round((total + Number.EPSILON) * 100) / 100;
}

function formatMoney(amount) {
  return `Rs. ${amount.toFixed(2)}`;
}

function askForCashOnAction() {
  const total = getCartTotal();
  if (total <= 0) {
    window.alert("Add items to the cart before entering cash.");
    return;
  }

  const input = window.prompt(`Enter cash received (total: ${formatMoney(total)}):`);
  if (input === null) {
    return;
  }

  const amount = Number(input.trim());
  if (!input.trim() || !Number.isFinite(amount) || amount < total) {
    window.alert(`Cash must be a valid amount of at least ${formatMoney(total)}.`);
    return;
  }

  cashReceived = Math.round((amount + Number.EPSILON) * 100) / 100;
  renderCart();
}

function printBillOnAction() {
  if (cart.size === 0) {
    window.alert("Add items to the cart before printing a bill.");
    return;
  }

  if (cashReceived === null) {
    askForCashOnAction();
  }
  if (cashReceived !== null) {
    window.print();
  }
}
