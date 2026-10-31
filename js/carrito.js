/* Carrito de compras (se guarda en localStorage del navegador).
   Se carga en todas las páginas después de productos.js. */

(function () {
    'use strict';

    var CLAVE = 'frontend-store-carrito';
    var TALLA_BASE = 'Mediana';
    var MAXIMO = 99;
    var formato = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    var escuchas = [];
    var lineas = cargar();

    /* --- Datos ---------------------------------------------------------- */

    function buscarProducto(id) {
        id = Number(id);
        for (var i = 0; i < PRODUCTOS.length; i++) {
            if (PRODUCTOS[i].id === id) return PRODUCTOS[i];
        }
        return null;
    }

    function cargar() {
        try {
            var datos = JSON.parse(localStorage.getItem(CLAVE));
            if (!Array.isArray(datos)) return [];
            return datos.filter(function (l) {
                return buscarProducto(l.id) && TALLAS.indexOf(l.talla) > -1 && l.cantidad > 0;
            });
        } catch (e) {
            return [];
        }
    }

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(lineas)); } catch (e) { /* sin almacenamiento: queda en memoria */ }
        avisar();
    }

    function avisar() {
        conservarFoco(function () {
            escuchas.forEach(function (f) { f(); });
        });
    }

    function indice(id, talla) {
        id = Number(id);
        for (var i = 0; i < lineas.length; i++) {
            if (lineas[i].id === id && lineas[i].talla === talla) return i;
        }
        return -1;
    }

    function limitar(n) {
        n = Math.floor(Number(n));
        if (!(n >= 1)) return 1;
        return Math.min(n, MAXIMO);
    }

    function agregar(id, talla, cantidad) {
        id = Number(id);
        if (!buscarProducto(id) || TALLAS.indexOf(talla) < 0) return;
        var i = indice(id, talla);
        if (i > -1) {
            lineas[i].cantidad = limitar(lineas[i].cantidad + limitar(cantidad));
        } else {
            lineas.push({ id: id, talla: talla, cantidad: limitar(cantidad) });
        }
        guardar();
    }

    function fijarCantidad(id, talla, cantidad) {
        var i = indice(id, talla);
        if (i < 0) return;
        lineas[i].cantidad = limitar(cantidad);
        guardar();
    }

    function cambiarTalla(id, talla, nueva) {
        var i = indice(id, talla);
        if (i < 0 || talla === nueva || TALLAS.indexOf(nueva) < 0) return;
        var j = indice(id, nueva);
        if (j > -1) {
            lineas[j].cantidad = limitar(lineas[j].cantidad + lineas[i].cantidad);
            lineas.splice(i, 1);
        } else {
            lineas[i].talla = nueva;
        }
        guardar();
    }

    function quitar(id, talla) {
        var i = indice(id, talla);
        if (i > -1) lineas.splice(i, 1);
        guardar();
    }

    function vaciar() {
        lineas = [];
        guardar();
    }

    function detalle() {
        return lineas.map(function (l) {
            return { producto: buscarProducto(l.id), talla: l.talla, cantidad: l.cantidad };
        });
    }

    function unidades() {
        return lineas.reduce(function (t, l) { return t + l.cantidad; }, 0);
    }

    function subtotal() {
        return detalle().reduce(function (t, l) { return t + l.producto.precio * l.cantidad; }, 0);
    }

    /* --- Utilidades de interfaz ---------------------------------------- */

    function moneda(n) { return formato.format(n); }

    function esc(texto) {
        return String(texto).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function descripcion(p) {
        return p.descripcion || 'Camiseta con el logo de ' + p.nombre + ', de la colección de Front End Store para desarrolladores.';
    }

    /* Mantiene el foco en el mismo control cuando se vuelve a pintar el carrito. */
    function conservarFoco(pintar) {
        var activo = document.activeElement;
        var clave = activo && activo.getAttribute ? activo.getAttribute('data-foco') : null;
        pintar();
        if (clave) {
            var nuevo = document.querySelector('[data-foco="' + clave + '"]');
            if (nuevo && !nuevo.disabled) nuevo.focus();
        }
    }

    function tarjeta(p) {
        return '<article class="producto">' +
            '<a class="producto__enlace" href="producto.html?id=' + p.id + '">' +
                '<img class="producto__imagen" src="' + esc(p.imagen) + '" alt="Camiseta ' + esc(p.nombre) + '" loading="lazy">' +
                '<div class="producto__informacion">' +
                    '<p class="producto__nombre">' + esc(p.nombre) + '</p>' +
                    '<p class="producto__precio">' + moneda(p.precio) + '</p>' +
                '</div>' +
            '</a>' +
            '<div class="producto__accion">' +
                '<button class="boton boton--principal boton--chico boton--ancho" type="button" data-agregar="' + p.id + '">Agregar al carrito</button>' +
            '</div>' +
        '</article>';
    }

    function controlCantidad(l) {
        var id = l.producto.id;
        var datos = ' data-id="' + id + '" data-talla="' + esc(l.talla) + '"';
        var clave = id + '-' + esc(l.talla);
        return '<div class="cantidad cantidad--chica">' +
            '<button type="button" data-menos' + datos + ' data-foco="menos-' + clave + '" aria-label="Quitar una unidad de ' + esc(l.producto.nombre) + '"' + (l.cantidad <= 1 ? ' disabled' : '') + '>&minus;</button>' +
            '<output aria-label="Cantidad">' + l.cantidad + '</output>' +
            '<button type="button" data-mas' + datos + ' data-foco="mas-' + clave + '" aria-label="Agregar una unidad de ' + esc(l.producto.nombre) + '"' + (l.cantidad >= MAXIMO ? ' disabled' : '') + '>+</button>' +
        '</div>';
    }

    function botonQuitar(l) {
        return '<button class="enlace-boton" type="button" data-quitar data-id="' + l.producto.id + '" data-talla="' + esc(l.talla) + '" data-foco="quitar-' + l.producto.id + '-' + esc(l.talla) + '">Quitar</button>';
    }

    /* --- Carrito lateral ------------------------------------------------ */

    var velo, panel, lista, pie, cerrarBtn, ultimoFoco;
    var enPaginaCarrito = document.body.getAttribute('data-pagina') === 'carrito';

    function crearPanel() {
        velo = document.createElement('div');
        velo.className = 'velo';
        velo.hidden = true;

        panel = document.createElement('aside');
        panel.className = 'mini';
        panel.id = 'mini-carrito';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'mini-titulo');
        panel.innerHTML =
            '<div class="mini__cabecera">' +
                '<h2 id="mini-titulo">Tu carrito</h2>' +
                '<button class="mini__cerrar" type="button" data-cerrar-carrito aria-label="Cerrar carrito">&times;</button>' +
            '</div>' +
            '<div class="mini__lista"></div>' +
            '<div class="mini__pie"></div>';

        document.body.appendChild(velo);
        document.body.appendChild(panel);
        lista = panel.querySelector('.mini__lista');
        pie = panel.querySelector('.mini__pie');
        cerrarBtn = panel.querySelector('.mini__cerrar');
    }

    function pintarPanel() {
        var items = detalle();
        if (!items.length) {
            lista.innerHTML = '<p class="mini__vacio">Todavía no agregaste productos.</p>';
            pie.innerHTML = '<a class="boton boton--principal boton--ancho" href="index.html">Ver productos</a>';
            return;
        }
        lista.innerHTML = '<ul>' + items.map(function (l) {
            var p = l.producto;
            return '<li class="mini__item">' +
                '<a href="producto.html?id=' + p.id + '"><img src="' + esc(p.imagen) + '" alt=""></a>' +
                '<div>' +
                    '<a class="mini__nombre" href="producto.html?id=' + p.id + '">' + esc(p.nombre) + '</a>' +
                    '<span class="mini__meta">Talla ' + esc(l.talla) + '</span>' +
                    controlCantidad(l) +
                '</div>' +
                '<div class="mini__precio">' + moneda(p.precio * l.cantidad) + botonQuitar(l) + '</div>' +
            '</li>';
        }).join('') + '</ul>';
        pie.innerHTML =
            '<div class="mini__subtotal"><span>Subtotal (' + unidades() + (unidades() === 1 ? ' producto' : ' productos') + ')</span><span>' + moneda(subtotal()) + '</span></div>' +
            '<p class="mini__envio">Envío gratis.</p>' +
            '<a class="boton boton--principal boton--ancho" href="carrito.html#envio">Finalizar compra</a>' +
            '<a class="boton boton--oscuro boton--ancho" href="carrito.html">Ver carrito</a>';
    }

    function abrir() {
        if (enPaginaCarrito) {
            window.scrollTo(0, 0);
            return;
        }
        ultimoFoco = document.activeElement;
        velo.hidden = false;
        panel.hidden = false;
        document.body.classList.add('sin-scroll');
        cerrarBtn.focus();
    }

    function cerrar() {
        if (panel.hidden) return;
        velo.hidden = true;
        panel.hidden = true;
        document.body.classList.remove('sin-scroll');
        if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
    }

    function atraparTab(e) {
        var foco = panel.querySelectorAll('a[href], button:not(:disabled)');
        if (!foco.length) return;
        var primero = foco[0];
        var ultimo = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
            e.preventDefault();
            ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
            e.preventDefault();
            primero.focus();
        }
    }

    /* --- Contador del encabezado --------------------------------------- */

    function pintarContador() {
        var n = unidades();
        var cuentas = document.querySelectorAll('[data-cuenta]');
        for (var i = 0; i < cuentas.length; i++) {
            cuentas[i].textContent = n;
            cuentas[i].setAttribute('data-vacio', n === 0 ? 'true' : 'false');
        }
        var botones = document.querySelectorAll('[data-abrir-carrito]');
        for (var j = 0; j < botones.length; j++) {
            botones[j].setAttribute('aria-label', 'Carrito, ' + n + (n === 1 ? ' producto' : ' productos'));
        }
    }

    /* --- Eventos globales ---------------------------------------------- */

    document.addEventListener('click', function (e) {
        var t = e.target.closest('[data-agregar],[data-menos],[data-mas],[data-quitar],[data-abrir-carrito],[data-cerrar-carrito]');
        if (!t) return;

        if (t.hasAttribute('data-abrir-carrito')) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
            e.preventDefault();
            abrir();
        } else if (t.hasAttribute('data-cerrar-carrito')) {
            cerrar();
        } else if (t.hasAttribute('data-agregar')) {
            agregar(t.getAttribute('data-agregar'), TALLA_BASE, 1);
            abrir();
        } else {
            var id = t.getAttribute('data-id');
            var talla = t.getAttribute('data-talla');
            var i = indice(id, talla);
            if (i < 0) return;
            if (t.hasAttribute('data-menos')) fijarCantidad(id, talla, lineas[i].cantidad - 1);
            if (t.hasAttribute('data-mas')) fijarCantidad(id, talla, lineas[i].cantidad + 1);
            if (t.hasAttribute('data-quitar')) quitar(id, talla);
        }
    });

    document.addEventListener('change', function (e) {
        var t = e.target;
        if (t.matches && t.matches('select[data-talla-linea]')) {
            cambiarTalla(t.getAttribute('data-id'), t.getAttribute('data-talla'), t.value);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (!panel || panel.hidden) return;
        if (e.key === 'Escape') cerrar();
        if (e.key === 'Tab') atraparTab(e);
    });

    window.addEventListener('storage', function (e) {
        if (e.key === CLAVE) {
            lineas = cargar();
            avisar();
        }
    });

    /* Si una imagen no carga (ruta o nombre incorrecto), se muestra un respaldo
       y se avisa en la consola con la ruta exacta que el navegador buscó. */
    var PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#e9ebef"/>' +
        '<text x="200" y="210" font-family="Arial" font-size="22" fill="#8a90a0" text-anchor="middle">Imagen no disponible</text></svg>');

    function respaldo(img) {
        if (!img || img.tagName !== 'IMG' || img.getAttribute('data-roto')) return;
        img.setAttribute('data-roto', 'true');
        console.warn('No se encontró la imagen:', img.src);
        if (img.classList.contains('cabecera__logo')) {
            var texto = document.createElement('span');
            texto.className = 'cabecera__logo-texto';
            texto.textContent = 'Front End Store';
            img.parentNode.replaceChild(texto, img);
        } else {
            img.src = PLACEHOLDER;
        }
    }

    document.addEventListener('error', function (e) { respaldo(e.target); }, true);

    /* Imágenes que ya fallaron antes de que este script se cargara */
    window.addEventListener('load', function () {
        var todas = document.images;
        for (var i = 0; i < todas.length; i++) {
            if (todas[i].complete && todas[i].naturalWidth === 0 && todas[i].getAttribute('src').indexOf('data:') !== 0) respaldo(todas[i]);
        }
    });

    /* --- Arranque ------------------------------------------------------- */

    crearPanel();
    velo.addEventListener('click', cerrar);
    escuchas.push(pintarContador, pintarPanel);
    pintarContador();
    pintarPanel();

    /* API para los scripts de cada página */
    window.Tienda = {
        TALLA_BASE: TALLA_BASE,
        MAXIMO: MAXIMO,
        buscarProducto: buscarProducto,
        agregar: agregar,
        vaciar: vaciar,
        detalle: detalle,
        unidades: unidades,
        subtotal: subtotal,
        moneda: moneda,
        esc: esc,
        descripcion: descripcion,
        tarjeta: tarjeta,
        controlCantidad: controlCantidad,
        botonQuitar: botonQuitar,
        alCambiar: function (f) { escuchas.push(f); }
    };
})();
