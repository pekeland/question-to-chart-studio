import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChartData, SuggestedQuestion, FieldType } from '@/components/types';
import { ensureUniqueQuestion, ensureUniqueTitle } from '@/utils/uniqueness';

interface QuestionData {
  id: string;
  text: string;
  confidence: 'high' | 'medium' | 'low';
}

interface VisualizationData {
  id: string;
  title: string;
  chart_type: 'bar' | 'line' | 'pie' | 'table' | 'scatter';
  fields: FieldType[];
  is_ai_generated: boolean;
  involved_agents: string[];
}

interface SemanticModelData {
  id: string;
  name: string;
  table_name: string;
  fields: FieldType[];
}

export const useRelationships = () => {
  const [loading, setLoading] = useState(false);

  const saveQuestion = useCallback(async (questionText: string, confidence: 'high' | 'medium' | 'low' = 'medium'): Promise<string> => {
    setLoading(true);
    try {
      // Ensure the question is unique
      const uniqueQuestion = await ensureUniqueQuestion(questionText);
      
      const { data, error } = await supabase
        .from('questions')
        .insert({
          text: uniqueQuestion,
          confidence
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving question:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveVisualization = useCallback(async (chartData: ChartData): Promise<string> => {
    setLoading(true);
    try {
      // Ensure the title is unique
      const uniqueTitle = await ensureUniqueTitle(chartData.title);
      
      const { data, error } = await supabase
        .from('visualizations')
        .insert({
          title: uniqueTitle,
          chart_type: chartData.chartType,
          fields: JSON.stringify(chartData.fields),
          is_ai_generated: chartData.isAIGenerated || false,
          involved_agents: JSON.stringify(chartData.involvedAgents || [])
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving visualization:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSemanticModel = useCallback(async (name: string, tableName: string, fields: FieldType[]): Promise<string> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('semantic_models')
        .insert({
          name,
          table_name: tableName,
          fields: JSON.stringify(fields)
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving semantic model:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const linkQuestionToVisualization = useCallback(async (
    questionId: string, 
    visualizationId: string, 
    relationshipType: 'generates' | 'suggested_by' | 'related_to' = 'generates'
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('question_visualization_relationships')
        .insert({
          question_id: questionId,
          visualization_id: visualizationId,
          relationship_type: relationshipType
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error linking question to visualization:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const linkVisualizationToSemanticModel = useCallback(async (
    visualizationId: string,
    semanticModelId: string,
    fieldsUsed: FieldType[] = []
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('visualization_semantic_model_relationships')
        .insert({
          visualization_id: visualizationId,
          semantic_model_id: semanticModelId,
          fields_used: JSON.stringify(fieldsUsed)
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error linking visualization to semantic model:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuestionsByVisualization = useCallback(async (visualizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('question_visualization_relationships')
        .select(`
          relationship_type,
          questions (
            id,
            text,
            confidence
          )
        `)
        .eq('visualization_id', visualizationId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching questions by visualization:', error);
      return [];
    }
  }, []);

  const getVisualizationsByQuestion = useCallback(async (questionId: string) => {
    try {
      const { data, error } = await supabase
        .from('question_visualization_relationships')
        .select(`
          relationship_type,
          visualizations (
            id,
            title,
            chart_type,
            fields,
            is_ai_generated,
            involved_agents
          )
        `)
        .eq('question_id', questionId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching visualizations by question:', error);
      return [];
    }
  }, []);

  const getVisualizationsGeneratedByQuestion = useCallback(async (questionText: string) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          text,
          question_visualization_relationships!inner (
            relationship_type,
            visualizations (
              id,
              title,
              chart_type,
              fields,
              is_ai_generated,
              involved_agents
            )
          )
        `)
        .eq('text', questionText)
        .eq('question_visualization_relationships.relationship_type', 'generates');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching generated visualizations by question:', error);
      return [];
    }
  }, []);

  const getQuestionsGeneratingVisualization = useCallback(async (visualizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('question_visualization_relationships')
        .select(`
          relationship_type,
          questions (
            id,
            text,
            confidence
          )
        `)
        .eq('visualization_id', visualizationId)
        .eq('relationship_type', 'generates');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching generating questions by visualization:', error);
      return [];
    }
  }, []);

  return {
    loading,
    saveQuestion,
    saveVisualization,
    saveSemanticModel,
    linkQuestionToVisualization,
    linkVisualizationToSemanticModel,
    getQuestionsByVisualization,
    getVisualizationsByQuestion,
    getVisualizationsGeneratedByQuestion,
    getQuestionsGeneratingVisualization
  };
};