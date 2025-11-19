import Dexie from 'dexie';

export const db = new Dexie('ProntuDB');

db.version(1).stores({
  tasks: '++id, title, completed, parentId, createdAt' // Primary key and indexed props
});

// Version 2: Add 'order' field
db.version(2).stores({
  tasks: '++id, title, completed, parentId, order, createdAt'
}).upgrade(async tx => {
  // Initialize order for existing tasks
  await tx.table('tasks').toCollection().modify(task => {
    task.order = task.createdAt.getTime(); // Simple initial order
  });
});

import { trainingPlans } from '../data/trainingPlans';

// Version 3: Add 'plans' table
db.version(3).stores({
  tasks: '++id, title, completed, parentId, order, createdAt',
  plans: '++id, title, description, isCustom'
}).upgrade(async tx => {
  // Seed initial plans
  await tx.table('plans').bulkAdd(trainingPlans.map(p => ({
    ...p,
    isCustom: false
  })));
});

// Version 4: Re-seed plans to include new Beginner Plan
db.version(4).stores({
  tasks: '++id, title, completed, parentId, order, createdAt',
  plans: '++id, title, description, isCustom'
}).upgrade(async tx => {
  // Remove existing built-in plans to avoid duplicates/outdated versions
  await tx.table('plans').where('isCustom').equals(false).delete();

  // Re-seed all built-in plans
  await tx.table('plans').bulkAdd(trainingPlans.map(p => ({
    ...p,
    isCustom: false
  })));
});

export const addTask = async (title, parentId = 'root', completed = false) => {
  // Get the max order for this parent to append to the end
  const siblings = await db.tasks.where('parentId').equals(String(parentId)).toArray();
  const maxOrder = siblings.reduce((max, t) => Math.max(max, t.order || 0), 0);

  return await db.tasks.add({
    title,
    completed,
    parentId: String(parentId),
    order: maxOrder + 1,
    createdAt: new Date()
  });
};

export const addPlan = async (title, description, tasks) => {
  return await db.plans.add({
    title,
    description,
    tasks,
    isCustom: true
  });
};

export const deletePlan = async (id) => {
  return await db.plans.delete(id);
};

export const updateTask = async (id, updates) => {
  return await db.tasks.update(id, updates);
};

export const deleteTask = async (id) => {
  // Recursive delete
  const subtasks = await db.tasks.where('parentId').equals(String(id)).toArray();
  for (const subtask of subtasks) {
    await deleteTask(subtask.id);
  }
  return await db.tasks.delete(id);
};

export const getTasks = (parentId = 'root') => {
  return db.tasks.where('parentId').equals(parentId).sortBy('order');
};

export const reorderTask = async (taskId, newParentId, newOrder) => {
  return await db.tasks.update(taskId, {
    parentId: String(newParentId),
    order: newOrder
  });
};
