import React, { useState } from 'react';
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
    marginLeft: '20px', 
    marginTop: '8px'
  };

  const subtasks = useLiveQuery(() => 
    db.tasks.where('parentId').equals(String(task.id)).sortBy('order')
  );

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
      await addTask(newSubtaskTitle, task.id);
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="task-content" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Drag Handle */}
        <span {...listeners} style={{ cursor: 'grab', color: 'var(--secondary-color)', fontSize: '1.2rem' }}>⋮⋮</span>

        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={handleToggle}
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
            style={{ 
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'var(--secondary-color)' : 'var(--text-color)',
              flex: 1,
              cursor: 'pointer'
            }}
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </span>
        )}

        <div className="actions" style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          <button 
            onClick={() => setShowAddSubtask(!showAddSubtask)} 
            title="Add Subtask"
            style={{
              color: 'var(--accent-color)',
              fontWeight: 'bold',
              padding: '8px 12px', // Larger touch target
              fontSize: '1.2rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            +
          </button>
          <button 
            onClick={handleDelete} 
            title="Delete" 
            style={{
              color: 'var(--danger-color)',
              fontWeight: 'bold',
              padding: '8px 12px', // Larger touch target
              fontSize: '1.2rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {showAddSubtask && (
        <form onSubmit={handleAddSubtask} style={{ marginLeft: '30px', marginTop: '8px' }}>
          <input 
            type="text" 
            placeholder="New subtask..." 
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            autoFocus
          />
        </form>
      )}

      {subtasks && subtasks.length > 0 && isExpanded && (
        <div className="subtasks">
          <SortableContext 
            items={subtasks.map(t => t.id)} 
            strategy={verticalListSortingStrategy}
          >
            {subtasks.map(subtask => (
              <TaskItem key={subtask.id} task={subtask} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};
