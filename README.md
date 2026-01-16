# 📚 LibraryHub

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

<img src="/img/logo1.png" width="400" alt="Banner" />

**LibraryHub** es una librería online moderna y elegante donde podés explorar, filtrar y comprar libros.  Diseño responsive, tema oscuro/claro, carrito funcional con persistencia y gestión de stock en tiempo real. 

🌐 **[Ver Demo en Vivo](https://library-hub-phi.vercel.app/)**

---

## ✨ Características

### 📖 Catálogo de Libros
- Exploración con información detallada (precio, autor, género, stock)
- Diseño de cards moderno y profesional

### 🔍 Filtros Avanzados
- Búsqueda por título o autor en tiempo real
- Filtro por género y ordenamiento (precio, nombre, autor)

### 🛒 Carrito de Compras
- Control de cantidad con límite de stock
- Cálculo automático + envío gratis sobre $50.000
- Persistencia en LocalStorage

### 🎨 Tema Oscuro/Claro
- Switch de tema con persistencia de preferencia
- Transiciones suaves entre modos

### 📱 Diseño Responsive
- 100% adaptable a móviles, tablets y desktop
- Navbar colapsable y grid responsive

---

## 🚀 Tecnologías

| Tecnología | Uso |
|------------|-----|
| **JavaScript ES6+** | Lógica de la aplicación |
| **HTML5 + CSS3** | Estructura y estilos |
| **SCSS** | Preprocesador CSS |
| **Bootstrap 5.3** | Framework UI |
| **Toastify + SweetAlert2** | Notificaciones y modales |
| **LocalStorage** | Persistencia de datos |
| **Vercel** | Hosting |

### Stack Técnico
- **Vanilla JavaScript** con Async/Await y Fetch API
- **LocalStorage API** para persistencia de carrito y stock
- **Bootstrap 5** para diseño responsive
- **Debounce** para optimización de búsquedas

---

## 🛠️ Instalación Local

### Requisitos Previos
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Servidor local (opcional:  Live Server, Python, etc.)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/baez-nicolas/LibraryHub.git
cd LibraryHub
```

2. **Abrir con un servidor local**

Opción A - Live Server (VSCode):
```
Click derecho en index.html → Open with Live Server
```

Opción B - Simplemente abrir el archivo: 
```
Doble click en index.html
```

---

## 🎨 Características Técnicas

### Funcionalidades JavaScript
- **Carga asíncrona de datos:** `fetch()` + JSON
- **Filtrado en tiempo real:** Búsqueda con debounce
- **Gestión de estado:** Carrito y stock sincronizados
- **Persistencia:** LocalStorage API
- **DOM Manipulation:** Renderizado dinámico
- **Event Delegation:** Manejo eficiente de eventos

### Librerías Externas
- **Bootstrap:** Grid, navbar, modales, utilities
- **Toastify:** Notificaciones no intrusivas
- **SweetAlert2:** Modales elegantes y customizables

---

## 🎯 Funcionalidades Destacadas

### Sistema de Stock Inteligente
- Stock disminuye al agregar al carrito
- Se restaura al eliminar del carrito
- Persistente entre sesiones
- Validación en tiempo real

### Cálculo de Envío
- Envío gratis en compras > $50.000
- Costo de envío:  $2.500
- Cálculo automático en el modal del carrito

### Filtros Combinados
- Búsqueda por texto + género simultáneamente
- Ordenamiento independiente de filtros
- Reset de filtros con un click

---

## 👨‍💻 Autor

**Nicolás Baez**

- GitHub: [@baez-nicolas](https://github.com/baez-nicolas)
- LinkedIn: [linkedin.com/in/baez-nicolas](https://www.linkedin.com/in/baez-nicolas/)
- Proyecto: [LibraryHub](https://github.com/baez-nicolas/LibraryHub)

---

<div align="center">

**[⬆ Volver arriba](#-libraryhub)**

Hecho con ❤️ y 📚 para los amantes de la lectura

</div>
