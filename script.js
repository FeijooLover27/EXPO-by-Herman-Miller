document.addEventListener("DOMContentLoaded", () => {
    
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // 1. ANIMACIÓN DE ENTRADA
    gsap.from("#main-header-text", { 
        y: 100, 
        opacity: 0, 
        duration: 1.5, 
        ease: "power3.out", 
        delay: 0.2 
    });

    // 2. LÓGICA DE SCROLL
    const allSections = document.querySelectorAll('.scroll-section');

    allSections.forEach((section, index) => {
        
        const model = section.querySelector('model-viewer');
        const scrollDistance = model ? "+=50%" : "+=10%";

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                pin: true,
                scrub: 0,
                start: "top top",
                end: scrollDistance, 
                

            }
        });

        if (model) {
            const orbit = { theta: 0 };
            tl.to(orbit, {
                theta: 360,
                ease: "none",
                onUpdate: () => {
                    try {
                        model.cameraOrbit = `${orbit.theta}deg 75deg 100%`;
                    } catch (e) {
                        // Prevención de errores
                    }
                }
            });
        } else {
            tl.to({}, { duration: 1 }); 
        }
    });

    $(function () {
        $('.cell').on('mouseenter', function () {
          const $t = $(this).find('.cell-text');
    
          if ($t.hasClass('in-bottom')) {
            $t.removeClass('in-bottom').addClass('in-top');
          } else if ($t.hasClass('in-top')) {
            $t.removeClass('in-top').addClass('in-bottom');
          }
        });
      });
    
      function fitCellText($cell){
        const $t = $cell.find('.cell-text');
    
        $t.css({ maxHeight: '', overflow: '' });
    
        const cellH = $cell.innerHeight();
        const textH = $t.outerHeight(true);
    
        if (textH > cellH) {
          $t.css({
            maxHeight: cellH + 'px',
            overflow: 'hidden'
          });
        }
      }
    
      function fitAll(){
        $('.cell').each(function(){
          fitCellText($(this));
        });
      }
    
      $(function(){
        fitAll();
        $(window).on('resize', fitAll);
      });
    
      $(function () {
        const GAP_BETWEEN_GROUPS = 2000; // 2s entre ráfagas
    
        // Ajusta estos si quieres el flash más/menos rápido
        const MIN_ON  = 60;   // ms en blanco
        const MAX_ON  = 110;
        const MIN_GAP = 70;   // ms entre parpadeos dentro de la ráfaga
        const MAX_GAP = 140;
    
        function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
    
        function burst($el, done){
          if ($el.data('blinking')) return;     // bloqueo: si está parpadeando, no empieza otra
          $el.data('blinking', true);
    
          let blinks = rand(3, 4);              // 3 o 4 parpadeos por ráfaga
    
          function oneBlink(){
            $el.addClass('blink-white');
            setTimeout(function(){
              $el.removeClass('blink-white');
    
              blinks--;
              if (blinks <= 0) {
                $el.data('blinking', false);
                done && done();
                return;
              }
    
              setTimeout(oneBlink, rand(MIN_GAP, MAX_GAP));
            }, rand(MIN_ON, MAX_ON));
          }
    
          oneBlink();
        }
    
        function loop($el){
          burst($el, function(){
            setTimeout(function(){
              loop($el);
            }, GAP_BETWEEN_GROUPS); // 2s después de terminar la ráfaga
          });
        }
    
        // SOLO spans con .cell-text (los que tienes en tu HTML)
        $('.cell-text').each(function(){
          const $el = $(this);
          setTimeout(function(){ loop($el); }, rand(0, 1500)); // delay inicial aleatorio
        });
      });
    
    
    
    $(function () {
    
      function setMenu(open){
        const $header = $('.site-header');
        $header.toggleClass('is-open', open);
        $('.menu-toggle').attr('aria-expanded', open ? 'true' : 'false');
      }
    
      // Abrir/cerrar con el botón de la pastilla
      $('.menu-toggle').on('click', function () {
        setMenu(!$('.site-header').hasClass('is-open'));
      });
    
      // Cerrar con el botón "Cerrar" del panel
      $(document).on('click', '.menu-close', function () {
        setMenu(false);
      });
    
      // 👉 aquí debajo pega tu “función final” tal cual (si la tienes)
    
    });

});