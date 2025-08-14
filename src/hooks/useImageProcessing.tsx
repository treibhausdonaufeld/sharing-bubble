import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ProcessingJob = Database['public']['Tables']['item_processing_jobs']['Row'];

export const useImageProcessing = () => {
  const { toast } = useToast();
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const createProcessingJob = useCallback(async (
    itemId: string, 
    images: { url: string; file: File }[]
  ) => {
    try {
      setIsProcessing(true);
      
      const originalImages = images.map(img => img.url);
      
      const { data, error } = await supabase
        .from('item_processing_jobs')
        .insert({
          item_id: itemId,
          status: 'pending',
          original_images: originalImages
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setProcessingJobs(prev => [...prev, data]);

      // Trigger background processing
      await triggerImageProcessing(data.id);

      return data;
    } catch (error) {
      console.error('Error creating processing job:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start image processing.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const triggerImageProcessing = useCallback(async (jobId: string) => {
    try {
      // Call edge function to start processing
      const { error } = await supabase.functions.invoke('process-item-images', {
        body: { jobId }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error triggering image processing:', error);
      
      // Update job status to failed
      await supabase
        .from('item_processing_jobs')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId);
    }
  }, []);

  const getProcessingJob = useCallback(async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('item_processing_jobs')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching processing job:', error);
      return null;
    }
  }, []);

  const subscribeToProcessingUpdates = useCallback((itemId: string, callback: (job: ProcessingJob) => void) => {
    const channel = supabase
      .channel(`processing-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_processing_jobs',
          filter: `item_id=eq.${itemId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as ProcessingJob);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    processingJobs,
    isProcessing,
    createProcessingJob,
    getProcessingJob,
    subscribeToProcessingUpdates
  };
};