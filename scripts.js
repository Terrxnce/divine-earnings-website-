// Enhanced Oil-Water Lava Lamp Animation for Divine Earnings
// Implements sophisticated physics simulation with purple/black theming

class OilWaterLavaLamp {
    constructor(canvasId = 'hero-canvas') {
        console.log(`Initializing Oil-Water Lava Lamp Animation for ${canvasId}...`);
        
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.blobs = [];
        this.mouse = { x: 0, y: 0, radius: 150, active: false };
        this.time = 0;
        this.animationId = null;
        
        // Device detection for responsive design
        this.isMobile = window.innerWidth <= 767;
        this.isTablet = window.innerWidth >= 768 && window.innerWidth <= 1199;
        this.isDesktop = window.innerWidth >= 1200;
        
        // Performance settings based on device
        this.settings = this.getDeviceSettings();
        
        // Color scheme - Purple and Black theme
        this.colors = {
            background: '#0a0a0f',
            oil: {
                primary: '#6F63E7',
                secondary: '#5749c4',
                light: '#9189ef',
                dark: '#4a3d9a'
            },
            water: {
                primary: '#1a1a2e',
                secondary: '#0f0f1a',
                light: '#2d2d4a',
                dark: '#000000'
            }
        };
        
        this.init();
    }
    
    getDeviceSettings() {
        if (this.isMobile) {
            return {
                blobCount: 12,
                maxRadius: 25,
                minRadius: 8,
                interactionRadius: 100,
                targetFPS: 30,
                useSimpleShapes: true,
                enableGradients: false
            };
        } else if (this.isTablet) {
            return {
                blobCount: 18,
                maxRadius: 35,
                minRadius: 12,
                interactionRadius: 120,
                targetFPS: 60,
                useSimpleShapes: true,
                enableGradients: true
            };
        } else {
            return {
                blobCount: 25,
                maxRadius: 45,
                minRadius: 15,
                interactionRadius: 150,
                targetFPS: 60,
                useSimpleShapes: true,
                enableGradients: true
            };
        }
    }
    
    init() {
        this.resize();
        this.createBlobs();
        this.bindEvents();
        this.animate();
        console.log(`Lava lamp initialized with ${this.blobs.length} blobs for ${this.isMobile ? 'mobile' : this.isTablet ? 'tablet' : 'desktop'} device`);
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }
    
    createBlobs() {
        this.blobs = [];
        
        for (let i = 0; i < this.settings.blobCount; i++) {
            const isOil = Math.random() > 0.4; // 60% oil, 40% water
            const radius = this.settings.minRadius + Math.random() * (this.settings.maxRadius - this.settings.minRadius);
            
            this.blobs.push({
                x: Math.random() * (this.width - radius * 2) + radius,
                y: Math.random() * (this.height - radius * 2) + radius,
                vx: (Math.random() - 0.5) * 1.2,  // Increased initial velocity
                vy: (Math.random() - 0.5) * 1.2,
                radius: radius,
                originalRadius: radius,
                type: isOil ? 'oil' : 'water',
                age: 0
            });
        }
    }
    
    bindEvents() {
        // Mouse interaction
        const updateMouse = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        };
        
        this.canvas.addEventListener('mousemove', updateMouse);
        this.canvas.addEventListener('mouseenter', () => this.mouse.active = true);
        this.canvas.addEventListener('mouseleave', () => this.mouse.active = false);
        
