<template>
  <div class="feedback-manager">
    <h2>Feedback Manager</h2>

    <div class="controls">
      <label>
        Filter by Type:
        <select v-model="filterType">
          <option value="">All</option>
          <option value="Bug">Bug</option>
          <option value="Feature">Feature</option>
          <option value="Other">Other</option>
        </select>
      </label>

      <label>
        Sort by:
        <select v-model="sortKey">
          <option value="timestamp">Date</option>
          <option value="type">Type</option>
          <option value="name">Name</option>
          <option value="priority">Priority</option>
        </select>
      </label>

      <label>
        Direction:
        <select v-model="sortDirection">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="status">Loading feedback...</div>
    <div v-else-if="sortedAndFilteredList.length === 0" class="status">No feedback found.</div>

    <div v-for="item in sortedAndFilteredList" :key="item.id" class="feedback-item">
      <textarea v-model="item.message" class="message-input" v-if="!item.deleted" />
      <div v-else class="deleted-message"><strong>Deleted</strong></div>

      <div class="meta" v-if="!item.deleted">
        <span><strong>Name:</strong> {{ item.name || 'Anonymous' }}</span>
        <span><strong>Day:</strong> {{ formatTime(item.timestamp) }}</span>

        <select v-model="item.type" class="type-select">
          <option value="">Unset</option>
          <option value="Bug">Bug</option>
          <option value="Feature">Feature</option>
          <option value="Other">Other</option>
        </select>

        <select v-model="item.priority" class="priority-select">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="urgent">Urgent</option>
        </select>

        <button @click="save(item)" class="save-btn">Save</button>
        <button @click="deleteItem(item)" class="delete-btn">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getDatabase, ref as dbRef, get, update, remove } from 'firebase/database';

const feedbackList = ref([]);
const loading = ref(true);
const filterType = ref('');
const sortKey = ref('timestamp');
const sortDirection = ref('desc');

onMounted(async () => {
  const db = getDatabase();
  const snap = await get(dbRef(db, '/feedback'));
  const data = snap.exists() ? snap.val() : {};
  feedbackList.value = Object.entries(data).map(([id, value]) => ({
    id,
    ...value
  }));
  loading.value = false;
});

const priorityOrder = { low: 1, medium: 2, urgent: 3 };

const sortedAndFilteredList = computed(() => {
  return feedbackList.value
    .filter(item => !filterType.value || item.type === filterType.value)
    .sort((a, b) => {
      const aVal = a[sortKey.value] || '';
      const bVal = b[sortKey.value] || '';

      if (sortKey.value === 'timestamp') {
        return sortDirection.value === 'asc'
          ? (aVal || 0) - (bVal || 0)
          : (bVal || 0) - (aVal || 0);
      } else if (sortKey.value === 'priority') {
        const aPriority = priorityOrder[aVal] || 0;
        const bPriority = priorityOrder[bVal] || 0;
        return sortDirection.value === 'asc'
          ? aPriority - bPriority
          : bPriority - aPriority;
      } else {
        return sortDirection.value === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
    });
});

function formatTime(timestamp) {
  if (!timestamp) return 'n/a';
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

async function save(item) {
  const db = getDatabase();
  const updates = {
    message: item.message,
    name: item.name || '',
    type: item.type || '',
    priority: item.priority || 'low',
    timestamp: item.timestamp || Date.now()
  };
  await update(dbRef(db, `/feedback/${item.id}`), updates);
  alert('Saved!');
}

async function deleteItem(item) {
  const db = getDatabase();
  await remove(dbRef(db, `/feedback/${item.id}`));
  item.deleted = true;
}
</script>

<style scoped lang="scss">
.feedback-manager {
  padding: 1rem;
  border-radius: 8px;
  max-width: 50vw;
  margin: auto;
  max-height: 60vh;
  overflow-y: auto;
  color: white;

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;

    label {
      display: flex;
      flex-direction: column;
      font-size: 0.9rem;
    }

    select {
      margin-top: 0.25rem;
      padding: 0.25rem;
    }
  }

  .status {
    color: #666;
    font-style: italic;
  }

  .feedback-item {
    background: rgb(215, 215, 215);
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    color: black;

    .message-input {
      width: 100%;
      min-height: 4rem;
      margin-bottom: 0.5rem;
      font-family: monospace;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.9rem;
      align-items: center;

      .save-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 0.3rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background: #1e40af;
        }
      }

      .delete-btn {
        background: #f51c1c;
        color: white;
        border: none;
        padding: 0.3rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background: #a31e1e;
        }
      }

      .type-select {
        padding: 0.25rem;
      }
    }
  }

  .deleted-message {
    font-style: italic;
    color: #999;
    margin-bottom: 0.5rem;
  }
}
</style>