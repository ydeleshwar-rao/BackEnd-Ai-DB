import { ChatOpenAI } from '@langchain/openai';
import { SqlDatabase } from "langchain/sql_db";
import { createSqlQueryChain } from "langchain/chains/sql_db";
import { DataSource } from "typeorm";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class AIServiceEnhanced {
  private llm: ChatOpenAI;
  private db: SqlDatabase | null = null;
  private datasource: DataSource | null = null;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private dbInitialized: Promise<void>;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4',
      temperature: 0,
    });

    this.dbInitialized = this.initializeDatabase();
  }

  // ============ DATABASE INITIALIZATION ============
  
  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🔄 Initializing database connection...');
      
      this.datasource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

      await this.datasource.initialize();
      console.log('✅ TypeORM DataSource initialized');

      this.db = await SqlDatabase.fromDataSourceParams({
        appDataSource: this.datasource,
      });

      console.log('✅ Database connected successfully');
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  private async ensureDbReady(): Promise<void> {
    await this.dbInitialized;
    if (!this.db) {
      throw new Error('Database failed to initialize');
    }
  }

  // ============ QUERY OPTIMIZATION WITH SCHEMA HINTS ============
  
  private getSchemaHints(): string {
    return `
Database Schema Hints:
- Job table: Contains job records with customer_id, created_at, status
- Booking table: Contains bookings with scheduled_date, technician, job_id
- Customer table: Contains customer information with name, id, phone, email

Common query patterns:
- "leads" or "jobs" → Query the Job table
- "bookings" or "appointments" → Query the Booking table  
- "customers" or "clients" → Query the Customer table
- For date ranges, use INTERVAL or date functions
- Use JOINs when connecting customer names to bookings/jobs
`;
  }

  // ============ TEXT-TO-SQL WITH SCHEMA HINTS ============
  
  private async generateAndExecuteSQLEnhanced(question: string): Promise<any> {
    await this.ensureDbReady();

    // Add schema hints to improve SQL generation
    const enhancedQuestion = `
${this.getSchemaHints()}

User question: ${question}

IMPORTANT: Return ONLY the SQL query, nothing else. No explanations, no markdown, just the SQL.
`;

    const sqlQueryChain = await createSqlQueryChain({
      llm: this.llm,
      db: this.db!,
      dialect: "postgres",
    });

    console.log('🔍 Generating SQL query with schema hints...');
    
    let sqlQuery = await sqlQueryChain.invoke({ 
      question: enhancedQuestion 
    });

    // Clean the SQL query - remove any extra text
    sqlQuery = this.cleanSQLQuery(sqlQuery);

    console.log('📝 Generated SQL:', sqlQuery);

    try {
      const result = await this.db!.run(sqlQuery);
      console.log('✅ Query executed successfully');
      return JSON.parse(result);
    } catch (error: any) {
      console.error('❌ SQL execution error:', error.message);
      // Retry once with error context
      return await this.retryWithError(question, sqlQuery, error.message);
    }
  }

  // Clean SQL query by removing extra text and quotes
  private cleanSQLQuery(sql: string): string {
    // Remove markdown code blocks
    let cleaned = sql.replace(/```sql\n?|\n?```/g, '').trim();
    
    // Remove extra quotes around the entire query
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Remove "Now, run the query..." or similar text
    const lines = cleaned.split('\n');
    const sqlLines = lines.filter(line => {
      const lower = line.toLowerCase().trim();
      return !lower.startsWith('now') && 
             !lower.startsWith('run') && 
             !lower.startsWith('please') &&
             !lower.startsWith('execute') &&
             line.trim().length > 0;
    });
    
    cleaned = sqlLines.join('\n').trim();
    
    // If still has quotes, remove them
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    return cleaned;
  }

  private async retryWithError(
    question: string,
    failedQuery: string,
    errorMessage: string
  ): Promise<any> {
    await this.ensureDbReady();

    console.log('🔄 Retrying with error context...');

    const schema = await this.db!.getTableInfo();
    const retryPrompt = `
The following SQL query failed:
${failedQuery}

Error: ${errorMessage}

Database schema:
${schema}

Generate a corrected PostgreSQL query for: ${question}

CRITICAL RULES:
1. Return ONLY the SQL query
2. No explanations or text
3. No markdown formatting
4. Just the raw SQL query
5. Use double quotes for table/column names if needed
6. PostgreSQL syntax only

Corrected SQL query:
`;

    try {
      const response = await this.llm.invoke(retryPrompt);
      let correctedQuery = (response.content as string).trim();
      
      // Clean the corrected query too
      correctedQuery = this.cleanSQLQuery(correctedQuery);
      
      // Additional cleaning - remove any explanatory text
      const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH'];
      const lines = correctedQuery.split('\n');
      const sqlStartIndex = lines.findIndex(line => 
        sqlKeywords.some(keyword => line.trim().toUpperCase().startsWith(keyword))
      );
      
      if (sqlStartIndex > 0) {
        correctedQuery = lines.slice(sqlStartIndex).join('\n').trim();
      }
      
      console.log('📝 Corrected SQL:', correctedQuery);
      
      const result = await this.db!.run(correctedQuery);
      console.log('✅ Corrected query executed');
      return JSON.parse(result);
    } catch (error: any) {
      console.error('❌ Retry failed:', error.message);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  // ============ SMART QUERY UNDERSTANDING ============
  
  private async understandQuery(query: string): Promise<{
    intent: 'count' | 'list' | 'find' | 'compare' | 'analyze';
    entities: string[];
    timeframe?: string;
  }> {
    const analysisPrompt = `
Analyze this query and extract key information:

Query: "${query}"

Return a JSON object with:
{
  "intent": "count" | "list" | "find" | "compare" | "analyze",
  "entities": ["list of main entities mentioned like customer names, job types, etc"],
  "timeframe": "time period if mentioned (today, this week, last month, etc)"
}

Return ONLY the JSON object.
`;

    try {
      const response = await this.llm.invoke(analysisPrompt);
      const content = response.content as string;
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        intent: 'find',
        entities: [],
      };
    }
  }

  // ============ CONVERSATIONAL HANDLING ============
  
  private isConversationalQuery(query: string): boolean {
    const conversationalPatterns = [
      /^(hi|hello|hey|greetings)/i,
      /^(how are you|what's up|sup)/i,
      /^(thanks|thank you|thx)/i,
      /^(bye|goodbye|see you)/i,
    ];

    return conversationalPatterns.some(pattern => pattern.test(query.trim()));
  }

  private async handleSimpleConversation(query: string): Promise<string> {
    const conversationalPrompt = `
You are a helpful database assistant. The user said: "${query}"

This seems like a general greeting or conversational message, not a database query.

Respond in a friendly, helpful way and let them know you can help them query the database.
For example, you can tell them you can help find information about customers, jobs, bookings, etc.

Response:
`;

    const response = await this.llm.invoke(conversationalPrompt);
    return response.content as string;
  }

  // ============ HISTORY MANAGEMENT ============
  
  private addToHistory(sessionId: string, role: 'user' | 'assistant', content: string) {
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }
    
    const history = this.conversationHistory.get(sessionId)!;
    history.push({
      role,
      content,
      timestamp: Date.now(),
    });

    if (history.length > 50) {
      history.shift();
    }
  }

  async getConversationHistory(sessionId: string, limit: number = 20): Promise<ChatMessage[]> {
    const history = this.conversationHistory.get(sessionId) || [];
    return history.slice(-limit);
  }

  async clearHistory(sessionId: string): Promise<void> {
    this.conversationHistory.delete(sessionId);
    console.log(`🧹 Cleared history for session: ${sessionId}`);
  }

  clearAllCaches(): void {
    this.conversationHistory.clear();
    console.log('🧹 All caches and history cleared');
  }

  // ============ ENHANCED CHAT WITH CONTEXT ============
  
  async chat(query: string, sessionId: string) {
    try {
      console.log(`\n🤖 Processing query: "${query}"`);
      console.log(`📍 Session: ${sessionId}`);

      // Add user message to history
      this.addToHistory(sessionId, 'user', query);

      // Check if conversational
      if (this.isConversationalQuery(query)) {
        console.log('💬 Handling as conversational query');
        const answer = await this.handleSimpleConversation(query);
        this.addToHistory(sessionId, 'assistant', answer);
        return { answer, type: 'conversational' };
      }

      // Wait for database
      await this.ensureDbReady();

      // Understand the query intent
      const understanding = await this.understandQuery(query);
      console.log('🧠 Query understanding:', understanding);

      // Generate and execute SQL with enhanced context
      const queryResults = await this.generateAndExecuteSQLEnhanced(query);
      const rowCount = Array.isArray(queryResults) ? queryResults.length : 1;
      
      console.log(`📊 Retrieved ${rowCount} rows`);

      // Get conversation context
      const history = await this.getConversationHistory(sessionId, 5);
      const contextStr = history.length > 0 
        ? `\n\nConversation context:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}`
        : '';

      // Generate answer with full context
      const answerPrompt = `
You are a helpful database assistant. Answer based on the query results and conversation context.

Query intent: ${understanding.intent}
Entities mentioned: ${understanding.entities.join(', ')}
${understanding.timeframe ? `Timeframe: ${understanding.timeframe}` : ''}

Data retrieved (${rowCount} records):
${JSON.stringify(queryResults, null, 2)}

${contextStr}

User question: ${query}

Instructions:
- Be specific and clear
- If there are results, describe them naturally
- If no results, explain clearly
- Use numbers and details from the data
- Keep responses concise but informative

Your answer:
`;

      const response = await this.llm.invoke(answerPrompt);
      const answer = response.content as string;

      // Add to history
      this.addToHistory(sessionId, 'assistant', answer);

      console.log('✅ Answer generated\n');

      return {
        answer,
        data: queryResults,
        rowCount,
        intent: understanding.intent,
        entities: understanding.entities,
        type: 'database_query',
      };
    } catch (error: any) {
      console.error('❌ Error in chat:', error);
      
      const errorAnswer = `I encountered an error: ${error.message}. Please try rephrasing your question.`;
      this.addToHistory(sessionId, 'assistant', errorAnswer);
      
      return {
        answer: errorAnswer,
        error: error.message,
        type: 'error',
      };
    }
  }

  // ============ FOLLOW-UP QUESTION HANDLER ============
  
  private async detectFollowUp(query: string, history: ChatMessage[]): Promise<boolean> {
    const followUpPatterns = [
      /^(what about|how about|and|also|more|show me)/i,
      /^(who|when|where|why|how)\s/i,
      /(them|those|that|it|this)/i,
    ];

    return followUpPatterns.some(pattern => pattern.test(query.trim()));
  }

  private async enhanceWithContext(
    query: string, 
    history: ChatMessage[]
  ): Promise<string> {
    const recentContext = history.slice(-4).map(h => h.content).join('\n');
    
    const enhancePrompt = `
Given this conversation history:
${recentContext}

The user now asks: "${query}"

If this is a follow-up question referencing previous context, rewrite it as a complete standalone question.
If it's already complete, return it as-is.

Return ONLY the rewritten/original question, nothing else.
`;

    try {
      const response = await this.llm.invoke(enhancePrompt);
      return response.content as string;
    } catch (error) {
      return query;
    }
  }

  async chatWithFollowUp(query: string, sessionId: string) {
    const history = await this.getConversationHistory(sessionId, 10);
    
    if (history.length < 2) {
      return await this.chat(query, sessionId);
    }

    const isFollowUp = await this.detectFollowUp(query, history);
    
    if (isFollowUp) {
      console.log('🔄 Detected follow-up question');
      const contextualQuery = await this.enhanceWithContext(query, history);
      console.log('📝 Enhanced query:', contextualQuery);
      return await this.chat(contextualQuery, sessionId);
    }

    return await this.chat(query, sessionId);
  }

  // ============ EXPORT RESULTS ============
  
  async exportResults(sessionId: string, format: 'json' | 'csv'): Promise<string> {
    const history = await this.getConversationHistory(sessionId);
    
    if (format === 'json') {
      return JSON.stringify(history, null, 2);
    }
    
    // CSV format
    const csv = history.map(h => 
      `"${h.timestamp}","${h.role}","${h.content.replace(/"/g, '""')}"`
    ).join('\n');
    
    return `"timestamp","role","content"\n${csv}`;
  }

  // ============ HEALTH CHECK ============
  
  async getStatus(): Promise<{
    database: string;
    llm: string;
    sessions: number;
  }> {
    let dbStatus = 'disconnected';
    
    try {
      await this.ensureDbReady();
      dbStatus = 'connected';
    } catch {
      dbStatus = 'failed';
    }

    return {
      database: dbStatus,
      llm: 'ready',
      sessions: this.conversationHistory.size,
    };
  }

  // ============ CLEANUP ============
  
  async cleanup() {
    if (this.datasource && this.datasource.isInitialized) {
      await this.datasource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}