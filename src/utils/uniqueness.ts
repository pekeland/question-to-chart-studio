import { supabase } from '@/integrations/supabase/client';

export const ensureUniqueTitle = async (baseTitle: string, existingTitles?: string[]): Promise<string> => {
  let title = baseTitle;
  let counter = 1;
  
  // First check against existing titles if provided
  const checkTitle = async (titleToCheck: string): Promise<boolean> => {
    if (existingTitles?.includes(titleToCheck)) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('visualizations')
      .select('id')
      .eq('title', titleToCheck)
      .limit(1);
    
    if (error) {
      console.error('Error checking title uniqueness:', error);
      return true; // Assume unique if we can't check
    }
    
    return data.length === 0;
  };
  
  while (!(await checkTitle(title))) {
    title = `${baseTitle} (${counter})`;
    counter++;
  }
  
  return title;
};

export const ensureUniqueQuestion = async (baseQuestion: string, existingQuestions?: string[]): Promise<string> => {
  let question = baseQuestion;
  let counter = 1;
  
  const checkQuestion = async (questionToCheck: string): Promise<boolean> => {
    if (existingQuestions?.includes(questionToCheck)) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('questions')
      .select('id')
      .eq('text', questionToCheck)
      .limit(1);
    
    if (error) {
      console.error('Error checking question uniqueness:', error);
      return true; // Assume unique if we can't check
    }
    
    return data.length === 0;
  };
  
  while (!(await checkQuestion(question))) {
    // Add variation to make it unique
    question = `${baseQuestion} (${counter})`;
    counter++;
  }
  
  return question;
};

export const generateUniqueSuggestedQuestions = (chartData: any, existingQuestions: string[] = []): string[] => {
  const baseQuestions = [
    'What are the trends over time?',
    'How does this compare by region?',
    'What are the outliers?',
    'How has this changed year-over-year?',
    'What are the top performers?',
    'What patterns emerge from this data?',
    'How does this correlate with other metrics?',
    'What seasonal trends exist?'
  ];
  
  // Filter out questions that already exist
  const uniqueQuestions = baseQuestions.filter(q => !existingQuestions.includes(q));
  
  // Return up to 3 unique questions
  return uniqueQuestions.slice(0, 3);
};