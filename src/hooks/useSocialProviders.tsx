import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SocialProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  icon: string;
}

interface SocialProvidersResponse {
  providers: SocialProvider[];
  source: string;
  success: boolean;
  error?: string;
  message?: string;
}

export const useSocialProviders = () => {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke('fetch-social-providers');

        if (functionError) {
          console.error('Function error:', functionError);
          setError('Failed to fetch providers');
          setProviders([]);
          return;
        }

        const response: SocialProvidersResponse = data;

        if (!response.success) {
          setError(response.error || 'Unknown error occurred');
          setProviders([]);
          return;
        }

        setProviders(response.providers || []);
      } catch (err) {
      console.error('Error fetching social auth providers:', err);
      setError('Failed to connect to auth service');
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const refetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('fetch-social-providers');

      if (functionError) {
        console.error('Function error:', functionError);
        setError('Failed to fetch providers');
        setProviders([]);
        return;
      }

      const response: SocialProvidersResponse = data;

      if (!response.success) {
        setError(response.error || 'Unknown error occurred');
        setProviders([]);
        return;
      }

      setProviders(response.providers || []);
    } catch (err) {
      console.error('Error fetching social auth providers:', err);
      setError('Failed to connect to auth service');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    providers,
    loading,
    error,
    refetchProviders
  };
};