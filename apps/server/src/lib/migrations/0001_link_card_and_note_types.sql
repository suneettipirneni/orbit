ALTER TABLE `notes` ADD `note_type_id` text REFERENCES `note_types`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `cards` ADD `card_type_id` text REFERENCES `card_types`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `cards` ADD `anki_card_type` text;
