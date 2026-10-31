/* Página de producto: se llena con producto.html?id=3 */

(function () {
    'use strict';

    var contenido = document.getElementById('contenido-producto');
    var noExiste = document.getElementById('producto-no-existe');

    var id = Number(new URLSearchParams(window.location.search).get('id')) || 3;
    var producto = Tienda.buscarProducto(id);

    if (!producto) {
        contenido.hidden = true;
        noExiste.hidden = false;
        document.title = 'Producto no encontrado | Front End Store';
        return;
    }

    document.title = producto.nombre + ' | Front End Store';

    var imagen = document.getElementById('p-imagen');
    imagen.src = producto.imagen;
    imagen.alt = 'Camiseta ' + producto.nombre;

    document.getElementById('p-nombre').textContent = 'Camiseta ' + producto.nombre;
    document.getElementById('p-migas').textContent = producto.nombre;
    document.getElementById('p-precio').textContent = Tienda.moneda(producto.precio);
    document.getElementById('p-descripcion').textContent = Tienda.descripcion(producto);

    var formulario = document.getElementById('form-producto');
    var talla = document.getElementById('talla');
    var errorTalla = document.getElementById('error-talla');
    var cantidad = document.getElementById('cantidad');

    function validarTalla() {
        var valida = talla.value !== '';
        talla.setAttribute('aria-invalid', valida ? 'false' : 'true');
        errorTalla.hidden = valida;
        if (!valida) talla.focus();
        return valida;
    }

    function leerCantidad() {
        var n = Math.floor(Number(cantidad.value));
        if (!(n >= 1)) n = 1;
        return Math.min(n, Tienda.MAXIMO);
    }

    talla.addEventListener('change', function () {
        talla.setAttribute('aria-invalid', 'false');
        errorTalla.hidden = true;
    });

    cantidad.addEventListener('change', function () { cantidad.value = leerCantidad(); });

    formulario.addEventListener('click', function (e) {
        var paso = e.target.closest('[data-paso]');
        if (!paso) return;
        cantidad.value = Math.min(Math.max(leerCantidad() + Number(paso.getAttribute('data-paso')), 1), Tienda.MAXIMO);
    });

    formulario.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validarTalla()) return;
        Tienda.agregar(producto.id, talla.value, leerCantidad());
        document.querySelector('[data-abrir-carrito]').click();
    });

    document.getElementById('comprar-ahora').addEventListener('click', function () {
        if (!validarTalla()) return;
        Tienda.agregar(producto.id, talla.value, leerCantidad());
        window.location.href = 'carrito.html#envio';
    });

    /* Productos relacionados: primero los de la misma categoría */
    var otros = PRODUCTOS.filter(function (p) { return p.id !== producto.id; });
    var mismos = otros.filter(function (p) { return p.categoria === producto.categoria; });
    var resto = otros.filter(function (p) { return p.categoria !== producto.categoria; });
    document.getElementById('relacionados').innerHTML = mismos.concat(resto).slice(0, 4).map(Tienda.tarjeta).join('');
})();
