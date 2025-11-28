import { useState } from 'react';

export const About = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scrollable about-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>About Pronto</h2>
          <button onClick={onClose} className="modal-button" title="Close">×</button>
        </div>
        
        <div className="about-content">
          <p className="about-description">
            A minimalistic Capoeira progress tracking app for organizing your training journey.
          </p>

          <h3 className="about-section-title">🎯 Quick Start</h3>
          <ol className="about-list">
            <li>Add a goal in the input field at the top</li>
            <li>Click <strong>+</strong> to add subtasks</li>
            <li>Check boxes to track progress</li>
            <li>Use <strong>⋮⋮</strong> to drag and reorder</li>
          </ol>

          <h3 className="about-section-title">📋 Features</h3>
          <ul className="about-list">
            <li><strong>Hierarchical Tasks</strong> - Break down complex goals into steps</li>
            <li><strong>Training Plans</strong> - Load predefined or custom plans</li>
            <li><strong>Drag & Drop</strong> - Reorganize tasks easily</li>
            <li><strong>Import/Export</strong> - Share plans as JSON files</li>
            <li><strong>Dark Mode</strong> - Automatic theme switching</li>
            <li><strong>Offline Support</strong> - Works without internet</li>
          </ul>

          <h3 className="about-section-title">💾 Managing Plans</h3>
          <p className="about-text-block"><strong>Load a Plan:</strong></p>
          <p className="about-text-indent">
            Click "Load a Training Plan" to choose from built-in beginner/intermediate plans or your custom saved plans.
          </p>
          
          <p className="about-text-block"><strong>Save Your Plan:</strong></p>
          <p className="about-text-indent">
            Click the 💾 button, enter a title and description, then save your current tasks as a reusable plan.
          </p>

          <p className="about-text-block"><strong>Export/Import:</strong></p>
          <p className="about-text-indent-large">
            Use 📤 to export plans as JSON files. Use 📥 Import JSON to load plans from files.
          </p>

          <h3 className="about-section-title">⚙️ Settings Menu (⋮)</h3>
          <ul className="about-list">
            <li><strong>Reset Plan</strong> - Clear all current tasks</li>
            <li><strong>Hard Reset</strong> - Delete database and reload (emergency only)</li>
          </ul>

          <h3 className="about-section-title">💡 Tips</h3>
          <ul className="about-list">
            <li>Click any task title to edit it</li>
            <li>Keep hierarchy to 3-4 levels for clarity</li>
            <li>Export important plans regularly as backups</li>
            <li>Use "Restore Default Plans" if built-in plans disappear</li>
          </ul>

          <h3 className="about-section-title">🔧 Troubleshooting</h3>
          <p className="about-text-block"><strong>No plans available?</strong></p>
          <p className="about-text-indent">
            Click "Restore Default Plans" in the Load Plan modal.
          </p>

          <p className="about-text-block"><strong>App not working?</strong></p>
          <p className="about-text-indent-large">
            Try the Hard Reset option from the settings menu (⋮).
          </p>

          <h3 className="about-section-title">📱 Install as App</h3>
          <p className="about-text-block" style={{ color: 'var(--secondary-color)' }}>
            <strong>Desktop:</strong> Click the install icon in your browser's address bar.
          </p>
          <p className="about-text-indent-large">
            <strong>Mobile:</strong> Use "Add to Home Screen" from your browser menu.
          </p>

          <div className="quote-box">
            <p className="quote-text">
              "Progress, not perfection!"
            </p>
            <p className="quote-subtext">
              Axé! 🥁
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="modal-button primary about-button"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
