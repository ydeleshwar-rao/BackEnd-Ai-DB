import { Request, Response } from 'express';
import { AIServiceEnhanced } from './ai.service';
import { v4 as uuidv4 } from 'uuid';

const aiService = new AIServiceEnhanced();

export class AIController {

  // Health check endpoint
  status = async (req: Request, res: Response) => {
    try {
      const status = await aiService.getStatus();

      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Main chat endpoint with enhanced features
  chat = async (req: Request, res: Response) => {
    try {
      const { query, sessionId } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required',
        });
      }

      const session = sessionId || uuidv4();
      
      // Use enhanced chat with schema hints and context
      const result = await aiService.chat(query, session);

      return res.status(200).json({
        success: true,
        data: {
          ...result,
          sessionId: session,
        },
      });
    } catch (error: any) {
      console.error('Controller error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Chat with follow-up detection
  chatFollowUp = async (req: Request, res: Response) => {
    try {
      const { query, sessionId } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required',
        });
      }

      const session = sessionId || uuidv4();
      
      // Use follow-up aware chat
      const result = await aiService.chatWithFollowUp(query, session);

      return res.status(200).json({
        success: true,
        data: {
          ...result,
          sessionId: session,
        },
      });
    } catch (error: any) {
      console.error('Controller error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Get conversation history
  getHistory = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const history = await aiService.getConversationHistory(sessionId, limit);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Export conversation history
  exportHistory = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const format = (req.query.format as string) || 'json';

      if (format !== 'json' && format !== 'csv') {
        return res.status(400).json({
          success: false,
          message: 'Format must be json or csv',
        });
      }

      const exported = await aiService.exportResults(sessionId, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=conversation-${sessionId}.csv`);
        return res.send(exported);
      }

      return res.status(200).json({
        success: true,
        data: JSON.parse(exported),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Clear specific session history
  clearHistory = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      await aiService.clearHistory(sessionId);

      return res.status(200).json({
        success: true,
        message: 'History cleared successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Clear all caches (admin endpoint)
  clearCaches = async (req: Request, res: Response) => {
    try {
      aiService.clearAllCaches();

      return res.status(200).json({
        success: true,
        message: 'All caches cleared',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}

export const aiController = new AIController();