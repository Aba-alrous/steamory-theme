/**
 * Drag-to-scroll for any element marked `data-st-drag`.
 *
 * Touch devices already scroll these rails natively, and so does a trackpad;
 * this only adds the click-and-pull gesture a mouse user expects from a rail
 * that has no arrows.
 */
function makeDraggable(rail) {
  if (rail.dataset.stDragReady) return;
  rail.dataset.stDragReady = '1';

  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  // A press that never really moves should still count as a click on the card
  // underneath, so links keep working.
  let moved = false;

  const start = event => {
    dragging = true;
    moved = false;
    startX = event.pageX;
    startScroll = rail.scrollLeft;
    rail.classList.add('is-dragging');
  };

  const move = event => {
    if (!dragging) return;
    const distance = event.pageX - startX;
    if (Math.abs(distance) > 4) moved = true;
    // Prevents the browser's own text selection from fighting the drag.
    event.preventDefault();
    rail.scrollLeft = startScroll - distance;
  };

  const end = () => {
    dragging = false;
    rail.classList.remove('is-dragging');
  };

  rail.addEventListener('pointerdown', start);
  rail.addEventListener('pointermove', move);
  rail.addEventListener('pointerup', end);
  rail.addEventListener('pointerleave', end);
  rail.addEventListener('pointercancel', end);

  rail.addEventListener(
    'click',
    event => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}

function initDragRails() {
  document.querySelectorAll('[data-st-drag]').forEach(makeDraggable);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDragRails);
} else {
  initDragRails();
}

// The homepage editor swaps components in and out without a reload.
document.addEventListener('theme::ready', initDragRails);
