import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const dot = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check for fine pointer (not mobile)
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    let raf;
    const animate = () => {
      // Lerp dot (fast)
      dot.current.x += (mouse.current.x - dot.current.x) * 0.5;
      dot.current.y += (mouse.current.y - dot.current.y) * 0.5;
      // Lerp ring (slow, trailing)
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dot.current.x}px, ${dot.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    // Event delegation for hover states
    const onOver = (e) => {
      const isInteractable = e.target.closest('button, a, input, select, textarea, .role-card, .sidebar-item, .data-table tr');
      if (ringRef.current) {
        if (isInteractable) {
          ringRef.current.classList.add('hover');
        } else {
          ringRef.current.classList.remove('hover');
        }
      }
    };
    document.addEventListener('mouseover', onOver);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
