import { Connection, PublicKey, SystemProgram, VersionedMessage, MessageV0, Message, MessageCompiledInstruction, CompiledInstruction, Commitment } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAccount, getMint } from '@solana/spl-token';

const RPC_URL = 'https://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';
const WS_URL = 'wss://solana-mainnet.core.chainstack.com/263c9f53f4e4cdb897c0edc4a64cd007';

export const connection = new Connection(RPC_URL, {
  wsEndpoint: WS_URL,
  commitment: 'confirmed'
});

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function measureRPCLatency(): Promise<number> {
  const start = typeof window !== 'undefined' ? window.performance.now() : Date.now();
  try {
    await connection.getLatestBlockhash();
    return (typeof window !== 'undefined' ? window.performance.now() : Date.now()) - start;
  } catch (error) {
    console.error('Error measuring RPC latency:', error);
    return 0;
  }
}

export async function getRPCLatency(): Promise<number> {
  const measurements = await Promise.all([
    measureRPCLatency(),
    measureRPCLatency(),
    measureRPCLatency()
  ]);
  
  const validMeasurements = measurements.filter(m => m > 0);
  if (validMeasurements.length === 0) return 0;
  
  return Math.round(validMeasurements.reduce((a, b) => a + b, 0) / validMeasurements.length);
}

function getInstructions(message: VersionedMessage | Message) {
  if ('compiledInstructions' in message) {
    return (message as MessageV0).compiledInstructions;
  }
  return (message as Message).instructions;
}

function getProgramId(instruction: MessageCompiledInstruction | CompiledInstruction): number {
  if ('programIdIndex' in instruction && typeof instruction.programIdIndex === 'number') {
    return instruction.programIdIndex;
  }
  throw new Error('Invalid instruction type');
}

function getAccounts(instruction: MessageCompiledInstruction | CompiledInstruction) {
  if ('accountKeyIndexes' in instruction) {
    return instruction.accountKeyIndexes;
  }
  return instruction.accounts;
}

export interface Block {
  slot: number;
  timestamp: number | null;
}

export async function getInitialBlocks(): Promise<Block[]> {
  const currentSlot = await connection.getSlot();
  const slots = Array.from({ length: 10 }, (_, i) => currentSlot - i);
  
  // Get all block times in a single batch request
  const timestamps = await connection.getBlockTime(currentSlot);
  
  return slots.map((slot, index) => ({
    slot,
    // Approximate timestamps by subtracting ~0.4s per block from current block time
    timestamp: timestamps ? Math.floor(timestamps - (index * 0.4)) : null
  }));
}

export function subscribeToBlocks(callback: (block: Block) => void) {
  const subscriptionId = connection.onSlotUpdate(async (slotUpdate) => {
    if (slotUpdate.type === 'completed' || slotUpdate.type === 'frozen') {
      callback({ 
        slot: slotUpdate.slot,
        timestamp: Math.floor(Date.now() / 1000) // Use current timestamp instead of making RPC call
      });
    }
  });

  return () => {
    connection.removeSlotUpdateListener(subscriptionId);
  };
}

export async function getBlockDetails(slot: number) {
  try {
    const block = await connection.getBlock(slot);

    if (!block) {
      return null;
    }

    return {
      slot,
      timestamp: block.blockTime,
      blockhash: block.blockhash,
      parentSlot: block.parentSlot,
      transactions: block.transactions.length,
      previousBlockhash: block.previousBlockhash,
    };
  } catch (error) {
    console.error('Error fetching block details:', error);
    return null;
  }
}

