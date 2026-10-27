
import { IdeaNode, Vector2, Archetype, Particle } from '../types';
import { PHYSICS, ARCHETYPES } from '../constants';

// Radius (px) within which the cursor "pays attention" to a node
export const ATTENTION_RADIUS = 30;

export const createNode = (x: number, y: number, type: Archetype, parentId?: string, generation: number = 0): IdeaNode => {
  return {
    id: crypto.randomUUID(),
    type,
    pos: { x, y },
    vel: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
    energy: 50,
    radius: 10 - Math.min(generation, 7), // Radius shrinks slightly with generations
    parent: parentId,
    connections: parentId ? [parentId] : [],
    createdAt: Date.now(),
    generation,
    hue: ARCHETYPES[type].hue + (Math.random() * 20 - 10), // Slight color variation
  };
};

const distance = (a: Vector2, b: Vector2) => Math.hypot(a.x - b.x, a.y - b.y);

// dt is measured in 60fps frames (1 = 16.67ms), so constants keep their original tuning
export const updatePhysics = (
  nodes: IdeaNode[],
  particles: Particle[],
  width: number,
  height: number,
  dt: number,
  attention: Vector2 | null,
  onSynthesis: (x: number, y: number, type: Archetype) => void
): { nodes: IdeaNode[], particles: Particle[] } => {

  let nextNodes = [...nodes];

  // 1. Particle Physics
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= 0.02 * dt;
  });
  const nextParticles = particles.filter(p => p.life > 0);

  const nodeMap = new Map<string, IdeaNode>();
  for (const n of nextNodes) nodeMap.set(n.id, n);

  const drag = Math.pow(PHYSICS.DRAG, dt);

  // 2. Node Physics
  for (let i = 0; i < nextNodes.length; i++) {
    const node = nextNodes[i];

    // Decay
    node.energy -= PHYSICS.DECAY_RATE * dt;

    // Feed energy while the cursor hovers (attention)
    if (attention && distance(attention, node.pos) < ATTENTION_RADIUS) {
      node.energy += 1 * dt;
    }

    // Movement Forces
    let fx = 0;
    let fy = 0;

    // Repulsion (Coulomb)
    for (let j = 0; j < nextNodes.length; j++) {
      if (i === j) continue;
      const other = nextNodes[j];
      const d = distance(node.pos, other.pos);
      if (d > 0 && d < 200) {
        const force = PHYSICS.REPULSION / (d * d);
        const dx = node.pos.x - other.pos.x;
        const dy = node.pos.y - other.pos.y;
        fx += (dx / d) * force;
        fy += (dy / d) * force;
      }
    }

    // Attraction (Spring) to Connections
    node.connections.forEach(connId => {
      const other = nodeMap.get(connId);
      if (other) {
        const d = distance(node.pos, other.pos);
        if (d === 0) return;
        const force = (d - 60) * PHYSICS.ATTRACTION; // 60 is resting length
        const dx = other.pos.x - node.pos.x;
        const dy = other.pos.y - node.pos.y;
        fx += (dx / d) * force;
        fy += (dy / d) * force;
      }
    });

    // Center Gravity (Keep them on screen)
    const centerX = width / 2;
    const centerY = height / 2;
    const distCenter = distance(node.pos, {x: centerX, y: centerY});
    if (distCenter > Math.min(width, height) * 0.4) {
         fx += (centerX - node.pos.x) * 0.0005;
         fy += (centerY - node.pos.y) * 0.0005;
    }

    // Apply Velocity
    node.vel.x = (node.vel.x + fx * dt) * drag;
    node.vel.y = (node.vel.y + fy * dt) * drag;

    // Cap Velocity
    const speed = Math.hypot(node.vel.x, node.vel.y);
    if (speed > PHYSICS.MAX_VELOCITY) {
        node.vel.x = (node.vel.x / speed) * PHYSICS.MAX_VELOCITY;
        node.vel.y = (node.vel.y / speed) * PHYSICS.MAX_VELOCITY;
    }

    node.pos.x += node.vel.x * dt;
    node.pos.y += node.vel.y * dt;

    // Boundaries: clamp position and bounce inward
    if (node.pos.x < 0) { node.pos.x = 0; node.vel.x = Math.abs(node.vel.x); }
    else if (node.pos.x > width) { node.pos.x = width; node.vel.x = -Math.abs(node.vel.x); }
    if (node.pos.y < 0) { node.pos.y = 0; node.vel.y = Math.abs(node.vel.y); }
    else if (node.pos.y > height) { node.pos.y = height; node.vel.y = -Math.abs(node.vel.y); }

    // CRITICAL: Clamp Energy to prevent infinite values and gradient crashes
    node.energy = Math.max(0, Math.min(node.energy, 100));
  }

  // 3. Growth & Synthesis
  const newNodes: IdeaNode[] = [];
  // Per-frame chance of 0.002, scaled to the elapsed time
  const synthesisChance = 1 - Math.pow(1 - 0.002, dt);

  for (let i = 0; i < nextNodes.length; i++) {
    const node = nextNodes[i];

    // Mitosis (Growth)
    if (node.energy >= PHYSICS.GROWTH_THRESHOLD && nextNodes.length + newNodes.length < 150) {
       // INCREASED COST: Reset to 25 instead of 40 to slow down rapid re-growth
       node.energy = 25;
       const angle = Math.random() * Math.PI * 2;
       const offset = 20;
       const child = createNode(
           node.pos.x + Math.cos(angle) * offset,
           node.pos.y + Math.sin(angle) * offset,
           node.type,
           node.id,
           node.generation + 1
       );
       child.vel.x = node.vel.x + Math.cos(angle);
       child.vel.y = node.vel.y + Math.sin(angle);
       node.connections.push(child.id);
       newNodes.push(child);
       onSynthesis(node.pos.x, node.pos.y, node.type);
    }

    // Synthesis (Cross-pollination)
    // If close to a node that isn't connected and isn't too far structurally
    if (Math.random() < synthesisChance) { // Kept low
        for (let j = 0; j < nextNodes.length; j++) {
            if (i === j) continue;
            const other = nextNodes[j];
            const dist = distance(node.pos, other.pos);

            if (dist < PHYSICS.CONNECTION_DISTANCE && !node.connections.includes(other.id) && !other.connections.includes(node.id)) {
                // Synthesize!
                node.connections.push(other.id);
                other.connections.push(node.id);

                // LOWERED ENERGY GAIN: Prevent instant explosions
                node.energy += 10;
                other.energy += 10;

                // Create sparks
                onSynthesis((node.pos.x + other.pos.x)/2, (node.pos.y + other.pos.y)/2, node.type);

                // CRITICAL: Break the loop. A node can only form ONE connection per frame.
                // This prevents a single node from connecting to 10 neighbors instantly.
                break;
            }
        }
    }
  }

  // 4. Cleanup Death
  nextNodes = [...nextNodes, ...newNodes].filter(n => n.energy > 0);
  // Remove dead connections
  const activeIds = new Set(nextNodes.map(n => n.id));
  nextNodes.forEach(n => {
      n.connections = n.connections.filter(id => activeIds.has(id));
  });

  return { nodes: nextNodes, particles: nextParticles };
};
