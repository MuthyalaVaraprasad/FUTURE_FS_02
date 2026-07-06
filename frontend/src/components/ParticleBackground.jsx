import React, { useEffect, useRef } from 'react';

// Top-level Particle class to ensure clean scoping and avoid redeclaring inside the hook
class Particle {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = Math.random() * 1.5 + 1;
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off walls
    if (this.x < 0 || this.x > width) this.vx = -this.vx;
    if (this.y < 0 || this.y > height) this.vy = -this.vy;
  }

  draw(ctx, activeTheme) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    
    // Dynamic colors based on activeTheme
    if (activeTheme === 'cyberpunk') {
      ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    } else if (activeTheme === 'light') {
      ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
    } else {
      ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
    }
    
    ctx.fill();
  }
}

const ParticleBackground = ({ activeTheme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Handle resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Initialize particles
    const particleCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 25000));
    const particles = Array.from(
      { length: particleCount }, 
      () => new Particle(canvas.width, canvas.height)
    );

    // Connection distance
    const connectionDist = 120;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx, activeTheme);
      });

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            if (activeTheme === 'cyberpunk') {
              ctx.strokeStyle = `rgba(255, 0, 127, ${alpha})`;
            } else if (activeTheme === 'light') {
              ctx.strokeStyle = `rgba(79, 70, 229, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            }
            
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTheme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default ParticleBackground;
