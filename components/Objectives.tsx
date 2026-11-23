import React from 'react';
import { Check } from 'lucide-react';
import { CHAPTERS, CampaignState, currentChapter, objectiveProgress } from '../campaign';
import { SessionStats } from '../types';
import { chapterText, objectiveText, useI18n } from '../i18n';
import { useTouchInput } from './useTouchInput';

interface ObjectivesProps {
  campaign: CampaignState;
  stats: SessionStats | null;
}

export const Objectives: React.FC<ObjectivesProps> = ({ campaign, stats }) => {
  const { t } = useI18n();
  const touch = useTouchInput();
  const chapter = currentChapter(campaign);

  if (!chapter) {
    return (
      <div className="w-60 text-right">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">
          {t.campaign.complete}
        </p>
        <p className="mt-1 text-xs text-stone-400">{t.campaign.completeHint}</p>
      </div>
    );
  }

  const next = chapter.objectives.find((o) => !campaign.done.includes(o.id));
  const nextHint = next ? objectiveText(t, next.id) : null;
  const nextHintText =
    nextHint && touch && nextHint.hintTouch ? nextHint.hintTouch : (nextHint?.hint ?? '');

  return (
    <div className="w-60 text-right">
      <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">
        {t.campaign.chapterOf(campaign.chapter + 1, CHAPTERS.length)}
      </p>
      <p className="text-sm font-bold tracking-wide text-stone-200">
        {chapterText(t, chapter.id).title}
      </p>
      <ul className="mt-2 space-y-1">
        {chapter.objectives.map((objective) => {
          const done = campaign.done.includes(objective.id);
          const { value, held } = stats
            ? objectiveProgress(objective, campaign, stats)
            : { value: 0, held: 0 };
          const progress = objective.holdSeconds
            ? `${Math.min(objective.holdSeconds, Math.floor(held))}/${objective.holdSeconds}s`
            : `${Math.min(objective.target, Math.floor(value))}/${objective.target}`;
          return (
            <li
              key={objective.id}
              className={`flex items-center justify-end gap-2 text-xs ${done ? 'text-stone-500 line-through' : 'text-stone-300'}`}
            >
              <span>{objectiveText(t, objective.id).label}</span>
              {done ? (
                <Check size={12} className="text-cyan-300 shrink-0" />
              ) : (
                <span className="tabular-nums text-[10px] text-stone-500 min-w-[2.5rem]">
                  {progress}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {next && nextHintText && (
        <p className="mt-3 text-[11px] leading-snug text-cyan-100/70">{nextHintText}</p>
      )}
    </div>
  );
};
