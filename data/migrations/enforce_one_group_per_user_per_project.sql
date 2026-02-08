-- Add unique constraint to enforce one group per user per project
-- First, we need to ensure there are no duplicate memberships
-- Delete duplicate memberships, keeping only the first one for each user-project combination

DELETE gm1 FROM group_members gm1
INNER JOIN group_members gm2 
WHERE gm1.id > gm2.id 
  AND gm1.user_id = gm2.user_id 
  AND EXISTS (
    SELECT 1 FROM `groups` g1
    INNER JOIN `groups` g2 ON g1.project_id = g2.project_id
    WHERE g1.id = gm1.group_id AND g2.id = gm2.group_id
  );

-- Add unique constraint
-- Note: We can't add a direct unique constraint on (user_id, project_id) in group_members
-- because project_id is in the groups table, not group_members
-- Instead, we'll enforce this at the application level with proper validation
