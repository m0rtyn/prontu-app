import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateTask, deleteTask, addTask } from '../db/db';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

/**
 * @param {object} props
 * @param {import('../db/db').Task} props.task
 */
export const TaskItem = ({ task }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
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

  const handleToggle = () => {
    updateTask(task.id, { completed: !task.completed });
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle });
      setIsEditing(false);
    }
  };

  /**
   * @param {React.FormEvent} e
   */
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      await addTask(newSubtaskTitle, String(task.id));
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      setIsExpanded(true);
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this task and all subtasks?')) {
      deleteTask(task.id);
    }
  };

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
        
        {isEditing ? (
          <input 
            type="text" 
            value={editTitle} 
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            autoFocus
          />
        ) : (
          <span 
              className={`task-title${task.completed ? ' completed' : ''}`}
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </span>
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
};
