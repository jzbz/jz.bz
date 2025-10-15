// Particle System
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;
        this.mouse = { x: null, y: null, radius: 150 };
        
        this.init();
        this.animate();
        this.setupEventListeners();
    }
    
    init() {
        this.resize();
        this.createParticles();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });
        
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
    
    drawParticle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(222, 255, 133, ${particle.opacity})`;
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(222, 255, 133, 0.5)';
    }
    
    updateParticle(particle) {
        // Mouse interaction
        if (this.mouse.x != null && this.mouse.y != null) {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouse.radius) {
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                particle.vx -= Math.cos(angle) * force * 0.2;
                particle.vy -= Math.sin(angle) * force * 0.2;
            }
        }
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Damping
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        
        // Boundary check
        if (particle.x < 0 || particle.x > this.canvas.width) {
            particle.vx *= -1;
            particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
        }
        if (particle.y < 0 || particle.y > this.canvas.height) {
            particle.vy *= -1;
            particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
        }
    }
    
    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    const opacity = (1 - distance / 120) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(166, 226, 46, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });
        
        // Connect nearby particles
        this.connectParticles();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        requestAnimationFrame(() => this.animate());
    }
}

// Typing effect for name
class TypingEffect {
    constructor(element, text, speed = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.index = 0;
        this.isDeleting = false;
        
        // Store original text and clear element
        this.originalText = text;
        this.element.textContent = '';
        
        this.type();
    }
    
    type() {
        const current = this.index;
        const displayText = this.originalText.substring(0, current);
        
        this.element.textContent = displayText;
        
        let delta = this.speed;
        
        if (!this.isDeleting && current === this.originalText.length) {
            // Pause at end
            delta = 2000;
            this.isDeleting = true;
        } else if (this.isDeleting && current === 0) {
            // Start typing again
            this.isDeleting = false;
            delta = 500;
        }
        
        if (this.isDeleting) {
            this.index--;
            delta = this.speed / 2;
        } else {
            this.index++;
        }
        
        setTimeout(() => this.type(), delta);
    }
}

// Enhanced link interactions
class LinkEnhancer {
    constructor() {
        this.links = document.querySelectorAll('.link-hover');
        this.init();
    }
    
    init() {
        this.links.forEach(link => {
            link.addEventListener('mouseenter', (e) => this.onMouseEnter(e));
            link.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
            link.addEventListener('mousemove', (e) => this.onMouseMove(e));
        });
    }
    
    onMouseEnter(e) {
        const link = e.currentTarget;
        link.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }
    
    onMouseLeave(e) {
        const link = e.currentTarget;
        link.style.transform = 'translateY(0) scale(1) rotateX(0) rotateY(0)';
    }
    
    onMouseMove(e) {
        const link = e.currentTarget;
        const rect = link.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        link.style.transform = `translateY(-3px) scale(1.05) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
}

// Smooth scroll reveal
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.fade-in');
        this.init();
    }
    
    init() {
        this.observe();
    }
    
    observe() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1
        });
        
        this.elements.forEach(element => {
            observer.observe(element);
        });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    new ParticleSystem();
    
    // Initialize link enhancer
    new LinkEnhancer();
    
    // Initialize scroll reveal
    new ScrollReveal();
    
    // Optional: Add typing effect to name (commented out by default)
    // const nameElement = document.getElementById('name-title');
    // if (nameElement) {
    //     new TypingEffect(nameElement, 'Jonathan Zeppettini', 100);
    // }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Press 'p' to toggle particles
        if (e.key === 'p' && e.ctrlKey) {
            e.preventDefault();
            const canvas = document.getElementById('particles');
            canvas.style.display = canvas.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    // Performance optimization: reduce particles on mobile
    if (window.innerWidth < 768) {
        const canvas = document.getElementById('particles');
        if (canvas) {
            canvas.style.opacity = '0.5';
        }
    }
});

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
