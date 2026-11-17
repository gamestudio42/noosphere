import React from 'react';
import { ARCHETYPES } from '../constants';
import { chapterText, useI18n } from '../i18n';
import { CHAPTERS, Chapter } from '../campaign';

interface ChapterCardProps {
  chapter: Chapter | null; // null announces the end of the campaign
  onDone: () => void;
}

// Non-blocking title card shown when a chapter begins
export const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, onDone }) => {
  const { t } = useI18n();
  const index = chapter ? CHAPTERS.indexOf(chapter) : -1;
  const text = chapter ? chapterText(t, chapter.id) : null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4"
      aria-live="polite"
    >
      <div
        className="text-center animate-[cardInOut_5s_ease-in-out_forwards]"
        onAnimationEnd={onDone}
      >
        <p className="text-[11px] uppercase tracking-[0.5em] text-stone-500 mb-3">
          {chapter ? t.campaign.chapter(index + 1) : t.campaign.complete}
        </p>
        <h2 className="text-5xl font-light tracking-tighter mb-3">
          {text ? text.title : t.campaign.wholeTitle}
        </h2>
        <p className="text-stone-400">{text ? text.intro : t.campaign.wholeIntro}</p>
        {chapter && (chapter.unlocks.length > 0 || chapter.doubts) && (
          <div className="mt-5 flex justify-center gap-2">
            {chapter.unlocks.map((type) => (
              <span
                key={type}
                className="px-3 py-1 rounded-full text-[11px] uppercase tracking-widest border"
                style={{
                  borderColor: `hsla(${ARCHETYPES[type].hue}, 80%, 60%, 0.6)`,
                  color: `hsl(${ARCHETYPES[type].hue}, 80%, 75%)`,
                }}
              >
                {t.campaign.unlocked(t.archetypes[type].label)}
              </span>
            ))}
            {chapter.doubts && (
              <span className="px-3 py-1 rounded-full text-[11px] uppercase tracking-widest border border-violet-400/50 text-violet-200">
                {t.campaign.doubtsArrive}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
