-- Create item categories enum
CREATE TYPE public.item_category AS ENUM (
  'electronics',
  'tools',
  'furniture',
  'books',
  'sports',
  'clothing',
  'kitchen',
  'garden',
  'toys',
  'vehicles',
  'other'
);

-- Create item condition enum
CREATE TYPE public.item_condition AS ENUM (
  'new',
  'used',
  'broken'
);

-- Create item status enum
CREATE TYPE public.item_status AS ENUM (
  'draft',
  'available',
  'reserved',
  'rented',
  'sold'
);

-- Create listing type enum
CREATE TYPE public.listing_type AS ENUM (
  'sell',
  'rent',
  'both'
);

-- Create rental period enum
CREATE TYPE public.rental_period AS ENUM (
  'hourly',
  'daily',
  'weekly'
);

-- Create request status enum
CREATE TYPE public.request_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'counter_offer',
  'completed',
  'cancelled'
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  default_location TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user locations table
CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category public.item_category NOT NULL,
  condition public.item_condition NOT NULL,
  status public.item_status DEFAULT 'draft',
  listing_type public.listing_type NOT NULL,
  sale_price DECIMAL(10,2),
  rental_price DECIMAL(10,2),
  rental_period public.rental_period,
  location_id UUID REFERENCES public.user_locations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create item images table
CREATE TABLE public.item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create item requests table
CREATE TABLE public.item_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type public.listing_type NOT NULL,
  offered_price DECIMAL(10,2),
  rental_start_date TIMESTAMPTZ,
  rental_end_date TIMESTAMPTZ,
  message TEXT,
  status public.request_status DEFAULT 'pending',
  counter_offer_price DECIMAL(10,2),
  counter_start_date TIMESTAMPTZ,
  counter_end_date TIMESTAMPTZ,
  counter_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table for user communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.item_requests(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user ratings table
CREATE TABLE public.user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.item_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rater_id, rated_user_id, request_id)
);

-- Create credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund')),
  description TEXT,
  item_id UUID REFERENCES public.items(id),
  request_id UUID REFERENCES public.item_requests(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for user_locations
CREATE POLICY "Users can manage own locations" ON public.user_locations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view locations for items" ON public.user_locations FOR SELECT USING (true);

-- Create RLS policies for user_credits
CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own credits" ON public.user_credits FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own credits" ON public.user_credits FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for items
CREATE POLICY "Users can view available items" ON public.items FOR SELECT USING (status != 'draft' OR user_id = auth.uid());
CREATE POLICY "Users can manage own items" ON public.items FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for item_images
CREATE POLICY "Users can view item images" ON public.item_images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_images.item_id 
    AND (items.status != 'draft' OR items.user_id = auth.uid())
  )
);
CREATE POLICY "Users can manage own item images" ON public.item_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_images.item_id 
    AND items.user_id = auth.uid()
  )
);

-- Create RLS policies for item_requests
CREATE POLICY "Users can view requests involving them" ON public.item_requests FOR SELECT 
USING (requester_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Users can create requests" ON public.item_requests FOR INSERT 
WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can update requests they're involved in" ON public.item_requests FOR UPDATE 
USING (requester_id = auth.uid() OR owner_id = auth.uid());

-- Create RLS policies for messages
CREATE POLICY "Users can view messages involving them" ON public.messages FOR SELECT 
USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update messages they received" ON public.messages FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create RLS policies for user_ratings
CREATE POLICY "Users can view all ratings" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON public.user_ratings FOR INSERT WITH CHECK (rater_id = auth.uid());

-- Create RLS policies for credit_transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

-- Create storage policies for item images
CREATE POLICY "Anyone can view item images" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE 
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE 
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create avatar storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to automatically create user profile and credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_item_requests_updated_at BEFORE UPDATE ON public.item_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update user ratings
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.user_ratings 
      WHERE rated_user_id = NEW.rated_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.user_ratings 
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE user_id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update ratings when new rating is added
CREATE TRIGGER on_rating_added
  AFTER INSERT ON public.user_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();