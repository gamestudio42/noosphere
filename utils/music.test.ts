import { describe, expect, it } from 'vitest';
import {
  MUSIC,
  REGISTERS,
  arpeggioNote,
  degreeHz,
  layersFor,
  nextStep,
  noteFor,
  stepSeconds,
  threatFor,
} from './music';
import { ARCHETYPE_ORDER } from '../constants';

// Semitones above A, folded into one octave
const pitchClass = (hz: number) =>
  ((Math.round(12 * Math.log2(hz / MUSIC.ROOT_HZ)) % 12) + 12) % 12;
const IN_SCALE = new Set([0, 3, 5, 7, 10]);

describe('music', () => {
  it('maps degrees onto A minor pentatonic', () => {
    expect(degreeHz(0)).toBeCloseTo(55);
    expect(degreeHz(5)).toBeCloseTo(110);
    expect(degreeHz(10)).toBeCloseTo(220);
    for (let d = 0; d < 25; d++) expect(IN_SCALE.has(pitchClass(degreeHz(d)))).toBe(true);
  });

  it('keeps every archetype in key and inside its register', () => {
    for (const type of ARCHETYPE_ORDER) {
      const [low, high] = REGISTERS[type];
      for (const energy of [0, 0.5, 1]) {
        for (const roll of [0, 0.5, 0.99]) {
          const hz = noteFor(type, energy, roll);
          expect(IN_SCALE.has(pitchClass(hz))).toBe(true);
          expect(hz).toBeGreaterThanOrEqual(degreeHz(low) - 0.01);
          expect(hz).toBeLessThanOrEqual(degreeHz(high) + 0.01);
        }
      }
    }
    // Instinct sits below Chaos
    expect(noteFor('PRIMAL', 1, 0.5)).toBeLessThan(noteFor('CREATIVE', 0, 0.5));
  });

  it('snaps events forward onto the sixteenth-note grid', () => {
    const step = stepSeconds();
    expect(nextStep(10, 10)).toEqual({ index: 0, time: 10 });
    const next = nextStep(10 + step * 0.3, 10);
    expect(next.index).toBe(1);
    expect(next.time).toBeCloseTo(10 + step);
  });

  it('keeps the arpeggio in key', () => {
    for (let i = 0; i < 16 * 8; i += 2)
      expect(IN_SCALE.has(pitchClass(arpeggioNote(i)))).toBe(true);
  });

  it('brings layers in as the mind grows and tension under attack', () => {
    expect(layersFor({ size: 0, hybrids: 0, threat: 0 })).toEqual({
      drone: 0,
      pulse: 0,
      arpeggio: 0,
      tension: 0,
    });
    const calm = layersFor({ size: 0.6, hybrids: 10, threat: 0 });
    expect(calm.pulse).toBe(1);
    expect(calm.arpeggio).toBe(1);
    const attacked = layersFor({ size: 0.6, hybrids: 10, threat: 1 });
    expect(attacked.tension).toBe(1);
    expect(attacked.arpeggio).toBeLessThan(calm.arpeggio);
  });

  it('reads threat from latched doubts and a dying mind', () => {
    expect(threatFor(30, 0)).toBe(0);
    expect(threatFor(30, 3)).toBe(1);
    expect(threatFor(1, 0)).toBeGreaterThan(0.5);
    expect(threatFor(0, 0)).toBe(0);
  });
});
