-- Add delete policy for roadmap items
CREATE POLICY "Developers and admins can delete roadmap items" ON roadmap_items_mgg2024
FOR DELETE USING (
  EXISTS (
    SELECT 1 
    FROM profiles_mgg_2024 
    WHERE id = auth.uid() 
    AND (role = 'developer' OR role = 'admin')
  )
);