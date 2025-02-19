import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';
import type { Message } from '../components/ChatBot/types';

const genAI = new GoogleGenerativeAI('AIzaSyDjyNa6vjyTv7UzFWbyaR10efZrhvmsf8o');

export async function analyzePrediction(
  input: string,
  history: Message[]
): Promise<{ response: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build context from history
    const context = history
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `
      Tu es un assistant spécialisé dans le football qui aide les utilisateurs à analyser les matchs, les statistiques et les probabilités.
      
      Historique de la conversation:
      ${context}
      
      Question de l'utilisateur:
      ${input}
      
      Réponds de manière détaillée en incluant:
      - Des statistiques pertinentes
      - Des pourcentages de probabilité quand c'est approprié
      - Des tendances et formes actuelles
      - Des prédictions basées sur les données historiques
      
      Format ta réponse de manière claire et structurée.
    `;

    // Add safety check for model response
    const result = await model.generateContent(prompt);
    if (!result || !result.response) {
      throw new Error('Invalid response from Gemini');
    }

    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return { response: text };
  } catch (error) {
    logger.error('Gemini', 'Error generating response', error);
    throw new Error('Failed to generate response. Please try again.');
  }
}