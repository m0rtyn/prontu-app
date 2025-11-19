import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTask, reorderTask, addPlan, deletePlan, deleteDatabase, seedPlans } from '../db/db';
import { TaskItem } from './TaskItem';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const TaskList = () => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [showSavePlan, setShowSavePlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const tasks = useLiveQuery(() => 
    db.tasks.where('parentId').equals('root').sortBy('order')
  );

  const plans = useLiveQuery(() => db.plans.toArray());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  /**
   * @param {import('@dnd-kit/core').DragEndEvent} event
   */
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeTask = await db.tasks.get(active.id);
      const overTask = await db.tasks.get(over.id);

      if (activeTask && overTask) {
        if (activeTask.parentId !== overTask.parentId) {
          const newOrder = (overTask.order || 0) - 0.001;
          await db.tasks.update(active.id, { 
            parentId: overTask.parentId,
            order: newOrder 
          });
        } else {
          const newOrder = (overTask.order || 0) - 0.001;
           await db.tasks.update(active.id, { order: newOrder });
        }
      }
    }
  };

  /**
   * @param {React.FormEvent} e
   */
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      try {
        await addTask(newTaskTitle);
        setNewTaskTitle('');
      } catch (error) {
        console.error("Failed to add task:", error);
        alert("Failed to add task. The database might be in an invalid state. Try reloading or resetting.");
      }
    }
  };

  /**
   * @param {React.FormEvent} e
   */
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (newPlanTitle.trim()) {
      // Recursively build the plan structure from current tasks
      /**
       * @param {string|number} parentId
       * @returns {Promise<Array>}
       */
      const buildPlanTasks = async (parentId) => {
        const children = await db.tasks.where('parentId').equals(String(parentId)).sortBy('order');
        const planChildren = [];
        for (const child of children) {
          const subChildren = await buildPlanTasks(child.id);
          planChildren.push({
            title: child.title,
            completed: child.completed,
            children: subChildren.length > 0 ? subChildren : undefined
          });
        }
        return planChildren;
      };

      const rootTasks = await db.tasks.where('parentId').equals('root').sortBy('order');
      const planTasks = [];
      for (const task of rootTasks) {
        const children = await buildPlanTasks(task.id);
        planTasks.push({
          title: task.title,
          completed: task.completed,
          children: children.length > 0 ? children : undefined
        });
      }

      await addPlan(newPlanTitle, newPlanDesc, planTasks);
      setNewPlanTitle('');
      setNewPlanDesc('');
      setShowSavePlan(false);
      alert('Plan saved!');
    }
  };

  /**
   * @param {object} plan
   */
  const loadPlan = async (plan) => {
    if (confirm(`Load plan "${plan.title}"? This will add tasks to your list.`)) {
      /**
       * @param {object} task
       * @param {string|number} [parentId='root']
       */
      const addRecursive = async (task, parentId = 'root') => {
        const id = await addTask(task.title, parentId, task.completed);
        if (task.children) {
          for (const child of task.children) {
            await addRecursive(child, id);
          }
        }
      };

      // Create a root task for the plan
      const rootId = await addTask(plan.title, 'root', false); // Plan root itself is usually not completed
      if (plan.tasks) {
        for (const task of plan.tasks) {
          await addRecursive(task, rootId);
        }
      }
      setShowPlans(false);
    }
  };

  /**
   * @param {object} plan
   * @param {React.MouseEvent} e
   */
  const handleExportPlan = (plan, e) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${plan.title.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleImportPlan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (typeof event.target?.result === 'string') {
          const plan = JSON.parse(event.target.result);
          if (!plan.title || !plan.tasks) {
            alert('Invalid plan format: Missing title or tasks.');
            return;
          }

          // Remove IDs to avoid conflicts and ensure it's treated as a new plan
          const cleanPlan = {
            ...plan,
            id: undefined,
            isCustom: true
          };

          await addPlan(cleanPlan.title, cleanPlan.description || '', cleanPlan.tasks);
          alert(`Plan "${cleanPlan.title}" imported successfully!`);
        }
      } catch (error) {
        console.error('Error importing plan:', error);
        alert('Error importing plan. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset? This will delete all current tasks.')) {
      await db.tasks.clear();
      setShowPlans(true);
    }
  };

  return (
    <div className="task-list">
      <div className="task-list-toolbar">
        <form onSubmit={handleAddTask} className="task-list-input-wrapper">
          <input 
            type="text" 
            placeholder="Add a new goal..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="task-list-input"
          />
        </form>
        <button 
          onClick={() => setShowSavePlan(true)}
          title="Save current list as a plan"
          className="toolbar-button"
        >
          💾
        </button>
        <div className="settings-menu-container">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            className="settings-button"
          >
            ⋮
          </button>
          {showSettings && (
            <div className="settings-popover">
              <button
                onClick={() => {
                  setShowSettings(false);
                  handleReset();
                }}
                className="settings-menu-item"
              >
                🔄 Reset Plan
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  if (confirm('HARD RESET: This will DELETE the entire database and reload the app. Use this if the app is stuck. Continue?')) {
                    deleteDatabase();
                  }
                }}
                className="settings-menu-item danger"
              >
                ⚠️ Hard Reset
              </button>
            </div>
          )}
        </div>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <div className="tasks">
          <SortableContext 
            items={tasks?.map(t => t.id) || []} 
            strategy={verticalListSortingStrategy}
          >
            {tasks?.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </SortableContext>
          
          {tasks === undefined ? (
            <div className="empty-state">
              Loading...
            </div>
          ) : tasks.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">
                No goals yet. Start by adding one above or...
              </p>
              <button 
                onClick={() => setShowPlans(!showPlans)}
                  className="empty-state-button"
              >
                Load a Training Plan
              </button>
            </div>
          ) : null}
        </div>
      </DndContext>

      {/* Save Plan Modal */}
      {showSavePlan && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowSavePlan(false)}>
          <div className="modal" style={{
            backgroundColor: 'var(--bg-color)', padding: '24px', borderRadius: 'var(--radius)',
            maxWidth: '500px', width: '90%'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '16px' }}>Save as Plan</h2>
            <form onSubmit={handleSavePlan}>
              <input 
                type="text" 
                placeholder="Plan Title" 
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                style={{ marginBottom: '12px' }}
                autoFocus
              />
              <input 
                type="text" 
                placeholder="Description (optional)" 
                value={newPlanDesc}
                onChange={(e) => setNewPlanDesc(e.target.value)}
                style={{ marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowSavePlan(false)} style={{ color: 'var(--secondary-color)' }}>Cancel</button>
                <button type="submit" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Load Plan Modal */}
      {showPlans && (
        <div className="modal-overlay" onClick={() => setShowPlans(false)}>
          <div className="modal scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select a Plan</h2>
              <label style={{ 
                cursor: 'pointer', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}>
                📥 Import JSON
                <input type="file" accept=".json" onChange={handleImportPlan} style={{ display: 'none' }} />
              </label>
            </div>
            
            <div className="plan-list">
              {plans?.map((plan, index) => (
                <div key={index} className="plan-item" onClick={() => loadPlan(plan)}>
                  <div>
                    <h3>
                      {plan.title}
                      {plan.isCustom && <span className="plan-badge">CUSTOM</span>}
                    </h3>
                    <p>{plan.description}</p>
                  </div>
                  <div className="plan-actions">
                    <button
                      onClick={(e) => handleExportPlan(plan, e)}
                      title="Export to JSON"
                      className="plan-action-button"
                    >
                      📤
                    </button>
                    {plan.isCustom && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete plan "${plan.title}"?`)) {
                            await deletePlan(plan.id);
                          }
                        }}
                        title="Delete Plan"
                        className="plan-action-button"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {(!plans || plans.length === 0) && (
                <div className="empty-state">
                  <p className="empty-state-text">No plans found.</p>
                  <button
                    onClick={async () => {
                      await seedPlans();
                      alert('Default plans restored!');
                    }}
                    className="empty-state-button"
                  >
                    Restore Default Plans
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowPlans(false)}
              className="modal-button"
              style={{ marginTop: '1.25rem', width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
