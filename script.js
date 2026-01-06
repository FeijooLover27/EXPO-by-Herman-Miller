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
                
                // --- SALTO HACIA ABAJO ---
                onLeave: () => {
                    // CONDICIÓN CRÍTICA: Solo ejecuta el salto si es Escritorio (> 991px)
                    if (window.innerWidth > 991) {
                        const nextSection = allSections[index + 1];
                        const footer = document.querySelector('footer');
                        const target = nextSection || footer;

                        if (target) {
                            gsap.to(window, {
                                scrollTo: { y: target, autoKill: false },
                                duration: 0.8,
                                ease: "power2.inOut"
                            });
                        }
                    }
                },
                
                // --- SALTO HACIA ARRIBA ---
                onLeaveBack: () => {
                    // CONDICIÓN CRÍTICA: Solo ejecuta el salto si es Escritorio (> 991px)
                    if (window.innerWidth > 991) {
                        const prevSection = allSections[index - 1];
                        if (prevSection) {
                            gsap.to(window, {
                                scrollTo: { y: prevSection, autoKill: false },
                                duration: 0.8,
                                ease: "power2.inOut"
                            });
                        }
                    }
                }
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

});