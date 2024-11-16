DROP TABLE `target`;--> statement-breakpoint
DROP INDEX IF EXISTS `segugio_owner_unique`;--> statement-breakpoint
ALTER TABLE `segugio` ADD `target` text NOT NULL;--> statement-breakpoint
ALTER TABLE `segugio` ADD `ens_domain` text;--> statement-breakpoint
ALTER TABLE `segugio` ADD `resolved_ens_domain` text;--> statement-breakpoint
ALTER TABLE `segugio` ADD `time_range` text NOT NULL;--> statement-breakpoint
ALTER TABLE `segugio` ADD `only_buy_trades` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `segugio` ADD `portfolio_percentage` real NOT NULL;--> statement-breakpoint
ALTER TABLE `segugio` ADD `token_from` text NOT NULL;