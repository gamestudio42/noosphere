
import { GameState, IdeaNode, Vector2, Archetype, Particle } from '../types';
import { PHYSICS, ARCHETYPES } from '../constants';

export const createNode = (x: number, y: number, type: Archetype, parentId?: string, generation: number = 0): IdeaNode => {
  return {
    id: Math.random().toString(36).substr(2, 9),
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

export const updatePhysics = (
  nodes: IdeaNode[], 
  particles: Particle[], 
  width: number, 
  height: number, 
  onSynthesis: (x: number, y: number) => void
): { nodes: IdeaNode[], particles: Particle[] } => {
  
  let nextNodes = [...nodes];
  let nextParticles = particles.filter(p => p.life > 0);

  // 1. Particle Physics
  nextParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
  });

  // 2. Node Physics
  for (let i = 0; i < nextNodes.length; i++) {
    const node = nextNodes[i];
    
    // Decay
    node.energy -= PHYSICS.DECAY_RATE;

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
      const other = nextNodes.find(n => n.id === connId);
      if (other) {
        const d = distance(node.pos, other.pos);
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
    node.vel.x = (node.vel.x + fx) * PHYSICS.DRAG;
    node.vel.y = (node.vel.y + fy) * PHYSICS.DRAG;
    
    // Cap Velocity
    const speed = Math.hypot(node.vel.x, node.vel.y);
    if (speed > PHYSICS.MAX_VELOCITY) {
        node.vel.x = (node.vel.x / speed) * PHYSICS.MAX_VELOCITY;
        node.vel.y = (node.vel.y / speed) * PHYSICS.MAX_VELOCITY;
    }

    node.pos.x += node.vel.x;
    node.pos.y += node.vel.y;

    // Boundaries
    if (node.pos.x < 0 || node.pos.x > width) node.vel.x *= -1;
    if (node.pos.y < 0 || node.pos.y > height) node.vel.y *= -1;
    
    // CRITICAL: Clamp Energy to prevent infinite values and gradient crashes
    node.energy = Math.max(0, Math.min(node.energy, 100));
  }

  // 3. Growth & Synthesis
  const newNodes: IdeaNode[] = [];
  
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
       onSynthesis(node.pos.x, node.pos.y);
    }

    // Synthesis (Cross-pollination)
    // If close to a node that isn't connected and isn't too far structurally
    if (Math.random() < 0.002) { // Kept low
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
                onSynthesis((node.pos.x + other.pos.x)/2, (node.pos.y + other.pos.y)/2);
                
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