export async function getTokenInfo(mintAddress: string) {
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const [mint, tokenAccounts] = await Promise.all([
      getMint(connection, mintPublicKey),
      connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: mintPublicKey.toBase58(),
            },
          },
        ],
      }),
    ]);

    // Get metadata
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    let metadata: any = null;
    try {
      const metadataAccount = await connection.getAccountInfo(metadataPda);
      if (metadataAccount) {
        const name = metadataAccount.data.slice(1, 33).toString().replace(/\0/g, '');
        const symbol = metadataAccount.data.slice(33, 65).toString().replace(/\0/g, '');
        const uri = metadataAccount.data.slice(65, 200).toString().replace(/\0/g, '');
        metadata = { name, symbol, uri };
      }
    } catch (e) {
      console.error('Failed to fetch metadata:', e);
    }

    // Calculate total supply and holders
    let totalSupply = 0n;
    const holders = new Set<string>();

    // Get all token accounts in a single batch request
    const accountKeys = tokenAccounts.map(({ pubkey }) => pubkey);
    const accounts = await connection.getMultipleAccountsInfo(accountKeys);

    accounts.forEach((account, i) => {
      if (account) {
        try {
          const tokenAccount = deserializeTokenAccount(account);
          if (tokenAccount) {
            totalSupply += tokenAccount.amount;
            if (tokenAccount.amount > 0n) {
              holders.add(tokenAccount.owner.toBase58());
            }
          }
        } catch (e) {
          console.error('Error parsing token account:', e);
        }
      }
    });

    return {
      decimals: mint.decimals,
      supply: Number(totalSupply),
      holders: holders.size,
      metadata: metadata ? {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        description: '',
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      } : null,
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

// Helper function to deserialize token account data
function deserializeTokenAccount(account: { data: Buffer }) {
  // Basic deserialization of SPL Token Account data
  // This is a simplified version - you might want to use the actual SPL Token library
  const owner = new PublicKey(account.data.slice(32, 64));
  const amount = account.data.slice(64, 72).readBigUInt64LE(0);
  return { owner, amount };
}

export interface TransactionInfo {
  signature: string;
  slot: number;
  timestamp: number;
  status: 'success' | 'error';
  type: string;
  fee: number;
  signer: string;
  from: string;
  to: string;
  amount: number;
}

export async function getAccountInfo(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      return null;
    }

    return {
      address,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toBase58(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch,
      data: accountInfo.data,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
}

export async function getTransactionHistory(address: string, limit = 10) {
  try {
    const publicKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
    
    const transactions: TransactionInfo[] = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (!tx) return null;

        // Extract from and to addresses from the first transfer instruction
        const accountKeys = tx.transaction.message.getAccountKeys();
        let from = accountKeys.get(0)!.toBase58();
        let to = from;
        let amount = 0;
        let type = 'Unknown';

        // Try to determine transaction type and extract transfer details
        const instructions = getInstructions(tx.transaction.message);

        if (tx.meta && instructions.length > 0) {
          const instruction = instructions[0];
          const program = accountKeys.get(getProgramId(instruction));
          
          if (program?.equals(SystemProgram.programId)) {
            type = 'System Transfer';
            if (instruction.data.length >= 8) {
              // Convert data to Buffer if it's a string
              const dataBuffer = Buffer.from(instruction.data);
              // Assuming it's a transfer instruction
              amount = Number(dataBuffer.readBigInt64LE(8)) / 1e9;
              const accounts = getAccounts(instruction);
              from = accountKeys.get(accounts[0])!.toBase58();
              to = accountKeys.get(accounts[1])!.toBase58();
            }
          } else if (program?.equals(TOKEN_PROGRAM_ID)) {
            type = 'Token Transfer';
            // Add token transfer parsing logic here if needed
          }
        }

        return {
          signature: sig.signature,
          slot: sig.slot,
          timestamp: sig.blockTime || 0,
          status: sig.err ? 'error' : 'success',
          type,
          fee: (tx.meta?.fee || 0) / 1e9,
          signer: accountKeys.get(0)!.toBase58(),
          from,
          to,
          amount,
        };
      })
    );

    return transactions.filter((tx): tx is TransactionInfo => tx !== null);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

export interface DetailedTransactionInfo {
  signature: string;
  slot: number;
  blockTime: number | null;
  status: 'success' | 'error';
  fee: number;
  from: string;
  to: string;
  amount: number;
  type: string;
  computeUnits: number;
  accounts: string[];
  instructions: {
    programId: string;
    data: string;
  }[];
  logs: string[];
}

export async function getTransactionDetails(signature: string): Promise<DetailedTransactionInfo | null> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return null;
    }

    // Extract from and to addresses from the first transfer instruction
    const accountKeys = tx.transaction.message.getAccountKeys();
    let from = accountKeys.get(0)!.toBase58();
    let to = from;
    let amount = 0;
    let type = 'Unknown';

    // Try to determine transaction type and extract transfer details
    const instructions = getInstructions(tx.transaction.message);

    if (tx.meta && instructions.length > 0) {
      const instruction = instructions[0];
      const program = accountKeys.get(getProgramId(instruction));
      
      if (program?.equals(SystemProgram.programId)) {
        type = 'System Transfer';
        if (instruction.data.length >= 8) {
          // Convert data to Buffer if it's a string
          const dataBuffer = Buffer.from(instruction.data);
          // Assuming it's a transfer instruction
          amount = Number(dataBuffer.readBigInt64LE(8)) / 1e9;
          const accounts = getAccounts(instruction);
          from = accountKeys.get(accounts[0])!.toBase58();
          to = accountKeys.get(accounts[1])!.toBase58();
        }
      } else if (program?.equals(TOKEN_PROGRAM_ID)) {
        type = 'Token Transfer';
        // Add token transfer parsing logic here if needed
      }
    }

    return {
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime,
      status: tx.meta?.err ? 'error' : 'success',
      fee: (tx.meta?.fee || 0) / 1e9,
      from,
      to,
      amount,
      type,
      computeUnits: tx.meta?.computeUnitsConsumed || 0,
      accounts: accountKeys.staticAccountKeys.map(key => key.toBase58()),
      instructions: instructions.map(ix => ({
        programId: accountKeys.get(getProgramId(ix))!.toBase58(),
        data: ix.data.toString('base64'),
      })),
      logs: tx.meta?.logMessages || [],
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null;
  }
}

