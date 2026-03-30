# AdFlow Pro

A production-grade sponsored listing marketplace built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- **User Management**: Multi-role system (client, moderator, admin, super_admin)
- **Ad Management**: Create, edit, publish, and manage sponsored listings
- **Payment System**: Manual payment verification with transaction tracking
- **Media Support**: YouTube videos and images with automatic thumbnail generation
- **Smart Ranking**: Algorithm-based ad ranking with freshness and package weighting
- **Review System**: Content moderation and approval workflow
- **Analytics**: Comprehensive dashboard with KPIs and metrics
- **Scheduled Publishing**: Automated ad publishing and expiration
- **Learning Widget**: Random quiz questions for user engagement

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (JWT-based)
- **Validation**: Zod
- **Deployment**: Vercel
- **Scheduled Jobs**: Vercel Cron Jobs

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd adflow-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.local.example .env.local
```

4. Configure your Supabase project:
   - Create a new Supabase project
   - Run the SQL migration from `supabase/migrations/001_init.sql`
   - Add your Supabase credentials to `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
CRON_SECRET=your_cron_secret_for_security
```

## Database Setup

1. Create a Supabase project
2. Run the complete SQL migration from `supabase/migrations/001_init.sql`
3. The migration includes:
   - All required tables (users, ads, payments, etc.)
   - Indexes for performance
   - Seed data for testing

## API Routes

### Public Routes
- `GET /api/ads` - List active ads with filtering and pagination
- `GET /api/ads/[slug]` - Get single ad details
- `GET /api/packages` - List available packages
- `GET /api/questions/random` - Get random learning question
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Client Routes (Protected)
- `GET /api/client/ads` - Get user's ads
- `POST /api/client/ads` - Create new ad
- `PATCH /api/client/ads/[id]` - Update draft ad
- `DELETE /api/client/ads/[id]` - Delete draft ad
- `POST /api/client/payments` - Submit payment proof

### Moderator Routes (Protected)
- `GET /api/moderator/review` - Get ads pending review
- `PATCH /api/moderator/ads/[id]/review` - Approve/reject ads

### Admin Routes (Protected)
- `GET /api/admin/payments` - Get payment verification queue
- `PATCH /api/admin/payments/[id]/verify` - Verify/reject payments
- `GET /api/admin/publish` - Get ads ready to publish
- `PATCH /api/admin/ads/[id]/publish` - Publish or schedule ads
- `GET /api/admin/analytics` - Get analytics data

### Cron Routes (Protected)
- `POST /api/cron/publish-scheduled` - Publish scheduled ads
- `POST /api/cron/expire-ads` - Expire outdated ads
- `GET /api/health/db` - Database health check

## Pages Structure

### Public Pages
- `/` - Landing page with featured ads and packages
- `/explore` - Browse ads with filters and search
- `/ads/[slug]` - Individual ad details
- `/packages` - Package information and pricing
- `/categories/[slug]` - Ads by category
- `/cities/[slug]` - Ads by city

### Auth Pages
- `/login` - User login
- `/register` - User registration

### Dashboard Pages
- `/dashboard/client` - Client dashboard with ad management
- `/dashboard/moderator` - Moderator review queue
- `/dashboard/admin` - Admin payment and publishing queue
- `/dashboard/admin/analytics` - Analytics and reporting

## Key Features

### Ad Ranking Algorithm
```typescript
rankScore = (featured ? 50 : 0) + (packageWeight * 10) + freshnessPoints + adminBoost
```

### Media URL Normalization
- YouTube URLs → Thumbnail extraction
- Direct images → HTTPS validation
- Cloudinary URLs → Basic validation
- Invalid URLs → Placeholder fallback

### Status Transitions
```
draft → submitted → under_review → payment_pending → payment_submitted → payment_verified → scheduled/published → expired
```

### Cron Jobs
- **Hourly**: Publish scheduled ads
- **Daily**: Expire outdated ads  
- **Every 30 minutes**: Database health check

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy - Vercel will automatically detect Next.js
4. Set up cron jobs in `vercel.json`

### Manual Deployment

```bash
npm run build
npm start
```

## Testing

The application includes sample data in the SQL migration for testing all features:

- **Sample Users**: admin@example.com (admin), moderator@example.com (moderator), john@example.com (client)
- **Sample Ads**: Various statuses and categories
- **Sample Packages**: Basic ($5), Standard ($12), Premium ($25)
- **Sample Categories**: Electronics, Vehicles, Property, Jobs, Services
- **Sample Cities**: Karachi, Lahore, Islamabad, Peshawar, Quetta

## Security Features

- JWT-based authentication with Supabase Auth
- Role-based access control with middleware
- Input validation with Zod schemas
- SQL injection prevention with Supabase
- CORS protection
- Cron job security with secret tokens

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
