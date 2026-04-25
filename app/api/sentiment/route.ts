// app/api/sentiment/route.ts (ya pages/api/sentiment.ts)
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // server pe safe hai
});

export async function POST(req: Request) {
  const { text } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a sentiment analysis bot. Respond with a single number -1 to 1.' },
      { role: 'user', content: text },
    ],
    max_tokens: 5,
  });
  console.log('OpenAI response:', response);

  const score = parseFloat(response.choices[0].message.content || '');
  return NextResponse.json({ score: isNaN(score) || score < -1 || score > 1 ? null : score });
}
