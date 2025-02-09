# Repository Structure Analysis

## Root Directory
Configuration and setup files:
- `.eslintrc.json` - ESLint configuration for code quality
- `.prettierrc` - Prettier configuration for code formatting
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts
- `jest.setup.ts` - Jest test configuration
- `playwright.config.ts` - E2E test configuration

## Core Application Structure

### `/app` - Next.js App Router Pages
Main application pages and API routes:
- `/account/[address]` - Account details pages
- `/analytics` - Analytics dashboard pages
- `/api` - API route handlers
  - `account-stats` - Account statistics endpoints
  - `account-token-stats` - Token statistics endpoints
  - `solana-rpc` - Solana RPC proxy endpoints
  - `qdrant` - Knowledge graph endpoints
- `/blocks` - Block explorer pages
- `/networks` - Network statistics pages
- `/nfts` - NFT explorer pages
- `/tokens` - Token explorer pages
- `/tx` - Transaction details pages

### `/components` - React Components
Reusable UI components:
- Transaction Components
  - `TransactionFlowChart.tsx` - Transaction flow visualization
  - `TransactionAnalysis.tsx` - Transaction analysis display
  - `TransactionNodeDetails.tsx` - Transaction node details
  - `TransactionVisualizer.tsx` - Transaction visualization
  
- Network Components
  - `NetworkCharts.tsx` - Network statistics charts
  - `NetworkMetricsTable.tsx` - Network metrics display
  - `NetworkResponseChart.tsx` - Network response time charts
  - `NetworkTPSChart.tsx` - TPS visualization
  
- Account Components
  - `AccountInfo.tsx` - Account information display
  - `AccountOverview.tsx` - Account overview component
  - `TokenAccounts.tsx` - Token accounts display
  
- UI Components
  - `ui/` - Base UI components
  - `SearchBar.tsx` - Global search component
  - `CopyButton.tsx` - Copy to clipboard button
  - `ThemeSwitcher.tsx` - Dark/light theme toggle

### `/lib` - Core Logic
Core application logic and utilities:
- Blockchain Integration
  - `solana.ts` - Solana blockchain integration
  - `solana-connection.ts` - Solana connection management
  - `token-registry.ts` - Token registry integration
  
- Data Processing
  - `transaction-parser.ts` - Transaction parsing logic
  - `cache.ts` - Caching implementation
  - `rate-limit.ts` - Rate limiting logic
  
- Knowledge Graph
  - `server/qdrant.ts` - Qdrant vector database integration
  
- Types and Utils
  - `types/` - TypeScript type definitions
  - `utils.ts` - Utility functions

### `/public` - Static Assets
Public assets:
- `fonts/` - Font files
- `images/` - Image assets
- `SVMAI/` - AI model assets

### `/styles` - Styling
Style definitions:
- `DataTable.module.scss` - Table styling
- `vtable.scss` - Virtual table styling
- `themes/` - Theme configurations

### `/scripts` - Utility Scripts
Maintenance and development scripts:
- `test-flipside.ts` - Flipside API testing
- `verify-urls.ts` - URL verification
- `download-images.sh` - Asset download script

### `/qa-flows` - QA Documentation
Quality assurance documentation:
- `01-general-navigation.md` - Navigation testing
- `02-solana-rpc-integration.md` - RPC integration testing
- `03-ai-assistant.md` - AI features testing
- `04-visualization-components.md` - Visualization testing
- `05-security-and-performance.md` - Security and performance testing

### Testing
Test files and configurations:
- `__tests__/` - Jest unit tests
- `e2e/` - Playwright E2E tests
- `test-results/` - Test result artifacts

## Key Architectural Components

### Data Flow
1. Client Requests → Next.js App Router
2. API Routes → Solana RPC/Data Services
3. Data Processing → Knowledge Graph Construction
4. Response Generation → UI Components

### Core Features
1. Blockchain Data Integration
   - Solana RPC communication
   - Transaction parsing
   - Account management

2. Knowledge Graph Engine
   - Vector-based relationship modeling
   - Transaction pattern analysis
   - Similarity search

3. Visualization Layer
   - Interactive transaction flows
   - Network metrics
   - Account relationships

4. API Infrastructure
   - Rate limiting
   - Caching
   - Error handling

## Development Workflow
- TypeScript for type safety
- Next.js for server-side rendering
- Tailwind CSS for styling
- Jest and Playwright for testing
- ESLint and Prettier for code quality