-- Fix security vulnerability: Replace public access policies with authenticated user policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public access to questions" ON public.questions;
DROP POLICY IF EXISTS "Public access to visualizations" ON public.visualizations;
DROP POLICY IF EXISTS "Public access to semantic models" ON public.semantic_models;
DROP POLICY IF EXISTS "Public access to question-viz relationships" ON public.question_visualization_relationships;
DROP POLICY IF EXISTS "Public access to viz-model relationships" ON public.visualization_semantic_model_relationships;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can manage questions" 
ON public.questions 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage visualizations" 
ON public.visualizations 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage semantic models" 
ON public.semantic_models 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage question-viz relationships" 
ON public.question_visualization_relationships 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage viz-model relationships" 
ON public.visualization_semantic_model_relationships 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);