# API Documentation

## Account-Related Endpoints

### Account Statistics
- `GET /api/account-stats/[address]`
  - Purpose: Retrieve general account statistics
  - Parameters: Solana account address
  - Returns: Account balance, transaction count, and general metrics

### Account Token Statistics
- `GET /api/account-token-stats/[address]/[mint]`
  - Purpose: Get token-specific statistics for an account
  - Parameters: Account address and token mint address
  - Returns: Token balance, transfer history, and token-specific metrics

### Account Transfers
- `GET /api/account-transfers/[address]`
  - Purpose: List account transfer history
  - Parameters: Account address
  - Returns: List of transfers with timestamps and amounts

## Token-Related Endpoints

### Token Information
- `GET /api/token/[mint]`
  - Purpose: Get token details
  - Parameters: Token mint address
  - Returns: Token metadata, supply, and market information

### Token Statistics
- `GET /api/token-stats/[account]/[mint]`
  - Purpose: Get detailed token statistics
  - Parameters: Account address and token mint
  - Returns: Token usage metrics and analytics

## NFT-Related Endpoints

### NFT Collections
- `GET /api/nft-collections`
  - Purpose: List NFT collections
  - Returns: Collection metadata and statistics

- `GET /api/nft-collections/trending`
  - Purpose: Get trending NFT collections
  - Returns: Popular collections with recent activity

- `GET /api/nft-collections/new`
  - Purpose: List new NFT collections
  - Returns: Recently created collections

### NFTs
- `GET /api/nfts/collections`
  - Purpose: Get detailed NFT collection data
  - Returns: Comprehensive collection information

## Blockchain Data Endpoints

### Block Information
- `GET /api/block`
  - Purpose: Get latest block information
  - Returns: Block header and transaction list

- `GET /api/blocks/[slot]`
  - Purpose: Get specific block details
  - Parameters: Block slot number
  - Returns: Detailed block data

### Solana RPC
- `POST /api/solana-rpc`
  - Purpose: Proxy for Solana RPC calls
  - Body: RPC method and parameters
  - Returns: RPC response

- `POST /api/solana-proxy`
  - Purpose: Enhanced Solana RPC proxy with caching
  - Body: RPC method and parameters
  - Returns: Cached or live RPC response

## Analysis Endpoints

### Transaction Analysis
- `POST /api/analyze-transaction`
  - Purpose: Analyze transaction patterns
  - Body: Transaction signature
  - Returns: Detailed transaction analysis

### General Analysis
- `POST /api/analyze`
  - Purpose: General blockchain data analysis
  - Body: Analysis parameters
  - Returns: Analysis results

## Search and Discovery

### Account Search
- `GET /api/search/accounts`
  - Purpose: Search for accounts
  - Parameters: Search query
  - Returns: Matching accounts

### Filtered Search
- `GET /api/search/filtered`
  - Purpose: Advanced filtered search
  - Parameters: Filter criteria
  - Returns: Filtered results

### Search Suggestions
- `GET /api/search/suggestions`
  - Purpose: Autocomplete suggestions
  - Parameters: Partial search query
  - Returns: Search suggestions

## Knowledge Graph

### Qdrant Integration
- `POST /api/qdrant/init`
  - Purpose: Initialize knowledge graph
  - Returns: Initialization status

## AI/ML Features

### Chat Interface
- `POST /api/chat`
  - Purpose: AI chat interaction
  - Body: User message
  - Returns: AI response

### Question Answering
- `POST /api/getAnswer`
  - Purpose: Get answers to blockchain questions
  - Body: User question
  - Returns: AI-generated answer

- `GET /api/getSimilarQuestions`
  - Purpose: Find similar questions
  - Parameters: Question text
  - Returns: Related questions and answers

### Source Management
- `GET /api/getSources`
  - Purpose: Get information sources
  - Returns: Reference documentation and sources

## Utility Endpoints

### Account Type Checking
- `GET /api/check-account-type`
  - Purpose: Determine account type
  - Parameters: Account address
  - Returns: Account type classification

### Token Validation
- `GET /api/check-token`
  - Purpose: Validate token information
  - Parameters: Token mint address
  - Returns: Token validation status

### OpenGraph
- `GET /api/og`
  - Purpose: Generate OpenGraph images
  - Parameters: Content parameters
  - Returns: Dynamic OG image

## Data Flow Patterns

1. Request Handling
   - Rate limiting (lib/rate-limit.ts)
   - Authentication/Authorization (middleware.ts)
   - Input validation

2. Data Processing
   - Solana RPC interaction (lib/solana.ts)
   - Cache management (lib/cache.ts)
   - Error handling

3. Response Generation
   - Data transformation
   - Response formatting
   - Error standardization

## Security Features

1. Rate Limiting
   - Per-endpoint limits
   - User-based quotas
   - Burst protection

2. Data Validation
   - Input sanitization
   - Parameter validation
   - Type checking

3. Error Handling
   - Standardized error responses
   - Detailed error logging
   - Graceful degradation

## Performance Optimizations

1. Caching Strategy
   - In-memory caching
   - Redis caching
   - Cache invalidation

2. Query Optimization
   - Batch processing
   - Connection pooling
   - Query result caching

3. Response Optimization
   - Compression
   - Pagination
   - Field selection