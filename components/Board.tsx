
import React, { useRef, useEffect } from 'react';
import { IdeaNode, Particle, Archetype } from '../types';
import { createNode, updatePhysics, ATTENTION_RADIUS } from '../utils/gameLogic';
import { playTone } from '../utils/audio';

interface BoardProps {
  selectedArchetype: Archetype;
}

// Frame duration the physics constants were tuned for (60fps)
const FRAME_MS = 1000 / 60;
// Cap dt so a backgrounded tab doesn't make the simulation jump
const MAX_DT = 3;

export const Board: React.FC<BoardProps> = ({ selectedArchetype }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game State Refs (Mutable for high-performance loop)
  const nodesRef = useRef<IdeaNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const lastFrameRef = useRef<number | null>(null);
  const mouseRef = useRef<{x: number, y: number} | null>(null);
  const lastAudioTimeRef = useRef<number>(0);
  const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  // Read by the animation loop, so the loop doesn't restart when the archetype changes
  const archetypeRef = useRef(selectedArchetype);
  archetypeRef.current = selectedArchetype;

  // Initialize
  useEffect(() => {
      // Seed the initial thought
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      nodesRef.current = [createNode(cx, cy, archetypeRef.current)];
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number = 5) => {
      // Safety Cap: Don't spawn if too many particles exist
      if (particlesRef.current.length > 1500) return;

      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2;
          particlesRef.current.push({
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              color
          });
      }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Clear with Trail Effect
      ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; // Low opacity for trails
      ctx.fillRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const particles = particlesRef.current;

      ctx.globalCompositeOperation = 'lighter';

      // PERFORMANCE FIX: Create a Map for O(1) lookups
      // When we have 150 nodes, finding by ID in a loop creates lag (O(N^2) or worse).
      const nodeMap = new Map<string, IdeaNode>();
      for (const n of nodes) {
          nodeMap.set(n.id, n);
      }

      // Draw Connections (Synapses)
      ctx.lineWidth = 1;
      const drawnConnections = new Set<string>();

      nodes.forEach(node => {
          node.connections.forEach(targetId => {
              const target = nodeMap.get(targetId); // O(1) Lookup
              if (target) {
                  const key = [node.id, target.id].sort().join('-');
                  if (drawnConnections.has(key)) return;
                  drawnConnections.add(key);

                  // Safety check for gradients
                  const energyA = Math.max(0, Math.min(1, node.energy / 100));
                  const energyB = Math.max(0, Math.min(1, target.energy / 100));

                  const grad = ctx.createLinearGradient(node.pos.x, node.pos.y, target.pos.x, target.pos.y);
                  grad.addColorStop(0, `hsla(${node.hue}, 80%, 50%, ${energyA})`);
                  grad.addColorStop(1, `hsla(${target.hue}, 80%, 50%, ${energyB})`);

                  ctx.strokeStyle = grad;
                  ctx.beginPath();
                  ctx.moveTo(node.pos.x, node.pos.y);

                  // Slight curve
                  const midX = (node.pos.x + target.pos.x) / 2;
                  const midY = (node.pos.y + target.pos.y) / 2;
                  // Jitter for neural look
                  ctx.quadraticCurveTo(midX + (Math.random()-0.5)*2, midY + (Math.random()-0.5)*2, target.pos.x, target.pos.y);

                  ctx.stroke();
              }
          });
      });

      // Draw Nodes
      nodes.forEach(node => {
          const glow = Math.max(0, Math.min(1, node.energy / 100));
          const color = `hsla(${node.hue}, 100%, 60%, ${glow})`;

          ctx.beginPath();
          ctx.arc(node.pos.x, node.pos.y, node.radius * (0.8 + glow * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(node.pos.x, node.pos.y, node.radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();

          // Interaction Highlight (energy feeding happens in updatePhysics)
          if (mouseRef.current) {
              const d = Math.hypot(mouseRef.current.x - node.pos.x, mouseRef.current.y - node.pos.y);
              if (d < ATTENTION_RADIUS) {
                  ctx.beginPath();
                  ctx.arc(node.pos.x, node.pos.y, node.radius * 2, 0, Math.PI * 2);
                  ctx.strokeStyle = 'white';
                  ctx.stroke();
              }
          }
      });

      // Draw Particles
      particles.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
      });

      // Reset
      ctx.globalCompositeOperation = 'source-over';
  };

  const animate = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Work in CSS pixels; the canvas backing store is scaled by devicePixelRatio
      const { width, height } = sizeRef.current;
      const dt = lastFrameRef.current === null ? 1 : Math.min((time - lastFrameRef.current) / FRAME_MS, MAX_DT);
      lastFrameRef.current = time;

      // Update Physics
      const result = updatePhysics(
          nodesRef.current,
          particlesRef.current,
          width,
          height,
          dt,
          mouseRef.current,
          (x, y, type) => {
              // On Synthesis/Birth Callback
              spawnParticles(x, y, '#fff', 8);

              // Throttle audio: Only play if 80ms have passed since last tone
              // This limits automatic audio to ~12 notes/sec max
              const now = Date.now();
              if (now - lastAudioTimeRef.current > 80) {
                  playTone(type, 0.4);
                  lastAudioTimeRef.current = now;
              }
          }
      );

      nodesRef.current = result.nodes;
      particlesRef.current = result.particles;

      draw(ctx, width, height);
      requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
      const handleResize = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const dpr = window.devicePixelRatio || 1;
          const width = window.innerWidth;
          const height = window.innerHeight;
          sizeRef.current = { width, height };
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      window.addEventListener('resize', handleResize);
      handleResize();
      lastFrameRef.current = null;
      requestRef.current = requestAnimationFrame(animate);

      return () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(requestRef.current);
      };
  }, []);

  // Pointer events cover mouse, touch and pen without the touch→mouse double fire
  const handlePointerDown = (e: React.PointerEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;
      // On touch there's no hover, so holding a finger down pays attention instead
      mouseRef.current = { x: cx, y: cy };
      const archetype = archetypeRef.current;

      // Check click on node
      let clickedNode = false;
      for (const node of nodesRef.current) {
          const d = Math.hypot(cx - node.pos.x, cy - node.pos.y);
          if (d < ATTENTION_RADIUS) {
              // Stimulate
              node.energy = 100;
              node.vel.x += (Math.random()-0.5) * 5;
              node.vel.y += (Math.random()-0.5) * 5;
              spawnParticles(node.pos.x, node.pos.y, `hsl(${node.hue}, 100%, 50%)`, 10);
              playTone(node.type, 1.0);
              clickedNode = true;
          }
      }

      if (!clickedNode) {
          // Plant new Idea
          const newNode = createNode(cx, cy, archetype);
          newNode.energy = 100;
          nodesRef.current.push(newNode);
          spawnParticles(cx, cy, '#fff', 15);
          playTone(archetype, 0.8);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      // Touch only "pays attention" while the finger is down
      if (e.pointerType === 'touch' && e.buttons === 0) return;
      mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
      if (e.type === 'pointerleave' || e.pointerType === 'touch') {
          mouseRef.current = null;
      }
  };

  return (
    <div className="fixed inset-0 cursor-crosshair">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        className="block"
      />
    </div>
  );
};
