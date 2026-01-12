# 1. Quick Start
Quick Start
bash# 1. Install dependencies
```
npm install
```
# 2. Setup .env
```
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
OPENAI_API_KEY="sk-..."
```
# 3. Start server
```
npm run dev
```
// After starting the server for the mock data run this commnd
```
node src/scripts/seedAll.js
```
// it will insert All mock Data in DB

# 3.1. API Endpoints
```
GET http://localhost:3000/api/customers/All                     → It Will Fetch all customers

DELETE  http://localhost:3000/api/customers/Delete              → It Will Delete all customers
```
# 4. Test
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"How many jobs?"}'
  
```
📞 API Endpoints
GET  /api/ai/status              → Health check
POST /api/ai/chat                → Basic chat
POST /api/ai/chat/followup       → Chat with context
GET  /api/ai/history/:sessionId  → Get history
 ``` 

## Ai Working Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
│              "How many jobs this week?"                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS API                                   │
│                 POST /api/ai/chat                                │
│            { query, sessionId }                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI SERVICE                                     │
│                                                                  │
│   Step 1: Query ko samjho                                       │
│   ┌──────────────────────────────────────┐                     │
│   │ "How many jobs this week?"           │                     │
│   │ Intent: COUNT                         │                     │
│   │ Entity: jobs                          │                     │
│   │ Timeframe: this week                  │                     │
│   └──────────────────────────────────────┘                     │
│                                                                  │
│   Step 2: SQL Query Generate karo (GPT-4)                      │
│   ┌──────────────────────────────────────┐                     │
│   │ SELECT COUNT(*)                       │                     │
│   │ FROM "Job"                            │                     │
│   │ WHERE created_at >= NOW()             │                     │
│   │   - INTERVAL '7 days'                 │                     │
│   └──────────────────────────────────────┘                     │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                            │
│                                                                  │
│   Tables:                                                        │
│   ┌─────────────┐  ┌──────────────┐  ┌─────────────┐          │
│   │  Customer   │  │     Job      │  │   Booking   │          │
│   ├─────────────┤  ├──────────────┤  ├─────────────┤          │
│   │ id          │  │ job_id       │  │ booking_id  │          │
│   │ name        │  │ customer_id  │  │ job_id      │          │
│   │ phone       │  │ created_at   │  │ scheduled   │          │
│   │ email       │  │ status       │  │ technician  │          │
│   └─────────────┘  └──────────────┘  └─────────────┘          │
│                                                                  │
│   SQL Execute → Result: { count: 14 }                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI SERVICE (Part 2)                           │
│                                                                  │
│   Step 3: Results ko natural language me convert karo          │
│   ┌──────────────────────────────────────┐                     │
│   │ Input: { count: 14 }                 │                     │
│   │ GPT-4: "There are 14 jobs            │                     │
│   │         booked this week."           │                     │
│   └──────────────────────────────────────┘                     │
│                                                                  │
│   Step 4: History me save karo                                 │
│   ┌──────────────────────────────────────┐                     │
│   │ Session: abc-123                      │                     │
│   │ User: "How many jobs this week?"     │                     │
│   │ AI: "There are 14 jobs..."           │                     │
│   └──────────────────────────────────────┘                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        USER                                      │
│          Response: "There are 14 jobs booked this week."       │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Detailed Process

### **1️⃣ User Request**
```
User types: "How many jobs this week?"
           ↓
API receives: POST /api/ai/chat
              { "query": "How many jobs this week?" }
```

### **2️⃣ AI Service Processing**

```typescript
// Step 1: Query Analysis
Query: "How many jobs this week?"
       ↓
GPT-4 analyzes:
{
  intent: "count",
  entities: ["jobs"],
  timeframe: "this week"
}
```

```typescript
// Step 2: SQL Generation
Schema Hints provided to GPT-4:
- Job table has: job_id, customer_id, created_at, status
- Use INTERVAL for date ranges
       ↓
GPT-4 generates:
SELECT COUNT(*) 
FROM "Job" 
WHERE created_at >= NOW() - INTERVAL '7 days'
```

### **3️⃣ Database Execution**

```sql
-- TypeORM executes:
SELECT COUNT(*) FROM "Job" 
WHERE created_at >= NOW() - INTERVAL '7 days'
       ↓
Result: [{ count: '14' }]
```

### **4️⃣ Natural Language Response**

```typescript
// GPT-4 converts result to natural language
Input: [{ count: '14' }]
Query: "How many jobs this week?"
       ↓
Output: "There are 14 jobs booked this week."
```

### **5️⃣ History Saved**

```typescript
conversationHistory.set('session-123', [
  { role: 'user', content: 'How many jobs this week?' },
  { role: 'assistant', content: 'There are 14 jobs...' }
])
```

## 🔄 Follow-up Questions

```
User: "How many jobs this week?"
AI:   "There are 14 jobs booked this week."
      ↓ (History saved)

User: "What about last week?"  ← Follow-up!
      ↓
AI detects follow-up pattern
      ↓
Combines with history:
"Based on previous context about jobs this week,
 user is now asking about jobs last week"
      ↓
Generates SQL:
SELECT COUNT(*) FROM "Job"
WHERE created_at >= NOW() - INTERVAL '14 days'
  AND created_at < NOW() - INTERVAL '7 days'
      ↓
AI:   "Last week there were 18 jobs."
```

## 📊 Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│                    Technology Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (User)                                        │
│  └─ Any HTTP Client (Browser, Postman, Mobile App)     │
│                    ↕                                     │
│  Backend (Node.js + Express)                            │
│  ├─ ai.routes.ts      → Route handling                  │
│  ├─ ai.controller.ts  → Request/Response                │
│  └─ ai.service.ts     → Business logic                  │
│                    ↕                                     │
│  AI Layer (LangChain + OpenAI)                          │
│  ├─ ChatOpenAI        → GPT-4 model                     │
│  ├─ SqlDatabase       → Database wrapper                │
│  └─ createSqlQueryChain → SQL generation               │
│                    ↕                                     │
│  Database Layer (TypeORM + PostgreSQL)                  │
│  ├─ DataSource        → DB connection                   │
│  ├─ Tables: Customer, Job, Booking                      │
│  └─ SQL execution                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Key Technologies

### **1. LangChain**
```
Purpose: AI workflows its manage
- SQL query generation
- Prompt management
- Database integration
```

### **2. OpenAI GPT-4**
```
Purpose: Natural language processing
- Questions ko samajhna
- SQL generate karna
- Natural answers dena
```

### **3. TypeORM**
```
Purpose: Database connection
- PostgreSQL to connect
- SQL executetion
- Results return values
```

### **4. Express.js**
```
Purpose: API endpoints
- HTTP requests handle 
- Routing
- Response send 
```

### **5. Note 
```
have to Open API Key For Working With LLM
env file must look like : 
# OpenAI Configuration
OPENAI_API_KEY= API API Key

# Database Configuration
DATABASE_URL=postgresql://postgres:root@localhost:5432/job-db?schema=public
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=job-db

# Server Configuration
PORT=3000
NODE_ENV=development

```