'use strict';

// Particle System
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mouse = { x: null, y: null, radius: 150 };
        this.running = true;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Pre-rendered glow sprite: one drawImage stamp per particle replaces
        // arc + shadowBlur, which was the hot path's bottleneck.
        this.sprite = this.createSprite();

        this.resize();
        this.createParticles();
        this.setupEventListeners();

        if (this.reducedMotion) {
            this.drawFrame(); // Single static frame, no animation loop
        } else {
            this.animate();
        }
    }

    createSprite() {
        const size = 64;
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = size;
        const ctx = sprite.getContext('2d');
        const half = size / 2;
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, 'rgba(222, 255, 133, 1)');
        gradient.addColorStop(0.2, 'rgba(222, 255, 133, 0.9)');
        gradient.addColorStop(0.5, 'rgba(222, 255, 133, 0.2)');
        gradient.addColorStop(1, 'rgba(222, 255, 133, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return sprite;
    }

    resize() {
        // Scale the backing store for high-DPI displays (capped at 2x)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    createParticles() {
        // Scale particle count to viewport area (fewer on small screens)
        const count = Math.round(Math.min(90, Math.max(25, (this.width * this.height) / 16000)));
        this.particles = Array.from({ length: count }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        }));
    }

    setupEventListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
                this.createParticles();
                if (this.reducedMotion) this.drawFrame();
            }, 100);
        });

        if (this.reducedMotion) return;

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Only clear when the pointer leaves the window entirely, not when
        // it moves between elements
        window.addEventListener('mouseout', (e) => {
            if (!e.relatedTarget) {
                this.mouse.x = null;
                this.mouse.y = null;
            }
        });
    }

    updateParticle(p) {
        // Mouse repulsion
        if (this.mouse.x !== null) {
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const distSq = dx * dx + dy * dy;
            const radius = this.mouse.radius;

            if (distSq > 0 && distSq < radius * radius) {
                const distance = Math.sqrt(distSq);
                const force = (radius - distance) / radius;
                p.vx -= (dx / distance) * force * 0.2;
                p.vy -= (dy / distance) * force * 0.2;
            }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Bounce off edges
        if (p.x < 0 || p.x > this.width) {
            p.vx *= -1;
            p.x = Math.max(0, Math.min(this.width, p.x));
        }
        if (p.y < 0 || p.y > this.height) {
            p.vy *= -1;
            p.y = Math.max(0, Math.min(this.height, p.y));
        }
    }

    drawFrame() {
        const { ctx, particles } = this;
        ctx.clearRect(0, 0, this.width, this.height);

        // Particles (glow sprite stamps)
        for (const p of particles) {
            const r = p.size * 4;
            ctx.globalAlpha = p.opacity;
            ctx.drawImage(this.sprite, p.x - r, p.y - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1;

        // Connections (squared-distance check, sqrt only for actual matches)
        const maxDist = 120;
        const maxDistSq = maxDist * maxDist;
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxDistSq) {
                    const opacity = (1 - Math.sqrt(distSq) / maxDist) * 0.3;
                    ctx.strokeStyle = `rgba(166, 226, 46, ${opacity})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
    }

    animate() {
        if (!this.running) return;
        for (const p of this.particles) this.updateParticle(p);
        this.drawFrame();
        requestAnimationFrame(() => this.animate());
    }

    toggle() {
        this.running = !this.running;
        this.canvas.style.display = this.running ? '' : 'none';
        if (this.running && !this.reducedMotion) this.animate();
    }
}

// 3D tilt on hover
class LinkEnhancer {
    constructor() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        document.querySelectorAll('.link-hover').forEach(link => {
            link.addEventListener('mousemove', (e) => this.onMouseMove(link, e));
            link.addEventListener('mouseleave', () => this.onMouseLeave(link));
        });
    }

    onMouseMove(link, e) {
        // Throttle to one style update per frame
        if (link._tiltRaf) return;
        link._tiltRaf = requestAnimationFrame(() => {
            link._tiltRaf = null;
            const rect = link.getBoundingClientRect();
            const rotateX = (e.clientY - rect.top - rect.height / 2) / 10;
            const rotateY = (rect.width / 2 - (e.clientX - rect.left)) / 10;
            link.style.transform = `translateY(-3px) scale(1.05) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    }

    onMouseLeave(link) {
        if (link._tiltRaf) {
            cancelAnimationFrame(link._tiltRaf);
            link._tiltRaf = null;
        }
        link.style.transform = ''; // Hand control back to the stylesheet
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const particleSystem = new ParticleSystem(document.getElementById('particles'));
    new LinkEnhancer();

    // Ctrl+P toggles the particle background
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' && e.ctrlKey) {
            e.preventDefault();
            particleSystem.toggle();
        }
    });
});
