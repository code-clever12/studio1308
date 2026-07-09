# DESIGN.md — Studio 1308 Brand Guidelines

> **Brand Positioning:** "European Luxury, Southern Soul" — a premium salon spa in Savannah, GA.  
> **Tagline:** ENHANCE. ELEVATE. EMPOWER.  
> **Interaction Level:** L2 (Smooth scrolling reveals, hover transitions, entrance animations)

---

## 1. Visual Theme & Atmosphere

**Design Philosophy:**  
Studio 1308 lives at the intersection of Old World European refinement and warm Southern hospitality. Every visual choice should feel like stepping into a Parisian atelier that happens to be located on a sun-drenched Savannah boulevard — marble counters, soft candlelight, the scent of gardenias.

**Atmosphere Keywords:**  
`Refined` · `Intimate` · `Empowering` · `Sensual` · `Timeless` · `Confident`

**One-Line Tone:**  
*Luxury that feels personal — beauty as a rite, not a routine.*

**Visual Mood:**  
- Rich jewel tones against warm cream, never stark white
- Slow, deliberate transitions — nothing rushed
- Generous white space as an indicator of premium positioning
- Thin serif lettering for headlines; clean sans for navigation/body
- Photography: warmly lit, skin-close, textural (marble, hair, fabric)

---

## 2. Color Palette & Roles

```css
:root {
  /* ── Primary — Burgundy (extracted from logo) ── */
  --color-primary:        #7B2040;
  --color-primary-rgb:    123, 32, 64;
  --color-primary-light:  #9B3558;
  --color-primary-dark:   #4E1228;

  /* ── Secondary — Champagne Gold ── */
  --color-secondary:      #C4A04A;
  --color-secondary-rgb:  196, 160, 74;
  --color-secondary-light:#D4B870;
  --color-secondary-dark: #9A7830;

  /* ── Neutrals ── */
  --color-cream:          #FAF6F0;   /* Page background */
  --color-cream-mid:      #EEE5D8;   /* Card/section backgrounds */
  --color-cream-dark:     #DDD0BE;   /* Borders, dividers */
  --color-taupe:          #A8918A;   /* Secondary text, muted labels */
  --color-dark:           #1C0912;   /* Primary text */
  --color-white:          #FFFFFF;

  /* ── Semantic ── */
  --color-surface:        var(--color-cream);
  --color-surface-raised: var(--color-white);
  --color-text:           var(--color-dark);
  --color-text-muted:     var(--color-taupe);
  --color-border:         var(--color-cream-dark);
  --color-accent:         var(--color-secondary);
}
```

**Color Roles:**

| Token | Value | Role |
|-------|-------|------|
| `--color-primary` | `#7B2040` | Brand color, CTAs, headings on light bg, logo match |
| `--color-secondary` | `#C4A04A` | Accent lines, icon highlights, premium badges, hover gold |
| `--color-cream` | `#FAF6F0` | Page & section backgrounds |
| `--color-cream-mid` | `#EEE5D8` | Cards, testimonial blocks, subtle panels |
| `--color-dark` | `#1C0912` | Body text, nav items |
| `--color-taupe` | `#A8918A` | Captions, labels, meta text |

---

## 3. Typography Rules

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');

