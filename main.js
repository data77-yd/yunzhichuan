/**
 * 云智川科技 - 营销官网交互脚本
 */

(function(){
  'use strict';

  /* ===== DOM REFS ===== */
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const navLinks = mainNav.querySelectorAll('a');

  /* ===== SCROLL: HEADER BACKGROUND & ACTIVE LINK ===== */
  const sections = [];
  const navAnchors = [];
  navLinks.forEach(function(a){
    var href = a.getAttribute('href');
    if (href && href.startsWith('#')){
      var target = document.querySelector(href);
      if (target){
        sections.push(target);
        navAnchors.push({a:a, id:href});
      }
    }
  });

  function onScroll(){
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Header shadow
    if (scrollY > 60){
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Active nav link
    var currentId = '';
    for (var i = sections.length - 1; i >= 0; i--){
      if (sections[i].getBoundingClientRect().top <= 120){
        currentId = '#' + sections[i].id;
        break;
      }
    }
    navLinks.forEach(function(a){
      a.classList.remove('active');
      a.removeAttribute('aria-current');
      if (a.getAttribute('href') === currentId){
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ===== SMOOTH SCROLL ===== */
  navLinks.forEach(function(a){
    a.addEventListener('click',function(e){
      var href = this.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1){
        e.preventDefault();
        var target = document.querySelector(href);
        if (target){
          target.scrollIntoView({behavior:'smooth',block:'start'});
          // Close mobile menu
          mainNav.classList.remove('open');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Dropdown toggle for mobile (click to open/close)
  var dropdownToggle = document.querySelector('.nav-dropdown-toggle');
  if (dropdownToggle){
    dropdownToggle.addEventListener('click', function(e){
      if (window.innerWidth <= 767){
        e.preventDefault();
        var parent = this.parentElement;
        parent.classList.toggle('open');
      }
    });
  }

  /* ===== MOBILE MENU TOGGLE ===== */
  menuToggle.addEventListener('click',function(){
    mainNav.classList.toggle('open');
    menuToggle.classList.toggle('active');
    var isOpen = mainNav.classList.contains('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu on outside click
  document.addEventListener('click',function(e){
    if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && !menuToggle.contains(e.target)){
      mainNav.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ===== SCROLL ANIMATION: Intersection Observer ===== */
  var observerOptions = {threshold:0.15,rootMargin:'0px 0px -50px 0px'};
  var animateElements = document.querySelectorAll('[data-animate]');

  if ('IntersectionObserver' in window){
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animateElements.forEach(function(el){ observer.observe(el); });
  } else {
    // Fallback: show all immediately
    animateElements.forEach(function(el){ el.classList.add('visible'); });
  }

  /* ===== NUMBER COUNTING ANIMATION ===== */
  function animateCount(el){
    var raw = el.getAttribute('data-count');
    if (!raw) return;
    var val = parseFloat(raw);
    if (isNaN(val)) return;

    var span = el.querySelector('span');
    var suffix = span ? span.textContent : '';
    var isInteger = (val === Math.floor(val) && val < 100);
    var isFloat = (val !== Math.floor(val));
    var duration = 1500;
    var startTime = null;

    function step(timestamp){
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = val * eased;

      var display;
      if (isInteger){
        display = Math.floor(current);
      } else if (isFloat){
        display = current.toFixed(2);
      } else {
        display = Math.floor(current);
      }

      // Set content: number + suffix span
      if (span){
        var textNode = el.firstChild;
        if (textNode && textNode.nodeType === 3){
          textNode.textContent = display;
        } else {
          el.childNodes[0] && el.childNodes[0].nodeType === 3 ?
            (el.childNodes[0].textContent = display) :
            (el.innerHTML = display + '<span>' + suffix + '</span>');
        }
      } else {
        el.textContent = display;
      }

      if (progress < 1){
        requestAnimationFrame(step);
      } else {
        // Final value
        if (span){
          el.innerHTML = (isFloat ? val.toFixed(2) : Math.floor(val)) + '<span>' + suffix + '</span>';
        } else {
          el.textContent = isFloat ? val.toFixed(2) : Math.floor(val);
        }
      }
    }
    requestAnimationFrame(step);
  }

  var countObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0.3});

  document.querySelectorAll('[data-count]').forEach(function(el){
    countObserver.observe(el);
  });

  /* ===== RESIZE HANDLER ===== */
  var resizeTimer;
  window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
      // Close mobile menu on resize to desktop
      if (window.innerWidth > 767 && mainNav.classList.contains('open')){
        mainNav.classList.remove('open');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    }, 200);
  });

  /* ===== INIT ===== */
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  /* ===== HERO CAROUSEL ===== */
  var slides = document.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.hero-dot');
  if (slides.length && dots.length){
    var currentSlide = 0;
    var slideInterval;
    var SLIDE_DURATION = 5000;

    function goToSlide(index){
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      currentSlide = index;
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }

    function nextSlide(){
      goToSlide((currentSlide + 1) % slides.length);
    }

    // Auto rotation
    function startAutoPlay(){
      stopAutoPlay();
      slideInterval = setInterval(nextSlide, SLIDE_DURATION);
    }
    function stopAutoPlay(){
      clearInterval(slideInterval);
    }

    // Indicator clicks
    dots.forEach(function(dot){
      dot.addEventListener('click', function(){
        var idx = parseInt(this.getAttribute('data-slide'));
        if (idx !== currentSlide){
          goToSlide(idx);
          startAutoPlay();
        }
      });
    });

    // Touch swipe support
    var touchStartX = 0;
    var touchEndX = 0;
    var slidesContainer = document.getElementById('heroSlides');
    slidesContainer.addEventListener('touchstart', function(e){
      touchStartX = e.changedTouches[0].screenX;
    }, {passive:true});
    slidesContainer.addEventListener('touchend', function(e){
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 60){
        if (diff > 0){
          goToSlide((currentSlide + 1) % slides.length);
        } else {
          goToSlide((currentSlide - 1 + slides.length) % slides.length);
        }
        startAutoPlay();
      }
    });

    startAutoPlay();
  }

})();