/* Página del carrito: líneas, resumen y formulario de envío. */

(function () {
    'use strict';

    var vacio = document.getElementById('carrito-vacio');
    var lleno = document.getElementById('carrito-lleno');
    var confirmacion = document.getElementById('confirmacion');
    var lineasEl = document.getElementById('lineas');
    var resumenUnidades = document.getElementById('resumen-unidades');
    var resumenSubtotal = document.getElementById('resumen-subtotal');
    var resumenTotal = document.getElementById('resumen-total');
    var formulario = document.getElementById('form-envio');
    var titulo = document.getElementById('titulo-carrito');
    var errorPedido = document.getElementById('error-pedido');

    var pedidoHecho = false;

    function opcionesTalla(actual) {
        return TALLAS.map(function (t) {
            return '<option' + (t === actual ? ' selected' : '') + '>' + t + '</option>';
        }).join('');
    }

    function pintar() {
        if (pedidoHecho) return;

        var items = Tienda.detalle();
        vacio.hidden = items.length > 0;
        lleno.hidden = items.length === 0;
        if (!items.length) return;

        lineasEl.innerHTML = items.map(function (l) {
            var p = l.producto;
            var talla = Tienda.esc(l.talla);
            return '<li class="linea">' +
                '<a href="producto.html?id=' + p.id + '"><img class="linea__imagen" src="' + Tienda.esc(p.imagen) + '" alt="Camiseta ' + Tienda.esc(p.nombre) + '"></a>' +
                '<div>' +
                    '<a class="linea__nombre" href="producto.html?id=' + p.id + '">Camiseta ' + Tienda.esc(p.nombre) + '</a>' +
                    '<div class="linea__controles">' +
                        '<label>Talla <select data-talla-linea data-id="' + p.id + '" data-talla="' + talla + '" data-foco="talla-' + p.id + '-' + talla + '">' + opcionesTalla(l.talla) + '</select></label>' +
                        Tienda.controlCantidad(l) +
                        Tienda.botonQuitar(l) +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<p class="linea__total">' + Tienda.moneda(p.precio * l.cantidad) + '</p>' +
                    (l.cantidad > 1 ? '<p class="linea__unidad">' + Tienda.moneda(p.precio) + ' c/u</p>' : '') +
                '</div>' +
            '</li>';
        }).join('');

        var n = Tienda.unidades();
        resumenUnidades.textContent = 'Productos (' + n + ')';
        resumenSubtotal.textContent = Tienda.moneda(Tienda.subtotal());
        resumenTotal.textContent = Tienda.moneda(Tienda.subtotal());
    }

    function mostrarConfirmacion(datos, numero, total, productos) {
        pedidoHecho = true;
        lleno.hidden = true;
        vacio.hidden = true;
        titulo.textContent = 'Pedido recibido';
        confirmacion.innerHTML =
            '<div class="caja confirmacion">' +
                '<h2>Gracias por tu compra, ' + Tienda.esc(datos.nombre.split(' ')[0]) + '</h2>' +
                '<p>Número de pedido:</p>' +
                '<p class="confirmacion__numero">' + Tienda.esc(numero) + '</p>' +
                '<p>' + productos + (productos === 1 ? ' producto' : ' productos') + ' por un total de <strong>' + Tienda.moneda(total) + '</strong>, con envío gratis a ' +
                Tienda.esc(datos.direccion) + ', ' + Tienda.esc(datos.ciudad) + '.</p>' +
                '<a class="boton boton--principal" href="index.html">Seguir comprando</a>' +
            '</div>';
        confirmacion.hidden = false;
        window.scrollTo(0, 0);
        titulo.setAttribute('tabindex', '-1');
        titulo.focus();
    }

    function mostrarError(mensaje) {
        errorPedido.textContent = mensaje;
        errorPedido.hidden = false;
    }

    formulario.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        var datos = {
            nombre: formulario.elements.nombre.value.trim(),
            correo: formulario.elements.correo.value.trim(),
            telefono: formulario.elements.telefono.value.trim(),
            direccion: formulario.elements.direccion.value.trim(),
            ciudad: formulario.elements.ciudad.value.trim()
        };
        var total = Tienda.subtotal();
        var productos = Tienda.unidades();
        var boton = formulario.querySelector('button[type="submit"]');
        var textoOriginal = boton.textContent;
        errorPedido.hidden = true;
        boton.disabled = true;
        boton.textContent = 'Guardando pedido...';

        try {
            var respuesta = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cliente: datos, items: Tienda.detalle().map(function (linea) {
                    return { productoId: linea.producto.id, talla: linea.talla, cantidad: linea.cantidad };
                }) })
            });
            var resultado = await respuesta.json();
            if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo guardar el pedido.');

            mostrarConfirmacion(datos, resultado.numero, resultado.total, productos);
            Tienda.vaciar();
        } catch (error) {
            mostrarError(error.message || 'No se pudo guardar el pedido. Inténtalo de nuevo.');
            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    });

    Tienda.alCambiar(pintar);
    pintar();
})();