export async function getInitialTransactions(limit = 10): Promise<TransactionInfo[]> {
  try {
    const signatures = await connection.getSignaturesForAddress(SystemProgram.programId, { limit });
    
    const transactions: TransactionInfo[] = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (!tx) return null;

        // Extract from and to addresses from the first transfer instruction
        const accountKeys = tx.transaction.message.getAccountKeys();
        let from = accountKeys.get(0)!.toBase58();
        let to = from;
        let amount = 0;
        let type = 'Unknown';

        // Try to determine transaction type and extract transfer details
        const instructions = getInstructions(tx.transaction.message);

        if (tx.meta && instructions.length > 0) {
          const instruction = instructions[0];
          const program = accountKeys.get(getProgramId(instruction));
          
          if (program?.equals(SystemProgram.programId)) {
            type = 'System Transfer';
            if (instruction.data.length >= 8) {
              // Convert data to Buffer if it's a string
              const dataBuffer = Buffer.from(instruction.data);
              // Assuming it's a transfer instruction
              amount = Number(dataBuffer.readBigInt64LE(8)) / 1e9;
              const accounts = getAccounts(instruction);
              from = accountKeys.get(accounts[0])!.toBase58();
              to = accountKeys.get(accounts[1])!.toBase58();
            }
          } else if (program?.equals(TOKEN_PROGRAM_ID)) {
            type = 'Token Transfer';
            // Add token transfer parsing logic here if needed
          }
        }

        return {
          signature: sig.signature,
          slot: sig.slot,
          timestamp: sig.blockTime || 0,
          status: sig.err ? 'error' : 'success',
          type,
          fee: (tx.meta?.fee || 0) / 1e9,
          signer: accountKeys.get(0)!.toBase58(),
          from,
          to,
          amount,
        };
      })
    );

    return transactions.filter((tx): tx is TransactionInfo => tx !== null);
  } catch (error) {
    console.error('Error fetching initial transactions:', error);
    return [];
  }
}

