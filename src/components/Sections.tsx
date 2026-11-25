import {
  ArrowUpRight, Bike, Bus, Car, CarFront, Clock, Droplets, Heart, Instagram, Layers, ListChecks,
  MapPin, MessageCircle, Phone, Sparkles, SprayCan, Truck, UserRound,
} from 'lucide-react';
import { business, links, reasons, services } from '../data';

const ICONS: Record<string, typeof Car> = {
  car: Car, bike: Bike, truck: Truck, suv: CarFront, bus: Bus, sparkles: Sparkles, foam: SprayCan,
  droplets: Droplets, heart: Heart, layers: Layers, list: ListChecks, user: UserRound,
};

export function About() {
  return (
    <section id="about" className="about section" aria-labelledby="about-title">
      <div className="wrap about-grid">
        <div className="about-media">
          <figure className="frame reveal reveal-clip about-main">
            <img src="/img/owner-portrait.webp" alt="Krishnam Raju, founder of R.K CAR WASH" loading="lazy" width={598} height={868} />
          </figure>
          <figure className="frame reveal reveal-clip about-inset">
            <img src="/img/owner-car.webp" alt="Krishnam Raju with his white Hyundai hatchback" loading="lazy" width={584} height={866} />
          </figure>
        </div>
        <div className="about-copy">
          <p className="eyebrow reveal">About us</p>
          <h2 id="about-title" className="section-title reveal">Passion behind every clean.</h2>
          <p className="lead reveal">
            At R.K CAR WASH, washing vehicles is more than just a service. It’s a passion.
          </p>
          <p className="reveal">
            Founded by <strong>{business.owner}</strong>, our business is dedicated to keeping every vehicle clean,
            fresh and shining. Whether it’s a bike, car or heavy-duty lorry, every vehicle receives attention and care.
          </p>
          <dl className="facts reveal">
            <div><dt>Founder</dt><dd>{business.owner}</dd></div>
            <div><dt>We wash</dt><dd>Bikes · Cars · SUVs · Lorries · Commercial</dd></div>
            <div><dt>Talk to us</dt><dd><a href={links.call}>{business.phone}</a></dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function tilt(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--rx', `${(((e.clientY - r.top) / r.height) - 0.5) * -8}deg`);
  el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width) - 0.5) * 10}deg`);
  el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
}
function untilt(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg');
  e.currentTarget.style.setProperty('--ry', '0deg');
}

export function Services() {
  return (
    <section id="services" className="services section" aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-head reveal">
          <div>
            <p className="eyebrow">Our services</p>
            <h2 id="services-title" className="section-title">Every wheel, every size.</h2>
          </div>
          <p className="section-side">Prices depend on the vehicle and the wash. Message us for a quote — it only takes a minute.</p>
        </div>
        <div className="service-grid">
          {services.map((s, i) => {
            const Icon = ICONS[s.icon];
            return (
              <article key={s.name} className="service reveal" style={{ '--d': `${(i % 4) * 70}ms` } as React.CSSProperties} onPointerMove={tilt} onPointerLeave={untilt}>
                <div className="service-top">
                  <span className="icon-disc"><Icon size={20} strokeWidth={1.5} /></span>
                  <small>{String(i + 1).padStart(2, '0')}</small>
                </div>
                <h3>{s.name}</h3>
                <p>{s.text}</p>
                <a href={links.whatsapp} target="_blank" rel="noopener" className="service-link" aria-label={`Contact for pricing: ${s.name}`}>
                  Contact for pricing <ArrowUpRight size={15} />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Promo() {
  return (
    <section className="promo dark" aria-labelledby="promo-title">
      <div className="promo-media">
        <img src="/img/promo-suv.webp" srcSet="/img/promo-suv-sm.webp 800w, /img/promo-suv.webp 1536w" sizes="100vw" alt="Promotional visual: a jet of water hits the front of a black SUV, foam running down the bumper" loading="lazy" />
      </div>
      <div className="wrap promo-copy">
        <p className="eyebrow reveal">The R.K promise</p>
        <h2 id="promo-title" className="promo-title reveal">
          We don’t just wash vehicles.<br /><em>We bring back their shine.</em>
        </h2>
        <a className="btn btn-acid reveal" href={links.whatsapp} target="_blank" rel="noopener">Book your wash</a>
      </div>
      <p className="promo-disclaimer wrap">Promotional visuals on this site illustrate our washing style. They are not photographs of completed customer work.</p>
    </section>
  );
}

export function Why() {
  return (
    <section className="why section" aria-labelledby="why-title">
      <div className="wrap">
        <div className="section-head reveal">
          <div>
            <p className="eyebrow">Why choose us</p>
            <h2 id="why-title" className="section-title">Your vehicle. Our passion.</h2>
          </div>
        </div>
        <div className="why-grid">
          {reasons.map((r, i) => {
            const Icon = ICONS[r.icon];
            return (
              <div key={r.title} className="why-card reveal" style={{ '--d': `${(i % 3) * 90}ms` } as React.CSSProperties}>
                <span className="icon-disc pulse"><Icon size={20} strokeWidth={1.5} /></span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="contact section dark" aria-labelledby="contact-title">
      <div className="wrap contact-grid">
        <div>
          <p className="eyebrow reveal">Contact</p>
          <h2 id="contact-title" className="section-title reveal">Let’s get your vehicle shining.</h2>
          <div className="contact-actions reveal">
            <a className="btn btn-acid btn-lg" href={links.call}><Phone size={18} /> Call now</a>
            <a className="btn btn-wa btn-lg" href={links.whatsapp} target="_blank" rel="noopener"><MessageCircle size={18} /> WhatsApp</a>
            <a className="btn btn-line btn-lg" href={business.instagram} target="_blank" rel="noopener"><Instagram size={18} /> Instagram</a>
          </div>
          <dl className="contact-list reveal">
            <div><dt>Business</dt><dd>{business.name}</dd></div>
            <div><dt>Owner</dt><dd>{business.owner}</dd></div>
            <div><dt>Phone</dt><dd><a href={links.call}>{business.phone}</a></dd></div>
            <div><dt>WhatsApp</dt><dd><a href={links.whatsapp} target="_blank" rel="noopener">{business.phone}</a></dd></div>
            <div><dt>Instagram</dt><dd><a href={business.instagram} target="_blank" rel="noopener">{business.instagramHandle}</a></dd></div>
          </dl>
        </div>
        <div className="contact-side">
          <div className="map-card frame reveal">
            <div className="map-grid" aria-hidden="true" />
            <span className="map-pin" aria-hidden="true"><MapPin size={22} /></span>
            <div className="map-copy">
              <h3>Find us</h3>
              <p>Ask us on WhatsApp and we’ll send you our location pin and directions.</p>
              <a className="btn btn-line" href={links.whatsappLocation} target="_blank" rel="noopener">Get directions</a>
            </div>
          </div>
          <div className="hours-card reveal">
            <Clock size={18} />
            <div>
              <h3>Business hours</h3>
              <p>Call or WhatsApp before you come — we’ll confirm today’s timings.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <a href="#home" className="wordmark">R.K <span>CAR WASH</span></a>
            <p>{business.tagline}</p>
          </div>
          <div className="footer-links">
            <a href={links.call}>Call {business.phone}</a>
            <a href={links.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
            <a href={business.instagram} target="_blank" rel="noopener">Instagram</a>
          </div>
        </div>
        <div className="footer-baseline">
          <span>© {new Date().getFullYear()} {business.name} · {business.owner}</span>
          <span>Interface design language adapted from VEYRA by Amir Mušić (MIT).</span>
        </div>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return (
    <a className="fab-wa" href={links.whatsapp} target="_blank" rel="noopener" aria-label="Chat with R.K CAR WASH on WhatsApp">
      <MessageCircle size={24} />
      <span>WhatsApp</span>
    </a>
  );
}
