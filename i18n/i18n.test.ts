import { describe, expect, it } from 'vitest';
import { CATALOGS, LOCALES, browserLocale, chapterText, insightText, objectiveText } from '.';
import { CHAPTERS } from '../campaign';
import { INSIGHTS } from '../insights';
import { ARCHETYPE_ORDER } from '../constants';

describe('i18n', () => {
  it('words every chapter, objective, insight and archetype in every language', () => {
    for (const locale of LOCALES) {
      const t = CATALOGS[locale];
      for (const chapter of CHAPTERS) {
        expect(t.chapters, `${locale} chapter ${chapter.id}`).toHaveProperty(chapter.id);
        expect(chapterText(t, chapter.id).intro).not.toBe('');
        for (const objective of chapter.objectives) {
          expect(t.objectives, `${locale} objective ${objective.id}`).toHaveProperty(objective.id);
          expect(objectiveText(t, objective.id).hint).not.toBe('');
        }
      }
      for (const insight of INSIGHTS) {
        expect(t.insights, `${locale} insight ${insight.id}`).toHaveProperty(insight.id);
        expect(insightText(t, insight.id).description).not.toBe('');
      }
      for (const type of ARCHETYPE_ORDER) expect(t.archetypes[type].label).not.toBe('');
    }
  });

  it('translates rather than copying English', () => {
    for (const locale of LOCALES.filter((l) => l !== 'en')) {
      expect(CATALOGS[locale].menu.tagline).not.toBe(CATALOGS.en.menu.tagline);
      expect(CATALOGS[locale].pause.title).not.toBe(CATALOGS.en.pause.title);
    }
  });

  it('picks the first supported browser language, any Portuguese as pt-BR', () => {
    expect(browserLocale(['pt-PT', 'en'])).toBe('pt-BR');
    expect(browserLocale(['ja', 'de-AT'])).toBe('de');
    expect(browserLocale(['es-MX'])).toBe('es');
    expect(browserLocale(['ja'])).toBe('en');
    expect(browserLocale([])).toBe('en');
  });

  it('falls back to the id for unknown entries', () => {
    expect(chapterText(CATALOGS.fr, 'nope').title).toBe('nope');
  });

  it('gives every language a touch wording for plant, attention and banish', () => {
    for (const locale of LOCALES) {
      const t = CATALOGS[locale];
      expect(t.hud.howToTouch).toHaveLength(t.hud.howTo.length);
      for (const line of t.hud.howToTouch) expect(line).not.toBe('');
      for (const id of ['plant', 'split', 'banish'] as const) {
        expect(t.objectives[id].hintTouch).not.toBe('');
        expect(t.objectives[id].hintTouch).not.toBe(t.objectives[id].hint);
      }
    }
    const touchCopy = [
      ...CATALOGS.en.hud.howToTouch,
      CATALOGS.en.objectives.plant.hintTouch,
      CATALOGS.en.objectives.split.hintTouch,
      CATALOGS.en.objectives.banish.hintTouch,
    ].join(' ');
    expect(touchCopy).not.toMatch(/click|hover/i);
  });
});
