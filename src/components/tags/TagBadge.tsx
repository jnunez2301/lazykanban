import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  color: string;
  className?: string;
  onClick?: () => void;
}

export const TagBadge = ({ name, color, className, onClick }: TagBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn("cursor-default", onClick && "cursor-pointer hover:opacity-80", className)}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}10` // 10% opacity background
      }}
      onClick={onClick}
    >
      {name}
    </Badge>
  );
};