        // Touch support for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.mouse.active = true;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.mouse.active = true;
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.mouse.active = false;
        });
        
        // Resize handling
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
                this.createBlobs();
            }, 250);
        });
    }
    
    updatePhysics() {
        this.blobs.forEach((blob, i) => {
            blob.age += 0.016;
            
            // Mouse interaction
            if (this.mouse.active) {
                const dx = this.mouse.x - blob.x;
                const dy = this.mouse.y - blob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.settings.interactionRadius) {
                    const force = (1 - distance / this.settings.interactionRadius) * 0.02;
                    const angle = Math.atan2(dy, dx);
                    
                    // Repulsion effect
                    blob.vx -= Math.cos(angle) * force;
                    blob.vy -= Math.sin(angle) * force;
                }
            }
            
            // Blob-to-blob interactions
            for (let j = i + 1; j < this.blobs.length; j++) {
                const other = this.blobs[j];
                const dx = other.x - blob.x;
                const dy = other.y - blob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = blob.radius + other.radius;
                
                if (distance < minDistance) {
                    // Calculate collision normal
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    // Separate blobs to prevent overlap
                    const overlap = minDistance - distance;
                    const separationX = nx * overlap * 0.5;
                    const separationY = ny * overlap * 0.5;
                    
                    blob.x -= separationX;
                    blob.y -= separationY;
                    other.x += separationX;
                    other.y += separationY;
                    
                    // Elastic collision with damping
                    const relativeVx = blob.vx - other.vx;
                    const relativeVy = blob.vy - other.vy;
                    const velocityAlongNormal = relativeVx * nx + relativeVy * ny;
                    
                    if (velocityAlongNormal < 0) {
                        const restitution = 0.8; // Increased bounce factor from 0.7 to 0.8
                        const impulse = -(1 + restitution) * velocityAlongNormal;
                        
                        const impulseX = impulse * nx;
                        const impulseY = impulse * ny;
                        
                        blob.vx -= impulseX;
                        blob.vy -= impulseY;
                        other.vx += impulseX;
                        other.vy += impulseY;
                    }
                }
            }
            
            // Apply damping
            blob.vx *= 0.98;
            blob.vy *= 0.98;
            
            // Add random directional drift to simulate liquid currents
            blob.vx += (Math.random() - 0.5) * 0.01;
            blob.vy += (Math.random() - 0.5) * 0.01;
            
            // Ensure blobs never completely stop (minimum velocity)
            if (Math.abs(blob.vx) < 0.05) blob.vx += (Math.random() - 0.5) * 0.1;
            if (Math.abs(blob.vy) < 0.05) blob.vy += (Math.random() - 0.5) * 0.1;
            
            // Update position
            blob.x += blob.vx;
            blob.y += blob.vy;
            
            // Boundary collision - ensure blobs never exit canvas
            if (blob.x - blob.radius < 0 || blob.x + blob.radius > this.width) {
                blob.vx *= -0.85; // Increased bounce factor from 0.8 to 0.85
                blob.x = Math.max(blob.radius, Math.min(this.width - blob.radius, blob.x));
            }
            if (blob.y - blob.radius < 0 || blob.y + blob.radius > this.height) {
                blob.vy *= -0.85; // Increased bounce factor from 0.8 to 0.85
                blob.y = Math.max(blob.radius, Math.min(this.height - blob.radius, blob.y));
            }
            
            // Dynamic radius with very subtle variation (reduced breathing effect)
            const pressureFactor = 1 + Math.sin(blob.age * 0.5) * 0.01; // Reduced from 0.05 to 0.01
            blob.radius = blob.originalRadius * pressureFactor;
        });
    }
    
    drawBlob(blob) {
        // Create gradient for blob
        const gradient = this.ctx.createRadialGradient(
            blob.x - blob.radius * 0.3, 
            blob.y - blob.radius * 0.3, 
            0,
            blob.x, 
            blob.y, 
            blob.radius
        );
        
        if (blob.type === 'oil') {
            gradient.addColorStop(0, this.colors.oil.light);
            gradient.addColorStop(0.7, this.colors.oil.primary);
            gradient.addColorStop(1, this.colors.oil.dark);
        } else {
            gradient.addColorStop(0, this.colors.water.light);
            gradient.addColorStop(0.7, this.colors.water.primary);
            gradient.addColorStop(1, this.colors.water.dark);
        }
        
        // Draw blob
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add subtle outline
        this.ctx.strokeStyle = blob.type === 'oil' ? this.colors.oil.secondary : this.colors.water.secondary;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    animate() {
        this.time += 0.016;
        
        // Clear canvas with background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add ambient lighting effect
        const ambientGradient = this.ctx.createRadialGradient(
            this.width * 0.5, this.height * 0.3, 0,
            this.width * 0.5, this.height * 0.3, this.width * 0.8
        );
        ambientGradient.addColorStop(0, 'rgba(111, 99, 231, 0.05)');
        ambientGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        
        this.ctx.fillStyle = ambientGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Update physics
        this.updatePhysics();
        
        // Draw blobs
        this.blobs.forEach(blob => this.drawBlob(blob));
        
        // Debug info for first few seconds
        if (this.time < 3) {
            console.log(`Animation frame: ${this.time.toFixed(2)}s, Canvas: ${this.width}x${this.height}, Blobs: ${this.blobs.length}`);
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        console.log('Lava lamp animation destroyed');
    }
}

// Initialize the animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing lava lamp animations...');
    
    // Wait a bit for canvas to be properly sized
    setTimeout(() => {
        try {
            // Initialize all hero canvas elements
            const canvasIds = [
                'hero-canvas',
                'about-hero-canvas',
                'membership-hero-canvas',
                'results-hero-canvas',
                'contact-hero-canvas'
            ];
            
            window.lavaLampAnimations = [];
            
            canvasIds.forEach(canvasId => {
                const canvas = document.getElementById(canvasId);
                if (canvas) {
                    console.log(`Initializing animation for ${canvasId}`);
                    const animation = new OilWaterLavaLamp(canvasId);
                    window.lavaLampAnimations.push(animation);
                }
            });
            
            // Keep the main one for backward compatibility
            if (window.lavaLampAnimations.length > 0) {
                window.lavaLampAnimation = window.lavaLampAnimations[0];
            }
        } catch (error) {
            console.error('Error initializing lava lamp:', error);
        }
    }, 100);
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (window.lavaLampAnimations) {
        if (document.hidden) {
            window.lavaLampAnimations.forEach(animation => animation.destroy());
        } else {
            // Reinitialize animations
            const canvasIds = [
                'hero-canvas',
                'about-hero-canvas',
                'membership-hero-canvas',
                'results-hero-canvas',
                'contact-hero-canvas'
            ];
            
            window.lavaLampAnimations = [];
            canvasIds.forEach(canvasId => {
                const canvas = document.getElementById(canvasId);
                if (canvas) {
                    const animation = new OilWaterLavaLamp(canvasId);
                    window.lavaLampAnimations.push(animation);
                }
            });
        }
    }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navigation = document.querySelector('#main-navigation');
    
    if (mobileMenuToggle && navigation) {
        mobileMenuToggle.addEventListener('click', () => {
            const isActive = navigation.classList.contains('active');
            
            if (isActive) {
                // Close menu
                navigation.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                // Open menu
                navigation.classList.add('active');
                mobileMenuToggle.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
        
        // Close menu when clicking on a link
        navigation.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navigation.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navigation.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navigation.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Navbar scroll effect - enhanced shadow only
    const header = document.querySelector('#top-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 50) {
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.25)';
            }
        });
    }

    // Back to top button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = item.querySelector('.toggle-icon i');
        
        if (question && answer) {
            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');
                
                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherIcon = otherItem.querySelector('.toggle-icon i');
                        if (otherAnswer) otherAnswer.style.maxHeight = '0px';
                        if (otherIcon) otherIcon.className = 'fas fa-plus';
                    }
                });
                
                // Toggle current item
                if (!isOpen) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    if (icon) icon.className = 'fas fa-minus';
                } else {
                    item.classList.remove('active');
                    answer.style.maxHeight = '0px';
                    if (icon) icon.className = 'fas fa-plus';
                }
            });
        }
    });

    // Testimonial slider
    let currentSlide = 0;
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    if (slides.length > 0) {
        showSlide(0);
        
        // Auto-advance slides every 6 seconds
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, 6000);
        
        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Reveal on scroll with graceful fallback
    (function(){
      const els = document.querySelectorAll('.reveal');
      if (!('IntersectionObserver' in window)) {
        els.forEach(el => el.classList.add('is-visible'));
        return;
      }
      const obs = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },{root:null, rootMargin:'0px 0px -10% 0px', threshold:0.15});
      els.forEach(el=>obs.observe(el));
    })();
});