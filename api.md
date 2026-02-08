# LazyKanban API Documentation

## Authentication (`/api/auth`)

### Login
- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com", 
    "password": "password123"
  }
  ```
- **Response**:
  - `200 OK`: `{ token: string, user: { id: number, email: string, name: string, uiMode: "regular" | "dev" } }`
  - `401 Unauthorized`: Invalid credentials
  - `400 Bad Request`: Validation error

### Register
- **Endpoint**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123", // min 6 chars
    "name": "User Name" // min 2 chars
  }
  ```
- **Response**:
  - `201 Created`: `{ token: string, user: { ... } }`
  - `400 Bad Request`: User already exists or validation error

### Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: `{ id: number, email: string, name: string, uiMode: string, createdAt: string }`
  - `401 Unauthorized`: Invalid/missing token

### Update Current User
- **Endpoint**: `PATCH /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "New Name", // optional
    "uiMode": "dev" | "regular" // optional
  }
  ```
- **Response**:
  - `200 OK`: Updated user object
  - `400 Bad Request`: Validation error

## User (`/api/user`)

### Update Avatar
- **Endpoint**: `PATCH /api/user/avatar`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "avatar": "avatar-1.png" // avatar-1.png to avatar-5.png
  }
  ```
- **Response**:
  - `200 OK`: `{ message: string, avatar: string }`

### Get User Groups
- **Endpoint**: `GET /api/user/groups`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Array of group memberships
    ```json
    [
      {
        "group_id": 1,
        "group_name": "Admin Group",
        "project_id": 101,
        "project_name": "Project Alpha",
        "role": "admin",
        "membership_id": 5
      }
    ]
    ```

## Projects (`/api/projects`)

### Get All Projects
- **Endpoint**: `GET /api/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Returns projects where user is owner or member of a group.
- **Response**:
  - `200 OK`: Array of projects
    ```json
    [
      {
        "id": 1,
        "name": "Project Alpha",
        "description": "...",
        "owner_id": 1,
        "is_pinned": false,
        "pinned_at": null,
        "created_at": "...",
        "updated_at": "...",
        "owner_name": "User Name"
      }
    ]
    ```

### Create Project
- **Endpoint**: `POST /api/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "New Project", // 3-120 chars
    "description": "Optional description" // max 255 chars
  }
  ```
- **Response**:
  - `201 Created`: `{ id: number, name: string, description: string, ownerId: number }`
  - `400 Bad Request`: Validation error

### Get Project Details
- **Endpoint**: `GET /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Project object
  - `404 Not Found`: Project not found or access denied

### Update Project
- **Endpoint**: `PATCH /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Updated Name", // optional
    "description": "Updated Description", // optional
    "isPinned": true // optional boolean
  }
  ```
- **Response**:
  - `200 OK`: Updated project object
  - `403 Forbidden`: Permission denied

### Delete Project
- **Endpoint**: `DELETE /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: `{ message: "Project deleted successfully" }`
  - `404 Not Found`: Project not found or user is not owner

### Get Project Groups
- **Endpoint**: `GET /api/projects/:id/groups`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Array of groups
    ```json
    [
      {
        "id": 1,
        "name": "Developers",
        "description": "...",
        "created_at": "...",
        "updated_at": "...",
        "member_count": 5
      }
    ]
    ```

### Create Project Group
- **Endpoint**: `POST /api/projects/:id/groups`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "New Group", // min 2 chars
    "description": "Optional description"
  }
  ```
- **Response**:
  - `201 Created`: `{ id: number, name: string, description: string, project_id: string }`
  - `409 Conflict`: Group name already exists

### Get My Project Group (Deprecated - see notes)
- **Endpoint**: `GET /api/projects/:id/my-group`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Array of group memberships for this project
    ```json
    [
      {
        "group_id": 1,
        "group_name": "Developers",
        "role": "member",
        "project_id": 101
      }
    ]
    ```

### Get My Permissions
- **Endpoint**: `GET /api/projects/:id/my-permissions`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Aggregated permissions object
    ```json
    {
      "canCreateTasks": 1,
      "canEditTasks": 1,
      "canDeleteTasks": 0,
      "canManageMembers": 0
    }
    ```

## Tasks (`/api/tasks`)

### Get All Tasks (Project)
- **Endpoint**: `GET /api/projects/:id/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Array of tasks
    ```json
    [
      {
        "id": 1,
        "title": "Task 1",
        "description": "...",
        "priority": "medium",
        "due_date": "...",
        "owner_name": "User 1",
        "assignee_name": "User 2",
        "tag_name": "In Progress",
        "tag_color": "#F59E0B"
      }
    ]
    ```

### Create Task
- **Endpoint**: `POST /api/projects/:id/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "New Task",
    "description": "Optional description",
    "assigneeId": 123, // optional
    "tagId": 456, // optional
    "priority": "medium", // low, medium, high
    "dueDate": "2023-12-31" // optional
  }
  ```
- **Response**:
  - `201 Created`: Task object

### Get Task Details
- **Endpoint**: `GET /api/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Task object

### Update Task
- **Endpoint**: `PATCH /api/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Updated Title",
    "description": "Updated Description",
    "assigneeId": 123,
    "tagId": 456,
    "priority": "high",
    "dueDate": "2023-12-31"
  }
  ```
- **Response**:
  - `200 OK`: Updated task object
  - `403 Forbidden`: Permission denied

### Delete Task
- **Endpoint**: `DELETE /api/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: `{ message: "Task deleted successfully" }`
  - `403 Forbidden`: Permission denied

## Groups (`/api/groups`)

### Get Group Details
- **Endpoint**: `GET /api/groups/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Group object

### Update Group
- **Endpoint**: `PATCH /api/groups/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "description": "Updated Description"
  }
  ```
- **Response**:
  - `200 OK`: Updated group object
  - `403 Forbidden`: Permission denied

### Delete Group
- **Endpoint**: `DELETE /api/groups/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: `{ message: "Group deleted successfully" }`
  - `403 Forbidden`: Permission denied

## Tags (`/api/tags`)

### Get Project Tags
- **Endpoint**: `GET /api/projects/:id/tags`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: Array of tags
    ```json
    [
      {
        "id": 1,
        "name": "Defined",
        "color": "#3B82F6",
        "display_order": 1,
        "is_default": true
      }
    ]
    ```

### Create Tag
- **Endpoint**: `POST /api/projects/:id/tags`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Custom Tag",
    "color": "#FF5733"
  }
  ```
- **Response**:
  - `201 Created`: Tag object
  - `403 Forbidden`: Permission denied

### Update Tag
- **Endpoint**: `PATCH /api/tags/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Updated Tag",
    "color": "#000000"
  }
  ```
- **Response**:
  - `200 OK`: Updated tag object
  - `403 Forbidden`: Permission denied

### Delete Tag
- **Endpoint**: `DELETE /api/tags/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  - `200 OK`: `{ message: "Tag deleted successfully" }`
  - `403 Forbidden`: Permission denied
  - `400 Bad Request`: Cannot delete default tags
