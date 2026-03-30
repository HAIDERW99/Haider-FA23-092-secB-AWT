-- USERS
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  role text check (role in ('client','moderator','admin','super_admin')) default 'client',
  status text default 'active',
  created_at timestamptz default now()
);

-- SELLER PROFILES
create table seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  display_name text,
  business_name text,
  phone text,
  city text,
  is_verified boolean default false
);

-- PACKAGES
create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days int not null,
  weight int not null,
  is_featured boolean default false,
  price numeric(10,2) not null
);

-- CATEGORIES
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  is_active boolean default true
);

-- CITIES
create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  is_active boolean default true
);

-- ADS (main table)
create table ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  package_id uuid references packages(id),
  category_id uuid references categories(id),
  city_id uuid references cities(id),
  title text not null,
  slug text unique not null,
  description text,
  status text check (status in (
    'draft','submitted','under_review','payment_pending',
    'payment_submitted','payment_verified','scheduled',
    'published','expired','archived','rejected'
  )) default 'draft',
  publish_at timestamptz,
  expire_at timestamptz,
  admin_boost int default 0,
  rank_score numeric default 0,
  created_at timestamptz default now()
);

-- AD MEDIA
create table ad_media (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references ads(id) on delete cascade,
  source_type text check (source_type in ('youtube','image','cloudinary')),
  original_url text not null,
  thumbnail_url text,
  validation_status text default 'pending'
);

-- PAYMENTS
create table payments (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references ads(id) on delete cascade,
  amount numeric(10,2),
  method text,
  transaction_ref text unique,
  sender_name text,
  screenshot_url text,
  status text check (status in ('pending','verified','rejected')) default 'pending',
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text,
  message text,
  type text,
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- AUDIT LOGS
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action_type text,
  target_type text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- AD STATUS HISTORY
create table ad_status_history (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references ads(id) on delete cascade,
  previous_status text,
  new_status text,
  changed_by uuid,
  note text,
  changed_at timestamptz default now()
);

-- LEARNING QUESTIONS
create table learning_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  topic text,
  difficulty text,
  is_active boolean default true
);

-- SYSTEM HEALTH LOGS
create table system_health_logs (
  id uuid primary key default gen_random_uuid(),
  source text,
  response_ms int,
  checked_at timestamptz default now(),
  status text
);

-- INDEXES FOR PERFORMANCE
create index ads_status_idx on ads(status);
create index ads_category_idx on ads(category_id);
create index ads_city_idx on ads(city_id);
create index ads_rank_score_idx on ads(rank_score desc);
create index ads_publish_at_idx on ads(publish_at);
create index ads_user_id_idx on ads(user_id);
create index ad_media_ad_id_idx on ad_media(ad_id);
create index payments_ad_id_idx on payments(ad_id);
create index payments_status_idx on payments(status);
create index notifications_user_id_idx on notifications(user_id);
create index audit_logs_actor_id_idx on audit_logs(actor_id);
create index ad_status_history_ad_id_idx on ad_status_history(ad_id);

-- INSERT SEED DATA

-- PACKAGES
insert into packages (name, duration_days, weight, is_featured, price) values
('Basic', 7, 1, false, 5.00),
('Standard', 15, 2, false, 12.00),
('Premium', 30, 3, true, 25.00);

-- CATEGORIES
insert into categories (name, slug, is_active) values
('Electronics', 'electronics', true),
('Vehicles', 'vehicles', true),
('Property', 'property', true),
('Jobs', 'jobs', true),
('Services', 'services', true);

-- CITIES
insert into cities (name, slug, is_active) values
('Karachi', 'karachi', true),
('Lahore', 'lahore', true),
('Islamabad', 'islamabad', true),
('Peshawar', 'peshawar', true),
('Quetta', 'quetta', true);

-- SAMPLE USERS
insert into users (name, email, role, status) values
('John Doe', 'john@example.com', 'client', 'active'),
('Jane Smith', 'jane@example.com', 'client', 'active'),
('Admin User', 'admin@example.com', 'admin', 'active'),
('Moderator User', 'moderator@example.com', 'moderator', 'active');

