/*
  # Add authentication roles and admin features
  
  1. Changes
    - Add admin role
    - Create profiles table
    - Add RLS policies for profiles
    - Add function to check admin status
  
  2. Security
    - Only admins can grant admin privileges
    - Profiles are protected by RLS
    - Public read access for basic profile info
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access"
  ON profiles FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Function to grant admin privileges (only callable by admins)
CREATE OR REPLACE FUNCTION grant_admin(target_user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can grant admin privileges';
  END IF;
  
  UPDATE profiles
  SET is_admin = true
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;