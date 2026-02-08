"use client";

import { useMemo, useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useTasks, Task } from "@/hooks/useTasks";
import { useTags, Tag } from "@/hooks/useTags";
import { TaskCard, SortableTaskCard } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";

interface TaskBoardProps {
  projectId: string;
}

// Sub-component for Column to handle Droppable logic
const BoardColumn = ({ tag, tasks, onTaskClick }: { tag: Tag; tasks: Task[]; onTaskClick: (task: Task) => void }) => {
  const { setNodeRef } = useDroppable({
    id: `col-${tag.id}`,
  });

  return (
    <div className="w-[280px] shrink-0 flex flex-col bg-muted/30 rounded-lg border h-full">
      <div
        className="p-3 border-b flex items-center justify-between bg-card rounded-t-lg"
        style={{ borderTop: `3px solid ${tag.color}` }}
      >
        <div className="flex items-center gap-2 font-medium">
          {tag.name}
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[100px]"
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-20 flex items-center justify-center border-2 border-dashed border-muted-foreground/10 rounded-lg text-xs text-muted-foreground/50">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};


export const TaskBoard = ({ projectId }: TaskBoardProps) => {
  const { data: tasks, isLoading: tasksLoading, updateTask } = useTasks(projectId);
  const { data: tags, isLoading: tagsLoading } = useTags(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Sync local state with server data
  useEffect(() => {
    if (tasks) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  // New state for selected task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const tasksByTag = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    if (tags) {
      tags.forEach(tag => {
        grouped[tag.id] = [];
      });
    }

    // Use localTasks instead of tasks
    if (localTasks) {
      localTasks.forEach(task => {
        const tagId = task.tag_id || 0;
        if (!grouped[tagId]) {
          grouped[tagId] = [];
        }
        grouped[tagId].push(task);
      });
    }
    return grouped;
  }, [localTasks, tags]);

  const activeTask = useMemo(() =>
    localTasks?.find(t => t.id === activeId),
    [localTasks, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTaskIndex = localTasks.findIndex(t => t.id === activeId);
    if (activeTaskIndex === -1) return;

    const activeTask = localTasks[activeTaskIndex];
    let overContainerId: number | null = null;

    // Identify over container
    if (overId.toString().startsWith("col-")) {
      overContainerId = parseInt(overId.toString().replace("col-", ""));
    } else {
      const overTask = localTasks.find(t => t.id === overId);
      if (overTask) {
        overContainerId = overTask.tag_id || null;
      }
    }

    if (overContainerId === null) return;

    // If moving to a different container
    if (activeTask.tag_id !== overContainerId) {
      setLocalTasks((items) => {
        const newItems = [...items];
        // Optimistically update the tag_id
        newItems[activeTaskIndex] = { ...newItems[activeTaskIndex], tag_id: overContainerId! };
        return newItems;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = parseInt(active.id.toString());
    const overId = over.id.toString();

    // Calculate final tag ID based on drop
    let newTagId: number | null = null;

    if (overId.startsWith("col-")) {
      newTagId = parseInt(overId.replace("col-", ""));
    } else {
      const overTaskId = parseInt(overId);
      // Look up in localTasks for the most current state, 
      // but 'overTask' might not have changed.
      const overTask = localTasks.find(t => t.id === overTaskId);
      if (overTask) {
        newTagId = overTask.tag_id;
      }
    }

    // Determine original state from server data (to see if api call is needed)
    // Actually, we must check if the FINAL state requires update.
    // Since we updated local state optimistically, let's verify if an update is needed.

    // We can just call updateTask. If newTagId is different from original server task's tag_id, do it.
    const originalTask = tasks?.find(t => t.id === taskId);

    if (originalTask && newTagId !== null && newTagId !== originalTask.tag_id) {
      try {
        await updateTask({ id: taskId, data: { tagId: newTagId } });
      } catch (err) {
        console.error("Failed to move task", err);
        // Revert local state if error
        if (tasks) setLocalTasks(tasks);
      }
    } else {
      // If no change or update failed (or redundant), sync back to ensure consistency
      // But if we moved item across columns and dropped it, we want it to stay.
      // If we don't call API, we keep localTasks as is until refresh?
      // Actually, if we don't call API, it means no change.
      // We should probably re-sync localTasks to server tasks to clear any optimistic partial state
      // if it wasn't a valid move. But here the logic suggests if tag changed, we call API.
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  if (tasksLoading || tagsLoading) {
    return <div className="flex gap-4 overflow-auto pb-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[500px] w-[300px] shrink-0 rounded-lg" />)}
    </div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl font-semibold">Board</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-4 pb-4 px-1 min-w-full w-max snap-x snap-mandatory">
            {tags?.map(tag => (
              <div key={tag.id} className="snap-center h-full">
                <BoardColumn
                  tag={tag}
                  tasks={tasksByTag[tag.id] || []}
                  onTaskClick={handleTaskClick}
                />
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeId && activeTask ? (
            <div className="w-[280px]">
              <TaskCard
                task={activeTask}
                className="rotate-2 cursor-grabbing shadow-2xl scale-105 opacity-100 bg-card border-primary/50 ring-2 ring-primary/20"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          projectId={projectId}
        />
      )}
    </div>
  );
};
