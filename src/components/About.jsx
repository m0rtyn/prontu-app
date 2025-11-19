import { useState } from 'react';

export const About = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scrollable" onClick={e => e.stopPropagation()} style={{ maxWidth: '50rem' }}>
        <div className="modal-header">
          <h2>About Pronto</h2>
          <button onClick={onClose} className="modal-button" title="Close">×</button>
        </div>
        
        <div style={{ lineHeight: '1.6' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>
            A minimalistic Capoeira progress tracking app for organizing your training journey.
          </p>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>🎯 Quick Start</h3>
          <ol style={{ marginLeft: '1.25rem', marginBottom: '1rem' }}>
            <li>Add a goal in the input field at the top</li>
            <li>Click <strong>+</strong> to add subtasks</li>
            <li>Check boxes to track progress</li>
            <li>Use <strong>⋮⋮</strong> to drag and reorder</li>
          </ol>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>📋 Features</h3>
          <ul style={{ marginLeft: '1.25rem', marginBottom: '1rem' }}>
            <li><strong>Hierarchical Tasks</strong> - Break down complex goals into steps</li>
            <li><strong>Training Plans</strong> - Load predefined or custom plans</li>
            <li><strong>Drag & Drop</strong> - Reorganize tasks easily</li>
            <li><strong>Import/Export</strong> - Share plans as JSON files</li>
            <li><strong>Dark Mode</strong> - Automatic theme switching</li>
            <li><strong>Offline Support</strong> - Works without internet</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>💾 Managing Plans</h3>
          <p style={{ marginBottom: '0.5rem' }}><strong>Load a Plan:</strong></p>
          <p style={{ marginLeft: '1rem', marginBottom: '0.75rem', color: 'var(--secondary-color)' }}>
            Click "Load a Training Plan" to choose from built-in beginner/intermediate plans or your custom saved plans.
          </p>
          
          <p style={{ marginBottom: '0.5rem' }}><strong>Save Your Plan:</strong></p>
          <p style={{ marginLeft: '1rem', marginBottom: '0.75rem', color: 'var(--secondary-color)' }}>
            Click the 💾 button, enter a title and description, then save your current tasks as a reusable plan.
          </p>

          <p style={{ marginBottom: '0.5rem' }}><strong>Export/Import:</strong></p>
          <p style={{ marginLeft: '1rem', marginBottom: '1rem', color: 'var(--secondary-color)' }}>
            Use 📤 to export plans as JSON files. Use 📥 Import JSON to load plans from files.
          </p>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>⚙️ Settings Menu (⋮)</h3>
          <ul style={{ marginLeft: '1.25rem', marginBottom: '1rem' }}>
            <li><strong>Reset Plan</strong> - Clear all current tasks</li>
            <li><strong>Hard Reset</strong> - Delete database and reload (emergency only)</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>💡 Tips</h3>
          <ul style={{ marginLeft: '1.25rem', marginBottom: '1rem' }}>
            <li>Click any task title to edit it</li>
            <li>Keep hierarchy to 3-4 levels for clarity</li>
            <li>Export important plans regularly as backups</li>
            <li>Use "Restore Default Plans" if built-in plans disappear</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>🔧 Troubleshooting</h3>
          <p style={{ marginBottom: '0.5rem' }}><strong>No plans available?</strong></p>
          <p style={{ marginLeft: '1rem', marginBottom: '0.75rem', color: 'var(--secondary-color)' }}>
            Click "Restore Default Plans" in the Load Plan modal.
          </p>

          <p style={{ marginBottom: '0.5rem' }}><strong>App not working?</strong></p>
          <p style={{ marginLeft: '1rem', marginBottom: '1rem', color: 'var(--secondary-color)' }}>
            Try the Hard Reset option from the settings menu (⋮).
          </p>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>📱 Install as App</h3>
          <p style={{ marginBottom: '0.5rem', color: 'var(--secondary-color)' }}>
            <strong>Desktop:</strong> Click the install icon in your browser's address bar.
          </p>
          <p style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>
            <strong>Mobile:</strong> Use "Add to Home Screen" from your browser menu.
          </p>

          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: 'var(--border-color)', 
            borderRadius: 'var(--radius)',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontStyle: 'italic' }}>
              "Progress, not perfection!"
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
              Axé! 🥁
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="modal-button primary"
          style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