:root {
  --font-display:  'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-body:     'Montserrat', Arial, Helvetica, sans-serif;

  /* Size scale */
  --text-xs:    0.75rem;   /*  12px */
  --text-sm:    0.875rem;  /*  14px */
  --text-base:  1rem;      /*  16px */
  --text-lg:    1.125rem;  /*  18px */
  --text-xl:    1.375rem;  /*  22px */
  --text-2xl:   1.75rem;   /*  28px */
  --text-3xl:   2.5rem;    /*  40px */
  --text-4xl:   3.5rem;    /*  56px */
  --text-5xl:   5rem;      /*  80px */
  --text-hero:  7.5rem;    /* 120px */

  /* Weight */
  --weight-light:   300;
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semi:    600;

  /* Line height */
  --leading-tight:  1.1;
  --leading-snug:   1.3;
  --leading-normal: 1.6;
  --leading-relaxed:1.8;

  /* Letter spacing */
  --tracking-tight:  -0.02em;
  --tracking-normal:  0em;
  --tracking-wide:    0.08em;
  --tracking-wider:   0.18em;
  --tracking-widest:  0.3em;
}
```

**Type Hierarchy:**

| Level | Font | Size | Weight | Tracking | Usage |
|-------|------|------|--------|---------|-------|
| Hero | Cormorant Garamond | `--text-hero` | 300 | tight | Single-word/short hero statements |
| H1 | Cormorant Garamond | `--text-5xl` | 400 | tight | Page titles |
| H2 | Cormorant Garamond | `--text-4xl` | 300 italic | tight | Section headings |
| H3 | Cormorant Garamond | `--text-3xl` | 400 | normal | Sub-section headings |
| Eyebrow | Montserrat | `--text-xs` | 500 | widest | All-caps labels above headings |
| Body | Montserrat | `--text-base` | 300 | normal | Paragraphs |
| Caption | Montserrat | `--text-sm` | 400 | wide | Image captions, meta |
| CTA | Montserrat | `--text-sm` | 500 | wider | Button text (always all-caps) |

**Forbidden:**  
- No system sans-serif for headlines  
- No bold (700+) weight on display font — heaviness destroys the luxury feel  
- No pure black (`#000000`) — always use `--color-dark`  
- No centered body text blocks longer than 3 lines

---

## 4. Component Stylings

### Buttons

```css
/* Primary Button */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--color-primary);
  color: var(--color-cream);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  border: 1px solid var(--color-primary);
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
.btn-primary:hover  { background: var(--color-primary-dark); border-color: var(--color-primary-dark); }
.btn-primary:active { background: var(--color-primary-dark); transform: translateY(1px); }
.btn-primary:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 3px; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

/* Outline Button */
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: transparent;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  border: 1px solid var(--color-primary);
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}
.btn-outline:hover  { background: var(--color-primary); color: var(--color-cream); }
.btn-outline:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 3px; }
.btn-outline:disabled { opacity: 0.45; cursor: not-allowed; }

/* Gold Accent Button */
.btn-gold {
  padding: 0.875rem 2rem;
  background: var(--color-secondary);
  color: var(--color-dark);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
}
.btn-gold:hover { background: var(--color-secondary-dark); color: var(--color-white); }
.btn-gold:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.btn-gold:disabled { opacity: 0.45; cursor: not-allowed; }
```

### Cards

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  padding: 2rem;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.card:hover {
  box-shadow: 0 12px 40px rgba(var(--color-primary-rgb), 0.1);
  transform: translateY(-4px);
}

.card-service {
  position: relative;
  overflow: hidden;
}
.card-service::before {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 3px; height: 0;
  background: var(--color-secondary);
  transition: height 0.4s ease;
}
.card-service:hover::before { height: 100%; }
```

### Navigation

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
  background: transparent;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.nav.scrolled {
  background: var(--color-white);
  box-shadow: 0 2px 20px rgba(var(--color-primary-rgb), 0.06);
}
.nav-link {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--color-dark);
  text-decoration: none;
  position: relative;
  padding-bottom: 2px;
  transition: color 0.2s ease;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0; left: 50%;
  width: 0; height: 1px;
  background: var(--color-secondary);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}
.nav-link:hover { color: var(--color-primary); }
.nav-link:hover::after { width: 100%; }
```

### Divider / Gold Rule

```css
.gold-rule {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
}
.gold-rule::before,
.gold-rule::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-secondary), transparent);
}
```

---

## 5. Layout Principles

```css
:root {
  --container-max:   1200px;
  --container-wide:  1440px;
  --container-tight: 800px;

  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */
}
```

**Grid:**  
- 12-column grid, 24px gutter  
- Hero: full-bleed  
- Content sections: max-width 1200px, centered  
- Text columns: max-width 680px for readability  
- Services grid: 3-col desktop, 2-col tablet, 1-col mobile  

**Section Rhythm:**  
- Padding between sections: `--space-24` to `--space-32`  
- Internal section padding: `--space-16` to `--space-20`  
- Never less than `--space-12` between major sections  

