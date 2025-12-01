import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onSelect?: (index: number) => void;
  onSubmit?: () => void;
  onNext?: () => void;
  onHint?: () => void;
  onHelp?: () => void;
  onPrevious?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();

      // Number keys 1-4 for answer selection
      if (key >= '1' && key <= '4' && handlers.onSelect) {
        event.preventDefault();
        const index = parseInt(key) - 1;
        handlers.onSelect(index);
        return;
      }

      // Enter for submit
      if (key === 'enter' && handlers.onSubmit) {
        event.preventDefault();
        handlers.onSubmit();
        return;
      }

      // N or ArrowRight for next
      if ((key === 'n' || key === 'arrowright') && handlers.onNext) {
        event.preventDefault();
        handlers.onNext();
        return;
      }

      // ArrowLeft for previous
      if (key === 'arrowleft' && handlers.onPrevious) {
        event.preventDefault();
        handlers.onPrevious();
        return;
      }

      // H for hint
      if (key === 'h' && handlers.onHint) {
        event.preventDefault();
        handlers.onHint();
        return;
      }

      // ? (Shift + /) for help
      if ((key === '?' || (event.shiftKey && key === '/')) && handlers.onHelp) {
        event.preventDefault();
        handlers.onHelp();
        return;
      }

      // Escape for close/cancel
      if (key === 'escape' && handlers.onEscape) {
        event.preventDefault();
        handlers.onEscape();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, enabled]);
}
