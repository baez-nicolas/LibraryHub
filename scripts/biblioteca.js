let libros = [];
let librosFiltrados = [];
let carrito = [];
let stockOriginal = {};

const LIMITE_ENVIO_GRATIS = 50000;
const COSTO_ENVIO = 2500;

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

function mostrarToast(mensaje, tipo = "success") {
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
    style: {
      background: colores[tipo]
    }
  }).showToast();
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
  mostrarToast(`"${libro.titulo}" agregado al carrito`);
}

function quitarDelCarrito(libroId) {
  const item = carrito.find(i => i.id === libroId);
  if (!item) return;

  Swal.fire({
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
    Swal.fire('Carrito vacío', 'El carrito ya está vacío', 'info');
    return;
  }

  Swal.fire({
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
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card h-100">
          <img src="${libro.portada}" class="card-img-top img-crop" alt="${libro.titulo}">
          <div class="card-body d-flex flex-column">
            <h3 class="h6 mb-2 fw-bold" style="min-height:2.6rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${libro.titulo}
            </h3>
            <p class="text-muted small mb-3" style="min-height:2.2rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              <span class="d-block"><strong>📝 ${libro.autor}</strong></span>
              <span class="d-block">📚 ${libro.genero} • 📅 ${libro.anio}</span>
            </p>
            <div class="d-flex justify-content-between align-items-center mb-3" style="min-height:1.8rem;">
              <strong class="text-primary fs-5">$${formatearPrecio(libro.precio)}</strong>
              <small class="${tieneStock ? 'badge bg-success bg-opacity-10 text-success' : 'badge bg-danger bg-opacity-10 text-danger'}">
                ${tieneStock ? `✓ ${stockDisponible} disponible${stockDisponible > 1 ? 's' : ''}` : "Sin stock"}
              </small>
            </div>
            <button class="btn ${tieneStock ? 'btn-primary' : 'btn-secondary'} btn-sm mt-auto" 
                    onclick="agregarAlCarrito('${libro.id}')" ${!tieneStock ? 'disabled' : ''}>
              ${tieneStock ? '🛒 Agregar al carrito' : '❌ Sin stock'}
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
        <div class="empty-icon mb-3" style="font-size: 3rem;">🛒</div>
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
              🗑️
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
    elementos.envio.textContent = envio === 0 ? "GRATIS 🎉" : "$" + formatearPrecio(envio);
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

  renderLibros();
}

function limpiarFiltros() {
  document.querySelector("#q").value = "";
  document.querySelector("#genre").value = "";
  document.querySelector("#sort").value = "todos";
  aplicarFiltros();
  mostrarToast("Filtros limpiados", "info");
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

  mostrarToast("¡Compra realizada con éxito! 🎉");
}

function cambiarTema() {
  const body = document.body;
  const temaActual = body.getAttribute("data-theme") || "light";
  const nuevoTema = temaActual === "light" ? "dark" : "light";

  body.setAttribute("data-theme", nuevoTema);
  localStorage.setItem("tema_guardado", nuevoTema);

  const boton = document.getElementById("btnToggleTheme");
  if (boton) {
    boton.textContent = nuevoTema === "dark" ? "☀️" : "🌙";
  }
}

function configurarTemaInicial() {
  const temaGuardado = localStorage.getItem("tema_guardado");
  const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const tema = temaGuardado || (prefiereOscuro ? "dark" : "light");

  document.body.setAttribute("data-theme", tema);

  const boton = document.getElementById("btnToggleTheme");
  if (boton) {
    boton.textContent = tema === "dark" ? "☀️" : "🌙";
  }
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
    }
  });
}

window.resetearFiltros = resetearFiltros;

(async function inicializarApp() {
  try {
    configurarTemaInicial();
    cargarCarrito();
    await cargarLibros();
    llenarSelectGeneros();
    renderLibros();
    configurarEventos();
    renderCarrito();
  } catch (error) {
    Swal.fire({
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
