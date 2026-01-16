// Variables globales
let libros = [];
let librosFiltrados = [];
let carrito = [];
let stockOriginal = {};

// Constantes de la bilbioteca
const LIMITE_ENVIO_GRATIS = 50000;
const COSTO_ENVIO = 2500;

// Función para debounce (la copié de internet)
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

// Formatear precio en pesos argentinos
function formatearPrecio(precio) {
  return precio.toLocaleString("es-AR");
}

// Mostrar notificaciones con Toastify
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

// Cargar datos de libros desde JSON
async function cargarLibros() {
  try {
    const response = await fetch("./data/libros.json");
    if (!response.ok) {
      throw new Error("Error al cargar los libros");
    }
    const data = await response.json();

    // Convertir IDs a string por las dudas
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

// Cargar stock desde localStorage
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
      // Si hay error parseando, usar stock original
    }
  }
}

// Guardar stock en localStorage
function guardarStock() {
  stockOriginal = {};
  for (const libro of libros) {
    stockOriginal[libro.id] = libro.stock;
  }
  localStorage.setItem("stock_biblioteca", JSON.stringify(stockOriginal));
}

// Cargar carrito desde localStorage
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

// Guardar carrito en localStorage
function guardarCarrito() {
  localStorage.setItem("carrito_baez", JSON.stringify(carrito));
  actualizarBadgeCarrito();
}

// Actualizar el badge del carrito
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

// Obtener cantidad de un libro en el carrito
function obtenerCantidadCarrito(libroId) {
  const item = carrito.find(item => item.id === libroId);
  return item ? item.cantidad : 0;
}

