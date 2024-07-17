"use client"; 
// pages/buy.js
import React, { useEffect, useState } from 'react';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { Connection, Keypair, ParsedAccountData, PublicKey, sendAndConfirmTransaction, Transaction, clusterApiUrl } from "@solana/web3.js";
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

const BuyPage = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const { publicKey, signTransaction, sendTransaction } = useWallet()

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const network = clusterApiUrl('devnet'); // Change to 'mainnet-beta' for mainnet
  
  const SOLANA_CONNECTION = new Connection(network, 'confirmed');
  const FROM_KEYPAIR  = Keypair.fromSecretKey(Uint8Array.from(
    [70,171,122,74,133,49,93,37,81,174,84,214,116,24,247,243,119,39,56,217,127,236,242,68,63,11,216,200,58,107,12,153,126,171,62,87,0,167,60,35,50,85,21,254,89,118,138,157,63,196,255,167,185,177,160,175,187,145,247,223,85,189,201,113]
  ));
  console.log(`My public key is: ${FROM_KEYPAIR .publicKey.toString()}.`);
  const DESTINATION_WALLET = '7uvJ5sgc8w1SgZDfTmuuJvWRrziQaDYPouPUnNLSCzzu'; 
  const MINT_ADDRESS = 'DppPugQt2K1TuF5SaPiV4d56o67qfU4cfEXJqk7DwzJb'; //You must change this value!
  // 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU usdc devnet
  const TRANSFER_AMOUNT = 1;

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      try {
        const { solana } = window;
        if (solana && solana.isPhantom) {
          const response = await solana.connect({ onlyIfTrusted: true });
          setWalletAddress(response.publicKey.toString());
        }
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    };
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (solana) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const manageUsers = async (actype, useraddress) => {
    if(actype == 1) {
      let item = JSON.parse(window.sessionStorage.getItem('useraddress'));
      const ret = item.push(useraddress);
      window.sessionStorage.setItem('useraddress', JSON.stringify(ret));
    }else {
      let item = JSON.parse(window.sessionStorage.getItem('useraddress'));
      const ret2 = item.slice(useraddress);
      window.sessionStorage.setItem('useraddress', JSON.stringify(ret));
    }
  }

 const getNumberDecimals = async() => {
  const info = await SOLANA_CONNECTION.getParsedAccountInfo(new PublicKey(MINT_ADDRESS));
  const result = (info.value?.data).parsed.info.decimals;
  return result;
 }

  const buyTokens = async () => {
    if (!amount) {
      alert('Please enter the amount of tokens you want to buy');
      return;
    }
    
    // if()
    try {
      console.log(`Sending ${TRANSFER_AMOUNT} ${new PublicKey(MINT_ADDRESS)} from ${(FROM_KEYPAIR.publicKey.toString())} to ${(DESTINATION_WALLET)}.`)
      //Step 1
      console.log(`1 - Getting Source Token Account`);
      let sourceAccount = await getOrCreateAssociatedTokenAccount(
          SOLANA_CONNECTION, 
          FROM_KEYPAIR,
          new PublicKey(MINT_ADDRESS),
          FROM_KEYPAIR.publicKey,
          signTransaction,
      );
      console.log(`    Source Account: ${sourceAccount.address.toString()}`);
      
          //Step 2
      console.log(`2 - Getting Destination Token Account`);
      let destinationAccount = await getOrCreateAssociatedTokenAccount(
          SOLANA_CONNECTION, 
          FROM_KEYPAIR,
          new PublicKey(MINT_ADDRESS),
          new PublicKey(DESTINATION_WALLET),
          signTransaction,
      );
      console.log(`    Destination Account: ${destinationAccount.address.toString()}`);

          //Step 3
      console.log(`3 - Fetching Number of Decimals for Mint: ${MINT_ADDRESS}`);
      const numberDecimals = await getNumberDecimals(MINT_ADDRESS);
      console.log(`    Number of Decimals: ${numberDecimals}`);
      
      //Step 4
      console.log(`4 - Creating and Sending Transaction`);
      const tx = new Transaction();
      tx.add(createTransferInstruction(
          // new PublicKey('Gd3VCCRBZtRSDLou3NyR9LzdsWRdAoGoV9iYhea6VsS2'),
          // new PublicKey('9GfUhbdNgDo352sMezKnY9bLwUkdDHmatDvw8wgmQJa8'),
          sourceAccount.address,
          destinationAccount.address,
          FROM_KEYPAIR.publicKey,
          TRANSFER_AMOUNT * Math.pow(10, numberDecimals)
      ))

      const latestBlockHash = await SOLANA_CONNECTION.getLatestBlockhash('confirmed');
      tx.recentBlockhash = await latestBlockHash.blockhash;    
      const signature = await sendAndConfirmTransaction(SOLANA_CONNECTION,tx,[FROM_KEYPAIR]);
      console.log(
          '\x1b[32m', //Green Text
          `   Transaction Success!🎉`,
          `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`
      );


      setMessage('Tokens purchased successfully!');
    } catch (error) {
      console.error('Transaction failed:', error);
      setMessage('Transaction failed: ' + error.message);
    }
  };

  return (
    <div className="container">
      <header>
        {!walletAddress ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <>
          <div>
            <h1>Buy Tokens</h1>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={buyTokens}>Buy Tokens</button>
            {message && <p>{message}</p>}
          </div>
          {/* <div>
            <input
                placeholder="Address"
                value={useraddress}
                onChange={(e) => setUseraddress(e.target.value)}
              />
              <button onClick={() => manageUsers(1, useraddress)}>Add Whitelist</button>
              <button onClick={() => manageUsers(2, useraddress)}>Remove Whitelist</button>
          </div> */}
          </>
        )}
      </header>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        header {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        input {
          margin: 5px;
          padding: 10px;
          width: 300px;
        }
        button {
          margin: 5px;
          padding: 10px;
          width: 150px;
          cursor: pointer;
        }
        p {
          color: green;
        }
      `}</style>
    </div>
  );
};

export default BuyPage;
