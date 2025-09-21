# Venturassist - AI-Powered VC Analysis Platform

> **Your AI VC Analyst** - Revolutionizing startup evaluation through intelligent document analysis, competitive intelligence, and risk assessment.

## 🚀 Overview

Venturassist is an advanced AI-powered platform that automates and enhances the venture capital due diligence process. By leveraging cutting-edge AI agents and comprehensive data analysis, we transform how VCs evaluate startup opportunities, providing deep insights, competitive analysis, and risk assessments that would traditionally take weeks to compile.

## 🏗️ System Architecture

Our platform employs a sophisticated multi-agent architecture that processes startup pitch decks and documents through three specialized AI agents:
<img width="5837" height="1874" alt="image" src="https://github.com/user-attachments/assets/f9edd819-17fc-4142-b3c7-e1ccff219ca1" />

### 🔄 Processing Flow

```mermaid
graph TD
    A[User Uploads Pitch Deck] --> B[BetterAuth Authentication]
    B --> C[Store Files in Cloudflare R2]
    C --> D[Store Metadata in PostgreSQL]
    D --> E[Ingestion Queue - BullMQ]
    E --> F[Ingestion Agent]
    F --> G[Extract & Structure Data]
    G --> H[AI Analysis & Storage]
    H --> I[Trigger RedLens Agent]
    H --> J[Trigger Competitor Agent]
    I --> K[Risk Assessment Report]
    J --> L[Competitive Analysis Report]
    K --> M[Merge Reports]
    L --> M
    M --> N[Present to VC]

    O[VC Chat Interface] --> P[Chatbot Agent]
    P --> Q[Query Database]
    Q --> R[Return Insights]
```
<img width="1433" height="716" alt="image" src="https://github.com/user-attachments/assets/4dfb74b8-c261-4ed2-b81d-05e4a8c00ec8" />


### 🤖 AI Agents

#### 1. **Ingestion Agent**

- **Purpose**: Document processing and data extraction
- **Capabilities**:
  - Processes PDF, PPTX, and text documents
  - Extracts structured data (metrics, team info, market data)
  - Performs initial AI analysis and risk identification
  - Triggers downstream analysis agents

#### 2. **RedLens Risk Assessment Agent**

- **Purpose**: Comprehensive risk analysis through specialized modules
- **Modules**:
  - **Forensic Accountant**: Financial sustainability and red flags
  - **Market Strategist**: Market opportunity and competitive positioning
  - **Talent Scout**: Team composition and execution capability
  - **Devil's Advocate**: Contrarian analysis and failure point identification
- **Output**: Risk scores, findings, and investment recommendations

#### 3. **Competitor Analysis Agent**

- **Purpose**: Competitive intelligence and market positioning
- **Capabilities**:
  - Identifies direct and indirect competitors
  - Analyzes competitive advantages and threats
  - Provides market positioning insights
  - Generates strategic recommendations

### **AI & Processing**

- **Google Gemini 2.5 Flash** for AI analysis
- **AI SDK** for structured AI interactions
- **Zod** for data validation and schemas
- **Mammoth** for Word document processing
- **PDF-Parse** for PDF text extraction
- **PPTX2JSON** for PowerPoint processing

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker and Docker Compose
- PostgreSQL database
- Redis instance
- Cloudflare R2 account (for file storage)
- Google AI API key

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

3. **Set up environment variables**

   ```bash
   cp example.env .env.local
   ```

   Configure the following variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/venturassist"

   # Redis
   REDIS_URL="redis://localhost:6379"

   # AI
   GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"

   # File Storage
   CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key"
   CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-key"
   CLOUDFLARE_R2_BUCKET_NAME="your-bucket-name"
   CLOUDFLARE_R2_ENDPOINT="your-r2-endpoint"

   # Authentication
   BETTER_AUTH_SECRET="your-auth-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

4. **Start infrastructure services**

   ```bash
   docker-compose up -d
   ```

5. **Set up the database**

   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

6. **Start the development server**

   ```bash
   pnpm dev
   ```

7. **Start the AI workers** (in separate terminals)

   ```bash
   # Ingestion worker
   pnpm worker:ingestion

   # RedLens risk assessment worker
   pnpm worker:redlens

   # Competitor analysis worker
   pnpm worker:competitor
   ```

The application will be available at `http://localhost:3000`.

## 📊 Key Features

### **Document Processing**

- Multi-format support (PDF, PPTX, DOCX, text)
- Intelligent content extraction and structuring
- Automated data validation and cleaning

### **AI-Powered Analysis**

- Structured data extraction from unstructured documents
- Multi-modal analysis combining text, metrics, and market data
- Real-time web search integration for market intelligence

### **Risk Assessment (RedLens)**

- Four specialized analysis modules
- Comprehensive risk scoring and recommendations
- Confidence-based assessment reporting

### **Competitive Intelligence**

- Automated competitor discovery and analysis
- Market positioning assessment
- Strategic recommendation generation

### **Interactive Chat Interface**

- Natural language querying of analysis results
- Context-aware responses based on startup data
- Real-time insights and recommendations

### **Scalable Architecture**

- Queue-based processing for handling multiple analyses
- Horizontal scaling capabilities
- Robust error handling and retry mechanisms

## 🎯 Problem We're Solving

Traditional VC due diligence is:

- **Time-intensive**: Weeks of manual analysis per startup
- **Inconsistent**: Varies based on analyst experience and bias
- **Incomplete**: Limited by human capacity to process information
- **Expensive**: Requires dedicated analyst teams

Venturassist addresses these challenges by:

- **Automating** the initial analysis process
- **Standardizing** evaluation criteria across all assessments
- **Enhancing** human decision-making with AI insights
- **Scaling** analysis capacity without proportional cost increases

## 👥 Team

- **Shreyan Dey** - Lead Developer & System Architecture
- **Prasad Ware** - AI/ML Engineering & Agent Development
- **Saher Pathan** - Backend Development & Infrastructure
- **Sagarika Paul** - Frontend Development & UX/UI
- **Meghana** - Product Strategy & Business Development

## 🚀 Future Roadmap

### **Short-term Optimizations**

- **Flow Optimization**: Streamline processing pipelines for faster analysis
- **Enhanced UI/UX**: Redesign interfaces for better user experience
- **Performance Tuning**: Optimize AI model usage and response times

### **Advanced Agent Capabilities**

- **Gmail Integration**: Enable agents to access and analyze email communications
- **Calling Tools**: Implement voice-based startup interviews and assessments
- **Real-time Collaboration**: Multi-user analysis and commenting features

### **Expanded Analysis Modules**

- **Legal Compliance Agent**: Regulatory and legal risk assessment
- **Technology Assessment Agent**: Technical architecture and scalability analysis
- **Market Timing Agent**: Industry trends and timing analysis

### **Enterprise Features**

- **Multi-tenant Architecture**: Support for multiple VC firms
- **Custom Agent Training**: Firm-specific analysis criteria
- **Advanced Analytics**: Portfolio-level insights and benchmarking

## 📈 Impact & Vision

Venturassist represents the future of venture capital analysis, where AI augments human expertise to deliver faster, more comprehensive, and more accurate startup evaluations. By democratizing access to sophisticated analysis tools, we're enabling VCs to make better investment decisions while reducing the time and cost of due diligence.

Our vision is to become the standard platform for AI-powered startup analysis, transforming how the venture capital industry evaluates and invests in the next generation of innovative companies.

---

_Built with ❤️ by the Venturassist team_
