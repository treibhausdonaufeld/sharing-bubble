import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KeycloakProvider {
  alias: string;
  displayName: string;
  enabled: boolean;
  providerId: string;
  config: Record<string, any>;
}

interface KeycloakRealmInfo {
  realm: string;
  identityProviders: KeycloakProvider[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Keycloak configuration from environment variables
    const keycloakUrl = Deno.env.get('KEYCLOAK_URL')
    const keycloakRealm = Deno.env.get('KEYCLOAK_REALM')
    const keycloakClientId = Deno.env.get('KEYCLOAK_CLIENT_ID')
    const keycloakClientSecret = Deno.env.get('KEYCLOAK_CLIENT_SECRET')

    if (!keycloakUrl || !keycloakRealm || !keycloakClientId || !keycloakClientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Keycloak configuration', 
          providers: [] 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First, get an access token from Keycloak
    const tokenResponse = await fetch(`${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: keycloakClientId,
        client_secret: keycloakClientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get Keycloak token:', await tokenResponse.text())
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with Keycloak', 
          providers: [] 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch realm information including identity providers
    const realmResponse = await fetch(`${keycloakUrl}/admin/realms/${keycloakRealm}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!realmResponse.ok) {
      console.error('Failed to fetch realm info:', await realmResponse.text())
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch realm information', 
          providers: [] 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch identity providers separately
    const providersResponse = await fetch(`${keycloakUrl}/admin/realms/${keycloakRealm}/identity-provider/instances`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!providersResponse.ok) {
      console.error('Failed to fetch providers:', await providersResponse.text())
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch identity providers', 
          providers: [] 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const providers: KeycloakProvider[] = await providersResponse.json()

    // Filter and format enabled providers
    const enabledProviders = providers
      .filter(provider => provider.enabled)
      .map(provider => ({
        id: provider.alias,
        name: provider.displayName || provider.alias,
        type: provider.providerId,
        enabled: provider.enabled,
        keycloakAlias: provider.alias
      }))

    return new Response(
      JSON.stringify({ 
        providers: enabledProviders,
        realm: keycloakRealm,
        success: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error fetching Keycloak providers:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        providers: [],
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})