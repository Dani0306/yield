import { useLayoutEffect } from "react";

// How many mounted components currently want the page locked, and the
// body's own styles from before the first of them locked it.
let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

// Stops the page behind a modal from scrolling. Shared by every open modal:
// the page is locked when the first one opens and unlocked when the last one
// closes, in whatever order they close. (A per-modal lock breaks when two
// close together: the inner one "restores" the locked state the outer one
// left behind.)
export const useBodyScrollLock = () => {
  useLayoutEffect(() => {
    const body = document.body;

    if (locks === 0) {
      saved = {
        overflow: body.style.overflow,
        paddingRight: body.style.paddingRight,
      };
      // Keep the layout from shifting when the scrollbar disappears.
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbar > 0) {
        const padding = parseInt(getComputedStyle(body).paddingRight, 10) || 0;
        body.style.paddingRight = `${padding + scrollbar}px`;
      }
      body.style.overflow = "hidden";
    }
    locks++;

    return () => {
      locks--;
      if (locks === 0 && saved) {
        body.style.overflow = saved.overflow;
        body.style.paddingRight = saved.paddingRight;
        saved = null;
      }
    };
  }, []);
};
