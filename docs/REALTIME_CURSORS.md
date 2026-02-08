# Real-Time Cursor Tracking

This feature enables real-time cursor tracking for collaborative work within projects. When multiple users are viewing the same project, they can see each other's cursor positions along with their names and avatars.

## Features

- **Live Cursor Positions**: See where other users are pointing in real-time
- **User Identification**: Each cursor displays the user's name and avatar
- **Color-Coded**: Each user gets a unique color based on their user ID
- **Smooth Animations**: Cursors move smoothly with CSS transitions
- **Auto-Cleanup**: Inactive cursors disappear after 3 seconds
- **Throttled Updates**: Cursor positions are sent at most 20 times per second to optimize performance

## Architecture

### Backend (Socket.IO Server)
- **Location**: `server.ts`
- **Port**: Same as Next.js (default: 3000)
- **Path**: `/api/socket`
- **Events**:
  - `join-project`: User joins a project room
  - `leave-project`: User leaves a project room
  - `cursor-move`: User moves their cursor
  - `cursor-update`: Broadcast cursor position to other users

### Frontend Components

1. **Hook**: `src/hooks/useRealtimeCursors.ts`
   - Manages Socket.IO connection
   - Handles cursor state
   - Throttles cursor updates

2. **Component**: `src/components/collaboration/CursorOverlay.tsx`
   - Renders cursor pointers
   - Displays user info badges
   - Handles animations

3. **Integration**: `src/app/dashboard/projects/[id]/page.tsx`
   - Listens to mouse movements
   - Updates cursor positions
   - Renders cursor overlay

## Usage

The feature is automatically enabled when viewing a project. No additional configuration is needed.

### Development

```bash
# Start the development server with Socket.IO
bun dev

# Or use the standard Next.js dev server (without Socket.IO)
bun dev:next
```

### Production

```bash
# Build the application
bun run build

# Start the production server with Socket.IO
bun start

# Or use the standard Next.js start (without Socket.IO)
bun start:next
```

## Technical Details

### Socket.IO Rooms
Each project creates a unique room identified by `project:{projectId}`. Users automatically join the room when they open a project and leave when they navigate away.

### Cursor Data Structure
```typescript
interface CursorData {
  x: number;          // X coordinate
  y: number;          // Y coordinate
  userId: number;     // User ID
  userName: string;   // User display name
  avatar?: string;    // User avatar filename
  socketId?: string;  // Socket connection ID
}
```

### Performance Optimizations
- **Throttling**: Cursor updates are throttled to 50ms intervals
- **Room-based Broadcasting**: Updates are only sent to users in the same project
- **Auto-cleanup**: Inactive cursors are removed after 3 seconds
- **Efficient Rendering**: Uses CSS transforms for smooth animations

## Future Enhancements

- [ ] Cursor click indicators
- [ ] User presence list
- [ ] Typing indicators for task editing
- [ ] Collaborative task dragging
- [ ] Voice/video chat integration
