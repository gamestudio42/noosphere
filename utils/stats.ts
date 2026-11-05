import { IdeaNode } from '../types';

// Size of the largest connected group of ideas
export const largestNetwork = (nodes: IdeaNode[]): number => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  let best = 0;
  for (const start of nodes) {
    if (seen.has(start.id)) continue;
    let size = 0;
    const stack = [start];
    seen.add(start.id);
    while (stack.length) {
      const node = stack.pop()!;
      size++;
      for (const id of node.connections) {
        const next = byId.get(id);
        if (next && !seen.has(id)) {
          seen.add(id);
          stack.push(next);
        }
      }
    }
    best = Math.max(best, size);
  }
  return best;
};

export const formatDuration = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};
