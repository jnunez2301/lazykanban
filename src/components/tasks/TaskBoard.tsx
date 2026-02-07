"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTasks, Task } from "@/hooks/useTasks";
import { useTags, Tag } from "@/hooks/useTags";
import { TaskCard } from "@/components/tasks/TaskCard";
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
            <TaskCard
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

    if (tasks) {
      tasks.forEach(task => {
        const tagId = task.tag_id || 0;
        if (!grouped[tagId]) {
          grouped[tagId] = [];
        }
        grouped[tagId].push(task);
      });
    }
    return grouped;
  }, [tasks, tags]);

  const activeTask = useMemo(() =>
    tasks?.find(t => t.id === activeId),
    [tasks, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = parseInt(active.id.toString());
    const overId = over.id.toString();

    let newTagId: number | null = null;

    if (overId.startsWith("col-")) {
      newTagId = parseInt(overId.replace("col-", ""));
    } else {
      const overTaskId = parseInt(overId);
      const overTask = tasks?.find(t => t.id === overTaskId);
      if (overTask) {
        newTagId = overTask.tag_id;
      }
    }

    const activeTask = tasks?.find(t => t.id === taskId);

    if (activeTask && newTagId !== null && newTagId !== activeTask.tag_id) {
      try {
        await updateTask({ id: taskId, data: { tagId: newTagId } });
      } catch (err) {
        console.error("Failed to move task", err);
      }
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
            <div className="w-[280px] opacity-80 rotate-2 cursor-grabbing">
              <TaskCard task={activeTask} />
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
