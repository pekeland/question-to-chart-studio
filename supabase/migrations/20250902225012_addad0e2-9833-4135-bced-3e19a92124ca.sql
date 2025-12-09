-- Create tables to track questions, visualizations, and their relationships

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Visualizations table
CREATE TABLE public.visualizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  chart_type TEXT NOT NULL CHECK (chart_type IN ('bar', 'line', 'pie', 'table', 'scatter')),
  fields JSONB NOT NULL DEFAULT '[]',
  is_ai_generated BOOLEAN DEFAULT false,
  involved_agents JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Semantic models table
CREATE TABLE public.semantic_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Question-Visualization relationships
CREATE TABLE public.question_visualization_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  visualization_id UUID NOT NULL REFERENCES public.visualizations(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('generates', 'suggested_by', 'related_to')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, visualization_id, relationship_type)
);

-- Visualization-Semantic Model relationships
CREATE TABLE public.visualization_semantic_model_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visualization_id UUID NOT NULL REFERENCES public.visualizations(id) ON DELETE CASCADE,
  semantic_model_id UUID NOT NULL REFERENCES public.semantic_models(id) ON DELETE CASCADE,
  fields_used JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(visualization_id, semantic_model_id)
);

-- Enable Row Level Security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_visualization_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualization_semantic_model_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now, can be restricted later with auth)
CREATE POLICY "Public access to questions" ON public.questions FOR ALL USING (true);
CREATE POLICY "Public access to visualizations" ON public.visualizations FOR ALL USING (true);
CREATE POLICY "Public access to semantic models" ON public.semantic_models FOR ALL USING (true);
CREATE POLICY "Public access to question-viz relationships" ON public.question_visualization_relationships FOR ALL USING (true);
CREATE POLICY "Public access to viz-model relationships" ON public.visualization_semantic_model_relationships FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visualizations_updated_at
  BEFORE UPDATE ON public.visualizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_semantic_models_updated_at
  BEFORE UPDATE ON public.semantic_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_questions_text ON public.questions(text);
CREATE INDEX idx_visualizations_chart_type ON public.visualizations(chart_type);
CREATE INDEX idx_semantic_models_table_name ON public.semantic_models(table_name);
CREATE INDEX idx_question_viz_relationships_question_id ON public.question_visualization_relationships(question_id);
CREATE INDEX idx_question_viz_relationships_visualization_id ON public.question_visualization_relationships(visualization_id);
CREATE INDEX idx_viz_model_relationships_visualization_id ON public.visualization_semantic_model_relationships(visualization_id);
CREATE INDEX idx_viz_model_relationships_semantic_model_id ON public.visualization_semantic_model_relationships(semantic_model_id);