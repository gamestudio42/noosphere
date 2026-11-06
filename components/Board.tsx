import React, { useRef, useEffect } from 'react';
import {
  IdeaNode,
  Particle,
  Archetype,
  SessionStats,
  Insight,
  GameRules,
  GameMode,
  Doubt,
} from '../types';
import { createNode, updatePhysics, ATTENTION_RADIUS } from '../utils/gameLogic';
import { PHYSICS, FOCUS, DOUBT } from '../constants';
import { playTone, playBlend, playCue, setAmbience } from '../utils/audio';
import { canAfford, drainFocus, regenFocus } from '../utils/focus';
import { doubtAt, maxDoubts, spawnDoubt, spawnInterval, updateDoubts } from '../utils/doubts';
import { drawFrame, BACKGROUND } from '../utils/renderer';
import { largestNetwork } from '../utils/stats';
import { INSIGHTS } from '../insights';
import { saveMind, loadMind, clearMind } from '../utils/persistence';

interface BoardProps {
  mode: GameMode; // which saved mind to resume and write
  selectedArchetype: Archetype;
  rules: GameRules;
  onStats: (stats: SessionStats) => void;
  onInsight: (insight: Insight) => void;
  onExtinct: (stats: SessionStats) => void;
  onRestore: (insights: Insight[]) => void;
  onDenied: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// Frame duration the physics constants were tuned for (60fps)
const FRAME_MS = 1000 / 60;
// Cap dt so a backgrounded tab doesn't make the simulation jump
const MAX_DT = 3;
// How often stats are pushed to the UI
const STATS_INTERVAL_MS = 250;
// How often the mind is saved to local storage
const SAVE_INTERVAL_MS = 5000;
// The trail fade touches every pixel each frame. Past 2x the extra sharpness
// on soft glows is invisible, while the fill cost grows with the square.
const MAX_PIXEL_RATIO = 2;

export const Board: React.FC<BoardProps> = ({
  mode,
  selectedArchetype,
  rules,
  onStats,
  onInsight,
  onExtinct,
  onRestore,
  onDenied,
  canvasRef,
}) => {
  // Game State Refs (Mutable for high-performance loop)
  const nodesRef = useRef<IdeaNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const lastFrameRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastAudioTimeRef = useRef<number>(0);
  const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  const reducedMotionRef = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Read by the animation loop, so the loop doesn't restart when the archetype changes
  const archetypeRef = useRef(selectedArchetype);
  archetypeRef.current = selectedArchetype;
  const rulesRef = useRef(rules);
  rulesRef.current = rules;
  const focusRef = useRef<number>(FOCUS.MAX);
  const doubtsRef = useRef<Doubt[]>([]);
  // Simulated time doubts have been active, and when the next one arrives
  const doubtClockRef = useRef(0);
  const nextDoubtRef = useRef<number>(DOUBT.FIRST_DELAY_MS);
  const callbacksRef = useRef({ onStats, onInsight, onExtinct, onDenied });
  callbacksRef.current = { onStats, onInsight, onExtinct, onDenied };
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Session bookkeeping (counters the simulation itself doesn't keep)
  const sessionRef = useRef({
    startedAt: Date.now(),
    peakAlive: 0,
    maxGeneration: 0,
    largestNetwork: 0,
    maxBlend: 1,
    bonds: 0,
    hybridsBorn: 0,
    doubtsBanished: 0,
    doubtsDissolved: 0,
    planted: 0,
    splits: 0,
    unlocked: new Set<string>(),
    lastStatsAt: 0,
    extinct: false,
  });

  // Initialize: resume the saved mind, or seed the initial thought
  useEffect(() => {
    const saved = loadMind(mode);
    if (saved) {
      const sx = window.innerWidth / saved.width;
      const sy = window.innerHeight / saved.height;
      for (const n of saved.nodes) {
        n.pos.x *= sx;
        n.pos.y *= sy;
      }
      nodesRef.current = saved.nodes;
      focusRef.current = saved.focus ?? FOCUS.MAX;
      doubtsRef.current = saved.doubts ?? [];
      for (const d of doubtsRef.current) {
        d.pos.x *= sx;
        d.pos.y *= sy;
      }
      const session = sessionRef.current;
      Object.assign(session, {
        ...saved.session,
        startedAt: Date.now() - saved.session.duration,
        unlocked: new Set(saved.session.unlocked),
      });
      onRestoreRef.current(INSIGHTS.filter((i) => session.unlocked.has(i.id)));
      return;
    }
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    nodesRef.current = [createNode(cx, cy, archetypeRef.current)];
  }, [mode]);

  // Persist the mind periodically and when the page is hidden or closed
  useEffect(() => {
    const save = () => {
      const session = sessionRef.current;
      if (session.extinct || nodesRef.current.length === 0) return;
      saveMind(mode, {
        savedAt: Date.now(),
        width: sizeRef.current.width,
        height: sizeRef.current.height,
        nodes: nodesRef.current,
        focus: focusRef.current,
        doubts: doubtsRef.current,
        session: {
          duration: Date.now() - session.startedAt,
          peakAlive: session.peakAlive,
          maxGeneration: session.maxGeneration,
          largestNetwork: session.largestNetwork,
          maxBlend: session.maxBlend,
          bonds: session.bonds,
          hybridsBorn: session.hybridsBorn,
          doubtsBanished: session.doubtsBanished,
          doubtsDissolved: session.doubtsDissolved,
          planted: session.planted,
          splits: session.splits,
          unlocked: [...session.unlocked],
        },
      });
    };
    const interval = window.setInterval(save, SAVE_INTERVAL_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', save);
    return () => {
      // Leaving for the menu unmounts the board: keep the mind
      save();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', save);
    };
  }, [mode]);

  const spawnParticles = (x: number, y: number, color: string, count: number = 5) => {
    // Safety Cap: Don't spawn if too many particles exist
    if (reducedMotionRef.current || particlesRef.current.length > 1500) return;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
      });
    }
  };

