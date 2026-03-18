import React, { useEffect } from 'react';

const CopyPasteBlocker = ({ enabled, onViolation }) => {
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e) => {
      e.preventDefault();
      onViolation?.('copy');
      return false;
    };

    const handlePaste = (e) => {
      e.preventDefault();
      onViolation?.('paste');
      return false;
    };

    const handleCut = (e) => {
      e.preventDefault();
      onViolation?.('cut');
      return false;
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      onViolation?.('right_click');
      return false;
    };

    const handleKeyDown = (e) => {
      // Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        onViolation?.('keyboard_shortcut');
        return false;
      }
      
      // Print screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        onViolation?.('screenshot');
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';

    return () => {
      // Remove event listeners
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);

      // Re-enable text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
      document.body.style.mozUserSelect = '';
    };
  }, [enabled, onViolation]);

  return null;
};

export default CopyPasteBlocker;