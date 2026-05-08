CREATE TABLE `signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`customerId` int NOT NULL,
	`signatureImageUrl` varchar(500),
	`signatureImageKey` varchar(255),
	`otp` varchar(6) NOT NULL,
	`otpVerifiedAt` timestamp,
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp,
	`status` enum('pending','verified','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `signatures_id` PRIMARY KEY(`id`)
);