// Agregar libro al carrito
function agregarAlCarrito(libroId) {
  const libro = libros.find(l => l.id === libroId);
  if (!libro) return;

  const existente = carrito.find(item => item.id === libroId);
  const cantidadActual = existente ? existente.cantidad : 0;
  const nuevaCantidad = cantidadActual + 1;

  // Verificar stock
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

// Quitar producto del carrito
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

// Cambiar cantidad de un producto
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

// Vaciar todo el carrito
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

// Renderizar la grilla de libros
function renderLibros() {
  const grid = document.querySelector("#grid");

  const html = librosFiltrados.map(libro => {
    const enCarrito = obtenerCantidadCarrito(libro.id);
    const stockDisponible = libro.stock - enCarrito;
    const tieneStock = stockDisponible > 0;

    return `
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card h-100 shadow-sm">
          <img src="${libro.portada}" class="card-img-top img-crop" alt="${libro.titulo}">
          <div class="card-body d-flex flex-column">
            <h3 class="h6 mb-0" style="min-height:2.6rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${libro.titulo}
            </h3>
            <p class="text-muted small mb-2" style="min-height:2.2rem;margin-top:-0.4rem;display:-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;display:-webkit-box;">
              ${libro.autor} • ${libro.genero} • ${libro.anio}
            </p>
            <div class="d-flex justify-content-between align-items-center" style="min-height:1.8rem;">
              <strong>$${formatearPrecio(libro.precio)}</strong>
              <small class="text-muted">${tieneStock ? `Stock: ${stockDisponible}` : "Sin stock"}</small>
            </div>
            <button class="btn btn-primary btn-sm mt-auto" onclick="agregarAlCarrito('${libro.id}')" ${!tieneStock ? 'disabled' : ''}>
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  if (grid) grid.innerHTML = html;
  const count = document.querySelector("#resultCount");
  if (count) count.textContent = `Mostrando ${librosFiltrados.length} resultados`;

  // Mostrar/ocultar mensaje de sin resultados
  const vacio = document.querySelector("#empty");
  if (vacio) vacio.classList.toggle("d-none", librosFiltrados.length > 0);
}

// Renderizar carrito lateral
function renderCarrito() {
  const contenedor = document.querySelector("#cartItems");
  if (!contenedor) return;

  if (carrito.length === 0) {
    contenedor.innerHTML = `<p class="text-center text-muted my-4">El carrito está vacío</p>`;
  } else {
    const html = carrito.map(item => {
      const total = item.precio * item.cantidad;
      return `
        <div class="cart__row">
          <img src="${item.portada}" alt="" class="cart__thumb">
          <div class="flex-grow-1">
            <div class="fw-semibold">${item.titulo}</div>
            <div class="text-muted small">$${formatearPrecio(item.precio)} c/u</div>
            <div class="d-flex align-items-center gap-2 mt-1">
              <label class="small text-muted">Cantidad:</label>
              <input type="number" min="1" max="${item.stockMax}" value="${item.cantidad}"
                class="form-control form-control-sm w-auto"
                onchange="cambiarCantidad('${item.id}', this.value)">
            </div>
          </div>
          <div class="text-end">
            <div class="fw-bold">$${formatearPrecio(total)}</div>
            <button class="btn btn-sm btn-outline-danger mt-1" onclick="quitarDelCarrito('${item.id}')">
              ✕
            </button>
          </div>
        </div>`;
    }).join('');
    contenedor.innerHTML = html;
  }

  actualizarTotales();
}

// Actualizar totales del carrito
function actualizarTotales() {
  let subtotal = 0;
  for (const item of carrito) {
    subtotal += (item.precio * item.cantidad);
  }
  const envio = subtotal > LIMITE_ENVIO_GRATIS ? 0 : COSTO_ENVIO;
  const total = subtotal + envio;

  // Actualizar elementos del DOM
  const elementos = {
    subtotal: document.querySelector("#cSubtotal"),
    envio: document.querySelector("#cEnvio"),
    total: document.querySelector("#cTotal")
  };

  if (elementos.subtotal) elementos.subtotal.textContent = formatearPrecio(subtotal);
  if (elementos.envio) elementos.envio.textContent = formatearPrecio(envio);
  if (elementos.total) elementos.total.textContent = formatearPrecio(total);
}

// Llenar select de géneros
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

// Aplicar filtros de búsqueda
function aplicarFiltros() {
  const busqueda = document.querySelector("#q").value.toLowerCase().trim();
  const generoSeleccionado = document.querySelector("#genre").value;
  const ordenamiento = document.querySelector("#sort").value;

  // Filtrar libros
  librosFiltrados = libros.filter(libro => {
    const coincideBusqueda = !busqueda ||
      libro.titulo.toLowerCase().includes(busqueda) ||
      libro.autor.toLowerCase().includes(busqueda);

    const coincideGenero = !generoSeleccionado || libro.genero === generoSeleccionado;

    return coincideBusqueda && coincideGenero;
  });

  // Ordenar resultados
  if (ordenamiento === "precio-asc") {
    librosFiltrados.sort((a, b) => a.precio - b.precio);
  } else if (ordenamiento === "precio-desc") {
    librosFiltrados.sort((a, b) => b.precio - a.precio);
  } else if (ordenamiento === "titulo-az") {
    librosFiltrados.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  }

  renderLibros();
}

// Limpiar todos los filtros
function limpiarFiltros() {
  document.querySelector("#q").value = "";
  document.querySelector("#genre").value = "";
  document.querySelector("#sort").value = "todos";
  aplicarFiltros();
  mostrarToast("Filtros limpiados", "info");
}

// Abrir carrito lateral
function abrirCarrito() {
  const cart = document.querySelector("#cart");
  const backdrop = document.querySelector("#backdrop");

  if (cart) cart.classList.add("show");
  if (backdrop) backdrop.classList.add("show");

  renderCarrito();
}

// Cerrar carrito lateral
function cerrarCarrito() {
  const cart = document.querySelector("#cart");
  const backdrop = document.querySelector("#backdrop");

  if (cart) cart.classList.remove("show");
  if (backdrop) backdrop.classList.remove("show");
}

// Proceso de checkout
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

// Completar la compra
function completarCompra() {
  // Actualizar stock de libros
  for (const item of carrito) {
    const libro = libros.find(l => l.id === item.id);
    if (libro) {
      libro.stock = Math.max(0, libro.stock - item.cantidad);
    }
  }

  guardarStock();

  // Generar número de pedido
  const numeroPedido = Date.now().toString().slice(-6);

  // Vaciar carrito
  carrito = [];
  guardarCarrito();
  renderCarrito();
  renderLibros();
  cerrarCarrito();

  // Mostrar confirmación
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

// Cambiar tema claro/oscuro
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

// Configurar tema inicial
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

// Función para resetear filtros (expuesta globalmente para el navbar)
function resetearFiltros() {
  limpiarFiltros();
}

// Configurar eventos del DOM
function configurarEventos() {
  // Búsqueda con debounce
  const busquedaConDebounce = debounce(aplicarFiltros, 400);
  document.querySelector("#q").addEventListener("input", busquedaConDebounce);

  // Filtros
  document.querySelector("#genre").addEventListener("change", aplicarFiltros);
  document.querySelector("#sort").addEventListener("change", aplicarFiltros);
  document.querySelector("#btnClear").addEventListener("click", limpiarFiltros);

  // Carrito
  document.querySelector("#btnOpenCart").addEventListener("click", abrirCarrito);
  document.querySelector("#btnCloseCart").addEventListener("click", cerrarCarrito);
  document.querySelector("#backdrop").addEventListener("click", cerrarCarrito);
  document.querySelector("#btnClearCart").addEventListener("click", vaciarCarrito);
  document.querySelector("#btnCheckout").addEventListener("click", procesarCheckout);

  // Tema
  const btnTema = document.getElementById("btnToggleTheme");
  if (btnTema) {
    btnTema.addEventListener("click", cambiarTema);
  }

  // Cerrar carrito con Escape
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      cerrarCarrito();
    }
  });
}

// Exponer función globalmente para el onclick del navbar
window.resetearFiltros = resetearFiltros;

// Inicialización de la aplicación
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