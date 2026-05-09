let libros = [];
let librosFiltrados = [];
let carrito = [];
let stockOriginal = {};

const LIMITE_ENVIO_GRATIS = 50000;
const COSTO_ENVIO = 2500;

function swalOpts() {
  const dark = document.body.getAttribute("data-theme") === "dark";
  return dark
    ? {
        background: "#0d1b35",
        color: "#f1f5f9",
        confirmButtonColor: "#e8b84b",
        cancelButtonColor: "#1a2f50"
      }
    : {
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#1e3a6e",
        cancelButtonColor: "#6b7280"
      };
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatearPrecio(precio) {
  return precio.toLocaleString("es-AR");
}

function mostrarToast(mensaje, tipo = "success", opts = {}) {
  const esMobile = window.innerWidth < 576;

  if (tipo === "success" && opts.portada) {
    mostrarToastRico(mensaje, opts.portada, "carrito", esMobile);
    return;
  }

  if (opts.compra) {
    mostrarToastRico(mensaje, null, "compra", esMobile);
    return;
  }

  const colores = {
    success: "linear-gradient(to right, #00b09b, #96c93d)",
    error: "#dc3545",
    info: "#6c757d"
  };
  Toastify({
    text: mensaje,
    duration: tipo === "success" ? 1800 : 2500,
    gravity: "top",
    position: "left",
    style: { background: colores[tipo] }
  }).showToast();
}

function mostrarToastRico(mensaje, portada, tipo, esMobile) {
  const id = esMobile ? "mobileToast" : "desktopToast";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = esMobile ? "mobile-toast" : "desktop-toast";
    document.body.appendChild(el);
  }

  clearTimeout(el._timeout);
  el.dataset.tipo = tipo;

  if (tipo === "compra") {
    el.innerHTML = `
      <div class="toast-compra-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      </div>
      <div class="toast-text">
        <span class="toast-label toast-label--compra">\u00a1Compra confirmada!</span>
        <span class="toast-msg">${mensaje}</span>
      </div>`;
  } else {
    el.innerHTML = `
      <img src="${portada}" alt="" class="toast-thumb">
      <div class="toast-text">
        <span class="toast-label">Agregado al carrito</span>
        <span class="toast-msg">${mensaje}</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="toast-check" viewBox="0 0 16 16">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
      </svg>`;
  }

  el.classList.remove("hide");
  el.classList.add("show");
  el._timeout = setTimeout(() => {
    el.classList.remove("show");
    el.classList.add("hide");
  }, tipo === "compra" ? 3000 : 2200);
}

function mostrarToastMobile(mensaje, portada, tipo = "carrito") {
  mostrarToastRico(mensaje, portada, tipo, true);
}

async function cargarLibros() {
  try {
    const response = await fetch("./data/libros.json");
    if (!response.ok) {
      throw new Error("Error al cargar los libros");
    }
    const data = await response.json();

    libros = (Array.isArray(data) ? data : []).map(libro => ({
      ...libro,
      id: String(libro.id)
    }));

    cargarStockGuardado();
    librosFiltrados = [...libros];

    return libros;
  } catch (error) {
    throw new Error("No se pudieron cargar los libros");
  }
}

function cargarStockGuardado() {
  const stockGuardado = localStorage.getItem("stock_biblioteca");
  if (stockGuardado) {
    try {
      stockOriginal = JSON.parse(stockGuardado);
      for (const libro of libros) {
        if (stockOriginal[libro.id] !== undefined) {
          libro.stock = stockOriginal[libro.id];
        }
      }
    } catch (e) {
    }
  }
}

function guardarStock() {
  stockOriginal = {};
  for (const libro of libros) {
    stockOriginal[libro.id] = libro.stock;
  }
  localStorage.setItem("stock_biblioteca", JSON.stringify(stockOriginal));
}

