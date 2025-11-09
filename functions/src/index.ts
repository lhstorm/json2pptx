import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { PresentationGeneratorAgent } from "./agents/presentationAgent";

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Generate presentation from AI prompt
 */
export const generatePresentation = functions.https.onCall(async (data, context) => {
  // Validate authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { prompt, numSlides, style } = data;

  if (!prompt) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Prompt is required'
    );
  }

  try {
    const agent = new PresentationGeneratorAgent();
    const presentation = await agent.generatePresentation({
      prompt,
      numSlides,
      style,
    });

    return { presentation };
  } catch (error) {
    console.error('Error generating presentation:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate presentation',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

/**
 * AI Chat Editor - Edit content using natural language
 */
export const chatEdit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { command, context: slideContext, slideId } = data;

  if (!command || !slideContext) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Command and context are required'
    );
  }

  // TODO: Implement chat editor agent
  // For now, return a simple response
  return {
    success: true,
    message: 'Chat editor will be implemented soon',
  };
});

/**
 * HTTP function to keep compatibility with Next.js API route
 */
export const generatePresentationHTTP = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { prompt, numSlides, style } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const agent = new PresentationGeneratorAgent();
      const presentation = await agent.generatePresentation({
        prompt,
        numSlides,
        style,
      });

      res.status(200).json({ presentation });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        error: 'Failed to generate presentation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
