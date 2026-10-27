
import { IdeaNode, Vector2, Archetype, Particle, Traits, SimEvent } from '../types';
import { PHYSICS, ARCHETYPES, AFFINITY, ARCHETYPE_ORDER } from '../constants';
import { random } from './random';

// Radius (px) within which the cursor "pays attention" to a node
export const ATTENTION_RADIUS = 30;

let idCounter = 0;
const newId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.floor(random() * 1e6).toString(36)}`;

export const normalizeBlend = (types: Archetype[]): Archetype[] =>
  ARCHETYPE_ORDER.filter(t => types.includes(t));

export const blendTraits = (blend: Archetype[]): Traits => {
  const sum: Traits = { decay: 0, growth: 0, sociability: 0, gravity: 0, inertia: 0 };
  for (const t of blend) {
    const tr = ARCHETYPES[t].traits;
    sum.decay += tr.decay;
    sum.growth += tr.growth;
    sum.sociability += tr.sociability;
    sum.gravity += tr.gravity;
    sum.inertia += tr.inertia;
  }
  const n = blend.length;
  return {
    decay: sum.decay / n,
    growth: sum.growth / n,
    sociability: sum.sociability / n,
    gravity: sum.gravity / n,
    inertia: sum.inertia / n,
  };
};

// Circular mean so e.g. red (10) + magenta (320) blends through 345, not 165
export const blendHue = (blend: Archetype[]): number => {
  let x = 0;
  let y = 0;
  for (const t of blend) {
    const rad = (ARCHETYPES[t].hue * Math.PI) / 180;
    x += Math.cos(rad);
    y += Math.sin(rad);
  }
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

export const affinityBetween = (a: Archetype[], b: Archetype[]): number => {
  let sum = 0;
  for (const x of a) for (const y of b) sum += AFFINITY[x][y];
  return sum / (a.length * b.length);
};

export const splitThreshold = (node: IdeaNode) =>
  Math.min(99, PHYSICS.GROWTH_THRESHOLD * node.traits.growth);

export const createNode = (
  x: number,
  y: number,
  types: Archetype | Archetype[],
  parentId?: string,
  generation: number = 0
): IdeaNode => {
  const blend = normalizeBlend(Array.isArray(types) ? types : [types]);
  return {
    id: newId(),
    type: Array.isArray(types) ? types[0] : types,
    blend,
    traits: blendTraits(blend),
    pos: { x, y },
    vel: { x: (random() - 0.5) * 2, y: (random() - 0.5) * 2 },
    energy: 50,
    // Radius shrinks slightly with generations, hybrids are a bit bigger
    radius: 10 - Math.min(generation, 7) + (blend.length - 1) * 1.5,
    parent: parentId,
    connections: parentId ? [parentId] : [],
    createdAt: Date.now(),
    generation,
    hue: blendHue(blend) + (random() * 20 - 10), // Slight color variation
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
  onEvent: (event: SimEvent) => void
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

  // Affinity only depends on the two blends, so cache it per frame
  const affinityCache = new Map<string, number>();
  const affinity = (a: IdeaNode, b: IdeaNode) => {
    const key = `${a.blend.join('|')}>${b.blend.join('|')}`;
    let value = affinityCache.get(key);
    if (value === undefined) {
      value = affinityBetween(a.blend, b.blend);
      affinityCache.set(key, value);
    }
    return value;
  };

  const drag = Math.pow(PHYSICS.DRAG, dt);

  // 2. Node Physics
  for (let i = 0; i < nextNodes.length; i++) {
    const node = nextNodes[i];

    // Decay
    node.energy -= PHYSICS.DECAY_RATE * node.traits.decay * dt;

    // Feed energy while the cursor hovers (attention)
    if (attention && distance(attention, node.pos) < ATTENTION_RADIUS) {
      node.energy += 1 * dt;
    }

    // Movement Forces
    let fx = 0;
    let fy = 0;

    for (let j = 0; j < nextNodes.length; j++) {
      if (i === j) continue;
      const other = nextNodes[j];
      const d = distance(node.pos, other.pos);
      if (d === 0) continue;
      // Unit vector pointing from node to other
      const ux = (other.pos.x - node.pos.x) / d;
      const uy = (other.pos.y - node.pos.y) / d;

      // Repulsion (Coulomb)
      if (d < 200) {
        const force = PHYSICS.REPULSION / (d * d);
        fx -= ux * force;
        fy -= uy * force;
      }

      // Affinity: like-minded ideas drift together, opposed ones apart
      if (d < PHYSICS.AFFINITY_RANGE) {
        const force = affinity(node, other) * PHYSICS.AFFINITY_FORCE * (1 - d / PHYSICS.AFFINITY_RANGE);
        fx += ux * force;
        fy += uy * force;
      }

      // Gravity of heavy (instinctive) ideas
      if (other.traits.gravity > 0 && d < PHYSICS.GRAVITY_RANGE) {
        const force = other.traits.gravity * PHYSICS.GRAVITY_FORCE * (1 - d / PHYSICS.GRAVITY_RANGE);
        fx += ux * force;
        fy += uy * force;
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

    // Cap Velocity (heavier ideas move slower)
    const maxVelocity = PHYSICS.MAX_VELOCITY / node.traits.inertia;
    const speed = Math.hypot(node.vel.x, node.vel.y);
    if (speed > maxVelocity) {
        node.vel.x = (node.vel.x / speed) * maxVelocity;
        node.vel.y = (node.vel.y / speed) * maxVelocity;
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
  const hasRoom = () => nextNodes.length + newNodes.length < PHYSICS.MAX_NODES;

  for (let i = 0; i < nextNodes.length; i++) {
    const node = nextNodes[i];

    // Mitosis (Growth)
    if (node.energy >= splitThreshold(node) && hasRoom()) {
       // INCREASED COST: Reset to 25 instead of 40 to slow down rapid re-growth
       node.energy = 25;
       const angle = random() * Math.PI * 2;
       const offset = 20;
       const child = createNode(
           node.pos.x + Math.cos(angle) * offset,
           node.pos.y + Math.sin(angle) * offset,
           node.blend,
           node.id,
           node.generation + 1
       );
       child.type = node.type;
       child.vel.x = node.vel.x + Math.cos(angle);
       child.vel.y = node.vel.y + Math.sin(angle);
       node.connections.push(child.id);
       newNodes.push(child);
       onEvent({ kind: 'split', x: node.pos.x, y: node.pos.y, node: child });
    }

    // Synthesis (Cross-pollination)
    // Sociable ideas try more often and reach further
    const chance = 1 - Math.pow(1 - PHYSICS.SYNTHESIS_CHANCE * node.traits.sociability, dt);
    if (node.connections.length < PHYSICS.MAX_CONNECTIONS && random() < chance) {
        const reach = PHYSICS.CONNECTION_DISTANCE * (0.75 + 0.25 * node.traits.sociability);
        for (let j = 0; j < nextNodes.length; j++) {
            if (i === j) continue;
            const other = nextNodes[j];
            const dist = distance(node.pos, other.pos);

            if (dist < reach && other.connections.length < PHYSICS.MAX_CONNECTIONS && !node.connections.includes(other.id) && !other.connections.includes(node.id)) {
                // Only one attempt per roll; affinity decides whether the ideas click
                const aff = affinityBetween(node.blend, other.blend);
                if (random() > 0.5 + 0.5 * aff) break;

                // Synthesize!
                node.connections.push(other.id);
                other.connections.push(node.id);

                // LOWERED ENERGY GAIN: Prevent instant explosions
                node.energy = Math.min(100, node.energy + PHYSICS.SYNTHESIS_ENERGY);
                other.energy = Math.min(100, other.energy + PHYSICS.SYNTHESIS_ENERGY);

                const mx = (node.pos.x + other.pos.x) / 2;
                const my = (node.pos.y + other.pos.y) / 2;
                onEvent({ kind: 'synthesis', x: mx, y: my, a: node, b: other });

                // Ideas carrying different archetypes give birth to a hybrid
                const union = normalizeBlend([...node.blend, ...other.blend]);
                if (union.length > Math.max(node.blend.length, other.blend.length) && hasRoom()) {
                    const hybrid = createNode(mx, my, [node.type, ...union], node.id, Math.max(node.generation, other.generation) + 1);
                    hybrid.energy = 60;
                    node.energy -= PHYSICS.HYBRID_COST;
                    other.energy -= PHYSICS.HYBRID_COST;
                    hybrid.connections.push(other.id);
                    node.connections.push(hybrid.id);
                    other.connections.push(hybrid.id);
                    newNodes.push(hybrid);
                    onEvent({ kind: 'hybrid', x: mx, y: my, node: hybrid });
                }

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
