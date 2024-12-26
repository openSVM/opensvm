import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { logs, type, status, amount, from, to } = await request.json();

    const prompt = `Analyze this Solana transaction:
Type: ${type}
Status: ${status}
Amount: ${amount} SOL
From: ${from}
To: ${to}

Transaction Logs:
${logs.join('\n')}

Please explain in simple terms what happened in this transaction, including:
1. What type of operation was performed
2. Whether it was successful
3. Any notable details from the logs
4. Potential purpose of the transaction`;

    const response = await fetch('https://api.together.xyz/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        prompt,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ['<human>', '<assistant>'],
      }),
    });

    if (!response.ok) {
      throw new Error('GPT API request failed');
    }

    const data = await response.json();
    return NextResponse.json({ analysis: data.output.choices[0].text.trim() });
  } catch (error) {
    console.error('Error analyzing transaction:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transaction' },
      { status: 500 }
    );
  }
} 