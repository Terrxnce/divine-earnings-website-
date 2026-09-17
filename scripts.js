/* Divine Earnings — site behaviour
   1. Lava-lamp hero canvas (purple/black)
   2. Header, mobile navigation, back-to-top
   3. FAQ accordion
   4. Reveal-on-scroll
*/

(function () {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ------------------------------------------------------------------
       1. Lava-lamp canvas
       ------------------------------------------------------------------ */
    class OilWaterLavaLamp {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.blobs = [];
            this.mouse = { x: 0, y: 0, active: false };
            this.animationId = null;
            this.running = false;
            this.inView = true;

            this.settings = this.getDeviceSettings();
            this.colors = {
                background: '#0a0a0f',
                oil: { primary: '#6F63E7', secondary: '#5749c4', light: '#9189ef', dark: '#4a3d9a' },
                water: { primary: '#1a1a2e', secondary: '#0f0f1a', light: '#2d2d4a', dark: '#000000' }
            };

            this.resize();
            this.createBlobs();
            this.bindEvents();

            if (reducedMotion.matches) {
                this.drawFrame();
            } else {
                this.start();
            }
        }

        getDeviceSettings() {
            const w = window.innerWidth;
            if (w <= 767) return { blobCount: 12, maxRadius: 25, minRadius: 8, interactionRadius: 100 };
            if (w <= 1199) return { blobCount: 18, maxRadius: 35, minRadius: 12, interactionRadius: 120 };
            return { blobCount: 25, maxRadius: 45, minRadius: 15, interactionRadius: 150 };
        }

        resize() {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
            this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.width = rect.width;
            this.height = rect.height;
        }

        createBlobs() {
            this.blobs = [];
            for (let i = 0; i < this.settings.blobCount; i++) {
                const radius = this.settings.minRadius + Math.random() * (this.settings.maxRadius - this.settings.minRadius);
                this.blobs.push({
                    x: Math.random() * Math.max(1, this.width - radius * 2) + radius,
                    y: Math.random() * Math.max(1, this.height - radius * 2) + radius,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: (Math.random() - 0.5) * 1.2,
                    radius,
                    originalRadius: radius,
                    type: Math.random() > 0.4 ? 'oil' : 'water',
                    age: 0
                });
            }
        }

        bindEvents() {
            const section = this.canvas.parentElement;
            const setMouse = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = clientX - rect.left;
                this.mouse.y = clientY - rect.top;
            };

            section.addEventListener('mousemove', (e) => { setMouse(e.clientX, e.clientY); this.mouse.active = true; });
            section.addEventListener('mouseleave', () => { this.mouse.active = false; });
            section.addEventListener('touchmove', (e) => {
                const t = e.touches[0];
                if (t) { setMouse(t.clientX, t.clientY); this.mouse.active = true; }
            }, { passive: true });
            section.addEventListener('touchend', () => { this.mouse.active = false; });

            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.settings = this.getDeviceSettings();
                    this.resize();
                    this.createBlobs();
                    if (!this.running) this.drawFrame();
                }, 200);
            });

            if ('IntersectionObserver' in window) {
                const io = new IntersectionObserver((entries) => {
                    this.inView = entries[0].isIntersecting;
                    if (this.inView) this.start(); else this.stop();
                }, { threshold: 0.05 });
                io.observe(this.canvas);
            }

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.stop(); else if (this.inView) this.start();
            });

            reducedMotion.addEventListener('change', () => {
                if (reducedMotion.matches) { this.stop(); this.drawFrame(); } else this.start();
            });
        }

        updatePhysics() {
            const s = this.settings;
            this.blobs.forEach((blob, i) => {
                blob.age += 0.016;

                if (this.mouse.active) {
                    const dx = this.mouse.x - blob.x;
                    const dy = this.mouse.y - blob.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < s.interactionRadius && distance > 0) {
                        const force = (1 - distance / s.interactionRadius) * 0.02;
                        blob.vx -= (dx / distance) * force;
                        blob.vy -= (dy / distance) * force;
                    }
                }

                for (let j = i + 1; j < this.blobs.length; j++) {
                    const other = this.blobs[j];
                    const dx = other.x - blob.x;
                    const dy = other.y - blob.y;
                    const distance = Math.hypot(dx, dy) || 0.001;
                    const minDistance = blob.radius + other.radius;
                    if (distance < minDistance) {
                        const nx = dx / distance;
                        const ny = dy / distance;
                        const overlap = minDistance - distance;
                        blob.x -= nx * overlap * 0.5;
                        blob.y -= ny * overlap * 0.5;
                        other.x += nx * overlap * 0.5;
                        other.y += ny * overlap * 0.5;

                        const relVx = blob.vx - other.vx;
                        const relVy = blob.vy - other.vy;
                        const alongNormal = relVx * nx + relVy * ny;
                        if (alongNormal < 0) {
                            const impulse = -(1 + 0.8) * alongNormal;
                            blob.vx -= impulse * nx;
                            blob.vy -= impulse * ny;
                            other.vx += impulse * nx;
                            other.vy += impulse * ny;
                        }
                    }
                }

                blob.vx *= 0.98;
                blob.vy *= 0.98;
                blob.vx += (Math.random() - 0.5) * 0.01;
                blob.vy += (Math.random() - 0.5) * 0.01;
                if (Math.abs(blob.vx) < 0.05) blob.vx += (Math.random() - 0.5) * 0.1;
                if (Math.abs(blob.vy) < 0.05) blob.vy += (Math.random() - 0.5) * 0.1;

                blob.x += blob.vx;
                blob.y += blob.vy;

                if (blob.x - blob.radius < 0 || blob.x + blob.radius > this.width) {
                    blob.vx *= -0.85;
                    blob.x = Math.max(blob.radius, Math.min(this.width - blob.radius, blob.x));
                }
                if (blob.y - blob.radius < 0 || blob.y + blob.radius > this.height) {
                    blob.vy *= -0.85;
                    blob.y = Math.max(blob.radius, Math.min(this.height - blob.radius, blob.y));
                }

                blob.radius = blob.originalRadius * (1 + Math.sin(blob.age * 0.5) * 0.01);
            });
        }

        drawBlob(blob) {
            const ctx = this.ctx;
            const c = blob.type === 'oil' ? this.colors.oil : this.colors.water;
            const gradient = ctx.createRadialGradient(
                blob.x - blob.radius * 0.3, blob.y - blob.radius * 0.3, 0,
                blob.x, blob.y, blob.radius
            );
            gradient.addColorStop(0, c.light);
            gradient.addColorStop(0.7, c.primary);
            gradient.addColorStop(1, c.dark);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = c.secondary;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        drawFrame() {
            const ctx = this.ctx;
            ctx.fillStyle = this.colors.background;
            ctx.fillRect(0, 0, this.width, this.height);

            const ambient = ctx.createRadialGradient(
                this.width * 0.5, this.height * 0.3, 0,
                this.width * 0.5, this.height * 0.3, this.width * 0.8
            );
            ambient.addColorStop(0, 'rgba(111, 99, 231, 0.05)');
            ambient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = ambient;
            ctx.fillRect(0, 0, this.width, this.height);

            this.blobs.forEach((blob) => this.drawBlob(blob));
        }

        tick = () => {
            if (!this.running) return;
            this.updatePhysics();
            this.drawFrame();
            this.animationId = requestAnimationFrame(this.tick);
        };

        start() {
            if (this.running || reducedMotion.matches) return;
            this.running = true;
            this.animationId = requestAnimationFrame(this.tick);
        }

        stop() {
            this.running = false;
            if (this.animationId) cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    function initHeroCanvases() {
        document.querySelectorAll('canvas.hero-background').forEach((canvas) => {
            try {
                new OilWaterLavaLamp(canvas);
            } catch (err) {
                canvas.remove();
            }
        });
    }

    /* ------------------------------------------------------------------
       2. Header, navigation, back-to-top
       ------------------------------------------------------------------ */
    function initHeader() {
        const header = document.getElementById('top-header');
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.getElementById('main-navigation');
        const backToTop = document.getElementById('back-to-top');

        const onScroll = () => {
            const y = window.scrollY || window.pageYOffset;
            if (header) header.classList.toggle('is-scrolled', y > 8);
            if (backToTop) backToTop.classList.toggle('visible', y > 400);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        if (backToTop) {
            backToTop.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
            });
        }

        if (!toggle || !nav) return;

        const setOpen = (open) => {
            nav.classList.toggle('active', open);
            toggle.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            document.body.style.overflow = open ? 'hidden' : '';
        };

        toggle.addEventListener('click', () => setOpen(!nav.classList.contains('active')));
        nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('active')) { setOpen(false); toggle.focus(); }
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024 && nav.classList.contains('active')) setOpen(false);
        });
    }

    /* ------------------------------------------------------------------
       3. FAQ accordion
       ------------------------------------------------------------------ */
    function initFaq() {
        const items = Array.from(document.querySelectorAll('.faq-item'));
        if (!items.length) return;

        const setItem = (item, open) => {
            const btn = item.querySelector('.faq-question');
            const icon = item.querySelector('.toggle-icon i');
            item.classList.toggle('is-open', open);
            if (btn) btn.setAttribute('aria-expanded', String(open));
            if (icon) icon.className = 'fas fa-plus';
        };

        items.forEach((item) => {
            const btn = item.querySelector('.faq-question');
            if (!btn) return;
            btn.addEventListener('click', () => {
                const willOpen = !item.classList.contains('is-open');
                items.forEach((other) => { if (other !== item) setItem(other, false); });
                setItem(item, willOpen);
            });
        });
    }

    /* ------------------------------------------------------------------
       4. Reveal on scroll
       ------------------------------------------------------------------ */
    function initReveal() {
        const els = document.querySelectorAll('.reveal');
        if (!els.length) return;
        if (!('IntersectionObserver' in window) || reducedMotion.matches) {
            els.forEach((el) => el.classList.add('is-visible'));
            return;
        }
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        els.forEach((el) => obs.observe(el));
    }

    function init() {
        initHeroCanvases();
        initHeader();
        initFaq();
        initReveal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
