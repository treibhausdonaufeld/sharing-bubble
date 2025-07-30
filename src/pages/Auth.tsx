import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, RefreshCw } from "lucide-react";
import { useKeycloakProviders } from "@/hooks/useKeycloakProviders";
import { useLanguage } from "@/contexts/LanguageContext";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { providers, loading: providersLoading, error: providersError, refetchProviders } = useKeycloakProviders();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });

      navigate("/");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: signupData.displayName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setError("This email is already registered. Please try logging in instead.");
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

      navigate("/");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeycloakAuth = async (providerAlias: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use Keycloak's direct OAuth flow
      const keycloakUrl = 'YOUR_KEYCLOAK_URL'; // This should come from environment or config
      const realm = 'YOUR_REALM'; // This should come from the providers response
      const clientId = 'YOUR_CLIENT_ID'; // This should come from environment
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      
      // Redirect to Keycloak OAuth endpoint
      const authUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid profile email&kc_idp_hint=${providerAlias}`;
      
      window.location.href = authUrl;
    } catch (err) {
      setError("Failed to initialize authentication.");
      setIsLoading(false);
    }
  };

  const getProviderIcon = (providerType: string) => {
    // Map Keycloak provider types to icons or use a generic icon
    switch (providerType.toLowerCase()) {
      case 'google':
        return '🔍';
      case 'github':
        return '🐙';
      case 'facebook':
        return '📘';
      case 'twitter':
        return '🐦';
      case 'microsoft':
        return '🪟';
      case 'apple':
        return '🍎';
      case 'linkedin':
        return '💼';
      default:
        return '🔐';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Join LocalGoods
            </CardTitle>
            <CardDescription>
              Share and discover amazing items in your community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : t('auth.signIn')}
                  </Button>
                </form>

                {/* Dynamic Keycloak Providers */}
                {providers.length > 0 && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {providersError && (
                        <div className="flex items-center justify-between p-2 border border-destructive/20 rounded-md bg-destructive/10">
                          <span className="text-sm text-destructive">{providersError}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={refetchProviders}
                            disabled={providersLoading}
                          >
                            <RefreshCw className={`w-4 h-4 ${providersLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-2">
                        {providers.map((provider) => (
                          <Button
                            key={provider.id}
                            variant="outline"
                            onClick={() => handleKeycloakAuth(provider.keycloakAlias || provider.id)}
                            disabled={isLoading || providersLoading}
                            className="h-10 justify-start"
                          >
                            <span className="mr-2">{getProviderIcon(provider.type)}</span>
                            Continue with {provider.name}
                          </Button>
                        ))}
                      </div>
                      
                      {providersLoading && (
                        <div className="text-center text-sm text-muted-foreground">
                          Loading providers...
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                {/* Dynamic Keycloak Providers for Signup */}
                {providers.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {providers.map((provider) => (
                          <Button
                            key={provider.id}
                            variant="outline"
                            onClick={() => handleKeycloakAuth(provider.keycloakAlias || provider.id)}
                            disabled={isLoading || providersLoading}
                            className="h-10 justify-start"
                          >
                            <span className="mr-2">{getProviderIcon(provider.type)}</span>
                            Sign up with {provider.name}
                          </Button>
                        ))}
                      </div>
                      
                      {providersLoading && (
                        <div className="text-center text-sm text-muted-foreground">
                          Loading providers...
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                      </div>
                    </div>
                  </>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your display name"
                      value={signupData.displayName}
                      onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;