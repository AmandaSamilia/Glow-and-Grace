// =========================
// Dados de exemplo (troque as imagens em /images/)
// ids: o1,o2,r1,r2,l1,l2 ...
// =========================
const PRODUCTS = [
  { id:'o1', nome:'Máscara de Cílios Precision', categoria:'olhos', preco:79.9, img:'images/rimel1.jpg', desc:'Volume definido e alongamento elegante.' },
  { id:'o2', nome:'Sombra Neutra Quarteto', categoria:'olhos', preco:99.9, img:'images/sombra1.jpg', desc:'Tons versáteis para o dia a dia.' },
  { id:'r1', nome:'Base Sérum Natural', categoria:'pele', preco:119.9, img:'images/base1.jpg', desc:'Cobertura leve com efeito segunda pele.' },
  { id:'r2', nome:'Iluminador Sutil', categoria:'pele', preco:89.9, img:'images/iluminador1.jpg', desc:'Glow sofisticado sem partículas grossas.' },
  { id:'l1', nome:'Balm Labial Glow', categoria:'lábios', preco:39.9, img:'images/batom1.jpg', desc:'Hidratação imediata com brilho sutil.' },
  { id:'l2', nome:'Batom Velvet Matte', categoria:'lábios', preco:59.9, img:'images/batom2.jpg', desc:'Acabamento aveludado sem ressecar.' }
];

// Utilitáriosa
const R$ = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

// Elementos
const carousel = qs('#productCarousel');
const prevBtn = qs('.carousel-btn.prev');
const nextBtn = qs('.carousel-btn.next');
const searchInput = qs('#search');
const navChips = qsa('.nav-chip');
const cartOpenBtn = qs('#cartOpen');
const cartBadge = qs('#cartBadge');
const cartDrawer = qs('#cartDrawer');
const backdrop = qs('#cartBackdrop');
const cartContent = qs('#cartContent');
const cartSubtotalEl = qs('#cartSubtotal');
const cartFreteEl = qs('#cartFrete');
const cartTotalEl = qs('#cartTotal');
const checkoutForm = qs('#checkoutForm');
const clearCartBtn = qs('#clearCart');
const cartCloseBtn = qs('#cartClose');
const backToShopBtn = qs('#backToShop');
const yearEl = qs('#year');

yearEl.textContent = new Date().getFullYear();

// Estado
let currentFilter = 'todos';
let cart = JSON.parse(localStorage.getItem('gg.cart') || '{}'); // {id: qtd}

