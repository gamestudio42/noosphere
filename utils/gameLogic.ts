import { IdeaNode, Vector2, Archetype, Particle, Traits, SimEvent } from '../types';
import { PHYSICS, ARCHETYPES, AFFINITY, ARCHETYPE_ORDER } from '../constants';
import { random } from './random';

// Radius (px) within which the cursor "pays attention" to a node
export const ATTENTION_RADIUS = 30;

let idCounter = 0;
const newId = () =>
  `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.floor(random() * 1e6).toString(36)}`;

export const normalizeBlend = (types: Archetype[]): Archetype[] =>
  ARCHETYPE_ORDER.filter((t) => types.includes(t));

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
  generation: number = 0,
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

// Pairwise forces: repulsion reaches 200px, affinity and gravity their own ranges.
// Pairs further apart than the longest of them feel nothing, so the grid below
// only visits neighbouring cells of this size.
const REPULSION_RANGE = 200;
const FORCE_RANGE = Math.max(REPULSION_RANGE, PHYSICS.AFFINITY_RANGE, PHYSICS.GRAVITY_RANGE);
const FORCE_RANGE_SQ = FORCE_RANGE * FORCE_RANGE;

// A blend as a 4-bit mask, one bit per archetype
const blendMask = (blend: Archetype[]) => {
  let mask = 0;
  for (const t of blend) mask |= 1 << ARCHETYPE_ORDER.indexOf(t);
  return mask;
};

// Affinity only depends on the two blends: 16 x 16 masks, filled on first use
const affinityTable = new Float64Array(256).fill(NaN);
const archetypesOf = (mask: number) => ARCHETYPE_ORDER.filter((_, i) => mask & (1 << i));
const affinityByMask = (a: number, b: number) => {
  const key = (a << 4) | b;
  let value = affinityTable[key];
  if (value !== value) {
    value = affinityBetween(archetypesOf(a), archetypesOf(b));
    affinityTable[key] = value;
  }
  return value;
};

// Buckets node indices into square cells (a counting sort, no per-cell arrays)
const buildGrid = (nodes: IdeaNode[], width: number, height: number) => {
  const cols = Math.max(1, Math.ceil(width / FORCE_RANGE));
  const rows = Math.max(1, Math.ceil(height / FORCE_RANGE));
  const cellOf = new Int32Array(nodes.length);
  const start = new Int32Array(cols * rows + 1);
  for (let i = 0; i < nodes.length; i++) {
    const cx = Math.min(cols - 1, Math.max(0, Math.floor(nodes[i].pos.x / FORCE_RANGE)));
    const cy = Math.min(rows - 1, Math.max(0, Math.floor(nodes[i].pos.y / FORCE_RANGE)));
    const cell = cy * cols + cx;
    cellOf[i] = cell;
    start[cell + 1]++;
  }
  for (let c = 0; c < cols * rows; c++) start[c + 1] += start[c];
  const fill = start.slice(0, cols * rows);
  const order = new Int32Array(nodes.length);
  for (let i = 0; i < nodes.length; i++) order[fill[cellOf[i]]++] = i;
  return { cols, rows, start, order, cellOf };
};

