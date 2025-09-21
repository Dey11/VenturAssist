# GenAI Hack - Startup Analysis Platform

A Next.js application that uses AI to analyze startup data and provide comprehensive insights for investors and entrepreneurs.

## Features

- **Startup Data Collection**: Upload files, text, and URLs for analysis
- **AI-Powered Analysis**: Uses Google's Gemini AI to extract key metrics, team information, and market insights
- **Background Processing**: BullMQ-based job queue for scalable data processing
- **Real-time Progress Tracking**: Live updates on analysis progress
- **Comprehensive Reports**: Detailed analysis results with risk assessment

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Queue System**: BullMQ with Redis
- **AI**: Vercel AI SDK with Google Gemini
- **Authentication**: Better Auth
- **File Storage**: AWS S3
- **Styling**: Shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Docker and Docker Compose
- PostgreSQL database
- AWS S3 bucket (for file storage)
- Google AI API key

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/genaihack"

# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# AI
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="your-aws-region"
AWS_S3_BUCKET="your-s3-bucket-name"

# Authentication
BETTER_AUTH_SECRET="your-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd genaihack
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start Redis with Docker Compose**

   ```bash
   docker compose up -d redis
   ```

4. **Set up the database**

   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Start the background worker** (in a separate terminal)
   ```bash
   pnpm worker:ingestion
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Development Workflow

### Running the Application

1. **Start Redis**: `docker compose up -d redis`
2. **Start Next.js**: `pnpm dev`
3. **Start Worker**: `pnpm worker:ingestion`

### Available Scripts

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm worker:ingestion` - Start the background ingestion worker
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome

### Architecture

#### Background Processing

The application uses BullMQ for background job processing:

- **Queue**: `ingestion-queue` - Processes startup data analysis
- **Worker**: `ingestion-worker` - Handles AI analysis and data extraction
- **Redis**: Message broker and job storage

#### Data Flow

1. User uploads files and provides startup information
2. Files are uploaded to S3 and metadata stored in database
3. `/api/data-sources/enqueue-job` creates a job and enqueues it
4. Background worker processes the job:
   - Downloads files from S3 using presigned URLs
   - Analyzes content with Google Gemini AI
   - Extracts structured data (metrics, team, market info, risks)
   - Stores results in database
5. Frontend polls job status and displays progress
6. User can view comprehensive analysis results

#### File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities and configurations
├── server/                # Server-side code
│   └── bullmq/           # Queue system
│       ├── config.ts     # BullMQ configuration
│       ├── types.ts      # Type definitions
│       ├── queues/       # Queue implementations
│       ├── services/     # Business logic services
│       └── workers/      # Background workers
└── workers/              # Worker entry points
```

## Deployment

### Production Setup

1. **Environment Variables**: Set all required environment variables
2. **Database**: Set up PostgreSQL database
3. **Redis**: Set up Redis instance (can use managed service)
4. **File Storage**: Configure AWS S3 bucket
5. **Worker Process**: Deploy worker as separate process/service

### Docker Deployment

```bash
# Build and start all services
docker compose up -d

# Or build production image
docker build -t genaihack .
docker run -p 3000:3000 genaihack
```

### Vercel Deployment

The application is optimized for Vercel deployment:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Note**: Background workers need to be deployed separately (e.g., on Railway, Render, or similar service).

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.
