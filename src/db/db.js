import Dexie from 'dexie';
import { trainingPlans } from '../data/trainingPlans';

export class ProntuDB extends Dexie {
  tasks;
  plans;

  constructor() {
    super('ProntuDB');
    this.version(1).stores({
      tasks: '++id, title, completed, parentId, createdAt'
    });

    this.version(2).stores({
      tasks: '++id, title, completed, parentId, order, createdAt'
    });

    this.version(3).stores({
      tasks: '++id, title, completed, parentId, order, createdAt',
      plans: '++id, title, description, isCustom'
    });

    this.version(4).stores({
      tasks: '++id, title, completed, parentId, order, createdAt',
      plans: '++id, title, description, isCustom'
    }).upgrade(async tx => {
      // Remove existing built-in plans to avoid duplicates/outdated versions
      await tx.table('plans').where('isCustom').equals(false).delete();

      // Re-seed all built-in plans
      if (trainingPlans && Array.isArray(trainingPlans)) {
        await tx.table('plans').bulkAdd(trainingPlans.map(p => ({
          ...p,
          isCustom: false
        })));
      }
    });

    this.tasks = this.table('tasks');
    this.plans = this.table('plans');
  }
}

/**
 * @typedef {object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} completed
 * @property {string} parentId
 * @property {number} [order]
 * @property {Date} createdAt
 */

/**
 * @typedef {object} Plan
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {Array<Task>} tasks
 * @property {boolean} isCustom
 */

export const db = new ProntuDB();

// Populate hook for fresh installs
db.on('populate', async () => {
  if (trainingPlans && Array.isArray(trainingPlans)) {
    await db.plans.bulkAdd(trainingPlans.map(p => ({
      ...p,
      isCustom: false
    })));
  }
});

/**
 * @param {string} title
 * @param {string} [parentId='root']
 * @param {boolean} [completed=false]
 */
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

/**
 * @param {string} title
 * @param {string} description
 * @param {Array} tasks
 */
export const addPlan = async (title, description, tasks) => {
  return await db.plans.add({
    title,
    description,
    tasks,
    isCustom: true
  });
};

/**
 * @param {number} id
 */
export const deletePlan = async (id) => {
  return await db.plans.delete(id);
};

/**
 * @param {number} id
 * @param {object} updates
 */
export const updateTask = async (id, updates) => {
  return await db.tasks.update(id, updates);
};

/**
 * @param {number} id
 */
export const deleteTask = async (id) => {
  // Recursive delete
  const subtasks = await db.tasks.where('parentId').equals(String(id)).toArray();
  for (const subtask of subtasks) {
    await deleteTask(subtask.id);
  }
  return await db.tasks.delete(id);
};

/**
 * @param {string} [parentId='root']
 */
export const getTasks = (parentId = 'root') => {
  return db.tasks.where('parentId').equals(parentId).sortBy('order');
};

/**
 * @param {number} taskId
 * @param {string} newParentId
 * @param {number} newOrder
 */
export const reorderTask = async (taskId, newParentId, newOrder) => {
  return await db.tasks.update(taskId, {
    parentId: String(newParentId),
    order: newOrder
  });
};

export const deleteDatabase = async () => {
  await db.delete();
  window.location.reload();
};

export const seedPlans = async () => {
  if (trainingPlans && Array.isArray(trainingPlans)) {
    await db.plans.where('isCustom').equals(false).delete();
    await db.plans.bulkAdd(trainingPlans.map(p => ({
      ...p,
      isCustom: false
    })));
    return true;
  }
  return false;
};
