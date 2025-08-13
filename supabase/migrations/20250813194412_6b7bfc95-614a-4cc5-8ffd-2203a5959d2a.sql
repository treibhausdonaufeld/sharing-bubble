-- Add a check constraint to ensure rooms can only be rented
ALTER TABLE items ADD CONSTRAINT rooms_rental_only 
CHECK (
  category != 'rooms' OR listing_type IN ('rent', 'both')
);