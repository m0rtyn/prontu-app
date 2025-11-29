import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateTask, deleteTask, addTask } from '../db/db';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

/**
 * @typedef {Object} Props
 * @property {string} initialValue - Indicates whether the Courage component is present.
 * @property {(value: string) => void} onSave - Indicates whether the Power component is present.
 * @property {() => void} onCancel - Indicates whether the Wisdom component is present.
 */

/** @type {React.FC<Props>} */
const TaskEditor = memo(({ initialValue, onSave, onCancel }) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef(/** @type {HTMLTextAreaElement | null} */(null));

  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      el.setSelectionRange(el.value.length, el.value.length);
      el.focus();
    }
  }, []);

  const handleChange = (e) => {
    setValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSave(value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="task-editor-overlay">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={() => onSave(value)}
        onKeyDown={handleKeyDown}
      />
      <div className="task-editor-help">
        <small>Cmd+Enter to save, Esc to cancel</small>
      </div>
    </div>
  );
});

TaskEditor.displayName = 'TaskEditor';

/** @typedef {Object} TaskItemProps 
 * @property {import('../db/db').Task} task
 */
/** @type {React.FC<TaskItemProps>}  */
export const TaskItem = memo(({ task }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(/** @type {HTMLDivElement | null} */(null));

  useEffect(() => {
    /**
     * @param {MouseEvent} event
     */
    const handleClickOutside = (event) => {
      if (menuRef.current && event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const subtasks = useLiveQuery(() => 
    db.tasks.where('parentId').equals(String(task.id)).sortBy('order')
  ) || [];

  const handleToggle = useCallback(() => {
    updateTask(task.id, { completed: !task.completed });
  }, [task.id, task.completed]);

  const handleSaveEdit = useCallback((newTitle) => {
    if (newTitle.trim() && newTitle !== task.title) {
      updateTask(task.id, { title: newTitle });
    }
    setIsEditing(false);
  }, [task.id, task.title]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  /**
   * @param {React.FormEvent} e
   */
  const handleAddSubtask = useCallback(async (e) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      await addTask(newSubtaskTitle, String(task.id));
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      setIsExpanded(true);
    }
  }, [newSubtaskTitle, task.id]);

  const handleDelete = useCallback(() => {
    if (confirm('Delete this task and all subtasks?')) {
      deleteTask(task.id);
    }
  }, [task.id]);

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="task-item">
      <div className="task-content">
        {/* Drag Handle */}
        <span {...listeners} className="drag-handle">⋮⋮</span>

        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={handleToggle}
          className="task-checkbox"
        />

        <span
          className={`task-title${task.completed ? ' completed' : ''}`}
          onClick={() => setIsEditing(true)}
        >
          {task.title}
        </span>

        {isEditing && (
          <TaskEditor
            initialValue={task.title}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        )}

        <button
          className={`toggle-button ${isExpanded ? 'expanded' : ''} ${subtasks.length > 0 ? 'has-subtasks' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
        />

        <div className="task-menu-container" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`task-menu-button ${showMenu ? 'active' : ''}`}
            title="Menu"
          >
            ⋮
          </button>

          {showMenu && (
            <div className="popover task-menu-popover">
              <button
                onClick={() => {
                  setShowAddSubtask(!showAddSubtask);
                  setShowMenu(false);
                }}
                className="task-menu-item"
                title="Add Subtask"
              >
                <span>+</span> Add Subtask
              </button>
              <button 
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                className="task-menu-item danger"
                title="Delete"
              >
                <span>×</span> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddSubtask && (
        <form onSubmit={handleAddSubtask} className="subtask-form">
          <input 
            type="text" 
            placeholder="New subtask..." 
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            autoFocus
          />
        </form>
      )}

      {subtasks?.length > 0 && (
        <div className={`subtasks-wrapper ${isExpanded ? 'expanded' : ''}`}>
          <div className="subtasks-inner">
            <SortableContext
              items={subtasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {subtasks.map(subtask => (
                <TaskItem key={subtask.id} task={subtask} />
              ))}
            </SortableContext>
          </div>
        </div>
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';
