// smooth.js - Custom Buttery Smooth Cursor & Lenis Smooth Scroll

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Lenis Smooth Scroll
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // 2. Custom Buttery Smooth Trailing Cursor
  const cursorDot = document.getElementById("cursor-dot");
  const cursorOutline = document.getElementById("cursor-outline");
  
  if (cursorDot && cursorOutline) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    let dotX = mouseX;
    let dotY = mouseY;
    let outlineX = mouseX;
    let outlineY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Add CSS properties automatically so it hides default cursor over interactive elements
    const style = document.createElement('style');
    style.innerHTML = `
      @media (pointer: fine) {
        * { cursor: none !important; }
        .cursor-dot, .cursor-outline {
          position: fixed;
          top: 0; left: 0;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          z-index: 99999;
          pointer-events: none;
        }
        .cursor-dot {
          width: 8px;
          height: 8px;
          background-color: var(--primary);
        }
        .cursor-outline {
          width: 40px;
          height: 40px;
          border: 2px solid var(--primary);
          transition: width 0.2s, height 0.2s;
        }
      }
      @media (pointer: coarse) {
        .cursor-dot, .cursor-outline { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    function animateCursor() {
      // Lerp for the dot (fast)
      dotX += (mouseX - dotX) * 0.5;
      dotY += (mouseY - dotY) * 0.5;
      
      // Lerp for the outline (slow / trailing)
      outlineX += (mouseX - outlineX) * 0.15;
      outlineY += (mouseY - outlineY) * 0.15;

      cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;

      requestAnimationFrame(animateCursor);
    }
    
    animateCursor();

    // Enlarge on interactive element hover
    const interactables = document.querySelectorAll('button, a, input, select, .job-card, .mcq-option, .login-logo, .nav-logo');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorOutline.style.width = '60px';
        cursorOutline.style.height = '60px';
        cursorOutline.style.backgroundColor = 'rgba(209, 43, 43, 0.1)';
        cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%) scale(0.5)`;
      });
      el.addEventListener('mouseleave', () => {
        cursorOutline.style.width = '40px';
        cursorOutline.style.height = '40px';
        cursorOutline.style.backgroundColor = 'transparent';
        cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%) scale(1)`;
      });
    });
    
    // Fix issue where elements added dynamically don't trigger hover (e.g. injected questions)
    // We achieve this via global mouseover event delegation
    document.addEventListener("mouseover", (e) => {
       const isInteractable = e.target.closest('button, a, input, select, .job-card, .mcq-option, .login-logo, .nav-logo, .sb-item');
       if (isInteractable) {
          cursorOutline.style.width = '60px';
          cursorOutline.style.height = '60px';
          cursorOutline.style.backgroundColor = 'rgba(209, 43, 43, 0.1)';
       } else {
          cursorOutline.style.width = '40px';
          cursorOutline.style.height = '40px';
          cursorOutline.style.backgroundColor = 'transparent';
       }
    });

  }
});
