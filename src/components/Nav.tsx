import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { business, links, nav } from '../data';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [current, setCurrent] = useState('home');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const sections = nav.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect(); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`masthead${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}>
      <div className="masthead-inner">
        <a href="#home" className="wordmark" aria-label={`${business.name} home`} onClick={() => setOpen(false)}>
          R.K <span>CAR WASH</span>
        </a>
        <nav className="nav-links" aria-label="Main">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={current === n.id ? 'current' : ''} aria-current={current === n.id ? 'true' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <a className="btn btn-acid nav-cta" href={links.whatsapp} target="_blank" rel="noopener">Book your wash</a>
        <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        {nav.map((n, i) => (
          <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} style={{ '--i': i } as React.CSSProperties}>
            <small>0{i + 1}</small> {n.label}
          </a>
        ))}
        <a className="btn btn-acid" href={links.whatsapp} target="_blank" rel="noopener" onClick={() => setOpen(false)}>Book your wash</a>
      </div>
    </header>
  );
}
