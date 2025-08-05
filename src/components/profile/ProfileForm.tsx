import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileForm = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || "",
    },
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={updateProfile.isPending}
              className="w-full"
            >
              {updateProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};