function cargarCarrito() {
  const carritoGuardado = localStorage.getItem("carrito_baez");
  if (carritoGuardado) {
    try {
      carrito = JSON.parse(carritoGuardado);
    } catch (e) {
      carrito = [];
    }
  }
  actualizarBadgeCarrito();
}

function guardarCarrito() {
  localStorage.setItem("carrito_baez", JSON.stringify(carrito));
  actualizarBadgeCarrito();
}

function actualizarBadgeCarrito() {
  let total = 0;
  for (const item of carrito) {
    total += item.cantidad;
  }
  const badge = document.querySelector("#badgeCart");
  if (badge) {
    badge.textContent = total;
  }
}

function obtenerCantidadCarrito(libroId) {
  const item = carrito.find(item => item.id === libroId);
  return item ? item.cantidad : 0;
}

function agregarAlCarrito(libroId) {
  const libro = libros.find(l => l.id === libroId);
  if (!libro) return;

  const existente = carrito.find(item => item.id === libroId);
  const cantidadActual = existente ? existente.cantidad : 0;
  const nuevaCantidad = cantidadActual + 1;

  if (nuevaCantidad > libro.stock) {
    Swal.fire({
      ...swalOpts(),
      icon: "warning",
      title: "Sin stock suficiente",
      text: `Solo quedan ${libro.stock} ejemplares disponibles`
    });
    return;
  }

  if (existente) {
    existente.cantidad = nuevaCantidad;
  } else {
    carrito.push({
      id: libroId,
      titulo: libro.titulo,
      precio: libro.precio,
      portada: libro.portada,
      stockMax: libro.stock,
      cantidad: 1
    });
  }

  guardarCarrito();
  renderCarrito();
  renderLibros();
  mostrarToast(`"${libro.titulo}" agregado al carrito`, "success", { portada: libro.portada });
}