---

## 6. Depth & Elevation

```css
:root {
  --shadow-sm:  0 1px 4px rgba(var(--color-primary-rgb), 0.06);
  --shadow-md:  0 4px 16px rgba(var(--color-primary-rgb), 0.08);
  --shadow-lg:  0 12px 40px rgba(var(--color-primary-rgb), 0.12);
  --shadow-xl:  0 24px 64px rgba(var(--color-primary-rgb), 0.16);
  --shadow-gold: 0 4px 20px rgba(var(--color-secondary-rgb), 0.25);
}
```

**Elevation Rules:**  
- Page background: 0 (flat, no shadow)  
- Cards at rest: `--shadow-sm`  
- Cards on hover: `--shadow-lg`  
- Modals / drawers: `--shadow-xl`  
- Gold-accented featured elements: `--shadow-gold`  
- Never stack shadows — one elevation level per element  

---

## 7. Animation & Interaction (L2)

```css
:root {
  --ease-smooth:   cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-expo:  cubic-bezier(0.95, 0.05, 0.795, 0.035);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);

  --duration-fast:   150ms;
  --duration-normal: 300ms;
  --duration-slow:   600ms;
  --duration-slower: 900ms;
}

/* Entrance: FadeInUp */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Gold shimmer on text */
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

/* Scroll Reveal */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity var(--duration-slow) var(--ease-out-expo),
              transform var(--duration-slow) var(--ease-out-expo);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger children */
.stagger > * { transition-delay: calc(var(--i, 0) * 80ms); }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

**Interaction Rules:**  
- Hover transitions: always `300ms` `--ease-smooth`  
- Entrance animations: `600ms` `--ease-out-expo`, staggered 80ms  
- Never animate `width` or `height` — use `transform` and `opacity`  
- Gold shimmer only on premium/featured elements — max 1 per viewport  
- Navigation scroll-state change: `300ms` fade  

---

## 8. Do's and Don'ts

**DO:**
- ✅ Use Cormorant Garamond for all display text
- ✅ Always pair burgundy with generous cream space — the cream is what makes the burgundy breathe
- ✅ Use gold as an accent only — one or two moments per section
- ✅ Use thin (1px) borders and rules; never thick
- ✅ Let images bleed to the edge in hero sections
- ✅ Use lowercase in Cormorant Garamond for body headings — feels more intimate
- ✅ Use all-caps Montserrat 500 for eyebrows and button labels only
- ✅ Add generous padding inside cards — minimum 2rem on all sides

**DON'T:**
- ❌ Don't use burgundy as a background for large sections — it reads as heavy; reserve for accents + CTAs
- ❌ Don't use bold Cormorant Garamond (600+) — destroys the light, European feel
- ❌ Don't combine gold AND burgundy on the same interactive element
- ❌ Don't use sans-serif for hero or section headings
- ❌ Don't center-align long body copy (3+ lines)
- ❌ Don't add drop shadows to text — use color contrast instead
- ❌ Don't use pure white `#fff` for backgrounds — always `--color-cream` or `--color-white` (which can be pure white only for cards on cream bg)
- ❌ Don't use more than 3 font sizes in a single card component

---

## 9. Responsive Behavior

| Breakpoint | Width | Strategy |
|------------|-------|----------|
| Mobile S   | 360px | Single column, reduce hero font by 50% |
| Mobile L   | 480px | Single column |
| Tablet     | 768px | 2-column grids, reduced nav to hamburger |
| Desktop S  | 1024px | Full layout begins |
| Desktop    | 1200px | Full layout, max-content-width container |
| Wide       | 1440px+ | Content stays at 1200px, bg bleeds |

**Fold Strategy:**
- Hero H1: scales from `--text-3xl` (mobile) to `--text-hero` (desktop) via `clamp()`
- Section headings: `clamp(2rem, 5vw, 3.5rem)`
- Navigation: collapses to hamburger at 768px
- Service cards: 1 → 2 → 3 columns
- Touch targets: minimum 44×44px
- No horizontal overflow at any breakpoint
