// =====================================================================
// Estado de la app
// =====================================================================
let carrito = [];              // { localeId, localeNombre, itemId, itemNombre, precio, cantidad }
let categoriaActiva = "Todos";
let textoBusqueda = "";
let localAbierto = null;
let ubicacionCliente = null;   // { lat, lng } — se llena cuando el cliente comparte su ubicación

// =====================================================================
// Inicio
// =====================================================================
document.getElementById("brandName").textContent = CONFIG.nombreNegocio;
document.title = CONFIG.nombreNegocio + " — Pide por WhatsApp";

renderChips();
renderCatalogo();

document.getElementById("buscador").addEventListener("input", (e) => {
  textoBusqueda = e.target.value.toLowerCase().trim();
  renderCatalogo();
});

document.getElementById("cerrarOverlay").addEventListener("click", cerrarOverlay);
document.getElementById("overlayMenu").addEventListener("click", (e) => {
  if (e.target.id === "overlayMenu") cerrarOverlay();
});

document.getElementById("ticketTab").addEventListener("click", abrirCarrito);
document.getElementById("cerrarCarrito").addEventListener("click", cerrarCarrito);
document.getElementById("cartScrim").addEventListener("click", cerrarCarrito);

document.getElementById("cartForm").addEventListener("submit", enviarPedido);
document.getElementById("btnUbicacion").addEventListener("click", solicitarUbicacion);

// =====================================================================
// Categorías (chips)
// =====================================================================
function renderChips() {
  const categorias = ["Todos", ...new Set(LOCALES.map((l) => l.categoria))];
  const cont = document.getElementById("chips");
  cont.innerHTML = "";

  categorias.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === categoriaActiva ? " activo" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      categoriaActiva = cat;
      renderChips();
      renderCatalogo();
    });
    cont.appendChild(btn);
  });
}

// =====================================================================
// Catálogo de locales
// =====================================================================
function coincideBusqueda(local) {
  if (!textoBusqueda) return true;
  const enNombre = local.nombre.toLowerCase().includes(textoBusqueda);
  const enPlatos = local.menu.some((it) => it.nombre.toLowerCase().includes(textoBusqueda));
  return enNombre || enPlatos;
}

function renderCatalogo() {
  const cont = document.getElementById("catalogo");
  const vacio = document.getElementById("emptyState");
  cont.innerHTML = "";

  const visibles = LOCALES.filter((local) => {
    const pasaCategoria = categoriaActiva === "Todos" || local.categoria === categoriaActiva;
    return pasaCategoria && coincideBusqueda(local);
  });

  vacio.hidden = visibles.length > 0;

  visibles.forEach((local) => {
    const card = document.createElement("button");
    card.className = "local-card";

    const icono = local.imagen
      ? `<img src="${local.imagen}" alt="${local.nombre}">`
      : local.emoji;

    card.innerHTML = `
      <div class="icono">${icono}</div>
      <div class="nombre">${local.nombre}</div>
      <div class="categoria">${local.categoria}</div>
    `;
    card.addEventListener("click", () => abrirLocal(local.id));
    cont.appendChild(card);
  });
}

// =====================================================================
// Overlay: menú de un local
// =====================================================================
function abrirLocal(id) {
  const local = LOCALES.find((l) => l.id === id);
  if (!local) return;
  localAbierto = local;

  const icono = local.imagen
    ? `<img src="${local.imagen}" alt="${local.nombre}">`
    : local.emoji;

  document.getElementById("overlayHeader").innerHTML = `
    <div class="icono">${icono}</div>
    <div>
      <h2>${local.nombre}</h2>
      <div class="categoria">${local.categoria}</div>
    </div>
  `;

  renderItemsLocal();
  document.getElementById("overlayMenu").hidden = false;
}

function renderItemsLocal() {
  const cont = document.getElementById("overlayItems");
  cont.innerHTML = "";

  localAbierto.menu.forEach((item) => {
    const enCarrito = carrito.find((c) => c.localeId === localAbierto.id && c.itemId === item.id);
    const fila = document.createElement("div");
    fila.className = "item-menu";

    const descripcion = item.descripcion
      ? `<div class="descripcion">${item.descripcion}</div>`
      : "";

    const fotoPlato = item.imagen
      ? `<div class="foto-plato"><img src="${item.imagen}" alt="${item.nombre}"></div>`
      : "";

    fila.innerHTML = `
      ${fotoPlato}
      <div class="info">
        <div class="nombre">${item.nombre}</div>
        ${descripcion}
        <div class="precio">$${item.precio.toFixed(2)}</div>
      </div>
      <div class="accion"></div>
    `;

    const accion = fila.querySelector(".accion");

    if (enCarrito) {
      accion.innerHTML = `
        <div class="stepper">
          <button data-accion="restar">–</button>
          <span>${enCarrito.cantidad}</span>
          <button data-accion="sumar">+</button>
        </div>
      `;
      accion.querySelector('[data-accion="restar"]').addEventListener("click", () => {
        cambiarCantidad(localAbierto.id, item.id, -1);
      });
      accion.querySelector('[data-accion="sumar"]').addEventListener("click", () => {
        cambiarCantidad(localAbierto.id, item.id, 1);
      });
    } else {
      const btn = document.createElement("button");
      btn.className = "btn-agregar";
      btn.textContent = "Agregar";
      btn.addEventListener("click", () => agregarAlCarrito(localAbierto, item));
      accion.appendChild(btn);
    }

    cont.appendChild(fila);
  });
}