function quitarDelCarrito(libroId) {
  const item = carrito.find(i => i.id === libroId);
  if (!item) return;

  Swal.fire({
    ...swalOpts(),
    title: 'Eliminar producto',
    text: `¿Estás seguro de quitar "${item.titulo}" del carrito?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      carrito = carrito.filter(i => i.id !== libroId);
      guardarCarrito();
      renderCarrito();
      renderLibros();
      mostrarToast("Producto eliminado del carrito", "error");
    }
  });
}

function cambiarCantidad(libroId, nuevaCantidad) {
  const item = carrito.find(i => i.id === libroId);
  const libro = libros.find(l => l.id === libroId);

  if (!item || !libro) return;

  let cantidad = parseInt(nuevaCantidad, 10);
  if (isNaN(cantidad) || cantidad < 1) {
    cantidad = 1;
  }
  if (cantidad > libro.stock) {
    cantidad = libro.stock;
  }

  item.cantidad = cantidad;
  guardarCarrito();
  renderCarrito();
  renderLibros();
}

function vaciarCarrito() {
  if (carrito.length === 0) {
    Swal.fire({ ...swalOpts(), icon: 'info', title: 'Carrito vacío', text: 'El carrito ya está vacío' });
    return;
  }

  Swal.fire({
    ...swalOpts(),
    title: "¿Vaciar carrito?",
    text: "Se eliminarán todos los productos",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar"
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      carrito = [];
      guardarCarrito();
      renderCarrito();
      renderLibros();
      mostrarToast("Carrito vaciado", "info");
    }
  });
}

function renderLibros() {
  const grid = document.querySelector("#grid");

  const html = librosFiltrados.map(libro => {
    const enCarrito = obtenerCantidadCarrito(libro.id);
    const stockDisponible = libro.stock - enCarrito;
    const tieneStock = stockDisponible > 0;

    return `
      <div class="col-6 col-sm-6 col-lg-3">
        <div class="card h-100">
          <img src="${libro.portada}" class="card-img-top img-crop card-img-clickable" alt="${libro.titulo}"
               onclick="abrirDetalleLibro('${libro.id}')" title="Ver detalle">
          <div class="card-body d-flex flex-column">
            <h3 class="h6 mb-2 fw-bold card-title-book">
              ${libro.titulo}
            </h3>
            <p class="text-muted small mb-3 d-none d-sm-block" style="min-height:2.2rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              <span class="d-block"><strong>${libro.autor}</strong></span>
              <span class="d-block">${libro.genero} &middot; ${libro.anio}</span>
            </p>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <strong class="text-primary fs-5">$${formatearPrecio(libro.precio)}</strong>
              <small class="${tieneStock ? 'badge bg-success bg-opacity-10 text-success' : 'badge bg-danger bg-opacity-10 text-danger'} d-none d-sm-inline-block">
                ${tieneStock ? `✓ ${stockDisponible} disp.` : "Sin stock"}
              </small>
            </div>
            <button class="btn ${tieneStock ? 'btn-primary' : 'btn-secondary'} btn-sm mt-auto"
                    onclick="agregarAlCarrito('${libro.id}')" ${!tieneStock ? 'disabled' : ''}>
              <span class="d-none d-sm-inline">Agregar al carrito</span>
              <span class="d-inline d-sm-none">Agregar</span>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  if (grid) grid.innerHTML = html;
  const count = document.querySelector("#resultCount");
  if (count) count.textContent = `Mostrando ${librosFiltrados.length} resultados`;

  const vacio = document.querySelector("#empty");
  if (vacio) vacio.classList.toggle("d-none", librosFiltrados.length > 0);
}

function renderCarrito() {
  const contenedor = document.querySelector("#cartItems");
  if (!contenedor) return;

  if (carrito.length === 0) {
    contenedor.innerHTML = `
      <div class="text-center my-5 py-5">
        <div class="empty-icon mb-3" style="color: var(--muted); opacity: 0.5;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.397.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l.84 4.479 9.144-.459L13.89 4H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
        </div>
        <p class="text-muted">El carrito está vacío</p>
        <small class="text-muted">Agregá algunos libros para empezar</small>
      </div>`;
  } else {
    const html = carrito.map(item => {
      const total = item.precio * item.cantidad;
      return `
        <div class="cart__row">
          <img src="${item.portada}" alt="" class="cart__thumb">
          <div class="flex-grow-1">
            <div class="fw-semibold mb-1">${item.titulo}</div>
            <div class="text-muted small mb-2">$${formatearPrecio(item.precio)} c/u</div>
            <div class="d-flex align-items-center gap-2">
              <label class="small text-muted fw-semibold">Cantidad:</label>
              <input type="number" min="1" max="${item.stockMax}" value="${item.cantidad}"
                class="form-control form-control-sm w-auto shadow-sm"
                style="max-width: 70px;"
                onchange="cambiarCantidad('${item.id}', this.value)">
            </div>
          </div>
          <div class="text-end">
            <div class="fw-bold text-primary mb-2">$${formatearPrecio(total)}</div>
            <button class="btn btn-sm btn-outline-danger" onclick="quitarDelCarrito('${item.id}')" 
                    title="Eliminar producto">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
            </button>
          </div>
        </div>`;
    }).join('');
    contenedor.innerHTML = html;
  }

  actualizarTotales();
}

function actualizarTotales() {
  let subtotal = 0;
  for (const item of carrito) {
    subtotal += (item.precio * item.cantidad);
  }
  const envio = subtotal > LIMITE_ENVIO_GRATIS ? 0 : COSTO_ENVIO;
  const total = subtotal + envio;

  const elementos = {
    subtotal: document.querySelector("#cSubtotal"),
    envio: document.querySelector("#cEnvio"),
    total: document.querySelector("#cTotal")
  };

  if (elementos.subtotal) elementos.subtotal.textContent = "$" + formatearPrecio(subtotal);
  if (elementos.envio) {
    elementos.envio.textContent = envio === 0 ? "GRATIS" : "$" + formatearPrecio(envio);
  }
  if (elementos.total) elementos.total.textContent = "$" + formatearPrecio(total);
}

function llenarSelectGeneros() {
  const select = document.querySelector("#genre");
  if (!select) return;

  const generosSet = new Set();
  for (const libro of libros) {
    generosSet.add(libro.genero);
  }
  const generos = Array.from(generosSet).sort();

  let opciones = '<option value="">Todos los géneros</option>';
  for (const genero of generos) {
    opciones += `<option value="${genero}">${genero}</option>`;
  }
  select.innerHTML = opciones;

  const guardado = localStorage.getItem("filtros_biblioteca");
  if (guardado) {
    try {
      const filtros = JSON.parse(guardado);
      if (filtros.genre) select.value = filtros.genre;
    } catch (e) {}
  }
}

function guardarFiltros() {
  const filtros = {
    q: document.querySelector("#q").value,
    genre: document.querySelector("#genre").value,
    sort: document.querySelector("#sort").value
  };
  localStorage.setItem("filtros_biblioteca", JSON.stringify(filtros));
}

function restaurarFiltros() {
  const guardado = localStorage.getItem("filtros_biblioteca");
  if (!guardado) return;
  try {
    const filtros = JSON.parse(guardado);
    if (filtros.q) document.querySelector("#q").value = filtros.q;
    if (filtros.sort) document.querySelector("#sort").value = filtros.sort;
    return filtros.genre || "";
  } catch (e) {
    return "";
  }
}

function hayFiltrosActivos() {
  const q = document.querySelector("#q").value.trim();
  const genre = document.querySelector("#genre").value;
  const sort = document.querySelector("#sort").value;
  return q !== "" || genre !== "" || sort !== "todos";
}

function actualizarBotonLimpiar() {
  const btn = document.querySelector("#btnClear");
  if (!btn) return;
  if (hayFiltrosActivos()) {
    btn.classList.remove("btn-clear-hidden");
    btn.classList.add("btn-clear-visible");
  } else {
    btn.classList.remove("btn-clear-visible");
    btn.classList.add("btn-clear-hidden");
  }

  const badge = document.querySelector("#badgeFilters");
  if (!badge) return;
  const count = [document.querySelector("#q").value.trim(), document.querySelector("#genre").value, document.querySelector("#sort").value !== "todos" ? "x" : ""].filter(Boolean).length;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }
}

function aplicarFiltros() {
  const busqueda = document.querySelector("#q").value.toLowerCase().trim();
  const generoSeleccionado = document.querySelector("#genre").value;
  const ordenamiento = document.querySelector("#sort").value;

  librosFiltrados = libros.filter(libro => {
    const coincideBusqueda = !busqueda ||
      libro.titulo.toLowerCase().includes(busqueda) ||
      libro.autor.toLowerCase().includes(busqueda);
    const coincideGenero = !generoSeleccionado || libro.genero === generoSeleccionado;
    return coincideBusqueda && coincideGenero;
  });

  if (ordenamiento === "precio-asc") {
    librosFiltrados.sort((a, b) => a.precio - b.precio);
  } else if (ordenamiento === "precio-desc") {
    librosFiltrados.sort((a, b) => b.precio - a.precio);
  } else if (ordenamiento === "titulo-az") {
    librosFiltrados.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  }

  guardarFiltros();
  actualizarBotonLimpiar();
  renderLibros();

  sincronizarControlesMobile();
}

function limpiarFiltros() {
  document.querySelector("#q").value = "";
  document.querySelector("#genre").value = "";
  document.querySelector("#sort").value = "todos";
  localStorage.removeItem("filtros_biblioteca");
  actualizarBotonLimpiar();
  sincronizarControlesMobile();
  aplicarFiltros();
  mostrarToast("Filtros limpiados", "info");
}

function abrirSheetFiltros() {
  const sheet = document.getElementById("filterSheet");
  const bd = document.getElementById("filterSheetBackdrop");
  sincronizarControlesMobile();
  if (bd) bd.style.display = "block";
  requestAnimationFrame(() => {
    if (bd) bd.classList.add("open");
    if (sheet) sheet.classList.add("open");
  });
  document.body.style.overflow = "hidden";
}

function cerrarSheetFiltros() {
  const sheet = document.getElementById("filterSheet");
  const bd = document.getElementById("filterSheetBackdrop");
  if (sheet) sheet.classList.remove("open");
  if (bd) bd.classList.remove("open");
  document.body.style.overflow = "";
  setTimeout(() => { if (bd) bd.style.display = "none"; }, 350);
}

function sincronizarControlesMobile() {
  const qM = document.querySelector("#q-m");
  const genreM = document.querySelector("#genre-m");
  const sortM = document.querySelector("#sort-m");
  if (qM) qM.value = document.querySelector("#q").value;
  if (genreM) genreM.value = document.querySelector("#genre").value;
  if (sortM) sortM.value = document.querySelector("#sort").value;
}

function aplicarFiltrosMobile() {
  const qM = document.querySelector("#q-m");
  const genreM = document.querySelector("#genre-m");
  const sortM = document.querySelector("#sort-m");
  if (qM) document.querySelector("#q").value = qM.value;
  if (genreM) document.querySelector("#genre").value = genreM.value;
  if (sortM) document.querySelector("#sort").value = sortM.value;
  cerrarSheetFiltros();
  aplicarFiltros();
  actualizarResultCountMobile();
}

function limpiarFiltrosMobile() {
  const qM = document.querySelector("#q-m");
  const genreM = document.querySelector("#genre-m");
  const sortM = document.querySelector("#sort-m");
  if (qM) qM.value = "";
  if (genreM) genreM.value = "";
  if (sortM) sortM.value = "todos";
}

function actualizarResultCountMobile() {
  const el = document.querySelector("#resultCountMobile");
  const elDesktop = document.querySelector("#resultCount");
  if (el && elDesktop) el.textContent = elDesktop.textContent;
}

function llenarSelectGenerosMobile() {
  const selectM = document.querySelector("#genre-m");
  const selectD = document.querySelector("#genre");
  if (!selectM || !selectD) return;
  selectM.innerHTML = selectD.innerHTML;
}

function abrirDetalleLibro(libroId) {
  if (window.innerWidth >= 576) return;

  const libro = libros.find(l => l.id === libroId);
  if (!libro) return;

  const enCarrito = obtenerCantidadCarrito(libroId);
  const stockDisponible = libro.stock - enCarrito;
  const tieneStock = stockDisponible > 0;

  const body = document.getElementById("bookDetailBody");
  if (!body) return;

  body.innerHTML = `
    <div class="d-flex gap-3 mb-4">
      <img src="${libro.portada}" alt="${libro.titulo}" class="book-detail-img">
      <div class="flex-grow-1">
        <h3 class="h5 fw-bold mb-1">${libro.titulo}</h3>
        <p class="text-muted small mb-1"><strong>${libro.autor}</strong></p>
        <p class="text-muted small mb-2">${libro.genero} &middot; ${libro.anio}</p>
        <strong class="text-primary fs-5">$${formatearPrecio(libro.precio)}</strong>
      </div>
    </div>
    <div class="mb-3">
      <span class="${tieneStock ? 'badge bg-success bg-opacity-10 text-success' : 'badge bg-danger bg-opacity-10 text-danger'} px-3 py-2">
        ${tieneStock ? `✓ ${stockDisponible} ejemplar${stockDisponible > 1 ? 'es' : ''} disponible${stockDisponible > 1 ? 's' : ''}` : 'Sin stock'}
      </span>
    </div>
    <button class="btn ${tieneStock ? 'btn-primary' : 'btn-secondary'} w-100"
            onclick="agregarAlCarrito('${libroId}'); cerrarDetalleLibro();"
            ${!tieneStock ? 'disabled' : ''}>
      ${tieneStock ? 'Agregar al carrito' : 'Sin stock'}
    </button>`;

  const overlay = document.getElementById("bookDetailModal");
  overlay.style.display = "flex";
  requestAnimationFrame(() => overlay.classList.add("open"));
  document.body.style.overflow = "hidden";
}

function cerrarDetalleLibro() {
  const overlay = document.getElementById("bookDetailModal");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
  setTimeout(() => { overlay.style.display = "none"; }, 260);
}

function abrirCarrito() {
  const cart = document.querySelector("#cart");
  const backdrop = document.querySelector("#backdrop");

  if (cart) cart.classList.add("show");
  if (backdrop) backdrop.classList.add("show");

  renderCarrito();
}

function cerrarCarrito() {
  const cart = document.querySelector("#cart");
  const backdrop = document.querySelector("#backdrop");

  if (cart) cart.classList.remove("show");
  if (backdrop) backdrop.classList.remove("show");
}

function procesarCheckout() {
  if (carrito.length === 0) {
    Swal.fire({
      ...swalOpts(),
      icon: 'info',
      title: 'Carrito vacío',
      text: 'Agregá algunos libros antes de finalizar la compra'
    });
    return;
  }

  let subtotal = 0;
  for (const item of carrito) {
    subtotal += (item.precio * item.cantidad);
  }
  const envio = subtotal > LIMITE_ENVIO_GRATIS ? 0 : COSTO_ENVIO;
  const total = subtotal + envio;

  Swal.fire({
    ...swalOpts(),
    title: "Confirmar compra",
    html: `
            <div class="text-start">
                <p><strong>Resumen de tu compra:</strong></p>
                <p>Productos: ${carrito.length} items</p>
                <p>Subtotal: $${formatearPrecio(subtotal)}</p>
                <p>Envío: ${envio === 0 ? 'GRATIS' : '$' + formatearPrecio(envio)}</p>
                <hr>
                <p><strong>Total: $${formatearPrecio(total)}</strong></p>
            </div>
        `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Confirmar compra",
    cancelButtonText: "Seguir comprando"
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      completarCompra();
    }
  });
}

