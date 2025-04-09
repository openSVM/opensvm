'use client';
import { useEffect, useState } from 'react';

type KeyboardShortcutOptions = {
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

/**
 * Hook to detect keyboard shortcuts
 * @param key The key to listen for (e.g., 'k', 'Enter')
 * @param callback The function to call when the shortcut is triggered
 * @param options Additional key modifiers (meta, ctrl, alt, shift)
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {}
) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key matches and all required modifiers are pressed
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (options.metaKey === undefined || event.metaKey === options.metaKey) &&
        (options.ctrlKey === undefined || event.ctrlKey === options.ctrlKey) &&
        (options.altKey === undefined || event.altKey === options.altKey) &&
        (options.shiftKey === undefined || event.shiftKey === options.shiftKey)
      ) {
        // Prevent default behavior (like browser shortcuts)
        event.preventDefault();
        
        // Set pressed state to true
        setPressed(true);
        
        // Call the callback function
        callback();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase()) {
        setPressed(false);
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [key, callback, options.metaKey, options.ctrlKey, options.altKey, options.shiftKey]);

  return pressed;
}
