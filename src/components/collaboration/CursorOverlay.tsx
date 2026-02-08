import { CursorData } from "@/hooks/useRealtimeCursors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CursorOverlayProps {
  cursors: Map<string, CursorData>;
}

export const CursorOverlay = ({ cursors }: CursorOverlayProps) => {
  return (
    <>
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.socketId}
          className="fixed pointer-events-none z-50 transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            <path
              d="M5.65376 12.3673L13.1844 4.83666C13.8263 4.19476 14.9132 4.63843 14.9132 5.54328V9.50566C14.9132 9.97632 15.2951 10.3582 15.7658 10.3582H19.7282C20.6331 10.3582 21.0767 11.4451 20.4348 12.087L12.9042 19.6176C12.2623 20.2595 11.1754 19.8159 11.1754 18.911V14.9486C11.1754 14.478 10.7935 14.0961 10.3229 14.0961H6.36051C5.45566 14.0961 5.01199 13.0092 5.65376 12.3673Z"
              fill={`hsl(${(cursor.userId * 137.5) % 360}, 70%, 50%)`}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* User info badge */}
          <div className="absolute left-6 top-0 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm border rounded-full px-2 py-1 shadow-lg">
            <Avatar className="h-4 w-4">
              <AvatarImage
                src={cursor.avatar ? `/avatars/${cursor.avatar}` : undefined}
                alt={cursor.userName}
              />
              <AvatarFallback className="text-[8px]">
                {cursor.userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                color: `hsl(${(cursor.userId * 137.5) % 360}, 70%, 50%)`,
              }}
            >
              {cursor.userName}
            </span>
          </div>
        </div>
      ))}
    </>
  );
};
