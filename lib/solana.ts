import { Connection, PublicKey, SystemProgram, VersionedMessage, MessageV0, Message, MessageCompiledInstruction, CompiledInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAccount, getMint } from '@solana/spl-token';

export const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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
        // Parse metadata manually since we don't have access to the full Metaplex SDK
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

    for (const { account, pubkey } of tokenAccounts) {
      const tokenAccount = await getAccount(connection, pubkey);
      totalSupply += tokenAccount.amount;
      if (tokenAccount.amount > 0n) {
        holders.add(tokenAccount.owner.toBase58());
      }
    }

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
        const signature = logs.signature;
        const tx = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (tx) {
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

          const transactionInfo: TransactionInfo = {
            signature,
            slot: tx.slot,
            timestamp: tx.blockTime || 0,
            status: 'success',
            type,
            fee: (tx.meta?.fee || 0) / 1e9,
            signer: accountKeys.get(0)!.toBase58(),
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