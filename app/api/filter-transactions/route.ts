import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Invalid transactions data' },
        { status: 400 }
      );
    }

    // Prepare transaction data for AI analysis
    const transactionSummary = transactions.map(tx => ({
      id: tx.txId || tx.signature,
      from: tx.from,
      to: tx.to,
      amount: tx.tokenAmount,
      token: tx.tokenSymbol,
      type: tx.transferType
    }));

    const prompt = `Analyze these SPL token transactions and filter out spam/irrelevant transactions. Return a JSON array with only the transaction IDs that are legitimate and relevant (not spam, bot activity, or micro-transactions).

Transactions to analyze:
${JSON.stringify(transactionSummary, null, 2)}

Criteria for filtering:
1. Remove transactions with amounts < 0.001 tokens (likely spam/dust)
2. Remove transactions to/from known spam addresses
3. Remove repetitive bot-like patterns
4. Keep legitimate transfers, swaps, and meaningful token movements
5. Keep transactions with significant amounts or unique patterns

Return only a JSON array of transaction IDs that should be kept, like: ["txId1", "txId2", ...]`;

    // Use GPT-4.1-nano or similar model for analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using available model instead of non-existent gpt-4.1-nano
        messages: [
          {
            role: 'system',
            content: 'You are a Solana transaction analyzer. Respond only with valid JSON arrays of transaction IDs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      // Fallback: if AI analysis fails, apply basic filtering
      const basicFiltered = transactions.filter(tx => {
        const amount = parseFloat(tx.tokenAmount || '0');
        return amount >= 0.001; // Remove micro-transactions
      });
      
      return NextResponse.json({ 
        filteredTransactions: basicFiltered,
        aiAnalysis: false,
        fallback: true
      });
    }

    const data = await response.json();
    let validTxIds: string[] = [];
    
    try {
      const aiResponse = JSON.parse(data.choices[0].message.content);
      validTxIds = aiResponse.validTransactions || aiResponse;
    } catch (parseError) {
      console.warn('Failed to parse AI response, using fallback filtering');
      const basicFiltered = transactions.filter(tx => {
        const amount = parseFloat(tx.tokenAmount || '0');
        return amount >= 0.001;
      });
      
      return NextResponse.json({ 
        filteredTransactions: basicFiltered,
        aiAnalysis: false,
        fallback: true
      });
    }

    // Filter transactions based on AI analysis
    const filteredTransactions = transactions.filter(tx => 
      validTxIds.includes(tx.txId || tx.signature)
    );

    return NextResponse.json({ 
      filteredTransactions,
      aiAnalysis: true,
      originalCount: transactions.length,
      filteredCount: filteredTransactions.length
    });
  } catch (error) {
    console.error('Error filtering transactions:', error);
    
    // Fallback to basic filtering if anything fails
    try {
      const { transactions } = await request.json();
      const basicFiltered = transactions.filter(tx => {
        const amount = parseFloat(tx.tokenAmount || '0');
        return amount >= 0.001;
      });
      
      return NextResponse.json({ 
        filteredTransactions: basicFiltered,
        aiAnalysis: false,
        fallback: true,
        error: 'AI analysis failed, used basic filtering'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to filter transactions' },
        { status: 500 }
      );
    }
  }
}