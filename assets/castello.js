// Dra. Castello — interacciones de la landing
(function () {
  'use strict';

  // ---------- Scroll reveal ----------
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupReveal() {
    var els = document.querySelectorAll('.reveal');
    if (prefersReduced) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- FAQ accordion ----------
  function setupFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      var panel = item.querySelector('.faq-a');
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        // cerrar los demás
        document.querySelectorAll('.faq-item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-a').style.maxHeight = '0px';
            other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          }
        });
        if (isOpen) {
          item.classList.remove('open');
          panel.style.maxHeight = '0px';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ---------- Hamburger menu ----------
  function setupHamburger() {
    var btn = document.getElementById('hamburger-btn');
    var nav = document.getElementById('main-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', function () {
      var isOpen = btn.classList.contains('open');
      btn.classList.toggle('open');
      nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      btn.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    });

    // Cerrar al hacer click en un link del nav
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        btn.classList.remove('open');
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Abrir menú');
      });
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) {
        btn.classList.remove('open');
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Abrir menú');
      }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        btn.classList.remove('open');
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Abrir menú');
        btn.focus();
      }
    });
  }

  // ---------- Active nav link on scroll ----------
  function setupActiveNav() {
    var navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
    if (!navLinks.length) return;

    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute('href').substring(1);
      var section = document.getElementById(id);
      if (section) sections.push({ el: section, link: link });
    });

    var headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 74;

    function updateActive() {
      var scrollY = window.scrollY + headerHeight + 60;
      var current = null;

      sections.forEach(function (s) {
        if (s.el.offsetTop <= scrollY) {
          current = s;
        }
      });

      navLinks.forEach(function (link) { link.classList.remove('active'); });
      if (current) current.link.classList.add('active');
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateActive();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    updateActive();
  }

  // ---------- Smooth scroll con offset para sticky header ----------
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href').substring(1);
        var target = document.getElementById(targetId);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ---------- Formulario de contacto (Formspree AJAX + fallback) ----------
  function setupContactForm() {
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Enviando consulta...';
      }

      var formData = new FormData(form);

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      }).then(function (response) {
        if (response.ok) {
          status.className = 'form-status success';
          status.textContent = '¡Gracias por contactarnos! Tu consulta fue enviada exitosamente a la Dra. Castello. Nos comunicaremos a la brevedad.';
          form.reset();
        } else {
          return response.json().then(function (data) {
            throw new Error(data && data.errors ? data.errors.map(function (err) { return err.message; }).join(', ') : 'Error en el envío');
          });
        }
      }).catch(function (error) {
        // Fallback: abrir cliente de correo directamente hacia la casilla
        var nombre = form.querySelector('[name="nombre"]') ? form.querySelector('[name="nombre"]').value : '';
        var mail = form.querySelector('[name="_replyto"]') ? form.querySelector('[name="_replyto"]').value : '';
        var tel = form.querySelector('[name="whatsapp"]') ? form.querySelector('[name="whatsapp"]').value : '';
        var motivo = form.querySelector('[name="motivo"]') ? form.querySelector('[name="motivo"]').value : '';
        var mensaje = form.querySelector('[name="mensaje"]') ? form.querySelector('[name="mensaje"]').value : '';

        var subject = encodeURIComponent('Consulta Web - ' + (motivo || 'Dra. Castello'));
        var body = encodeURIComponent('Nombre: ' + nombre + '\nEmail: ' + mail + '\nWhatsApp: ' + tel + '\nProcedimiento de interés: ' + motivo + '\n\nDetalle / Caso:\n' + mensaje);

        window.location.href = 'mailto:dramariaecastello@gmail.com?subject=' + subject + '&body=' + body;

        status.className = 'form-status success';
        status.textContent = 'Se abrió tu cliente de correo para enviar la consulta directamente a dramariaecastello@gmail.com.';
      }).finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      });
    });
  }

  // ---------- Init ----------
  function init() {
    setupReveal();
    setupFaq();
    setupHamburger();
    setupActiveNav();
    setupSmoothScroll();
    setupContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
