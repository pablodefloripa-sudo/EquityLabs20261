import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useLanguage } from '@/hooks/useLanguage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseAIChatReturn {
  sendMessage: (message: string, conversationHistory?: Message[]) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export const useAIChat = (): UseAIChatReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const sendMessage = useCallback(async (
    message: string, 
    conversationHistory: Message[] = []
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message,
          language,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Error calling AI service');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.response) {
        throw new Error('No response received from AI');
      }

      return data.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  return {
    sendMessage,
    isLoading,
    error,
  };
};