// Render carousel items (centered via CSS)
function renderCarousel(list = PRODUCTS){
  carousel.innerHTML = '';
  // spacer for center effect is CSS ::before/::after
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.nome}" loading="lazy" />
      <div class="name">${p.nome}</div>
      <div class="desc">${p.desc}</div>
      <div class="price">${R$(p.preco)}</div>
      <div class="actions">
        <div class="qty" data-id="${p.id}">
          <button data-act="dec">−</button>
          <span data-qtd>1</span>
          <button data-act="inc">+</button>
        </div>
        <button class="btn-primary add-btn" data-id="${p.id}">Adicionar</button>
      </div>
    `;
    // qty handlers
    card.addEventListener('click', (e)=>{
      const act = e.target.getAttribute('data-act');
      const id = e.target.closest('.qty')?.getAttribute('data-id');
      if(!act || !id) return;
      const span = e.target.closest('.qty').querySelector('[data-qtd]');
      let val = parseInt(span.textContent,10);
      if(act==='inc') span.textContent = ++val;
      if(act==='dec') span.textContent = Math.max(1, --val);
    });
    // add button
    card.querySelector('.add-btn').addEventListener('click', (e)=>{
      const id = e.target.getAttribute('data-id');
      const qty = parseInt(card.querySelector('[data-qtd]').textContent,10);
      addToCart(id, qty);
      // reset qty to 1
      card.querySelector('[data-qtd]').textContent = '1';
    });

    carousel.appendChild(card);
  });
}

// Filters
function applyFilters(){
  const term = searchInput.value.trim().toLowerCase();
  const filtered = PRODUCTS.filter(p => {
    const okCat = (currentFilter==='todos') || (p.categoria === currentFilter);
    const okTerm = p.nome.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term);
    return okCat && okTerm;
  });
  renderCarousel(filtered);
  // scroll to start
  carousel.scrollLeft = 0;
}

// Nav chips
navChips.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    navChips.forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    applyFilters();
  });
});

// search
searchInput.addEventListener('input', applyFilters);

// Carousel controls
prevBtn.addEventListener('click', ()=> {
  // scroll left by one card width (approx)
  carousel.scrollBy({left: -300, behavior:'smooth'});
});
nextBtn.addEventListener('click', ()=> {
  carousel.scrollBy({left: 300, behavior:'smooth'});
});

// Touch swipe support for carousel
let startX = 0;
carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
carousel.addEventListener('touchend', e => {
  const endX = e.changedTouches[0].clientX;
  if(endX - startX > 40) carousel.scrollBy({left: -300, behavior:'smooth'});
  if(startX - endX > 40) carousel.scrollBy({left: 300, behavior:'smooth'});
});

// ========== CART LOGIC ==========
function saveCart(){ localStorage.setItem('gg.cart', JSON.stringify(cart)); renderCart(); }

function addToCart(id, qty = 1){
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  openCart();
}

function removeFromCart(id){ delete cart[id]; saveCart(); }
function setQty(id, val){ if(val<=0) removeFromCart(id); else { cart[id]=val; saveCart(); } }

function cartItems(){
  return Object.entries(cart).map(([id,qtd])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    if(!p) return null;
    return {...p, qtd, total: p.preco * qtd};
  }).filter(Boolean);
}

function calcSubtotal(){
  return cartItems().reduce((s,i)=>s + i.total, 0);
}

function renderCart(){
  const items = cartItems();
  cartContent.innerHTML = '';
  if(items.length === 0){
    cartContent.innerHTML = '<p class="muted">Seu carrinho está vazio.</p>';
  } else {
    items.forEach(it=>{
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${it.img}" alt="${it.nome}">
        <div>
          <div style="font-weight:600">${it.nome}</div>
          <div class="muted" style="font-size:13px">${R$(it.preco)} • ${it.categoria}</div>
          <div style="margin-top:8px; display:flex;gap:8px; align-items:center">
            <div class="qty" data-id="${it.id}">
              <button data-act="dec">−</button>
              <span>${it.qtd}</span>
              <button data-act="inc">+</button>
            </div>
            <button class="btn-outline small" data-act="rm" data-id="${it.id}">Remover</button>
          </div>
        </div>
        <div style="font-weight:700">${R$(it.total)}</div>
      `;
      // events on row
      row.addEventListener('click', (e)=>{
        const act = e.target.getAttribute('data-act');
        const id = e.target.getAttribute('data-id') || e.target.closest('.qty')?.getAttribute('data-id');
        if(!act || !id) return;
        if(act === 'inc') setQty(id, (cart[id]||1) + 1);
        if(act === 'dec') setQty(id, (cart[id]||1) - 1);
        if(act === 'rm') removeFromCart(id);
      });
      cartContent.appendChild(row);
    });
  }

  // Totais
  const subtotal = calcSubtotal();
  const frete = subtotal > 199 ? 0 : 19.9; // exemplo
  cartSubtotalEl.textContent = R$(subtotal);
  cartFreteEl.textContent = R$(frete);
  cartTotalEl.textContent = R$(subtotal + frete);
  // badge
  const count = items.reduce((s,i)=>s+i.qtd,0);
  cartBadge.textContent = `(${count})`;
}

// Drawer open/close
function openCart(){
  cartDrawer.classList.remove('hidden');
  backdrop.classList.remove('hidden');
  cartOpenBtn.setAttribute('aria-expanded','true');
  renderCart();
}
function closeCart(){
  cartDrawer.classList.add('hidden');
  backdrop.classList.add('hidden');
  cartOpenBtn.setAttribute('aria-expanded','false');
}

cartOpenBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
backdrop.addEventListener('click', closeCart);
clearCartBtn.addEventListener('click', ()=>{
  if(confirm('Limpar o carrinho?')){ cart = {}; saveCart(); }
});
backToShopBtn.addEventListener('click', closeCart);

// Checkout submit (simulação)
checkoutForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(Object.keys(cart).length === 0){
    alert('Adicione produtos ao carrinho antes de finalizar.');
    return;
  }
  // validação simples
  const data = Object.fromEntries(new FormData(checkoutForm).entries());
  if(!data.nome || !data.cep || !data.endereco || !data.cidade || !data.uf){
    alert('Por favor preencha os campos de entrega obrigatórios.');
    return;
  }
  const pedido = {
    id: 'GG-' + Math.random().toString(36).slice(2,8).toUpperCase(),
    quando: new Date().toLocaleString('pt-BR'),
    itens: cartItems(),
    cliente: data
  };
  // limpa
  cart = {};
  saveCart();
  closeCart();
  alert(`Pedido confirmado! Código: ${pedido.id}\nEnviaremos os detalhes para você.`);
  console.log('Pedido (simulado):', pedido);
});

// Inicialização
document.addEventListener('DOMContentLoaded', ()=>{
  renderCarousel();
  renderCart();
});

// Inicial render sempre que filtros mudam
searchInput.addEventListener('input', applyFilters);

