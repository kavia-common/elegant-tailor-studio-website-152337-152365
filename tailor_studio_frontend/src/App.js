import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * App - Tailor Studio SPA
 * Renders all sections and manages navigation, animations, and form submissions.
 */
function App() {
  // Theme (auto by system preference with manual toggle)
  const prefDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [theme, setTheme] = useState(prefDark ? 'dark' : 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  // Smooth scroll helpers and active section
  const sections = useMemo(() => ([
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'faq', label: 'FAQ' },
    { id: 'newsletter', label: 'Newsletter' },
    { id: 'contact', label: 'Contact' },
  ]), []);

  const [active, setActive] = useState('hero');
  const observers = useRef([]);

  useEffect(() => {
    const opts = { root: null, rootMargin: '0px', threshold: 0.35 };
    const handler = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    };
    const io = new IntersectionObserver(handler, opts);
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
      observers.current.push({ io, el });
    });
    return () => io.disconnect();
  }, [sections]);

  // PUBLIC_INTERFACE
  const scrollToId = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Forms state
  const [nlEmail, setNlEmail] = useState('');
  const [nlStatus, setNlStatus] = useState({ type: '', message: '' });
  const [contact, setContact] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState({ newsletter: false, contact: false });

  const backendBase = process.env.REACT_APP_BACKEND_URL || '';

  // PUBLIC_INTERFACE
  const submitNewsletter = async (e) => {
    e.preventDefault();
    setNlStatus({ type: '', message: '' });
    if (!nlEmail) {
      setNlStatus({ type: 'error', message: 'Please enter an email.' });
      return;
    }
    setLoading((s) => ({ ...s, newsletter: true }));
    try {
      const res = await fetch(`${backendBase}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nlEmail })
      });
      if (res.status === 200 || res.status === 201) {
        setNlStatus({ type: 'success', message: res.status === 200 ? 'You are already subscribed.' : 'Subscribed successfully!' });
        setNlEmail('');
      } else {
        const t = await res.text();
        setNlStatus({ type: 'error', message: t || 'Subscription failed. Please try again.' });
      }
    } catch (err) {
      setNlStatus({ type: 'error', message: 'Network error. Please try later.' });
    } finally {
      setLoading((s) => ({ ...s, newsletter: false }));
    }
  };

  // PUBLIC_INTERFACE
  const submitContact = async (e) => {
    e.preventDefault();
    setContactStatus({ type: '', message: '' });

    if (!contact.name || !contact.email || !contact.message) {
      setContactStatus({ type: 'error', message: 'Name, email, and message are required.' });
      return;
    }
    setLoading((s) => ({ ...s, contact: true }));
    try {
      const res = await fetch(`${backendBase}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      if (res.status === 201) {
        setContactStatus({ type: 'success', message: 'Thanks! Your message has been sent.' });
        setContact({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        const t = await res.text();
        setContactStatus({ type: 'error', message: t || 'Submission failed. Please try again.' });
      }
    } catch (err) {
      setContactStatus({ type: 'error', message: 'Network error. Please try later.' });
    } finally {
      setLoading((s) => ({ ...s, contact: false }));
    }
  };

  // Back to top visibility
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const SectionHeader = ({ kicker, title, desc }) => (
    <motion.div
      className="section-header"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: .45 }}
    >
      <div className="section-kicker">{kicker}</div>
      <h2 className="section-title">{title}</h2>
      {desc && <p className="section-desc">{desc}</p>}
    </motion.div>
  );

  const navItems = sections.map(s => (
    <button
      key={s.id}
      className="nav-link"
      onClick={() => scrollToId(s.id)}
      aria-current={active === s.id ? 'page' : undefined}
    >
      {s.label}
    </button>
  ));

  return (
    <LayoutGroup>
      {/* Sticky Navbar */}
      <nav className="navbar">
        <div className="container nav-inner">
          <div className="brand" onClick={() => scrollToId('hero')} style={{ cursor: 'pointer' }}>
            <div className="brand-mark" />
            Elegant Tailor Studio
          </div>
          <div className="nav-links">
            {navItems}
            {/* Animated active indicator under the current page link for premium feel */}
            <AnimatePresence>
              {active && (
                <motion.div
                  layoutId="active-pill"
                  style={{
                    position: 'absolute',
                    height: 36,
                    borderRadius: 12,
                    background: 'rgba(39,68,114,0.10)',
                    boxShadow: 'inset 0 0 0 1px rgba(39,68,114,0.18)'
                  }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </AnimatePresence>
            <button className="btn btn-outline" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header id="hero" className="section hero">
        <div className="container hero-inner">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: .5 }}
          >
            <h1 className="hero-title">Bespoke Tailoring, Crafted to Perfection.</h1>
            <p className="hero-sub">Discover garments that fit your form and your story. Premium fabrics, precise cuts, and meticulous details—tailored exclusively for you.</p>
            <div className="cta-row">
              <button className="btn btn-primary" onClick={() => scrollToId('services')}>Explore Services</button>
              <button className="btn btn-outline" onClick={() => scrollToId('contact')}>Book a Fitting</button>
            </div>
          </motion.div>

          <motion.div
            className="hero-card"
            initial={{ opacity: 0, scale: .96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: .5, delay: .1 }}
            aria-label="Showcase grid"
          >
            <div className="hero-grid">
              {['Fine Wool', 'Italian Linen', 'Silk Lining', 'Hand Stitching'].map((t, i) => (
                <motion.div
                  className="hero-cell"
                  key={t}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: .4, delay: .04 * i }}
                >
                  {t}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* About */}
      <section id="about" className="section">
        <div className="container">
          <SectionHeader kicker="About" title="Three Generations of Craftsmanship" desc="We combine time-honored techniques with modern design to create bespoke clothing that elevates your presence." />
          <motion.div
            className="about-card"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .5 }}
          >
            <div>
              <p>Our studio is dedicated to refined tailoring—where each stitch is intentional and every cut is precise. From bespoke suits and shirts to alterations and bridal wear, we champion fit, comfort, and durability.</p>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="badge">Bespoke</span>
                <span className="badge">Made-to-Measure</span>
                <span className="badge">Alterations</span>
                <span className="badge">Bridal & Formal</span>
              </div>
            </div>
            <div>
              <div className="hero-card">
                <strong>Why choose us</strong>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-muted)' }}>
                  <li>Personal consultations and measurements</li>
                  <li>Curated selection of premium textiles</li>
                  <li>Precise fitting and finishing</li>
                  <li>Dedicated aftercare and adjustments</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <SectionHeader kicker="Services" title="Tailoring for Every Occasion" desc="Elegant solutions from everyday essentials to statement pieces." />
          <div className="card-grid">
            {[
              { t: 'Bespoke Suits', d: 'Pattern drafted to your posture and lifestyle.', k: '🧵' },
              { t: 'Shirts & Trousers', d: 'Made-to-measure basics with premium fabrics.', k: '👔' },
              { t: 'Alterations', d: 'Refined fit adjustments for comfort and style.', k: '✂️' },
              { t: 'Bridal & Formal', d: 'Custom gowns, tuxedos, and ceremonial wear.', k: '💍' },
              { t: 'Outerwear', d: 'Coats and jackets tailored to your silhouette.', k: '🧥' },
              { t: 'Restoration', d: 'Revive cherished pieces with expert care.', k: '🪡' },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                className="card"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: .4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div style={{ fontSize: 28 }}>{c.k}</div>
                <h3 className="card-title">{c.t}</h3>
                <p className="card-desc">{c.d}</p>
                <button className="btn btn-outline" onClick={() => scrollToId('contact')}>Enquire</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="section">
        <div className="container">
          <SectionHeader kicker="Gallery" title="Details That Define" desc="A glimpse into textures, finishes, and fits from recent work." />
          <div className="gallery-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="gallery-item"
                initial={{ opacity: 0, scale: .96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: .4, delay: i * 0.03 }}
                whileHover={{ scale: 1.01 }}
                aria-label={`Gallery item ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <SectionHeader kicker="FAQ" title="Frequently Asked Questions" />
          <div className="faq">
            {[
              { q: 'How long does a bespoke suit take?', a: 'Typically 4–8 weeks depending on fabric availability and fitting rounds.' },
              { q: 'Do you offer alterations for garments not made by you?', a: 'Yes, we perform alterations on most garments subject to an initial inspection.' },
              { q: 'What should I bring to my first fitting?', a: 'Bring a well-fitting shirt and shoes similar to what you intend to wear with the garment.' },
              { q: 'What is your pricing range?', a: 'Pricing varies by fabric and complexity. Contact us for a tailored quote.' },
            ].map((item, idx) => <FaqItem key={idx} {...item} />)}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="section">
        <div className="container">
          <SectionHeader kicker="Newsletter" title="Stay in the Loop" desc="Be the first to know about fabric arrivals, seasonal edits, and studio events." />
          <form className="form" onSubmit={submitNewsletter}>
            <div className="form-row">
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                aria-label="Email address"
                required
              />
              <button className="btn btn-primary" type="submit" disabled={loading.newsletter}>
                {loading.newsletter ? 'Subscribing…' : 'Subscribe'}
              </button>
            </div>
            <StatusLine status={nlStatus} />
          </form>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <SectionHeader kicker="Contact" title="Book a Consultation" desc="Tell us about your project—we’ll get back promptly." />
          <div className="about-card">
            <form className="form" onSubmit={submitContact}>
              <div className="form-row">
                <input className="input" placeholder="Full name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required />
                <input className="input" type="email" placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required />
              </div>
              <div className="form-row">
                <input className="input" placeholder="Phone (optional)" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                <input className="input" placeholder="Subject (optional)" value={contact.subject} onChange={(e) => setContact({ ...contact, subject: e.target.value })} />
              </div>
              <textarea className="textarea" placeholder="Your message" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} required />
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-primary" type="submit" disabled={loading.contact}>
                  {loading.contact ? 'Sending…' : 'Send Message'}
                </button>
                <StatusLine status={contactStatus} />
              </div>
            </form>
            <div>
              <div className="hero-card">
                <strong>Studio</strong>
                <p className="card-desc" style={{ margin: 0 }}>
                  12 Savile Row, London<br />
                  Mon–Sat: 10:00–18:00
                </p>
                <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />
                <strong>Contact</strong>
                <p className="card-desc" style={{ margin: 0 }}>
                  +44 20 7946 0123<br />
                  hello@eleganttailor.studio
                </p>
                <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className="badge">Instagram</span>
                  <span className="badge">Pinterest</span>
                  <span className="badge">LinkedIn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          © {new Date().getFullYear()} Elegant Tailor Studio — All rights reserved.
        </div>
      </footer>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            className="back-to-top"
            onClick={() => scrollToId('hero')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            aria-label="Back to top"
            title="Back to top"
            whileHover={{ y: -2 }}
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

/** Small components */
function StatusLine({ status }) {
  if (!status?.message) return null;
  const color = status.type === 'success' ? 'var(--color-primary)' : status.type === 'error' ? '#b91c1c' : 'inherit';
  return <span role="status" aria-live="polite" style={{ color, fontWeight: 700 }}>{status.message}</span>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-q" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {q}
        <span>{open ? '–' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: .22 }}
          >
            <div style={{ paddingTop: 6 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
