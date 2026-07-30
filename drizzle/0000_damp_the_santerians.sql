CREATE TYPE "public"."body_type" AS ENUM('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'van', 'pickup', 'wagon');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'electric');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('rental', 'deposit');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('requires_payment', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transmission" AS ENUM('automatic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TABLE "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" smallint NOT NULL,
	"body_type" "body_type" NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"transmission" "transmission" NOT NULL,
	"seats" smallint NOT NULL,
	"price_per_day" numeric(10, 2) NOT NULL,
	"image_url" text NOT NULL,
	"mileage" text,
	"description" text,
	"vin" text,
	"available" boolean DEFAULT true NOT NULL,
	"location_id" uuid NOT NULL,
	"rating_avg" numeric(2, 1) DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"trip_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cars_slug_unique" UNIQUE("slug"),
	CONSTRAINT "cars_price_non_negative" CHECK ("cars"."price_per_day" >= 0),
	CONSTRAINT "cars_seats_positive" CHECK ("cars"."seats" > 0),
	CONSTRAINT "cars_rating_range" CHECK ("cars"."rating_avg" between 0 and 5),
	CONSTRAINT "cars_review_count_non_negative" CHECK ("cars"."review_count" >= 0),
	CONSTRAINT "cars_trip_count_non_negative" CHECK ("cars"."trip_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country" text NOT NULL,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"timezone" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "locations_name_unique" UNIQUE("name"),
	CONSTRAINT "locations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"status" "payment_status" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"refunded_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"stripe_intent_id" text,
	"idempotency_key" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_non_negative" CHECK ("payments"."amount" >= 0),
	CONSTRAINT "payments_refund_within_amount" CHECK ("payments"."refunded_amount" >= 0 and "payments"."refunded_amount" <= "payments"."amount")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"percent_off" numeric(5, 2),
	"amount_off" numeric(10, 2),
	"min_days" integer,
	"max_redemptions" integer,
	"times_redeemed" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "promo_codes_upper_case" CHECK ("promo_codes"."code" = upper("promo_codes"."code")),
	CONSTRAINT "promo_codes_one_discount_kind" CHECK (("promo_codes"."percent_off" is null) <> ("promo_codes"."amount_off" is null)),
	CONSTRAINT "promo_codes_percent_range" CHECK ("promo_codes"."percent_off" is null or "promo_codes"."percent_off" between 0 and 100),
	CONSTRAINT "promo_codes_redeemed_non_negative" CHECK ("promo_codes"."times_redeemed" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"car_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"pickup_location_id" uuid NOT NULL,
	"dropoff_location_id" uuid NOT NULL,
	"pickup_at" timestamp with time zone NOT NULL,
	"return_at" timestamp with time zone NOT NULL,
	"driver_age" smallint NOT NULL,
	"days" integer NOT NULL,
	"base_total" numeric(10, 2) NOT NULL,
	"young_driver_fee" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"promo_code_id" uuid,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_reference_unique" UNIQUE("reference"),
	CONSTRAINT "reservations_window_ordered" CHECK ("reservations"."return_at" > "reservations"."pickup_at"),
	CONSTRAINT "reservations_days_positive" CHECK ("reservations"."days" >= 1),
	CONSTRAINT "reservations_totals_non_negative" CHECK ("reservations"."base_total" >= 0 and "reservations"."young_driver_fee" >= 0 and "reservations"."discount" >= 0 and "reservations"."total_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"car_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_reservationId_unique" UNIQUE("reservation_id"),
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"password_hash" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_lower_case" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "users_email_format" CHECK ("users"."email" ~ '^.+@.+\..+$'),
	CONSTRAINT "users_first_name_not_blank" CHECK (length(trim("users"."first_name")) > 0),
	CONSTRAINT "users_last_name_not_blank" CHECK (length(trim("users"."last_name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_dropoff_location_id_locations_id_fk" FOREIGN KEY ("dropoff_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cars_vin_unique" ON "cars" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "cars_available_price" ON "cars" USING btree ("available","price_per_day");--> statement-breakpoint
CREATE INDEX "cars_available_rating" ON "cars" USING btree ("available","rating_avg" DESC NULLS LAST,"review_count" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cars_location_available" ON "cars" USING btree ("location_id","available");--> statement-breakpoint
CREATE INDEX "cars_body_fuel" ON "cars" USING btree ("body_type","fuel_type");--> statement-breakpoint
CREATE INDEX "locations_active" ON "locations" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_stripe_intent_unique" ON "payments" USING btree ("stripe_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_unique" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_reservation_status" ON "payments" USING btree ("reservation_id","status");--> statement-breakpoint
CREATE INDEX "promo_codes_active" ON "promo_codes" USING btree ("active");--> statement-breakpoint
CREATE INDEX "reservations_status_window" ON "reservations" USING btree ("status","pickup_at","return_at");--> statement-breakpoint
CREATE INDEX "reservations_car_status_window" ON "reservations" USING btree ("car_id","status","pickup_at","return_at");--> statement-breakpoint
CREATE INDEX "reservations_user_recent" ON "reservations" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reviews_car_recent" ON "reviews" USING btree ("car_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reviews_user" ON "reviews" USING btree ("user_id");