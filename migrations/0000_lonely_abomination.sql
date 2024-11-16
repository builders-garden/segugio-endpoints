CREATE TABLE `segugio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`private_key` text NOT NULL,
	`address` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `segugio_owner_unique` ON `segugio` (`owner`);--> statement-breakpoint
CREATE TABLE `target` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`segugio_id` integer,
	`ens_domain` text,
	`address` text,
	`resolved_ens_domain` text,
	`time_range` text NOT NULL,
	`only_buy_trades` integer DEFAULT true NOT NULL,
	`portfolio_percentage` real NOT NULL,
	`token_from` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`segugio_id`) REFERENCES `segugio`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trade` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`segugio_id` integer,
	`tx_hash` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`from` text NOT NULL,
	`protocol` text NOT NULL,
	`token_in` text NOT NULL,
	`token_out` text NOT NULL,
	`amount_in` text NOT NULL,
	`amount_out` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`segugio_id`) REFERENCES `segugio`(`id`) ON UPDATE no action ON DELETE no action
);
