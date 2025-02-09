import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const QDRANT_URL =
  "https://5fd454be-2521-46ae-8e0f-a9a7319960a8.germanywestcentral-0.azure.cloud.qdrant.io:6333";
const QDRANT_API_KEY = "si2oUGJcAFita-a9rnieMb-gDEF92HO9F2dd8fYmpMLRfHM3FMb6Ng";

// Initialize Qdrant client
//const client = new QdrantClient({
//  url: QDRANT_URL,
//  apiKey: QDRANT_API_KEY,
//});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Solana proxy request:", {
      method: body.method,
      params: body.params,
    });

    // Try multiple RPC endpoints with rate limits
    const endpoints = ["https://api.mainnet-beta.solana.com"];

    // Add delay between retries
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    let lastError;
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await axios.post(
          endpoint,
          {
            jsonrpc: "2.0",
            id: 1,
            method: body.method,
            params: body.params,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            timeout: 10000,
          },
        );

        // Note: axios doesn't need response.ok check or response.text()
        console.log("Solana proxy response:", {
          endpoint,
          status: response.status,
          method: body.method,
        });

        const data = response.data;
        if (!data.error) {
          return NextResponse.json(data);
        }

        // If rate limited, add delay before next attempt
        if (response.status === 429 || data.error.code === -32005) {
          await delay(1000);
        }

        lastError = new Error(data.error.message || "Unknown RPC error");
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error("All RPC endpoints failed");
  } catch (error) {
    console.error("Solana proxy error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to proxy Solana RPC request",
        details:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Safely decode the URL and get transaction parameter
    console.log(request);
    const url = new URL(request.url);
    console.log(url);
    const transaction = url.searchParams.get("transaction");

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction parameter is required" },
        { status: 400 },
      );
    }

    // Validate transaction string format
    if (!/^[A-Za-z0-9]+$/.test(transaction)) {
      return NextResponse.json(
        { error: "Invalid transaction format" },
        { status: 400 },
      );
    }

    console.log("Processing transaction:", transaction);

    console.log("Solana proxy request:", {
      method: "getTransaction",
      params: [transaction, { maxSupportedTransactionVersion: 0 }],
    });

    // Try multiple RPC endpoints with rate limits
    const endpoints = ["https://api.mainnet-beta.solana.com"];

    // Add delay between retries
    const delay = (ms: number) => {
      console.log("Delaying for", ms, "ms");
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    let lastError;
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await axios.post(
          endpoint,
          {
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: [transaction, { maxSupportedTransactionVersion: 0 }],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            timeout: 10000,
          },
        );

        // Remove fetch-specific handling since axios handles it differently
        // clearTimeout(timeout); // Not needed with axios

        // Note: axios doesn't need response.ok check or response.text()
        console.log("Solana proxy response:", {
          endpoint,
          status: response.status,
          method: "getTransaction",
        });

        const data = response.data; // axios automatically parses JSON
        console.log(data);
        if (data.result.meta.err === null) {
          return NextResponse.json(data);
        }

        // If rate limited, add delay before next attempt
        if (response.status === 429 || data.error?.code === -32005) {
          await delay(1000);
        }

        lastError = new Error(data.error?.message || "Unknown RPC error");
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error("All RPC endpoints failed");
  } catch (error) {
    console.error("Solana proxy error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to proxy Solana RPC request",
        details:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      },
      { status: 500 },
    );
  }
}
