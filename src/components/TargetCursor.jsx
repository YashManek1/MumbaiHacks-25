import React from 'react';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';

/**
 * Universal Target Cursor Component
 * - Applies globally to entire app
 * - Disables all default cursors
 * - Works on all interactive elements
 * - Mobile-aware (auto-disables on touch)
 */
const TargetCursor = ({
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true
}) => {
  const cursorRef = useRef(null);
  const cornersRef = useRef(null);
  const spinTl = useRef(null);
  const dotRef = useRef(null);

  const isActiveRef = useRef(false);
  const targetCornerPositionsRef = useRef(null);
  const tickerFnRef = useRef(null);
  const activeStrengthRef = useRef(0);
  const hoveredElementRef = useRef(null);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
    return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
  }, []);

  const constants = useMemo(
    () => ({
      borderWidth: 3,
      cornerSize: 12
    }),
    []
  );

  const moveCursor = useCallback((x, y) => {
    if (!cursorRef.current) return;
    gsap.to(cursorRef.current, {
      x,
      y,
      duration: 0.1,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }, []);

  // Apply cursor styles globally
  useEffect(() => {
    if (isMobile) return;

    // Disable all cursors globally
    const style = document.createElement('style');
    style.textContent = `
      * {
        cursor: none !important;
      }
      html {
        cursor: none !important;
      }
      body {
        cursor: none !important;
      }
      button {
        cursor: none !important;
      }
      a {
        cursor: none !important;
      }
      input, textarea, select {
        cursor: none !important;
      }
      [role="button"] {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll('.target-cursor-corner');

    let activeTarget = null;
    let currentLeaveHandler = null;
    let resumeTimeout = null;
    let hoverTimeout = null;

    const cleanupTarget = (target) => {
      if (currentLeaveHandler) {
        target?.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    };

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const createSpinTimeline = () => {
      if (spinTl.current) {
        spinTl.current.kill();
      }
      spinTl.current = gsap.timeline({ repeat: -1 }).to(cursor, {
        rotation: '+=360',
        duration: spinDuration,
        ease: 'none'
      });
    };

    createSpinTimeline();

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) {
        return;
      }
      const strength = activeStrengthRef.current;
      if (strength === 0) return;

      const cursorX = gsap.getProperty(cursorRef.current, 'x');
      const cursorY = gsap.getProperty(cursorRef.current, 'y');
      const corners = Array.from(cornersRef.current);

      corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x');
        const currentY = gsap.getProperty(corner, 'y');
        const targetX = targetCornerPositionsRef.current[i].x - cursorX;
        const targetY = targetCornerPositionsRef.current[i].y - cursorY;
        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;
        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    };

    tickerFnRef.current = tickerFn;

    const moveHandler = (e) => {
      moveCursor(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', moveHandler, { passive: true });

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return;
      const mouseX = gsap.getProperty(cursorRef.current, 'x');
      const mouseY = gsap.getProperty(cursorRef.current, 'y');
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);

      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget ||
          elementUnderMouse.closest('button') === activeTarget ||
          elementUnderMouse.closest('a') === activeTarget ||
          elementUnderMouse.closest('[role="button"]') === activeTarget);

      if (!isStillOverTarget && currentLeaveHandler) {
        currentLeaveHandler();
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });

    const mouseDownHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 });
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 });
    };

    const mouseUpHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
    };

    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    // Universal hover handler for ALL interactive elements
    const handleMouseOver = (e) => {
      const target = e.target;

      // Check if element is interactive
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.onclick ||
        target.getAttribute('role') === 'button' ||
        target.className?.includes('cursor-target') ||
        target.className?.includes('hover:') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.cursor-target');

      if (!isInteractive) return;

      const interactiveParent =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.cursor-target') ||
        target;

      if (!interactiveParent || !cursorRef.current || !cornersRef.current) return;
      if (activeTarget === interactiveParent) return;

      if (activeTarget) {
        cleanupTarget(activeTarget);
      }

      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }

      activeTarget = interactiveParent;
      hoveredElementRef.current = interactiveParent;

      const corners = Array.from(cornersRef.current);
      corners.forEach((corner) => gsap.killTweensOf(corner));
      gsap.killTweensOf(cursorRef.current, 'rotation');
      spinTl.current?.pause();
      gsap.set(cursorRef.current, { rotation: 0 });

      hoverTimeout = setTimeout(() => {
        const rect = interactiveParent.getBoundingClientRect();
        const { borderWidth, cornerSize } = constants;
        const cursorX = gsap.getProperty(cursorRef.current, 'x');
        const cursorY = gsap.getProperty(cursorRef.current, 'y');

        targetCornerPositionsRef.current = [
          { x: rect.left - borderWidth, y: rect.top - borderWidth },
          {
            x: rect.right + borderWidth - cornerSize,
            y: rect.top - borderWidth
          },
          {
            x: rect.right + borderWidth - cornerSize,
            y: rect.bottom + borderWidth - cornerSize
          },
          {
            x: rect.left - borderWidth,
            y: rect.bottom + borderWidth - cornerSize
          }
        ];

        isActiveRef.current = true;
        gsap.ticker.add(tickerFnRef.current);
        gsap.to(activeStrengthRef, {
          current: 1,
          duration: hoverDuration,
          ease: 'power2.out'
        });

        corners.forEach((corner, i) => {
          gsap.to(corner, {
            x: targetCornerPositionsRef.current[i].x - cursorX,
            y: targetCornerPositionsRef.current[i].y - cursorY,
            duration: 0.2,
            ease: 'power2.out'
          });
        });
      }, 50);

      const leaveHandler = () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }

        gsap.ticker.remove(tickerFnRef.current);
        isActiveRef.current = false;
        targetCornerPositionsRef.current = null;
        gsap.set(activeStrengthRef, { current: 0, overwrite: true });
        activeTarget = null;
        hoveredElementRef.current = null;

        if (cornersRef.current) {
          const corners = Array.from(cornersRef.current);
          gsap.killTweensOf(corners);
          const { cornerSize } = constants;
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];
          const tl = gsap.timeline();
          corners.forEach((corner, index) => {
            tl.to(
              corner,
              {
                x: positions[index].x,
                y: positions[index].y,
                duration: 0.3,
                ease: 'power3.out'
              },
              0
            );
          });
        }

        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current && spinTl.current) {
            const currentRotation = gsap.getProperty(cursorRef.current, 'rotation');
            const normalizedRotation = currentRotation % 360;
            spinTl.current.kill();
            spinTl.current = gsap.timeline({ repeat: -1 }).to(cursorRef.current, {
              rotation: '+=360',
              duration: spinDuration,
              ease: 'none'
            });
            gsap.to(cursorRef.current, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: () => {
                spinTl.current?.restart();
              }
            });
          }
          resumeTimeout = null;
        }, 50);

        cleanupTarget(interactiveParent);
      };

      currentLeaveHandler = leaveHandler;
      interactiveParent.addEventListener('mouseleave', leaveHandler);
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      if (tickerFnRef.current) {
        gsap.ticker.remove(tickerFnRef.current);
      }
      window.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      if (activeTarget) {
        cleanupTarget(activeTarget);
      }
      spinTl.current?.kill();
      isActiveRef.current = false;
      targetCornerPositionsRef.current = null;
      activeStrengthRef.current = 0;
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };
  }, [spinDuration, moveCursor, constants, isMobile, hoverDuration, parallaxOn]);

  if (isMobile) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-0 h-0 pointer-events-none z-[9999]"
      style={{ willChange: 'transform' }}
    >
      <div
        ref={dotRef}
        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-blue-400/50"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[2.5px] border-blue-400 -translate-x-[150%] -translate-y-[150%] border-r-0 border-b-0 shadow-md shadow-blue-400/30"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[2.5px] border-blue-400 translate-x-1/2 -translate-y-[150%] border-l-0 border-b-0 shadow-md shadow-blue-400/30"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[2.5px] border-blue-400 translate-x-1/2 translate-y-1/2 border-l-0 border-t-0 shadow-md shadow-blue-400/30"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[2.5px] border-blue-400 -translate-x-[150%] translate-y-1/2 border-r-0 border-t-0 shadow-md shadow-blue-400/30"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
};

export default TargetCursor;