  const reportStats = () => {
    const session = sessionRef.current;
    const now = Date.now();
    if (session.extinct || now - session.lastStatsAt < STATS_INTERVAL_MS) return;
    session.lastStatsAt = now;

    const nodes = nodesRef.current;
    let hybridsAlive = 0;
    for (const n of nodes) {
      session.maxGeneration = Math.max(session.maxGeneration, n.generation);
      session.maxBlend = Math.max(session.maxBlend, n.blend.length);
      if (n.blend.length > 1) hybridsAlive++;
    }
    session.peakAlive = Math.max(session.peakAlive, nodes.length);
    const network = largestNetwork(nodes);
    session.largestNetwork = Math.max(session.largestNetwork, network);

    const stats: SessionStats = {
      startedAt: session.startedAt,
      duration: now - session.startedAt,
      alive: nodes.length,
      hybridsAlive,
      peakAlive: session.peakAlive,
      maxGeneration: session.maxGeneration,
      network,
      largestNetwork: session.largestNetwork,
      maxBlend: session.maxBlend,
      bonds: session.bonds,
      hybridsBorn: session.hybridsBorn,
      planted: session.planted,
      splits: session.splits,
      focus: focusRef.current,
      doubtsAlive: doubtsRef.current.length,
      doubtsBanished: session.doubtsBanished,
      doubtsDissolved: session.doubtsDissolved,
    };

    const { onStats, onInsight, onExtinct } = callbacksRef.current;
    onStats(stats);
    // The drone swells as the mind grows
    setAmbience(nodes.length / PHYSICS.MAX_NODES);
    for (const insight of INSIGHTS) {
      if (!session.unlocked.has(insight.id) && insight.test(stats)) {
        session.unlocked.add(insight.id);
        onInsight(insight);
      }
    }
    if (nodes.length === 0) {
      session.extinct = true;
      setAmbience(0);
      clearMind(mode);
      onExtinct(stats);
    }
  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Work in CSS pixels; the canvas backing store is scaled by devicePixelRatio
    const { width, height } = sizeRef.current;
    const dt =
      lastFrameRef.current === null
        ? 1
        : Math.min((time - lastFrameRef.current) / FRAME_MS, MAX_DT);
    lastFrameRef.current = time;
    const { focus: usesFocus, doubts: usesDoubts } = rulesRef.current;

    if (usesDoubts) {
      doubtClockRef.current += dt * FRAME_MS;
      const alive = nodesRef.current.length;
      if (alive > 0 && doubtClockRef.current >= nextDoubtRef.current) {
        if (doubtsRef.current.length < maxDoubts(alive)) {
          doubtsRef.current.push(spawnDoubt(width, height));
          playCue('doubt');
        }
        nextDoubtRef.current = doubtClockRef.current + spawnInterval(alive);
      }
      doubtsRef.current = updateDoubts(
        doubtsRef.current,
        nodesRef.current,
        width,
        height,
        dt,
        (event) => {
          if (event.kind !== 'dissolved') return;
          // Logic saw through it
          sessionRef.current.doubtsDissolved++;
          spawnParticles(event.doubt.pos.x, event.doubt.pos.y, 'hsl(190, 100%, 80%)', 12);
          playCue('banish');
        },
      );
    } else if (doubtsRef.current.length > 0) {
      doubtsRef.current = [];
    }

    // Update Physics. An exhausted mind can't feed ideas.
    const feeding = usesFocus && focusRef.current <= 0 ? null : mouseRef.current;
    const result = updatePhysics(
      nodesRef.current,
      particlesRef.current,
      width,
      height,
      dt,
      feeding,
      (event) => {
        const now = Date.now();
        if (event.kind === 'synthesis') sessionRef.current.bonds++;
        if (event.kind === 'split') sessionRef.current.splits++;
        if (event.kind === 'hybrid') {
          sessionRef.current.hybridsBorn++;
          // A new kind of idea: always celebrate it
          spawnParticles(event.x, event.y, `hsl(${event.node.hue}, 100%, 70%)`, 24);
          playBlend(event.node.blend, 0.9);
          lastAudioTimeRef.current = now;
          return;
        }

        // On Synthesis/Birth Callback
        spawnParticles(event.x, event.y, '#fff', 8);

        // Throttle audio: Only play if 80ms have passed since last tone
        // This limits automatic audio to ~12 notes/sec max
        if (now - lastAudioTimeRef.current > 80) {
          const source = event.kind === 'split' ? event.node : event.a;
          playTone(source.type, 0.4);
          lastAudioTimeRef.current = now;
        }
      },
    );

    nodesRef.current = result.nodes;
    particlesRef.current = result.particles;
    if (usesFocus) {
      let hybrids = 0;
      for (const n of result.nodes) if (n.blend.length > 1) hybrids++;
      focusRef.current = regenFocus(drainFocus(focusRef.current, result.fed, dt), hybrids, dt);
    }
    reportStats();

    drawFrame(ctx, nodesRef.current, particlesRef.current, doubtsRef.current, {
      width,
      height,
      time,
      attention: mouseRef.current,
      reducedMotion: reducedMotionRef.current,
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const width = window.innerWidth;
      const height = window.innerHeight;
      // A hidden or collapsed view can report a zero size; scaling by it
      // would collapse every position and turn them into NaN on the way back
      if (width === 0 || height === 0) return;
      // Keep the mind's layout proportional to the new viewport
      const prev = sizeRef.current;
      if (prev.width !== width || prev.height !== height) {
        const sx = width / prev.width;
        const sy = height / prev.height;
        for (const thing of [...nodesRef.current, ...doubtsRef.current]) {
          thing.pos.x *= sx;
          thing.pos.y *= sy;
        }
      }
      sizeRef.current = { width, height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotion = () => {
      reducedMotionRef.current = motionQuery.matches;
    };

    window.addEventListener('resize', handleResize);
    motionQuery.addEventListener('change', handleMotion);
    handleResize();
    lastFrameRef.current = null;
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotion);
      cancelAnimationFrame(requestRef.current);
      setAmbience(0);
    };
    // The loop reads everything through refs, so it is started exactly once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pointer events cover mouse, touch and pen without the touch→mouse double fire
  const handlePointerDown = (e: React.PointerEvent) => {
    const cx = e.clientX;
    const cy = e.clientY;
    // On touch there's no hover, so holding a finger down pays attention instead
    mouseRef.current = { x: cx, y: cy };
    const archetype = archetypeRef.current;
    const usesFocus = rulesRef.current.focus;
    // Returns false (with feedback) when the mind is too tired for an action
    const spend = (cost: number) => {
      if (!usesFocus) return true;
      if (!canAfford(focusRef.current, cost)) {
        playCue('denied');
        callbacksRef.current.onDenied();
        return false;
      }
      focusRef.current -= cost;
      return true;
    };

    // Banishing a doubt takes priority over everything under it
    const doubt = doubtAt(doubtsRef.current, cx, cy);
    if (doubt) {
      if (spend(FOCUS.BANISH)) {
        doubtsRef.current = doubtsRef.current.filter((d) => d !== doubt);
        sessionRef.current.doubtsBanished++;
        spawnParticles(doubt.pos.x, doubt.pos.y, 'hsl(275, 80%, 85%)', 20);
        playCue('banish');
      }
      return;
    }

    // Check click on node: stimulate the closest one
    let target: IdeaNode | null = null;
    let best: number = ATTENTION_RADIUS;
    for (const node of nodesRef.current) {
      const d = Math.hypot(cx - node.pos.x, cy - node.pos.y);
      if (d < best) {
        best = d;
        target = node;
      }
    }

    if (target) {
      const node = target;
      if (spend(FOCUS.STIMULATE)) {
        // Stimulate: a boost, not an instant split
        node.energy = Math.min(100, node.energy + 35);
        node.vel.x += (Math.random() - 0.5) * 5;
        node.vel.y += (Math.random() - 0.5) * 5;
        spawnParticles(node.pos.x, node.pos.y, `hsl(${node.hue}, 100%, 50%)`, 10);
        playBlend(node.blend, 1.0);
      }
    } else if (spend(FOCUS.PLANT)) {
      // Plant new Idea
      const newNode = createNode(cx, cy, archetype);
      newNode.energy = 70;
      nodesRef.current.push(newNode);
      sessionRef.current.planted++;
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
    <div className="fixed inset-0 cursor-crosshair" style={{ background: BACKGROUND }}>
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
