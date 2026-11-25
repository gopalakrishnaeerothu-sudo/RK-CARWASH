import { useEffect } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Process } from './components/Process';
import { Gallery } from './components/Gallery';
import { About, Contact, FloatingWhatsApp, Promo, Services, SiteFooter, Why } from './components/Sections';

export default function App() {
  // Scroll-triggered reveals for every element marked `.reveal`
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    const observe = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.getElementById('root')!, { childList: true, subtree: true });

    // Parallax for the promotional banner
    let raf = 0;
    const promo = document.querySelector<HTMLElement>('.promo');
    const onScroll = () => {
      if (raf || !promo) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = promo.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        promo.style.setProperty('--py', p.toFixed(3));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <>
      <a className="skip" href="#about">Skip to content</a>
      <Nav />
      <main>
        <Hero />
        <About />
        <Services />
        <Process />
        <Gallery />
        <Promo />
        <Why />
        <Contact />
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </>
  );
}
