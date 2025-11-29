import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Enhanced FinanceBackground Component
 * 🎨 Features:
 * - Animated financial chart lines
 * - Interactive cursor ripple grid effect
 * - Floating finance icons with Framer Motion
 * - Modern fintech gradient colors
 * - Smooth, professional animations
 * - GPU-optimized with will-change
 * - Magnetic cursor effects
 */
export default function FinanceBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const rippleGridRef = useRef(null);
  const rippleDataRef = useRef([]);

  // Handle mouse movement for ripple effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setMousePos({ x, y });

      // Create ripple at cursor position
      rippleDataRef.current.push({
        x,
        y,
        age: 0,
        maxAge: 600, // ms
        initialRadius: 20,
        maxRadius: 150
      });

      // Keep only recent ripples
      if (rippleDataRef.current.length > 10) {
        rippleDataRef.current.shift();
      }
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Chart data arrays for animation
    const charts = [
      {
        x: canvas.width * 0.15,
        y: canvas.height * 0.3,
        width: 200,
        height: 100,
        color: '#3B82F6',
        opacity: 0.15,
        speed: 0.003,
        offset: 0
      },
      {
        x: canvas.width * 0.7,
        y: canvas.height * 0.6,
        width: 250,
        height: 120,
        color: '#10B981',
        opacity: 0.12,
        speed: 0.002,
        offset: Math.PI / 2
      },
      {
        x: canvas.width * 0.5,
        y: canvas.height * 0.15,
        width: 180,
        height: 90,
        color: '#F59E0B',
        opacity: 0.1,
        speed: 0.0025,
        offset: Math.PI
      }
    ];

    // Floating particles with enhanced properties
    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 4)],
      opacity: Math.random() * 0.5 + 0.1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      type: Math.random() > 0.5 ? 'circle' : 'diamond',
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }));

    const drawWavyLine = (startX, startY, width, height, color, time, speed, offset) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();

      const points = 100;
      for (let i = 0; i < points; i++) {
        const x = startX + (i / points) * width;
        const y = startY + height / 2 + Math.sin(i * 0.1 + time * speed + offset) * (height / 3);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawGridPattern = () => {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 80;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    // Ripple grid effect at cursor
    const drawRippleGrid = () => {
      const now = Date.now();
      rippleDataRef.current = rippleDataRef.current.filter(ripple => {
        ripple.age = now - ripple.createdAt;
        return ripple.age < ripple.maxAge;
      });

      rippleDataRef.current.forEach(ripple => {
        const progress = ripple.age / ripple.maxAge;
        const radius = ripple.initialRadius + (ripple.maxRadius - ripple.initialRadius) * progress;
        const opacity = (1 - progress) * 0.3;

        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
        ctx.lineWidth = 2;

        // Outer circle
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner grid pattern in ripple
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.5})`;
        ctx.lineWidth = 1;
        const gridSize = 20;
        const startX = ripple.x - radius;
        const startY = ripple.y - radius;

        for (let x = startX; x < startX + radius * 2; x += gridSize) {
          if ((x - ripple.x) ** 2 <= radius ** 2) {
            ctx.beginPath();
            ctx.moveTo(x, ripple.y - Math.sqrt(radius ** 2 - (x - ripple.x) ** 2));
            ctx.lineTo(x, ripple.y + Math.sqrt(radius ** 2 - (x - ripple.x) ** 2));
            ctx.stroke();
          }
        }

        for (let y = startY; y < startY + radius * 2; y += gridSize) {
          if ((y - ripple.y) ** 2 <= radius ** 2) {
            ctx.beginPath();
            ctx.moveTo(ripple.x - Math.sqrt(radius ** 2 - (y - ripple.y) ** 2), y);
            ctx.lineTo(ripple.x + Math.sqrt(radius ** 2 - (y - ripple.y) ** 2), y);
            ctx.stroke();
          }
        }
      });
    };

    const drawFloatingParticles = (time) => {
      particles.forEach((particle, index) => {
        // Magnetic effect towards cursor when hovering
        if (isHovering) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const magneticRange = 200;

          if (distance < magneticRange) {
            const force = (1 - distance / magneticRange) * 0.05;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        // Apply velocity with friction
        particle.vx *= 0.95;
        particle.vy *= 0.95;

        // Update position
        particle.x += particle.speedX + particle.vx;
        particle.y += particle.speedY + particle.vy;

        // Wrap around screen
        if (particle.x > canvas.width) particle.x = -10;
        if (particle.x < -10) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = -10;
        if (particle.y < -10) particle.y = canvas.height;

        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * (0.5 + 0.5 * Math.sin(time * 0.002 + index));

        if (particle.type === 'circle') {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(time * 0.001 + index);
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          ctx.restore();
        }
      });
      ctx.globalAlpha = 1;
    };

    const drawTrendingArrows = (time) => {
      const arrows = [
        { x: canvas.width * 0.2, y: canvas.height * 0.7, color: '#10B981' },
        { x: canvas.width * 0.8, y: canvas.height * 0.3, color: '#3B82F6' },
        { x: canvas.width * 0.4, y: canvas.height * 0.85, color: '#F59E0B' }
      ];

      arrows.forEach((arrow, idx) => {
        const bounce = Math.sin(time * 0.003 + idx * Math.PI / 3) * 20;
        ctx.strokeStyle = arrow.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(time * 0.002 + idx);

        // Draw upward arrow
        ctx.beginPath();
        ctx.moveTo(arrow.x, arrow.y + bounce);
        ctx.lineTo(arrow.x, arrow.y - 30 + bounce);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(arrow.x, arrow.y - 30 + bounce);
        ctx.lineTo(arrow.x - 8, arrow.y - 15 + bounce);
        ctx.lineTo(arrow.x + 8, arrow.y - 15 + bounce);
        ctx.closePath();
        ctx.fillStyle = arrow.color;
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(time * 0.002 + idx);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.5, '#1E293B');
      gradient.addColorStop(1, '#0F172A');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle background elements
      drawGridPattern();

      // Draw animated wavy lines (charts)
      charts.forEach((chart) => {
        drawWavyLine(
          chart.x,
          chart.y,
          chart.width,
          chart.height,
          chart.color,
          timeRef.current,
          chart.speed,
          chart.offset
        );
      });

      // Draw floating particles
      drawFloatingParticles(timeRef.current);

      // Draw trending arrows
      drawTrendingArrows(timeRef.current);

      // Draw ripple grid effect
      drawRippleGrid();

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovering, mousePos]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-none"
        style={{
          willChange: 'transform',
          filter: 'brightness(0.95)'
        }}
      />

      {/* Custom animated cursor */}
      {isHovering && (
        <motion.div
          className="fixed pointer-events-none mix-blend-screen"
          style={{
            width: '24px',
            height: '24px',
            left: mousePos.x - 12,
            top: mousePos.y - 12,
            zIndex: 50
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="w-full h-full"
          >
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </motion.div>
      )}
    </>
  );
}