function completarCompra() {
  for (const item of carrito) {
    const libro = libros.find(l => l.id === item.id);
    if (libro) {
      libro.stock = Math.max(0, libro.stock - item.cantidad);
    }
  }

  guardarStock();

  const numeroPedido = Date.now().toString().slice(-6);

  carrito = [];
  guardarCarrito();
  renderCarrito();
  renderLibros();
  cerrarCarrito();

  Swal.fire({
    ...swalOpts(),
    icon: 'success',
    title: '¡Compra realizada!',
    html: `
            <div>
                <p>Tu pedido <strong>#${numeroPedido}</strong> ha sido procesado.</p>
                <p>Recibirás un email con los detalles.</p>
                <p>¡Gracias por elegir Biblioteca Duarte Quirós!</p>
            </div>
        `,
    confirmButtonText: 'Excelente'
  });

  mostrarToast("\u00a1Compra realizada con éxito!", "success", { compra: true });
}

function cambiarTema() {
  const body = document.body;
  const temaActual = body.getAttribute("data-theme") || "light";
  const nuevoTema = temaActual === "light" ? "dark" : "light";

  body.setAttribute("data-theme", nuevoTema);
  localStorage.setItem("tema_guardado", nuevoTema);
}

function configurarTemaInicial() {
  const temaGuardado = localStorage.getItem("tema_guardado");
  const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const tema = temaGuardado || (prefiereOscuro ? "dark" : "light");

  document.body.setAttribute("data-theme", tema);
}

