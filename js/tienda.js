/* Página de inicio: búsqueda, categorías y orden del catálogo. */

(function () {
    'use strict';

    var cuadricula = document.getElementById('cuadricula');
    var filtros = document.getElementById('lista-categorias');
    var conteo = document.getElementById('conteo');
    var orden = document.getElementById('orden');
    var buscador = document.getElementById('q');

    var estado = { q: '', categoria: 'Todas', orden: 'destacados' };

    function normalizar(texto) {
        return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function categorias() {
        var cuentas = {};
        PRODUCTOS.forEach(function (p) {
            cuentas[p.categoria] = (cuentas[p.categoria] || 0) + 1;
        });
        return Object.keys(cuentas).sort().map(function (nombre) {
            return { nombre: nombre, cuenta: cuentas[nombre] };
        });
    }

    function pintarFiltros() {
        var items = [{ nombre: 'Todas', cuenta: PRODUCTOS.length }].concat(categorias());
        filtros.innerHTML = items.map(function (c) {
            return '<li><button class="filtros__boton" type="button" data-categoria="' + Tienda.esc(c.nombre) + '" aria-pressed="' + (c.nombre === estado.categoria) + '">' +
                '<span>' + Tienda.esc(c.nombre) + '</span><span class="filtros__cuenta">' + c.cuenta + '</span></button></li>';
        }).join('');
    }

    function filtrar() {
        var q = normalizar(estado.q.trim());
        var lista = PRODUCTOS.filter(function (p) {
            var coincideCategoria = estado.categoria === 'Todas' || p.categoria === estado.categoria;
            var coincideTexto = !q || normalizar(p.nombre + ' ' + p.categoria).indexOf(q) > -1;
            return coincideCategoria && coincideTexto;
        });
        if (estado.orden === 'az') lista.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
        if (estado.orden === 'za') lista.sort(function (a, b) { return b.nombre.localeCompare(a.nombre); });
        return lista;
    }

    function pintar() {
        var lista = filtrar();
        conteo.textContent = lista.length + (lista.length === 1 ? ' producto' : ' productos');

        if (!lista.length) {
            cuadricula.innerHTML = '<div class="vacio" style="grid-column: 1 / -1">' +
                '<p>No encontramos productos para esa búsqueda.</p>' +
                '<button class="boton boton--oscuro" type="button" data-limpiar>Ver todos los productos</button></div>';
            return;
        }
        cuadricula.innerHTML = lista.map(Tienda.tarjeta).join('');
    }

    function actualizarDireccion() {
        var url = estado.q.trim() ? 'index.html?q=' + encodeURIComponent(estado.q.trim()) : 'index.html';
        try { history.replaceState(null, '', url); } catch (e) { /* abierto desde archivo local */ }
    }

    filtros.addEventListener('click', function (e) {
        var b = e.target.closest('[data-categoria]');
        if (!b) return;
        estado.categoria = b.getAttribute('data-categoria');
        pintarFiltros();
        pintar();
        var activo = filtros.querySelector('[aria-pressed="true"]');
        if (activo) activo.focus();
    });

    orden.addEventListener('change', function () {
        estado.orden = orden.value;
        pintar();
    });

    buscador.addEventListener('input', function () {
        estado.q = buscador.value;
        actualizarDireccion();
        pintar();
    });

    buscador.form.addEventListener('submit', function (e) {
        e.preventDefault();
        estado.q = buscador.value;
        actualizarDireccion();
        pintar();
    });

    cuadricula.addEventListener('click', function (e) {
        if (!e.target.closest('[data-limpiar]')) return;
        estado.q = '';
        estado.categoria = 'Todas';
        buscador.value = '';
        actualizarDireccion();
        pintarFiltros();
        pintar();
    });

    var parametros = new URLSearchParams(window.location.search);
    estado.q = (parametros.get('q') || '').trim();
    buscador.value = estado.q;

    pintarFiltros();
    pintar();
})();
