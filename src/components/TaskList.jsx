import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTask, reorderTask, addPlan, deletePlan, deleteDatabase, seedPlans } from '../db/db';
import { TaskItem } from './TaskItem';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { About } from './About';

export const TaskList = () => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [showSavePlan, setShowSavePlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const settingsMenuRef = useRef(/** @type {HTMLDivElement | null} */(null));

  useEffect(() => {
    /**
     * @param {MouseEvent} event
     */
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && event.target instanceof Node && !settingsMenuRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);
  
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
  const handleDragEnd = useCallback(async (event) => {
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
  }, []);

  /**
   * @param {React.FormEvent} e
   */
  const handleAddTask = useCallback(async (e) => {
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
  }, [newTaskTitle]);

  /**
   * @param {React.FormEvent} e
   */
  const handleSavePlan = useCallback(async (e) => {
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
  }, [newPlanTitle, newPlanDesc]);

  /**
   * @param {object} plan
   */
  const loadPlan = useCallback(async (plan) => {
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
  }, []);

  /**
   * @param {object} plan
   * @param {React.MouseEvent} e
   */
  const handleExportPlan = useCallback((plan, e) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${plan.title.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, []);

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleImportPlan = useCallback(async (e) => {
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
  }, []);

  const handleReset = useCallback(async () => {
    if (confirm('Are you sure you want to reset? This will delete all current tasks.')) {
      await db.tasks.clear();
      setShowPlans(true);
    }
  }, []);

  const handleReloadApp = useCallback(async () => {
    setShowSettings(false);
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    window.location.reload();
  }, []);

  const handleHardReset = useCallback(() => {
    setShowSettings(false);
    if (confirm('HARD RESET: This will DELETE the entire database and reload the app. Use this if the app is stuck. Continue?')) {
      deleteDatabase();
    }
  }, []);

  const handleRestoreDefaultPlans = useCallback(async () => {
    await seedPlans();
    alert('Default plans restored!');
  }, []);

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
        <div className="settings-menu-container" ref={settingsMenuRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            className="settings-button"
          >
            ⋮
          </button>

          {showSettings && (
            <div className="popover settings-popover">
              <button
                onClick={() => setShowAbout(true)}
                title="Help & About"
                className="settings-menu-item"
              >
                Help & About
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  handleReset();
                }}
                className="settings-menu-item"
                title="Clear all current tasks"
              >
                🔄 Reset Plan
              </button>
              <button
                onClick={handleReloadApp}
                className="settings-menu-item"
                title="Clear cache and reload app with latest version"
              >
                🔃 Update App
              </button>
              <button
                onClick={handleHardReset}
                className="settings-menu-item danger"
                title="Delete entire database and reload app"
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
                  title="Choose from predefined training plans"
              >
                Load a Training Plan
              </button>
            </div>
          ) : null}
        </div>
      </DndContext>

      {/* Save Plan Modal */}
      {showSavePlan && (
        <div className="modal-overlay" onClick={() => setShowSavePlan(false)}>
          <div className="modal save-plan-modal" onClick={e => e.stopPropagation()}>
            <h2 className="save-plan-title">Save as Plan</h2>
            <form onSubmit={handleSavePlan}>
              <input 
                type="text" 
                placeholder="Plan Title" 
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                className="save-plan-input"
                autoFocus
              />
              <input 
                type="text" 
                placeholder="Description (optional)" 
                value={newPlanDesc}
                onChange={(e) => setNewPlanDesc(e.target.value)}
                className="save-plan-desc"
              />
              <div className="save-plan-actions">
                <button type="button" onClick={() => setShowSavePlan(false)} className="save-plan-cancel" title="Cancel saving plan">Cancel</button>
                <button type="submit" className="save-plan-confirm" title="Save current tasks as a training plan">Save</button>
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
              <label className="import-label">
                📥 Import JSON
                <input type="file" accept=".json" onChange={handleImportPlan} className="hidden-input" />
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
                    onClick={handleRestoreDefaultPlans}
                    className="empty-state-button"
                    title="Re-add the default training plans"
                  >
                    Restore Default Plans
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowPlans(false)}
              className="modal-button modal-cancel-button"
              title="Close this dialog"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </div>
  );
};

