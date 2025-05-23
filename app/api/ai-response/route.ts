import { NextRequest, NextResponse } from 'next/server';
import { TogetherAI } from 'together-ai';
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

// Initialize Together AI client
// Note: In production, use environment variables for API keys
const together = new TogetherAI({
  apiKey: process.env.TOGETHER_AI_API_KEY || 'your-api-key-here',
});

// Define the model to use
const MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

export const runtime = 'edge';

// Function to extract potential sources from AI response
function extractSourcesFromText(text: string): { title: string, url: string }[] {
  const sources: { title: string, url: string }[] = [];
  
  // Default sources if none are extracted
  const defaultSources = [
    { title: 'Solana Documentation', url: 'https://docs.solana.com' },
    { title: 'Solana Explorer', url: 'https://explorer.solana.com' },
    { title: 'OpenSVM GitHub', url: 'https://github.com/aldrin-labs/opensvm' }
  ];
  
  // Try to extract URLs from the text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  if (matches && matches.length > 0) {
    // For each URL found, create a source entry
    matches.forEach(url => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const title = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        
        sources.push({
          title: `${title}`,
          url: url
        });
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
    });
    
    return sources.length > 0 ? sources : defaultSources;
  }
  
  // If no URLs found, check for source references in the text
  const sourceRegex = /(?:Source|Reference)s?:?\s*([^.]+)/gi;
  const sourceMatches = text.matchAll(sourceRegex);
  
  for (const match of sourceMatches) {
    if (match[1]) {
      const sourceText = match[1].trim();
      // Split by commas or newlines if multiple sources
      const sourceParts = sourceText.split(/,|\n/).map(part => part.trim()).filter(Boolean);
      
      sourceParts.forEach(part => {
        // Try to determine a URL based on the source name
        let url = '';
        if (part.toLowerCase().includes('solana')) {
          url = 'https://docs.solana.com';
        } else if (part.toLowerCase().includes('github')) {
          url = 'https://github.com/aldrin-labs/opensvm';
        } else if (part.toLowerCase().includes('explorer')) {
          url = 'https://explorer.solana.com';
        } else {
          url = `https://www.google.com/search?q=${encodeURIComponent(part)}`;
        }
        
        sources.push({
          title: part,
          url: url
        });
      });
    }
  }
  
  return sources.length > 0 ? sources : defaultSources;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Create a system prompt for blockchain and Solana-specific information
    const systemPrompt = `You are an AI assistant specialized in blockchain technology, particularly Solana. 
    Provide concise, accurate information about blockchain concepts, Solana programs, tokens, and transactions.
    When responding to queries, focus on technical accuracy and include relevant sources when possible.
    Format your response in clear paragraphs with bullet points for key information.
    At the end of your response, include a "Sources:" section with 2-3 relevant sources for the information provided.`;

    // Create a prompt that includes context about the search
    const prompt = `The user is searching for information related to: "${query}" on a Solana blockchain explorer.
    Provide relevant information about this query in the context of Solana blockchain.
    If it appears to be an address, token, or transaction, explain what it might be.
    If it's a general concept, explain how it relates to Solana.
    Include specific URLs or source names in your response that I can extract as citations.`;

    // Set up streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Store the complete response to extract sources at the end
    let completeResponse = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        // Function to handle streaming events
        function onParse(event: ParsedEvent | ReconnectInterval) {
          if (event.type === 'event') {
            const data = event.data;
            
            // Handle different event types
            try {
              const json = JSON.parse(data);
              
              if (json.choices?.[0]?.delta?.content) {
                const text = json.choices[0].delta.content;
                completeResponse += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              } else if (json.choices?.[0]?.finish_reason === 'stop') {
                // Extract sources from the complete response
                const sources = extractSourcesFromText(completeResponse);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`));
                controller.close();
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e);
              controller.error(e);
            }
          }
        }

        // Create parser for SSE
        const parser = createParser(onParse);
        
        // Call Together AI API with streaming
        try {
          const response = await together.chat.completions.create({
            model: MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
            stream: true,
          });
          
          // Process the streaming response
          if (response.body) {
            const reader = response.body.getReader();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Parse chunks as they arrive
              parser.feed(decoder.decode(value));
            }
          }
        } catch (error) {
          console.error('Error calling Together AI API:', error);
          controller.error(error);
        }
      }
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in AI response API:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