-- SELLER PROFILES
insert into seller_profiles (user_id, display_name, business_name, phone, city, is_verified) values
((select id from users where email = 'john@example.com'), 'John Tech', 'John Electronics', '+923001234567', 'Karachi', true),
((select id from users where email = 'jane@example.com'), 'Jane Auto', 'Jane Motors', '+923002345678', 'Lahore', false);

-- SAMPLE ADS
insert into ads (user_id, package_id, category_id, city_id, title, slug, description, status, publish_at, expire_at, rank_score) values
-- Published ads
((select id from users where email = 'john@example.com'), (select id from packages where name = 'Premium'), (select id from categories where name = 'Electronics'), (select id from cities where name = 'Karachi'), 'iPhone 14 Pro Max - Excellent Condition', 'iphone-14-pro-max-excellent-condition', 'Selling my iPhone 14 Pro Max in excellent condition. 256GB, Deep Purple. Used for 6 months, no scratches, battery health 95%. Original box and accessories included.', 'published', now() - interval '5 days', now() + interval '25 days', 85),
((select id from users where email = 'jane@example.com'), (select id from packages where name = 'Standard'), (select id from categories where name = 'Vehicles'), (select id from cities where name = 'Lahore'), 'Toyota Corolla 2020 Model', 'toyota-corolla-2020-model', 'Well maintained Toyota Corolla 2020 model. 50,000 km driven, automatic transmission, white color. Complete service history available.', 'published', now() - interval '10 days', now() + interval '5 days', 65),
((select id from users where email = 'john@example.com'), (select id from packages where name = 'Basic'), (select id from categories where name = 'Electronics'), (select id from cities where name = 'Karachi'), 'Dell Laptop Core i5', 'dell-laptop-core-i5', 'Dell Latitude 5420, Core i5 11th gen, 8GB RAM, 256GB SSD. Perfect for office work and students.', 'published', now() - interval '3 days', now() + interval '4 days', 75),
-- Pending review
((select id from users where email = 'john@example.com'), (select id from packages where name = 'Premium'), (select id from categories where name = 'Property'), (select id from cities where name = 'Islamabad'), '2 Bedroom Apartment for Rent', '2-bedroom-apartment-for-rent', 'Spacious 2 bedroom apartment in DHA Phase 2. 1200 sq ft, with balcony and parking. Near schools and markets.', 'under_review', null, null, 0),
-- Payment pending
((select id from users where email = 'jane@example.com'), (select id from packages where name = 'Standard'), (select id from categories where name = 'Services'), (select id from cities where name = 'Lahore'), 'Professional Photography Services', 'professional-photography-services', 'Professional photographer available for events, weddings, and portraits. 10 years experience with professional equipment.', 'payment_pending', null, null, 0),
-- Scheduled
((select id from users where email = 'john@example.com'), (select id from packages where name = 'Premium'), (select id from categories where name = 'Jobs'), (select id from cities where name = 'Karachi'), 'Software Developer Position', 'software-developer-position', 'Looking for experienced software developer proficient in React, Node.js, and cloud technologies. Remote work available.', 'scheduled', now() + interval '2 days', now() + interval '32 days', 50),
-- Expired ads
((select id from users where email = 'jane@example.com'), (select id from packages where name = 'Basic'), (select id from categories where name = 'Vehicles'), (select id from cities where name = 'Lahore'), 'Honda CG 125 Motorcycle', 'honda-cg-125-motorcycle', 'Honda CG 125 2019 model. Well maintained, new tires, excellent condition. Perfect for daily commute.', 'expired', now() - interval '20 days', now() - interval '13 days', 0),
-- Draft ads
((select id from users where email = 'john@example.com'), (select id from packages where name = 'Standard'), (select id from categories where name = 'Electronics'), (select id from cities where name = 'Karachi'), 'Samsung Smart TV 55"', 'samsung-smart-tv-55', 'Samsung 55" 4K Smart TV with HDR. Excellent condition, remote included.', 'draft', null, null, 0);