function cerrarOverlay() {
  document.getElementById("overlayMenu").hidden = true;
  localAbierto = null;
}

// =====================================================================
// Ubicación del cliente y cálculo de envío por distancia
// =====================================================================
function solicitarUbicacion() {
  const estado = document.getElementById("ubicacionEstado");

  if (!navigator.geolocation) {
    estado.textContent = "Tu navegador no permite compartir ubicación. Escribe tu dirección abajo y coordinamos el envío por WhatsApp.";
    return;
  }

  estado.textContent = "Obteniendo tu ubicación...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      ubicacionCliente = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      estado.textContent = "Ubicación capturada ✅ El envío se calculó según la distancia a cada local.";
      renderCarrito();
    },
    () => {
      estado.textContent = "No pudimos obtener tu ubicación. Escribe tu dirección abajo y coordinamos el envío por WhatsApp.";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Distancia en línea recta entre 2 puntos GPS (fórmula de Haversine), en km.
function calcularDistanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Devuelve { km, tarifa } si se puede calcular, o null si falta la ubicación
// del cliente, del local, o si el local no tiene tabla de tarifas, o si el
// cliente está más lejos que el último tramo (en esos casos, "a coordinar por WhatsApp").
function calcularEnvioLocal(local) {
  if (!ubicacionCliente || !local || !local.ubicacion || !local.tarifasEnvio || local.tarifasEnvio.length === 0) {
    return null;
  }
  const km = calcularDistanciaKm(
    ubicacionCliente.lat,
    ubicacionCliente.lng,
    local.ubicacion.lat,
    local.ubicacion.lng
  );
  const tramo = local.tarifasEnvio.find((t) => km <= t.hastaKm);
  if (!tramo) return null;
  return { km, tarifa: tramo.precio };
}

// Agrupa el carrito por local y calcula subtotales, envío y total final.
function obtenerResumenCarrito() {
  const porLocal = {};

  carrito.forEach((l) => {
    if (!porLocal[l.localeNombre]) {
      porLocal[l.localeNombre] = { localeId: l.localeId, lineas: [], subtotal: 0 };
    }
    porLocal[l.localeNombre].lineas.push(l);
    porLocal[l.localeNombre].subtotal += l.precio * l.cantidad;
  });

  let subtotalPlatos = 0;
  let totalEnvioCalculado = 0;
  let hayEnvioPendiente = false;

  Object.values(porLocal).forEach((grupo) => {
    subtotalPlatos += grupo.subtotal;
    const local = LOCALES.find((loc) => loc.id === grupo.localeId);
    grupo.envio = calcularEnvioLocal(local);
    if (grupo.envio) {
      totalEnvioCalculado += grupo.envio.tarifa;
    } else {
      hayEnvioPendiente = true;
    }
  });

  return {
    porLocal,
    subtotalPlatos,
    totalEnvioCalculado,
    hayEnvioPendiente,
    totalFinal: subtotalPlatos + totalEnvioCalculado,
  };
}

// =====================================================================
// Carrito
// =====================================================================
function agregarAlCarrito(local, item) {
  carrito.push({
    localeId: local.id,
    localeNombre: local.nombre,
    itemId: item.id,
    itemNombre: item.nombre,
    precio: item.precio,
    cantidad: 1,
  });
  renderItemsLocal();
  actualizarTicketTab();
}

function cambiarCantidad(localeId, itemId, delta) {
  const linea = carrito.find((c) => c.localeId === localeId && c.itemId === itemId);
  if (!linea) return;
  linea.cantidad += delta;
  if (linea.cantidad <= 0) {
    carrito = carrito.filter((c) => !(c.localeId === localeId && c.itemId === itemId));
  }
  if (localAbierto && localAbierto.id === localeId) renderItemsLocal();
  actualizarTicketTab();
  if (!document.getElementById("cartDrawer").hidden) renderCarrito();
}

function calcularTotal() {
  return carrito.reduce((suma, l) => suma + l.precio * l.cantidad, 0);
}

function actualizarTicketTab() {
  const tab = document.getElementById("ticketTab");
  const totalItems = carrito.reduce((n, l) => n + l.cantidad, 0);

  if (totalItems === 0) {
    tab.hidden = true;
    return;
  }
  tab.hidden = false;
  document.getElementById("ticketResumen").textContent =
    `${totalItems} item${totalItems === 1 ? "" : "s"} · $${calcularTotal().toFixed(2)}`;
}

function abrirCarrito() {
  renderCarrito();
  document.getElementById("cartScrim").hidden = false;
  document.getElementById("cartDrawer").hidden = false;
}

function cerrarCarrito() {
  document.getElementById("cartScrim").hidden = true;
  document.getElementById("cartDrawer").hidden = true;
}

function renderCarrito() {
  const cont = document.getElementById("cartLista");
  cont.innerHTML = "";

  if (carrito.length === 0) {
    cont.innerHTML = `<p class="carrito-vacio">Tu pedido está vacío. Cierra esta ventana y agrega algo rico 🍽️</p>`;
    document.getElementById("cartTotales").innerHTML = "";
    return;
  }

  const resumen = obtenerResumenCarrito();

  Object.entries(resumen.porLocal).forEach(([nombreLocal, grupo]) => {
    const titulo = document.createElement("div");
    titulo.className = "cart-grupo-local";
    titulo.textContent = nombreLocal;
    cont.appendChild(titulo);

    grupo.lineas.forEach((l) => {
      const fila = document.createElement("div");
      fila.className = "cart-item";
      fila.innerHTML = `
        <span><span class="cant">${l.cantidad}x</span> ${l.itemNombre}</span>
        <span>$${(l.precio * l.cantidad).toFixed(2)}</span>
      `;
      cont.appendChild(fila);
    });

    const filaEnvio = document.createElement("div");
    filaEnvio.className = "cart-item";
    filaEnvio.innerHTML = grupo.envio
      ? `<span>Envío (${grupo.envio.km.toFixed(1)} km)</span><span>$${grupo.envio.tarifa.toFixed(2)}</span>`
      : `<span>Envío</span><span>a coordinar</span>`;
    cont.appendChild(filaEnvio);
  });

  let filasHtml = `<div class="fila"><span>Subtotal platos</span><span>$${resumen.subtotalPlatos.toFixed(2)}</span></div>`;

  if (resumen.totalEnvioCalculado > 0) {
    filasHtml += `<div class="fila"><span>Envío calculado</span><span>$${resumen.totalEnvioCalculado.toFixed(2)}</span></div>`;
  }
  if (resumen.hayEnvioPendiente) {
    filasHtml += `<div class="fila envio-pendiente"><span>Envío pendiente</span><span>a coordinar por WhatsApp</span></div>`;
  }
  filasHtml += `<div class="fila total-final"><span>Total</span><span>$${resumen.totalFinal.toFixed(2)}</span></div>`;

  document.getElementById("cartTotales").innerHTML = filasHtml;
}

// =====================================================================
// Enviar pedido por WhatsApp
// =====================================================================
function enviarPedido(e) {
  e.preventDefault();
  if (carrito.length === 0) return;

  const nombre = document.getElementById("datoNombre").value.trim();
  const direccion = document.getElementById("datoDireccion").value.trim();
  const telefono = document.getElementById("datoTelefono").value.trim();

  const resumen = obtenerResumenCarrito();

  let mensaje = `🧾 *Nuevo pedido - ${CONFIG.nombreNegocio}*\n\n`;

  Object.entries(resumen.porLocal).forEach(([nombreLocal, grupo]) => {
    mensaje += `📍 *Local: ${nombreLocal}*\n`;
    grupo.lineas.forEach((l) => {
      const importe = l.precio * l.cantidad;
      mensaje += `• ${l.cantidad}x ${l.itemNombre} - $${importe.toFixed(2)}\n`;
    });
    mensaje += `Subtotal platos: $${grupo.subtotal.toFixed(2)}\n`;
    mensaje += grupo.envio
      ? `Envío (${grupo.envio.km.toFixed(1)} km): $${grupo.envio.tarifa.toFixed(2)}\n\n`
      : `Envío: a coordinar\n\n`;
  });

  mensaje += `💰 *Total: $${resumen.totalFinal.toFixed(2)}${resumen.hayEnvioPendiente ? " + envío a coordinar" : ""}*\n\n`;

  mensaje += `👤 Cliente: ${nombre}\n`;
  mensaje += `📍 Dirección: ${direccion}\n`;
  if (telefono) mensaje += `📱 Teléfono: ${telefono}\n`;
  if (ubicacionCliente) {
    mensaje += `🗺️ Ubicación exacta: https://www.google.com/maps?q=${ubicacionCliente.lat},${ubicacionCliente.lng}\n`;
  }

  const url = `https://wa.me/${CONFIG.numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}
