"use client";

import { useTasks } from "@/hooks/useTasks";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskListProps {
  projectId: string;
}

export const TaskList = ({ projectId }: TaskListProps) => {
  const { data: tasks, isLoading } = useTasks(projectId);

  if (isLoading) {
    return <div className="space-y-2">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
    </div>;
  }

  if (!tasks || tasks.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">No tasks found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                {task.tag_name && (
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: task.tag_color,
                      color: task.tag_color
                    }}
                  >
                    {task.tag_name}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={
                  task.priority === 'high' ? "destructive" :
                    task.priority === 'medium' ? "secondary" : "outline"
                }>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>{task.assignee_name || "-"}</TableCell>
              <TableCell>
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