-- AD MEDIA SAMPLES
insert into ad_media (ad_id, source_type, original_url, thumbnail_url, validation_status) values
((select id from ads where slug = 'iphone-14-pro-max-excellent-condition'), 'image', 'https://example.com/iphone14.jpg', 'https://example.com/iphone14.jpg', 'verified'),
((select id from ads where slug = 'toyota-corolla-2020-model'), 'image', 'https://example.com/corolla.jpg', 'https://example.com/corolla.jpg', 'verified'),
((select id from ads where slug = 'dell-laptop-core-i5'), 'youtube', 'https://youtube.com/watch?v=dell123', 'https://img.youtube.com/vi/dell123/hqdefault.jpg', 'verified');

-- SAMPLE PAYMENTS
insert into payments (ad_id, amount, method, transaction_ref, sender_name, screenshot_url, status) values
((select id from ads where slug = 'iphone-14-pro-max-excellent-condition'), 25.00, 'bank_transfer', 'TXN123456', 'John Doe', 'https://example.com/receipt1.jpg', 'verified'),
((select id from ads where slug = 'toyota-corolla-2020-model'), 12.00, 'jazzcash', 'TXN789012', 'Jane Smith', 'https://example.com/receipt2.jpg', 'verified'),
((select id from ads where slug = '2-bedroom-apartment-for-rent'), 25.00, 'bank_transfer', 'TXN345678', 'John Doe', 'https://example.com/receipt3.jpg', 'pending');

-- LEARNING QUESTIONS
insert into learning_questions (question, answer, topic, difficulty, is_active) values
('What is the purpose of ad ranking in AdFlow Pro?', 'Ad ranking helps display the most relevant and high-quality ads first, improving user experience and ad visibility.', 'AdFlow Basics', 'easy', true),
('How does the media normalization work for YouTube URLs?', 'YouTube URLs are converted to thumbnail URLs using the format: https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg', 'Media Processing', 'medium', true),
('What are the different user roles in AdFlow Pro?', 'Client (creates ads), Moderator (reviews content), Admin (manages payments and publishing), Super Admin (full system access)', 'User Management', 'easy', true),
('How is the rank score calculated for ads?', 'Rank score = (featured ? 50 : 0) + (packageWeight * 10) + freshnessPoints + adminBoost', 'Ranking Algorithm', 'medium', true),
('What happens when an ad expires?', 'Expired ads no longer appear in public results but remain in the system for historical data and reporting.', 'Ad Lifecycle', 'easy', true);

-- SAMPLE NOTIFICATIONS
insert into notifications (user_id, title, message, type, is_read, link) values
((select id from users where email = 'john@example.com'), 'Ad Published Successfully', 'Your ad "iPhone 14 Pro Max" has been published and is now live.', 'success', false, '/ads/iphone-14-pro-max-excellent-condition'),
((select id from users where email = 'jane@example.com'), 'Payment Received', 'Your payment for "Toyota Corolla 2020" has been verified.', 'success', true, '/dashboard/client'),
((select id from users where email = 'admin@example.com'), 'New Ad Pending Review', 'A new ad requires your review and approval.', 'info', false, '/dashboard/moderator');

-- SAMPLE AUDIT LOGS
insert into audit_logs (actor_id, action_type, target_type, target_id, old_value, new_value) values
((select id from users where email = 'admin@example.com'), 'status_change', 'ad', (select id from ads where slug = 'iphone-14-pro-max-excellent-condition'), '{"status": "payment_verified"}', '{"status": "published"}'),
((select id from users where email = 'john@example.com'), 'create', 'ad', (select id from ads where slug = 'dell-laptop-core-i5'), null, '{"title": "Dell Laptop Core i5"}');

-- AD STATUS HISTORY
insert into ad_status_history (ad_id, previous_status, new_status, changed_by, note) values
((select id from ads where slug = 'iphone-14-pro-max-excellent-condition'), 'payment_verified', 'published', (select id from users where email = 'admin@example.com'), 'Ad published after payment verification'),
((select id from ads where slug = 'toyota-corolla-2020-model'), 'payment_verified', 'published', (select id from users where email = 'admin@example.com'), 'Auto-published after payment verification'),
((select id from ads where slug = '2-bedroom-apartment-for-rent'), 'submitted', 'under_review', (select id from users where email = 'moderator@example.com'), 'Ad submitted for content review');
