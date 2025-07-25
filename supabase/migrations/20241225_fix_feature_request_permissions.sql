-- Fix feature request permissions for admins and developers

-- Drop existing policies that might be restrictive
DROP POLICY IF EXISTS "Users can update their own feature requests" ON feature_requests_mgg2024;
DROP POLICY IF EXISTS "Technicians and admins can update any feature request" ON feature_requests_mgg2024;
DROP POLICY IF EXISTS "Developers and admins can update any feature request" ON feature_requests_mgg2024;
DROP POLICY IF EXISTS "Developers and admins can delete any feature request" ON feature_requests_mgg2024;

-- Create new comprehensive policies for feature requests
CREATE POLICY "Users can update their own feature requests" ON feature_requests_mgg2024 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Developers and admins can update any feature request" ON feature_requests_mgg2024 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() 
    AND (role = 'developer' OR role = 'admin')
  )
);

CREATE POLICY "Users can delete their own feature requests" ON feature_requests_mgg2024 
FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Developers and admins can delete any feature request" ON feature_requests_mgg2024 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() 
    AND (role = 'developer' OR role = 'admin')
  )
);

-- Also fix feature request comments permissions
DROP POLICY IF EXISTS "Users can delete their own comments" ON feature_request_comments_mgg2024;
DROP POLICY IF EXISTS "Developers and admins can delete any feature request comment" ON feature_request_comments_mgg2024;

CREATE POLICY "Users can delete their own feature request comments" ON feature_request_comments_mgg2024 
FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Developers and admins can delete any feature request comment" ON feature_request_comments_mgg2024 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() 
    AND (role = 'developer' OR role = 'admin')
  )
);