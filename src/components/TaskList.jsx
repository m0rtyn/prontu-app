import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTask, reorderTask, addPlan, deletePlan } from '../db/db';
import { TaskItem } from './TaskItem';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const TaskList = () => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [showSavePlan, setShowSavePlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      await addTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (newPlanTitle.trim()) {
      // Recursively build the plan structure from current tasks
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

  const loadPlan = async (plan) => {
    if (confirm(`Load plan "${plan.title}"? This will add tasks to your list.`)) {
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

  const handleImportPlan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
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
      } catch (error) {
        console.error('Error importing plan:', error);
        alert('Error importing plan. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset? This will delete all current tasks.')) {
      await db.tasks.clear();
      setShowPlans(true);
    }
  };

  return (
    <div className="task-list">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <form onSubmit={handleAddTask} style={{ flex: 1 }}>
          <input 
            type="text" 
            placeholder="Add a new goal..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ fontSize: '1.1rem', padding: '12px' }}
          />
        </form>
        <button 
          onClick={() => setShowSavePlan(true)}
          title="Save current list as a plan"
          style={{ 
            padding: '0 16px', 
            backgroundColor: 'var(--bg-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius)',
            cursor: 'pointer'
          }}
        >
          💾
        </button>
        <button 
          onClick={handleReset}
          title="Reset Plan"
          style={{ 
            padding: '0 16px', 
            backgroundColor: 'var(--bg-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius)',
            cursor: 'pointer'
          }}
        >
          🔄
        </button>
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
          
          {tasks?.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <p style={{ color: 'var(--secondary-color)', marginBottom: '20px' }}>
                No goals yet. Start by adding one above or...
              </p>
              <button 
                onClick={() => setShowPlans(!showPlans)}
                style={{ 
                  color: 'var(--accent-color)', 
                  textDecoration: 'underline',
                  fontSize: '0.9rem'
                }}
              >
                Load a Training Plan
              </button>
            </div>
          )}
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
                <button type="button" onClick={() => setShowSavePlan(false)}>Cancel</button>
                <button type="submit" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Load Plan Modal */}
      {showPlans && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowPlans(false)}>
          <div className="modal" style={{
            backgroundColor: 'var(--bg-color)', padding: '24px', borderRadius: 'var(--radius)',
            maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Select a Plan</h2>
              <label style={{ 
                cursor: 'pointer', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                📥 Import JSON
                <input type="file" accept=".json" onChange={handleImportPlan} style={{ display: 'none' }} />
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plans?.map((plan, index) => (
                <div key={index} style={{ 
                  border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius)',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                  position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                }}
                onClick={() => loadPlan(plan)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                      {plan.title}
                      {plan.isCustom && <span style={{ fontSize: '0.7rem', marginLeft: '8px', backgroundColor: 'var(--secondary-color)', color: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>CUSTOM</span>}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--secondary-color)' }}>{plan.description}</p>
                  </div>
                  <button 
                    onClick={(e) => handleExportPlan(plan, e)}
                    title="Export to JSON"
                    style={{ 
                      background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer',
                      opacity: 0.6, padding: '4px'
                    }}
                    onMouseEnter={e => e.target.style.opacity = 1}
                    onMouseLeave={e => e.target.style.opacity = 0.6}
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
                      style={{
                        background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer',
                        opacity: 0.6, padding: '4px', marginLeft: '4px'
                      }}
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0.6}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowPlans(false)}
              style={{ marginTop: '20px', width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
