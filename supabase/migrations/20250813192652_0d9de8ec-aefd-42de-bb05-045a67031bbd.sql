-- Add 'rooms' category to the item_category enum
ALTER TYPE item_category ADD VALUE 'rooms';

-- Add a check constraint to ensure rooms can only be rented
ALTER TABLE items ADD CONSTRAINT rooms_rental_only 
CHECK (
  category != 'rooms' OR listing_type IN ('rent', 'both')
);