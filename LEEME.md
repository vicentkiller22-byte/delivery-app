# Tu app de delivery — Guía rápida

## 1. Configura tu negocio
Abre el archivo `data.js` y cambia estas 2 líneas al principio:

```js
nombreNegocio: "Tu Delivery",        // <-- el nombre de tu negocio
numeroWhatsapp: "593987654321",      // <-- TU número, con código de país, sin + y sin espacios
```

## 2. Pruébala en tu computadora
Solo haz doble clic en `index.html` y se abre en tu navegador. Así puedes revisar
que todo se vea bien antes de publicarla.

## 3. Publícala gratis (sin programar)
La forma más simple es **Netlify Drop**:

1. Entra a https://app.netlify.com/drop
2. Arrastra la carpeta `delivery-app` completa a esa página
3. En segundos te da un link público (algo como `https://tu-negocio.netlify.app`)
4. Ese es el link que compartes en tu estado de WhatsApp, en tu WhatsApp Business,
   en redes sociales, etc. Se abre como una app, sin que nadie tenga que instalar nada.

Si más adelante quieres un dominio propio (tudelivery.com), Netlify también te deja
conectarlo.

## 4. Cómo agregar más locales
Abre `data.js` y copia un bloque completo como este (desde `{` hasta `},`):

```js
{
  id: "nombre-unico-sin-espacios",
  nombre: "Nombre del local",
  categoria: "Categoría (ej: Pizza, Pollo, Postres)",
  emoji: "🍔",
  imagen: "",   // opcional: pega aquí el link de una foto
  menu: [
    { id: "a1", nombre: "Plato 1", precio: 5.00, descripcion: "" },
    { id: "a2", nombre: "Plato 2", precio: 6.50, descripcion: "" },
  ],
},
```

Pégalo dentro de la lista `LOCALES`, cambia los datos, y listo: ya aparece en la app.

**Tip:** si no quieres editar el archivo tú mismo, simplemente mándame la info de
cada local (nombre, categoría, platillos con precio) en el chat y yo te armo el
bloque de código listo para pegar — o directamente te actualizo el archivo.

## 5. Cómo funciona el pedido
El cliente arma su pedido (puede pedir de varios locales a la vez), llena su nombre
y dirección, y al tocar "Enviar pedido por WhatsApp" se abre WhatsApp con un mensaje
ya redactado, listo para enviarte a ti. Tú lo recibes organizado por local y decides
cómo coordinas con cada restaurante y el repartidor.

## 6. Envío calculado por distancia (nuevo)

Cuando el cliente arma su pedido, puede tocar **"📍 Usar mi ubicación"** dentro del
carrito. Si acepta compartir su ubicación, la app calcula el envío automáticamente
para cada local, **usando la tabla de tarifas propia de ese local** (cada local
puede tener su propia tabla, con sus propios precios).

Ejemplo de cómo se ve en `data.js`:

```js
ubicacion: { lat: -2.170998, lng: -79.922359 },
tarifasEnvio: [
  { hastaKm: 1, precio: 1.25 },
  { hastaKm: 2, precio: 2.25 },
  { hastaKm: 3, precio: 3.25 },
],
```

Esto se lee así: si el cliente está a 1 km o menos del local, paga $1.25 de envío;
si está a 2 km o menos, paga $2.25; si está a 3 km o menos, paga $3.25. Puedes
agregar tantos tramos como quieras, siempre en orden de menor a mayor distancia.

**Importante:**
- Esto solo funciona para los locales que tengan **ambos** campos: `ubicacion` y `tarifasEnvio`.
- Si un local no los tiene, o si el cliente está más lejos que el último tramo de la tabla,
  o si el cliente no comparte su ubicación, el pedido se manda igual, pero el envío
  queda como **"a coordinar por WhatsApp"** — exactamente como hasta ahora.

**Cómo conseguir las coordenadas de un local:**
1. Abre Google Maps y busca el local (o ubícalo a mano si no aparece).
2. Haz clic derecho justo sobre el punto exacto del local.
3. Aparece un menú con los números de las coordenadas (ej: `-2.170998, -79.922359`) — haz clic para copiarlos.
4. Mándamelos junto con la tabla de tarifas de ese local, y yo los agrego a `data.js`.

La distancia se calcula en línea recta (no la ruta real que maneja el repartidor),
así que ten ese margen en cuenta al definir tus tramos.

**Cómo conseguir las coordenadas de un local:**
1. Abre Google Maps y busca el local (o ubícalo a mano si no aparece).
2. Haz clic derecho justo sobre el punto exacto del local.
3. Aparece un menú con los números de las coordenadas (ej: `-2.170998, -79.922359`) — haz clic para copiarlos.
4. Pégalos en `data.js` así:

```js
ubicacion: { lat: -2.170998, lng: -79.922359 },
```

La distancia se calcula en línea recta (no la ruta real que maneja el repartidor),
así que puedes subir un poco el `porKm` para cubrir ese margen si lo ves muy justo.


## 7. Logos de cada local

Cada local ya tiene su logo real en la carpeta `logos/` (por ejemplo `logos/big-papa.png`),
y en `data.js` el campo `imagen` de cada local apunta a su archivo correspondiente.
Se ve tanto en la tarjeta del catálogo como arriba del menú del local.

Para agregar o cambiar el logo de un local: guarda la imagen dentro de la carpeta
`logos/` (cualquier nombre está bien) y pon esa ruta en el campo `imagen` de ese
local en `data.js`, por ejemplo:

```js
imagen: "logos/mi-local.png",
```

**Nota:** el logo de "Alitas Extremas" quedó duplicado con el de "Alitas To Go"
(el Word que me pasaste no traía uno propio para ese local). Mándame el logo real
de Alitas Extremas cuando lo tengas y lo corrijo.
