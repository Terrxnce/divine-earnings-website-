/**
 * D.E.V.I Lightning Blobs Animation
 * Hero-style lava lamp blobs with lightning pulsing effects
 * Performance optimized, accessibility compliant
 */

const DEVILightningConfig = {
  blobCount: 12,
  maxRadius: 35,
  minRadius: 15,
  interactionRadius: 120,
  lightning: {
    color: '#1F3FCF',
    highlight: 'rgba(31,63,207,0.8)',
    glowColor: 'rgba(31,63,207,0.4)',
    pulseFrequency: 2000, // ms between pulses
    pulseDuration: 800,   // ms pulse lasts
    thickness: [2, 4],
    maxConcurrent: { desktop: 3, mobile: 2 },
  },
  colors: { 
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
    },
    background: '#0a0a0f'
  }
};

class DEVILightningBlobs {
  constructor(canvasId = 'devi-lightning-bg') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`DEVI Lightning: Canvas ${canvasId} not found`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;
    this.isVisible = true;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Device detection
    this.isMobile = window.innerWidth <= 768;
    this.devicePixelRatio = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
    
    // Performance tracking
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    
    // Animation state
    this.blobs = [];
    this.lightningArcs = [];
    this.time = 0;
    this.nextLightningTime = 0;
    
    // Noise for blob movement (simplified Perlin-like)
    this.noiseOffset = Math.random() * 1000;
    
