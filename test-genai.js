require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: []
    });
    const res = await chat.sendMessage({ message: 'Hello!' });
    console.log('Success:', res.text);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
