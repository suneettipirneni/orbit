CREATE TABLE IF NOT EXISTS `decks` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `note_types` (
  `id` text PRIMARY KEY NOT NULL,
  `deck_id` text NOT NULL,
  `anki_id` integer,
  `name` text NOT NULL,
  `field_names` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_types` (
  `id` text PRIMARY KEY NOT NULL,
  `deck_id` text NOT NULL,
  `note_type_id` text,
  `anki_order` integer,
  `name` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`note_type_id`) REFERENCES `note_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notes` (
  `id` text PRIMARY KEY NOT NULL,
  `deck_id` text NOT NULL,
  `anki_id` integer,
  `anki_guid` text,
  `anki_model_id` integer,
  `anki_modified_at` integer,
  `anki_update_sequence_number` integer,
  `anki_tags` text,
  `anki_fields` text,
  `anki_field_names` text,
  `anki_sort_field` text,
  `anki_checksum` integer,
  `anki_flags` integer,
  `anki_data` text,
  `front` text NOT NULL,
  `back` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cards` (
  `id` text PRIMARY KEY NOT NULL,
  `deck_id` text NOT NULL,
  `note_id` text NOT NULL,
  `anki_id` integer,
  `anki_note_id` integer,
  `anki_deck_id` integer,
  `anki_order` integer,
  `anki_modified_at` integer,
  `anki_update_sequence_number` integer,
  `anki_type` integer,
  `anki_queue` integer,
  `anki_due` integer,
  `anki_interval` integer,
  `anki_factor` integer,
  `anki_repetitions` integer,
  `anki_lapses` integer,
  `anki_left` integer,
  `anki_original_due` integer,
  `anki_original_deck_id` integer,
  `anki_flags` integer,
  `anki_data` text,
  `due_at` text NOT NULL,
  `ease_factor` real NOT NULL,
  `interval_days` integer NOT NULL,
  `repetitions` integer NOT NULL,
  `lapses` integer NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` text PRIMARY KEY NOT NULL,
  `card_id` text NOT NULL,
  `rating` integer NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