function resetearFiltros() {
  limpiarFiltros();
}

function configurarEventos() {
  const busquedaConDebounce = debounce(aplicarFiltros, 400);
  document.querySelector("#q").addEventListener("input", busquedaConDebounce);

  document.querySelector("#genre").addEventListener("change", aplicarFiltros);
  document.querySelector("#sort").addEventListener("change", aplicarFiltros);
  document.querySelector("#btnClear").addEventListener("click", limpiarFiltros);

  const btnOpen = document.querySelector("#btnOpenFilters");
  const btnClose = document.querySelector("#btnCloseFilters");
  const btnApply = document.querySelector("#btnApplyFilters");
  const btnClearM = document.querySelector("#btnClearMobile");
  const sheetBd = document.querySelector("#filterSheetBackdrop");
  if (btnOpen) btnOpen.addEventListener("click", abrirSheetFiltros);
  if (btnClose) btnClose.addEventListener("click", cerrarSheetFiltros);
  if (btnApply) btnApply.addEventListener("click", aplicarFiltrosMobile);
  if (btnClearM) btnClearM.addEventListener("click", limpiarFiltrosMobile);
  if (sheetBd) sheetBd.addEventListener("click", cerrarSheetFiltros);

  document.querySelector("#btnOpenCart").addEventListener("click", abrirCarrito);
  document.querySelector("#btnCloseCart").addEventListener("click", cerrarCarrito);
  document.querySelector("#backdrop").addEventListener("click", cerrarCarrito);
  document.querySelector("#btnClearCart").addEventListener("click", vaciarCarrito);
  document.querySelector("#btnCheckout").addEventListener("click", procesarCheckout);

  const btnTema = document.getElementById("btnToggleTheme");
  if (btnTema) {
    btnTema.addEventListener("click", cambiarTema);
  }

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      cerrarCarrito();
      cerrarSheetFiltros();
      cerrarDetalleLibro();
    }
  });
}

