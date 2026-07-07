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

const isSimpleGreeting = (message: string) =>
  /^(hola|hello|hi|hey|buenos dias|buenas tardes|buenas noches|saludos)$/i.test(
    message.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );

const localGreeting = (language: string) => {
  const greetings: Record<string, string> = {
    es: 'Hola. Estoy listo para ayudarte desde EquityLabs. Puedo orientarte, organizar ideas, preparar un plan de accion o trabajar con tus agentes.',
    en: 'Hello. I am ready to help from EquityLabs. I can organize ideas, prepare an action plan, or work with your agents.',
    pt: 'Ola. Estou pronto para ajudar no EquityLabs. Posso organizar ideias, preparar um plano de acao ou trabalhar com seus agentes.',
  };

  return greetings[language] || greetings.es;
};

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
        console.error('[EquityLabs] ai-chat invoke failed:', fnError);
        if (isSimpleGreeting(message)) return localGreeting(language);
        throw new Error(fnError.message || 'Error calling AI service');
      }

      if (data?.error) {
        console.error('[EquityLabs] ai-chat returned error:', data.error, data);
        if (isSimpleGreeting(message)) return localGreeting(language);
        throw new Error(data.error);
      }

      if (!data?.response) {
        console.error('[EquityLabs] ai-chat returned empty response:', data);
        if (isSimpleGreeting(message)) return localGreeting(language);
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
