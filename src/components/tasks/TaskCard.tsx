"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/hooks/useTasks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  className?: string;
  style?: React.CSSProperties;
  isOverlay?: boolean;
  isLocked?: boolean;
  lockedBy?: string;
}

// Pure UI Component
export const TaskCard = ({ task, onClick, onMouseDown, onMouseUp, className, style, isOverlay, isLocked, lockedBy }: TaskCardProps) => {
  const priorityColor = {
    low: "bg-slate-500",
    medium: "bg-blue-500",
    high: "bg-red-500",
  }[task.priority];

  const assigneeInitials = task.assignee_name
    ? task.assignee_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    : "?";
  return (
    <Card
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm relative",
        isLocked && "opacity-60 pointer-events-none",
        className
      )}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {isLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex flex-col items-center justify-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          {lockedBy && (
            <p className="text-xs text-muted-foreground font-medium">
              {lockedBy} is editing...
            </p>
          )}
        </div>
      )}
      <CardHeader className="p-3 pb-0 space-y-0">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
            {task.title}
          </CardTitle>
          <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", priorityColor)} title={`Priority: ${task.priority}`} />
        </div>
      </CardHeader>

      <CardContent className="p-3 py-2">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {task.tag_name && (
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0 h-5"
              style={{ borderColor: task.tag_color, color: task.tag_color }}
            >
              {task.tag_name}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {task.due_date && (
            <div className={cn("flex items-center gap-0.5", new Date(task.due_date) < new Date() && "text-destructive")}>
              <CalendarDays className="h-3 w-3" />
              <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {task.assignee_id && (
          <Avatar className="h-6 w-6 border">
            <AvatarFallback className="text-[10px] bg-secondary">
              {assigneeInitials}
            </AvatarFallback>
          </Avatar>
        )}
      </CardFooter>
    </Card>
  );
};

// Sortable Wrapper
export const SortableTaskCard = ({
  task,
  onClick,
  onMouseDown,
  onMouseUp,
  isLocked,
  lockedBy
}: {
  task: Task;
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  isLocked?: boolean;
  lockedBy?: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
    disabled: isLocked
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 bg-black/5 dark:bg-white/5 border-2 border-dashed border-primary/20 rounded-lg h-[120px]"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <TaskCard
        task={task}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        isLocked={isLocked}
        lockedBy={lockedBy}
      />
    </div>
  );
};