window.resetearFiltros = resetearFiltros;

(async function inicializarApp() {
  try {
    configurarTemaInicial();
    cargarCarrito();
    restaurarFiltros();
    await cargarLibros();
    llenarSelectGeneros();
    llenarSelectGenerosMobile();
    aplicarFiltros();
    actualizarResultCountMobile();
    configurarEventos();
    renderCarrito();
  } catch (error) {
    Swal.fire({
      ...swalOpts(),
      icon: 'error',
      title: 'Error al cargar la aplicación',
      text: 'Hubo un problema cargando los datos. Por favor, recargá la página.'
    });
  }
})();

const scrollToTopBtn = document.getElementById('scrollToTop');

if (scrollToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
    }
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function inicializarAnimaciones() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
  });
}

function optimizarImagenes() {
  const imagenes = document.querySelectorAll('img');
  imagenes.forEach(img => {
    if ('loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    }
  });
}

function manejarErroresImagen() {
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%23e2e8f0" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%2394a3b8"%3ESin imagen%3C/text%3E%3C/svg%3E';
    });
  });
}

function aplicarTemaNavegador() {
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = document.body.dataset.theme === 'dark' ? '#0f172a' : '#ffffff';
    document.head.appendChild(meta);
  } else {
    metaTheme.content = document.body.dataset.theme === 'dark' ? '#0f172a' : '#ffffff';
  }
}

function detectarTemaAutomatico() {
  if (!localStorage.getItem('tema') && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.body.dataset.theme = 'dark';
      aplicarTemaNavegador();
    }
  }
}

function agregarEfectoHoverLibros() {
  const grid = document.querySelector('#grid');
  if (!grid) return;

  grid.addEventListener('mouseenter', (e) => {
    const card = e.target.closest('.card');
    if (card) {
      card.style.transform = 'translateY(-8px) scale(1.03)';
      card.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.25)';
      card.style.zIndex = '10';
    }
  }, true);

  grid.addEventListener('mouseleave', (e) => {
    const card = e.target.closest('.card');
    if (card) {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = '';
      card.style.zIndex = '';
    }
  }, true);
}

setTimeout(() => {
  inicializarAnimaciones();
  optimizarImagenes();
  manejarErroresImagen();
  detectarTemaAutomatico();
  agregarEfectoHoverLibros();
}, 100);
