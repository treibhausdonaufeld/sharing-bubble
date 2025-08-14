import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export const AuthDebugger = () => {
  const { user, session } = useAuth();
  const [debugResult, setDebugResult] = useState<any>(null);
  const [rpcResult, setRpcResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEdgeFunction = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-auth', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      
      console.log('Edge function result:', { data, error });
      setDebugResult({ data, error });
    } catch (err) {
      console.error('Edge function error:', err);
      setDebugResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testRPC = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('debug_auth_context' as any);
      
      console.log('RPC result:', { data, error });
      setRpcResult({ data, error });
    } catch (err) {
      console.error('RPC error:', err);
      setRpcResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Auth Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Client Auth State:</h3>
          <pre className="bg-muted p-2 rounded text-sm overflow-auto">
            {JSON.stringify({
              userId: user?.id,
              email: user?.email,
              sessionExists: !!session,
              accessToken: session?.access_token ? 'Present' : 'Missing'
            }, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button onClick={testEdgeFunction} disabled={loading}>
            Test Edge Function
          </Button>
          <Button onClick={testRPC} disabled={loading}>
            Test RPC
          </Button>
        </div>

        {debugResult && (
          <div className="space-y-2">
            <h3 className="font-semibold">Edge Function Result:</h3>
            <pre className="bg-muted p-2 rounded text-sm overflow-auto">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}

        {rpcResult && (
          <div className="space-y-2">
            <h3 className="font-semibold">RPC Result:</h3>
            <pre className="bg-muted p-2 rounded text-sm overflow-auto">
              {JSON.stringify(rpcResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};