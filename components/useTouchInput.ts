import { useEffect, useState } from 'react';

// Phones and tablets report a coarse pointer and no hover. A fine pointer that
// later sends a real touch (a touchscreen laptop) switches for the session.
const coarseQuery = '(pointer: coarse), (hover: none)';

export const detectsTouchInput = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(coarseQuery).matches;
};

export const useTouchInput = (): boolean => {
  const [touch, setTouch] = useState(detectsTouchInput);

  useEffect(() => {
    const media = window.matchMedia(coarseQuery);
    let sawTouch = false;
    const update = () => setTouch(media.matches || sawTouch);
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      sawTouch = true;
      update();
    };
    media.addEventListener('change', update);
    window.addEventListener('pointerdown', onPointerDown);
    update();
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return touch;
};
