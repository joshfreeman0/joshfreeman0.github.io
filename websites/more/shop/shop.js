/* Shop front end for /websites/more/shop/ */
const ORDER_EMAIL = 'orders@example.com';
const ORDER_EMAIL_PLACEHOLDER = 'orders@example.com';

function orderingConnected() {
  return String(ORDER_EMAIL || '').trim().toLowerCase() !== ORDER_EMAIL_PLACEHOLDER;
}

const grid = document.getElementById('grid');
const detail = document.getElementById('detail');
const formDialog = document.getElementById('order-form');
const notice = document.getElementById('order-notice');
const form = document.getElementById('request-form');
const formStatus = document.getElementById('form-status');
let items = [];
let pendingItem = null;

if (notice) {
  notice.hidden = orderingConnected();
}

function moneyUSD(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function isAvailable(item) {
  return String(item.status || '').toLowerCase() === 'available';
}

function hasBuyUrl(item) {
  return Boolean(item.buyUrl && String(item.buyUrl).trim());
}

function cardHTML(item) {
  const sold = !isAvailable(item);
  const img = item.image || '';
  return `<article class="product-card" data-id="${escapeAttr(item.id)}">
    <button type="button" class="product-hit" data-open="${escapeAttr(item.id)}" aria-label="View ${escapeAttr(item.name)}">
      <img src="${escapeAttr(img)}" alt="">
      <span class="product-meta">
        <span class="example-badge">Example item</span>
        <span class="product-name">${escapeHTML(item.name)}</span>
        <span class="product-price">${moneyUSD(item.price)} <span class="example-price">(example price)</span></span>
        <span class="product-status${sold ? ' is-sold' : ''}">${sold ? 'Sold' : 'Available'}</span>
      </span>
    </button>
  </article>`;
}

function actionHTML(item) {
  if (!isAvailable(item)) {
    return '<p class="sold-line">Sold</p>';
  }
  if (hasBuyUrl(item)) {
    return `<a class="btn" href="${escapeAttr(item.buyUrl)}" target="_blank" rel="noopener">Buy</a>`;
  }
  return `<button type="button" class="btn" data-request="${escapeAttr(item.id)}">Order request</button>`;
}

function openDetail(id) {
  const item = items.find((it) => it.id === id);
  if (!item || !detail) return;
  document.getElementById('detail-img').src = item.image || '';
  document.getElementById('detail-img').alt = item.name || '';
  document.getElementById('detail-name').textContent = item.name || '';
  document.getElementById('detail-price').innerHTML = `${moneyUSD(item.price)} <span class="example-price">(example price)</span>`;
  document.getElementById('detail-desc').textContent = item.description || '';
  document.getElementById('detail-status').textContent = isAvailable(item) ? 'Available' : 'Sold';
  document.getElementById('detail-status').className = 'product-status' + (isAvailable(item) ? '' : ' is-sold');
  document.getElementById('detail-actions').innerHTML = actionHTML(item);
  document.getElementById('detail-example').hidden = false;
  if (typeof detail.showModal === 'function') detail.showModal();
  else detail.setAttribute('open', '');
}

function closeDetail() {
  if (!detail) return;
  if (typeof detail.close === 'function') detail.close();
  else detail.removeAttribute('open');
}

function openForm(id) {
  const item = items.find((it) => it.id === id);
  if (!item || !formDialog) return;
  pendingItem = item;
  formStatus.textContent = '';
  form.item.value = item.name;
  form.quantity.value = '1';
  form.name.value = '';
  form.email.value = '';
  form.zip.value = '';
  form.note.value = '';
  closeDetail();
  if (typeof formDialog.showModal === 'function') formDialog.showModal();
  else formDialog.setAttribute('open', '');
}

function closeForm() {
  if (!formDialog) return;
  if (typeof formDialog.close === 'function') formDialog.close();
  else formDialog.removeAttribute('open');
  pendingItem = null;
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHTML(s).replace(/'/g, '&#39;');
}

grid.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) openDetail(open.getAttribute('data-open'));
});

document.body.addEventListener('click', (e) => {
  const req = e.target.closest('[data-request]');
  if (req) openForm(req.getAttribute('data-request'));
  if (e.target.closest('[data-close-detail]')) closeDetail();
  if (e.target.closest('[data-close-form]')) closeForm();
});

if (detail) {
  detail.addEventListener('click', (e) => {
    if (e.target === detail) closeDetail();
  });
}
if (formDialog) {
  formDialog.addEventListener('click', (e) => {
    if (e.target === formDialog) closeForm();
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  formStatus.textContent = '';
  if (!orderingConnected()) {
    formStatus.textContent = 'Ordering is not yet connected. This form will not send until an order email is set in shop.js.';
    return;
  }
  const itemName = form.item.value.trim() || (pendingItem && pendingItem.name) || '';
  const qty = form.quantity.value.trim() || '1';
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const zip = form.zip.value.trim();
  const note = form.note.value.trim();
  const subject = 'Order request: ' + itemName;
  const body = [
    'Name: ' + name,
    'Email: ' + email,
    'Item: ' + itemName,
    'Quantity: ' + qty,
    'Shipping ZIP: ' + zip,
    'Note: ' + note
  ].join('\n');
  const url = 'mailto:' + encodeURIComponent(ORDER_EMAIL)
    + '?subject=' + encodeURIComponent(subject)
    + '&body=' + encodeURIComponent(body);
  window.location.href = url;
  formStatus.textContent = 'Your mail app should open with the order request.';
});

fetch('items.json', { cache: 'no-store' })
  .then((r) => {
    if (!r.ok) throw new Error('Could not load items');
    return r.json();
  })
  .then((data) => {
    items = Array.isArray(data) ? data : [];
    grid.innerHTML = items.map(cardHTML).join('') || '<p class="empty">No items listed yet.</p>';
  })
  .catch(() => {
    grid.innerHTML = '<p class="empty">The item list could not be loaded.</p>';
  });