export function subscribeToTransactions(callback: (tx: TransactionInfo) => void): () => void {
  const id = connection.onLogs(SystemProgram.programId, async (logs) => {
    if (!logs.err) {
      try {
        // Parse transaction info directly from logs instead of fetching the full transaction
        const signature = logs.signature;
        const currentSlot = await connection.getSlot();
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Only process if it looks like a SOL transfer (contains 'Program: System Program' and 'transfer')
        if (logs.logs.some(log => log.includes('Program: System Program')) && 
            logs.logs.some(log => log.includes('transfer'))) {
          
          // Try to extract from/to addresses from logs
          const transferLog = logs.logs.find(log => log.includes('transfer'));
          let from = '';
          let to = '';
          let amount = 0;
          
          if (transferLog) {
            const matches = transferLog.match(/transfer: (.+) lamports from (.+) to (.+)/);
            if (matches) {
              amount = parseInt(matches[1]) / 1e9;
              from = matches[2];
              to = matches[3];
            }
          }

          const transactionInfo: TransactionInfo = {
            signature,
            slot: currentSlot,
            timestamp,
            status: 'success',
            type: 'System Transfer',
            fee: 0.000005, // Use average fee as approximation
            signer: from,
            from,
            to,
            amount,
          };
          
          callback(transactionInfo);
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    }
  });

  return () => {
    connection.removeOnLogsListener(id);
  };
}

let ws: WebSocket | null = null;
let subscriptionCounter = 0;
const subscriptions = new Map<number, {
  type: string;
  callback: (data: any) => void;
}>();

function getWebSocket(): WebSocket {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Resubscribe to all active subscriptions
      subscriptions.forEach((sub, id) => {
        sendSubscription(sub.type, id);
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.params?.subscription !== undefined) {
          const subscription = subscriptions.get(data.params.subscription);
          if (subscription) {
            subscription.callback(data.params.result);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed, will reconnect in 3s...');
      setTimeout(() => getWebSocket(), 3000);
    };
  }
  return ws;
}

function sendSubscription(method: string, id: number) {
  const ws = getWebSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params: ['confirmed']
    }));
  }
}

export function subscribeToBlockUpdates(callback: (data: any) => void): () => void {
  const id = ++subscriptionCounter;
  subscriptions.set(id, {
    type: 'slotSubscribe',
    callback
  });

  sendSubscription('slotSubscribe', id);

  return () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'slotUnsubscribe',
        params: [id]
      }));
    }
    subscriptions.delete(id);
  };
}

export function subscribeToTransactionUpdates(callback: (data: any) => void): () => void {
  const id = ++subscriptionCounter;
  subscriptions.set(id, {
    type: 'signatureSubscribe',
    callback
  });

  sendSubscription('signatureSubscribe', id);

  return () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'signatureUnsubscribe',
        params: [id]
      }));
    }
    subscriptions.delete(id);
  };
}

export function subscribeToAccountUpdates(address: string, callback: (data: any) => void): () => void {
  const id = ++subscriptionCounter;
  subscriptions.set(id, {
    type: 'accountSubscribe',
    callback
  });

  const ws = getWebSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'accountSubscribe',
      params: [
        address,
        {
          encoding: 'base64',
          commitment: 'confirmed'
        }
      ]
    }));
  }

  return () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'accountUnsubscribe',
        params: [id]
      }));
    }
    subscriptions.delete(id);
  };
}

export function subscribeToProgramUpdates(programId: string, callback: (data: any) => void): () => void {
  const id = ++subscriptionCounter;
  subscriptions.set(id, {
    type: 'programSubscribe',
    callback
  });

  const ws = getWebSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'programSubscribe',
      params: [
        programId,
        {
          encoding: 'base64',
          commitment: 'confirmed',
          filters: []
        }
      ]
    }));
  }

  return () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'programUnsubscribe',
        params: [id]
      }));
    }
    subscriptions.delete(id);
  };
}

// Example usage of the new subscriptions:
export function subscribeToAllUpdates() {
  // Subscribe to block updates
  const blockUnsubscribe = subscribeToBlockUpdates((data) => {
    console.log('Block update:', data);
  });

  // Subscribe to System Program updates
  const programUnsubscribe = subscribeToProgramUpdates(SystemProgram.programId.toBase58(), (data) => {
    console.log('System Program update:', data);
  });

  // Return cleanup function
  return () => {
    blockUnsubscribe();
    programUnsubscribe();
  };
} 