// dt is measured in 60fps frames (1 = 16.67ms), so constants keep their original tuning
export const updatePhysics = (
  nodes: IdeaNode[],
  particles: Particle[],
  width: number,
  height: number,
  dt: number,
  attention: Vector2 | null,
  onEvent: (event: SimEvent) => void,
): { nodes: IdeaNode[]; particles: Particle[]; fed: number } => {
  let nextNodes = nodes;
  // How many ideas the cursor fed this frame (feeding costs focus)
  let fed = 0;

  // 1. Particle Physics (compacted in place)
  let alive = 0;
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= 0.02 * dt;
    if (p.life > 0) particles[alive++] = p;
  }
  particles.length = alive;
  const nextParticles = particles;

  const nodeMap = new Map<string, IdeaNode>();
  for (const n of nextNodes) nodeMap.set(n.id, n);

  // Flat copies for the pair loop; xs/ys are kept in step as nodes move
  const count = nextNodes.length;
  const masks = new Int32Array(count);
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  const gravity = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const n = nextNodes[i];
    masks[i] = blendMask(n.blend);
    xs[i] = n.pos.x;
    ys[i] = n.pos.y;
    gravity[i] = n.traits.gravity;
  }
  const grid = buildGrid(nextNodes, width, height);

  const drag = Math.pow(PHYSICS.DRAG, dt);
  const centerX = width / 2;
  const centerY = height / 2;
  const keepInRange = Math.min(width, height) * 0.4;

  // 2. Node Physics
  for (let i = 0; i < nextNodes.length; i++) {
    const node = nextNodes[i];

    // Decay
    node.energy -= PHYSICS.DECAY_RATE * node.traits.decay * dt;

    // Feed energy while the cursor hovers (attention)
    if (attention && distance(attention, node.pos) < ATTENTION_RADIUS) {
      node.energy += 1 * dt;
      fed++;
    }

    // Movement Forces
    let fx = 0;
    let fy = 0;

    const cell = grid.cellOf[i];
    const cx = cell % grid.cols;
    const cy = (cell - cx) / grid.cols;
    for (let gy = Math.max(0, cy - 1); gy <= Math.min(grid.rows - 1, cy + 1); gy++) {
      for (let gx = Math.max(0, cx - 1); gx <= Math.min(grid.cols - 1, cx + 1); gx++) {
        const c = gy * grid.cols + gx;
        for (let k = grid.start[c]; k < grid.start[c + 1]; k++) {
          const j = grid.order[k];
          if (i === j) continue;
          const dx = xs[j] - xs[i];
          const dy = ys[j] - ys[i];
          const d2 = dx * dx + dy * dy;
          if (d2 === 0 || d2 >= FORCE_RANGE_SQ) continue;
          const d = Math.sqrt(d2);
          // Unit vector pointing from node to other
          const ux = dx / d;
          const uy = dy / d;

          // Repulsion (Coulomb)
          if (d < REPULSION_RANGE) {
            const force = PHYSICS.REPULSION / d2;
            fx -= ux * force;
            fy -= uy * force;
          }

          // Affinity: like-minded ideas drift together, opposed ones apart
          if (d < PHYSICS.AFFINITY_RANGE) {
            const force =
              affinityByMask(masks[i], masks[j]) *
              PHYSICS.AFFINITY_FORCE *
              (1 - d / PHYSICS.AFFINITY_RANGE);
            fx += ux * force;
            fy += uy * force;
          }

          // Gravity of heavy (instinctive) ideas
          if (gravity[j] > 0 && d < PHYSICS.GRAVITY_RANGE) {
            const force = gravity[j] * PHYSICS.GRAVITY_FORCE * (1 - d / PHYSICS.GRAVITY_RANGE);
            fx += ux * force;
            fy += uy * force;
          }
        }
      }
    }

    // Attraction (Spring) to Connections
    node.connections.forEach((connId) => {
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
    if (Math.hypot(node.pos.x - centerX, node.pos.y - centerY) > keepInRange) {
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
    if (node.pos.x < 0) {
      node.pos.x = 0;
      node.vel.x = Math.abs(node.vel.x);
    } else if (node.pos.x > width) {
      node.pos.x = width;
      node.vel.x = -Math.abs(node.vel.x);
    }
    if (node.pos.y < 0) {
      node.pos.y = 0;
      node.vel.y = Math.abs(node.vel.y);
    } else if (node.pos.y > height) {
      node.pos.y = height;
      node.vel.y = -Math.abs(node.vel.y);
    }
    xs[i] = node.pos.x;
    ys[i] = node.pos.y;

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
        node.generation + 1,
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

        if (
          dist < reach &&
          other.connections.length < PHYSICS.MAX_CONNECTIONS &&
          !node.connections.includes(other.id) &&
          !other.connections.includes(node.id)
        ) {
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
            const hybrid = createNode(
              mx,
              my,
              [node.type, ...union],
              node.id,
              Math.max(node.generation, other.generation) + 1,
            );
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

  // 4. Cleanup Death (only rebuild lists when something was born or died)
  if (newNodes.length > 0) nextNodes = nextNodes.concat(newNodes);
  if (nextNodes.some((n) => n.energy <= 0)) {
    nextNodes = nextNodes.filter((n) => n.energy > 0);
    // Remove dead connections
    const activeIds = new Set(nextNodes.map((n) => n.id));
    for (const n of nextNodes) n.connections = n.connections.filter((id) => activeIds.has(id));
  }

  return { nodes: nextNodes, particles: nextParticles, fed };
};