    this.init();
  }

  init() {
    if (this.isReducedMotion) {
      this.renderStaticFrame();
      return;
    }

    this.setupCanvas();
    this.createBlobs();
    this.setupIntersectionObserver();
    this.scheduleNextLightning();
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', this.debounce(() => {
      this.setupCanvas();
      this.createBlobs();
    }, 250));

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else if (this.isVisible) {
        this.resume();
      }
    });
  }

  setupCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Set display size
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    // Set actual size with device pixel ratio
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    
    // Scale context to match device pixel ratio
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    
    this.width = width;
    this.height = height;
  }

  createBlobs() {
    this.blobs = [];
    const count = DEVILightningConfig.blobCount;
    
    for (let i = 0; i < count; i++) {
      const isOil = Math.random() > 0.4; // 60% oil, 40% water like hero
      const radius = DEVILightningConfig.minRadius + Math.random() * (DEVILightningConfig.maxRadius - DEVILightningConfig.minRadius);
      
      const blob = {
        id: i,
        x: Math.random() * (this.width - radius * 2) + radius,
        y: Math.random() * (this.height - radius * 2) + radius,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: radius,
        originalRadius: radius,
        type: isOil ? 'oil' : 'water',
        age: 0,
        lightningCharge: 0, // For lightning pulsing
        lastLightningTime: 0
      };
      this.blobs.push(blob);
    }
  }

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animationId) {
          this.resume();
        } else if (!this.isVisible && this.animationId) {
          this.pause();
        }
      });
    }, { rootMargin: '50px' });
    
    observer.observe(this.canvas);
  }

  triggerLightningPulse(blob1, blob2) {
    // Charge both blobs with lightning
    blob1.lightningCharge = 1.0;
    blob2.lightningCharge = 1.0;
    blob1.lastLightningTime = this.time;
    blob2.lastLightningTime = this.time;
    
    // Create lightning arc between blobs
    const lightning = {
      startX: blob1.x,
      startY: blob1.y,
      endX: blob2.x,
      endY: blob2.y,
      startTime: this.time,
      duration: DEVILightningConfig.lightning.pulseDuration,
      intensity: 1.0
    };
    
    if (!this.lightningArcs) this.lightningArcs = [];
    this.lightningArcs.push(lightning);
  }

  scheduleNextLightning() {
    // Random lightning pulses
    if (Math.random() < 0.01 && this.blobs.length > 1) {
      const blob1 = this.blobs[Math.floor(Math.random() * this.blobs.length)];
      const blob2 = this.blobs[Math.floor(Math.random() * this.blobs.length)];
      if (blob1 !== blob2) {
        this.triggerLightningPulse(blob1, blob2);
      }
    }
  }

  createLightning() {
    const maxConcurrent = this.isMobile ? 
      DEVILightningConfig.lightning.maxConcurrent.mobile : 
      DEVILightningConfig.lightning.maxConcurrent.desktop;
    
    if (this.lightningArcs.length >= maxConcurrent) return;
    
    // Pick two random blobs
    const blob1 = this.blobs[Math.floor(Math.random() * this.blobs.length)];
    const blob2 = this.blobs[Math.floor(Math.random() * this.blobs.length)];
    
    if (blob1 === blob2) return;
    
    const duration = this.randomBetween(...DEVILightningConfig.lightning.durationMs);
    const afterglow = this.randomBetween(...DEVILightningConfig.lightning.afterglowMs);
    
    const lightning = {
      startX: blob1.x,
      startY: blob1.y,
      endX: blob2.x,
      endY: blob2.y,
      path: this.generateLightningPath(blob1.x, blob1.y, blob2.x, blob2.y),
      startTime: this.time,
      duration: duration,
      afterglowDuration: afterglow,
      thickness: this.randomBetween(...DEVILightningConfig.lightning.thickness),
      opacity: 0
    };
    
    this.lightningArcs.push(lightning);
    this.scheduleNextLightning();
  }

  generateLightningPath(x1, y1, x2, y2) {
    const points = [{ x: x1, y: y1 }];
    const segments = Math.floor(Math.random() * 4) + 3; // 3-6 segments
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = x1 + (x2 - x1) * t;
      const baseY = y1 + (y2 - y1) * t;
      
      // Add jagged displacement
      const displacement = 20 * (1 - Math.abs(t - 0.5) * 2); // Max displacement at middle
      const angle = Math.random() * Math.PI * 2;
      
      points.push({
        x: baseX + Math.cos(angle) * displacement * Math.random(),
        y: baseY + Math.sin(angle) * displacement * Math.random()
      });
    }
    
    points.push({ x: x2, y: y2 });
    return points;
  }

  // Simplified noise function
  noise(x, y) {
    return Math.sin(x * 0.01) * Math.cos(y * 0.01) * 0.5 + 0.5;
  }

  updateBlobs(deltaTime) {
    this.blobs.forEach((blob, i) => {
      blob.age += 0.016;
      
      // Blob-to-blob interactions (same as hero)
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
            const restitution = 0.8;
            const impulse = -(1 + restitution) * velocityAlongNormal;
            
            const impulseX = impulse * nx;
            const impulseY = impulse * ny;
            
            blob.vx -= impulseX;
            blob.vy -= impulseY;
            other.vx += impulseX;
            other.vy += impulseY;
            
            // Trigger lightning on collision
            if (Math.random() < 0.3) {
              this.triggerLightningPulse(blob, other);
            }
          }
        }
      }
      
      // Apply damping
      blob.vx *= 0.98;
      blob.vy *= 0.98;
      
      // Add random directional drift
      blob.vx += (Math.random() - 0.5) * 0.01;
      blob.vy += (Math.random() - 0.5) * 0.01;
      
      // Ensure blobs never completely stop
      if (Math.abs(blob.vx) < 0.05) blob.vx += (Math.random() - 0.5) * 0.1;
      if (Math.abs(blob.vy) < 0.05) blob.vy += (Math.random() - 0.5) * 0.1;
      
      // Update position
      blob.x += blob.vx;
      blob.y += blob.vy;
      
      // Boundary collision
      if (blob.x - blob.radius < 0 || blob.x + blob.radius > this.width) {
        blob.vx *= -0.85;
        blob.x = Math.max(blob.radius, Math.min(this.width - blob.radius, blob.x));
      }
      if (blob.y - blob.radius < 0 || blob.y + blob.radius > this.height) {
        blob.vy *= -0.85;
        blob.y = Math.max(blob.radius, Math.min(this.height - blob.radius, blob.y));
      }
      
      // Dynamic radius with subtle variation
      const pressureFactor = 1 + Math.sin(blob.age * 0.5) * 0.02;
      blob.radius = blob.originalRadius * pressureFactor;
      
      // Update lightning charge decay
      if (blob.lightningCharge > 0) {
        blob.lightningCharge -= deltaTime * 0.002;
        blob.lightningCharge = Math.max(0, blob.lightningCharge);
      }
    });
  }

  updateLightning(deltaTime) {
    this.lightningArcs = this.lightningArcs.filter(lightning => {
      const elapsed = this.time - lightning.startTime;
      const totalDuration = lightning.duration + lightning.afterglowDuration;
      
      if (elapsed < lightning.duration) {
        // Main lightning phase
        lightning.opacity = Math.min(1, elapsed / 100) * 0.8; // Fade in quickly
      } else if (elapsed < totalDuration) {
        // Afterglow phase
        const afterglowProgress = (elapsed - lightning.duration) / lightning.afterglowDuration;
        lightning.opacity = (1 - afterglowProgress) * 0.4;
      } else {
        // Remove expired lightning
        return false;
      }
      
      return true;
    });
    
    // Create new lightning if it's time
    if (this.time >= this.nextLightningTime) {
      this.createLightning();
    }
  }

  render() {
    // Clear canvas with background color
    this.ctx.fillStyle = DEVILightningConfig.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Add ambient lighting effect (like hero)
    const ambientGradient = this.ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.3, 0,
      this.width * 0.5, this.height * 0.3, this.width * 0.8
    );
    ambientGradient.addColorStop(0, 'rgba(31, 63, 207, 0.08)');
    ambientGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    this.ctx.fillStyle = ambientGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Render blobs with lightning effects
    this.renderBlobs();
    
    // Render lightning arcs
    this.renderLightning();
  }

  renderBlobs() {
    this.blobs.forEach(blob => {
      // Create gradient for blob (same as hero)
      const gradient = this.ctx.createRadialGradient(
        blob.x - blob.radius * 0.3, 
        blob.y - blob.radius * 0.3, 
        0,
        blob.x, 
        blob.y, 
        blob.radius
      );
      
      // Use hero-style colors with lightning effects
      if (blob.type === 'oil') {
        gradient.addColorStop(0, DEVILightningConfig.colors.oil.light);
        gradient.addColorStop(0.7, DEVILightningConfig.colors.oil.primary);
        gradient.addColorStop(1, DEVILightningConfig.colors.oil.dark);
      } else {
        gradient.addColorStop(0, DEVILightningConfig.colors.water.light);
        gradient.addColorStop(0.7, DEVILightningConfig.colors.water.primary);
        gradient.addColorStop(1, DEVILightningConfig.colors.water.dark);
      }
      
      // Draw main blob
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add lightning effect if charged
      if (blob.lightningCharge > 0) {
        const pulseIntensity = Math.sin(this.time * 0.01) * 0.5 + 0.5;
        const lightningAlpha = blob.lightningCharge * pulseIntensity;
        
        // Lightning glow
        this.ctx.save();
        this.ctx.globalAlpha = lightningAlpha * 0.6;
        this.ctx.shadowColor = DEVILightningConfig.lightning.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = DEVILightningConfig.lightning.highlight;
        this.ctx.beginPath();
        this.ctx.arc(blob.x, blob.y, blob.radius * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Lightning pulse through blob
        this.ctx.save();
        this.ctx.globalAlpha = lightningAlpha * 0.8;
        this.ctx.fillStyle = DEVILightningConfig.lightning.color;
        this.ctx.beginPath();
        this.ctx.arc(blob.x, blob.y, blob.radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
      
      // Add subtle outline (like hero)
      this.ctx.strokeStyle = blob.type === 'oil' ? 
        DEVILightningConfig.colors.oil.secondary : 
        DEVILightningConfig.colors.water.secondary;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  }

  renderLightning() {
    if (!this.lightningArcs) return;
    
    this.lightningArcs.forEach(lightning => {
      const elapsed = this.time - lightning.startTime;
      if (elapsed > lightning.duration) return;
      
      const progress = elapsed / lightning.duration;
      const intensity = Math.sin(progress * Math.PI) * lightning.intensity;
      
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.globalAlpha = intensity;
      
      // Draw lightning bolt between blobs
      this.ctx.strokeStyle = DEVILightningConfig.lightning.color;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = DEVILightningConfig.lightning.color;
      this.ctx.shadowBlur = 15;
      
      this.ctx.beginPath();
      this.ctx.moveTo(lightning.startX, lightning.startY);
      
      // Add some jaggedness to the lightning
      const midX = (lightning.startX + lightning.endX) / 2 + (Math.sin(this.time * 0.1) * 10);
      const midY = (lightning.startY + lightning.endY) / 2 + (Math.cos(this.time * 0.1) * 10);
      
      this.ctx.lineTo(midX, midY);
      this.ctx.lineTo(lightning.endX, lightning.endY);
      this.ctx.stroke();
      
      // Draw brighter core
      this.ctx.globalAlpha = intensity * 0.8;
      this.ctx.strokeStyle = DEVILightningConfig.lightning.highlight;
      this.ctx.lineWidth = 1.5;
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();
      
      this.ctx.restore();
    });
    
    // Clean up expired arcs
    this.lightningArcs = this.lightningArcs.filter(lightning => 
      this.time - lightning.startTime <= lightning.duration
    );
  }

  renderStaticFrame() {
    this.setupCanvas();
    this.createBlobs();
    
    // Render a single static frame with background
    this.ctx.fillStyle = DEVILightningConfig.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Add static ambient lighting
    const ambientGradient = this.ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.3, 0,
      this.width * 0.5, this.height * 0.3, this.width * 0.8
    );
    ambientGradient.addColorStop(0, 'rgba(31, 63, 207, 0.08)');
    ambientGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    this.ctx.fillStyle = ambientGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.renderBlobs();
  }

  animate() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.time = currentTime;
    
    // Update FPS counter
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / (deltaTime || 16.67));
    }
    
    // Update animations
    this.updateBlobs(deltaTime);
    this.scheduleNextLightning(); // Check for random lightning
    
    // Render frame
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  pause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (!this.animationId && this.isVisible && !this.isReducedMotion) {
      this.lastFrameTime = performance.now();
      this.animate();
    }
  }

  // Utility functions
  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  destroy() {
    this.pause();
    window.removeEventListener('resize', this.setupCanvas);
    document.removeEventListener('visibilitychange', this.pause);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('devi-lightning-bg');
  if (canvas) {
    window.deviLightningAnimation = new DEVILightningBlobs();
  }
});

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEVILightningBlobs;
}
