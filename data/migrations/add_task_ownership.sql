-- Add owner_id and assignee_id columns to tasks table
ALTER TABLE tasks ADD COLUMN owner_id INT NOT NULL;
ALTER TABLE tasks ADD COLUMN assignee_id INT NULL;

-- Add foreign key constraints
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;

-- Set existing tasks' owner to the project owner (or first user)
UPDATE tasks t
JOIN projects p ON t.project_id = p.id
SET t.owner_id = p.owner_id, t.assignee_id = p.owner_id;
