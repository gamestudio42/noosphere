import { afterEach, describe, expect, it } from 'vitest';
import { PALETTES, archetypeHue, displayHue, setPalette } from './palette';
import { blendHue, createNode } from './gameLogic';

afterEach(() => setPalette('default'));

describe('palette', () => {
  it('draws the simulation hue untouched by default', () => {
    const node = createNode(0, 0, ['RATIONAL', 'CREATIVE']);
    expect(displayHue(node)).toBe(node.hue);
    expect(blendHue(['EMOTIONAL'])).toBe(PALETTES.default.EMOTIONAL);
  });

  it('maps ideas onto the colour-blind palette, keeping their small variation', () => {
    setPalette('colourblind');
    expect(archetypeHue('PRIMAL')).toBe(235);
    const node = createNode(0, 0, 'CREATIVE');
    const jitter = node.hue - PALETTES.default.CREATIVE;
    expect(displayHue(node)).toBeCloseTo(PALETTES.colourblind.CREATIVE + jitter);
  });

  it('gives the four archetypes four different colour-blind hues', () => {
    expect(new Set(Object.values(PALETTES.colourblind)).size).toBe(4);
  });
});
