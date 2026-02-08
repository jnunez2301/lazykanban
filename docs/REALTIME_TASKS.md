# Real-Time Task Management

This feature enables real-time task CRUD operations and task locking for collaborative work within projects.

## Features

### Real-Time Task Synchronization
- **Live Updates**: See task creation, updates, and deletions in real-time
- **Automatic Sync**: Tasks are automatically synchronized across all connected clients
- **Optimistic Updates**: Local changes are reflected immediately while syncing with the server

### Task Locking
- **Visual Indicators**: Locked tasks show animated loading dots
- **User Identification**: See who is currently editing a task
- **Automatic Unlock**: Tasks are automatically unlocked when the user releases the mouse or closes the dialog
- **Conflict Prevention**: Locked tasks are non-interactive for other users and cannot be dragged

## Architecture

### Backend (Socket.IO Events)
**Location**: `server.ts`

**Task CRUD Events**:
- `task-created`: Broadcast when a task is created
- `task-updated`: Broadcast when a task is updated  
- `task-deleted`: Broadcast when a task is deleted

**Task Locking Events**:
- `task-lock`: User starts interacting with a task (mouse down)
- `task-unlock`: User stops interacting with a task (mouse up or dialog close)
- `task-locked`: Broadcast to other users that a task is locked
- `task-unlocked`: Broadcast to other users that a task is unlocked

### Frontend Components

1. **Hook**: `src/hooks/useRealtimeTasks.ts`
   - Listens for task CRUD events
   - Updates React Query cache in real-time
   - Provides methods to emit task events (`emitTaskCreated`, `emitTaskUpdated`, `emitTaskDeleted`)

2. **Hook**: `src/hooks/useTaskLocking.ts`
   - Manages task lock state
   - Handles lock/unlock events
   - Tracks which tasks are locked and by whom

3. **Component**: `src/components/tasks/CreateTaskDialog.tsx`
   - Emits `task-created` event on successful creation

4. **Component**: `src/components/tasks/TaskDetailDialog.tsx`
   - Emits `task-updated` event on save
   - Emits `task-deleted` event on delete

5. **Component**: `src/components/tasks/TaskBoard.tsx`
   - Emits `task-updated` event on drag-and-drop
   - Integrates locking hooks
   - Handles mouse down/up events
   - Passes lock state to task cards

6. **Component**: `src/components/tasks/TaskCard.tsx`
   - Shows locked state with animated dots
   - Displays who is editing the task
   - Prevents interaction and dragging when locked (`useSortable({ disabled: isLocked })`)

## Visual Design

### Locked Task State
- **Overlay**: Semi-transparent background with backdrop blur
- **Loading Animation**: Three bouncing dots in primary color
- **User Info**: Small text showing "{userName} is editing..."
- **Disabled State**: Pointer events disabled, reduced opacity, dragging disabled

## Integration Example

```tsx
// In TaskBoard.tsx
const { lockTask, unlockTask } = useTaskLocking(projectId);
const { emitTaskUpdated } = useRealtimeTasks(projectId);

// Handle drag end
const handleDragEnd = async (event) => {
  // ... update logic
  const updatedTask = await updateTask(...);
  emitTaskUpdated(updatedTask);
}
```

## Future Enhancements

- [ ] Lock timeout (auto-unlock after X seconds of inactivity)
- [ ] Lock stealing (allow admin to forcefully unlock)
- [ ] Typing indicators for task description editing
- [ ] Real-time collaborative editing
- [ ] Conflict resolution UI
