CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`department` varchar(100),
	`role` enum('admin','sales','hr','viewer') NOT NULL DEFAULT 'viewer',
	`isActive` int NOT NULL DEFAULT 1,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_username_unique` UNIQUE(`username`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`employeeId` int NOT NULL,
	`token` varchar(500) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
