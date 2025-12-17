# Setup and Deployment Guide

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v16 or higher): https://nodejs.org/
- **npm** (comes with Node.js)
- **Git**: https://git-scm.com/
- **MetaMask**: https://metamask.io/ (browser extension)
- **Ganache** (optional, for local testing): https://trufflesuite.com/ganache/

## Step 1: Install Dependencies

### Backend (Smart Contract)

```bash
# Navigate to project root
cd Smart-Contract

# Install Truffle and dependencies
npm install
```

### Frontend (DApp)

```bash
# Navigate to client directory
cd client

# Install React dependencies
npm install
```

## Step 2: Local Development Setup

### Option A: Using Ganache GUI

1. Download and install Ganache from https://trufflesuite.com/ganache/
2. Create a new workspace (Ethereum)
3. Set RPC Server to `HTTP://127.0.0.1:7545`
4. Note down the mnemonic phrase for later use

### Option B: Using Ganache CLI

```bash
# Install Ganache CLI globally
npm install -g ganache

# Run Ganache
ganache --port 7545
```

## Step 3: Configure Environment

Create `.env` file in the project root:

```bash
# Copy example file
cp .env.example .env

# Edit .env with your details
```

Example `.env` contents:

```env
# For local development (from Ganache)
MNEMONIC="your twelve word mnemonic phrase from ganache goes here"

# For Sepolia testnet (get from Infura.io)
INFURA_API_KEY=your_infura_api_key_here

# For contract verification (get from Etherscan.io)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Getting Infura API Key

1. Go to https://infura.io/
2. Sign up for a free account
3. Create a new project
4. Copy the API key from project settings

### Getting Etherscan API Key

1. Go to https://etherscan.io/
2. Create an account
3. Go to API-KEYs page
4. Create a new API key

## Step 4: Compile Smart Contracts

```bash
# In project root
npm run compile

# Or using Truffle directly
truffle compile
```

You should see output indicating successful compilation.

## Step 5: Deploy to Local Network (Ganache)

```bash
# Make sure Ganache is running first!

# Deploy contracts
npm run migrate:dev

# Or
truffle migrate --network development
```

**Important**: Copy the deployed contract address from the output!

Example output:
```
2_deploy_contracts.js
=====================

   Deploying 'FreelanceEscrow'
   ---------------------------
   > contract address:    0x1234567890123456789012345678901234567890
   > transaction hash:    0xabcdef...
```

## Step 6: Configure Frontend with Contract Address

1. Open `client/src/context/Web3Context.jsx`
2. Find the line: `const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || '0x...'`
3. Replace `'0x...'` with your deployed contract address

OR create `client/.env`:

```env
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

## Step 7: Copy Contract ABI to Frontend

```bash
# Copy the ABI file
cp build/contracts/FreelanceEscrow.json client/src/contracts/
```

## Step 8: Configure MetaMask for Local Network

1. Open MetaMask
2. Click on network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network" → "Add a network manually"
4. Fill in:
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337` or `5777` (depends on your Ganache settings)
   - Currency Symbol: `ETH`
5. Click "Save"
6. Import an account from Ganache:
   - Click MetaMask account icon → "Import Account"
   - Paste private key from Ganache
   - You should now see test ETH balance

## Step 9: Run the DApp

```bash
# In client directory
cd client
npm run dev
```

The app should open at `http://localhost:5173`

## Step 10: Test the Application Locally

1. **Connect Wallet**: Click "Connect Wallet" in the navbar
2. **Create Project**:
   - Go to "Create Project"
   - Use different Ganache addresses for freelancer and arbiter
   - Add milestones
   - Fund the project
3. **Switch Accounts** in MetaMask to test different roles
4. **Submit Milestones** as freelancer
5. **Approve/Dispute** as client

---

## Deploying to Sepolia Testnet

### Step 1: Get Sepolia ETH

1. Go to https://sepoliafaucet.com/
2. Enter your wallet address
3. Complete the captcha and request test ETH
4. Wait for confirmation (can take a few minutes)

### Step 2: Update .env with Mainnet Wallet

**WARNING**: Never commit your real mnemonic to Git!

In `.env`:
```env
# Use a wallet with Sepolia ETH
MNEMONIC="your real wallet mnemonic goes here"
INFURA_API_KEY=your_infura_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
```

### Step 3: Deploy to Sepolia

```bash
# Deploy to Sepolia testnet
npm run migrate:sepolia

# Or
truffle migrate --network sepolia
```

This will take longer than local deployment. Note the contract address!

### Step 4: Verify Contract on Etherscan

```bash
npm run verify

# Or
truffle run verify FreelanceEscrow --network sepolia
```

### Step 5: Update Frontend for Sepolia

Update `client/src/context/Web3Context.jsx` with new contract address or update `client/.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourSepoliaContractAddress
```

### Step 6: Configure MetaMask for Sepolia

1. Open MetaMask
2. Select "Sepolia test network" from network dropdown
3. If not available, add it manually:
   - Network Name: `Sepolia`
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
   - Chain ID: `11155111`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.etherscan.io`

### Step 7: Test on Sepolia

1. Run the DApp: `cd client && npm run dev`
2. Connect wallet (make sure Sepolia network is selected)
3. Test the full workflow with real transactions on testnet

---

## Troubleshooting

### "Error: Insufficient funds"
- Make sure your wallet has enough ETH (for local: import Ganache account, for Sepolia: get from faucet)

### "Error: Invalid contract address"
- Verify you copied the correct contract address to `Web3Context.jsx`
- Make sure the contract is deployed on the network you're connected to

### "MetaMask - RPC Error: Invalid chainId"
- Reset MetaMask account: Settings → Advanced → Reset Account
- Make sure Ganache/Sepolia network is properly configured

### "Transaction failed"
- Check that you're calling functions from the correct account
- Verify you have enough ETH for gas fees
- Check contract events in console for error messages

### "Module not found" errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### ABI errors
- Make sure you copied the ABI file correctly:
  ```bash
  cp build/contracts/FreelanceEscrow.json client/src/contracts/
  ```

---

## Testing Smart Contracts

Run the test suite:

```bash
# Make sure Ganache is running

# Run all tests
npm test

# Or
truffle test

# Run specific test file
truffle test test/FreelanceEscrow.test.js
```

---

## Building for Production

```bash
# Build frontend
cd client
npm run build

# Output will be in client/dist/
```

Deploy the `dist` folder to:
- Vercel: https://vercel.com/
- Netlify: https://www.netlify.com/
- GitHub Pages: https://pages.github.com/

---

## Viewing on Etherscan

After deploying to Sepolia:

1. Go to https://sepolia.etherscan.io/
2. Enter your contract address in the search
3. View:
   - **Transactions**: All contract interactions
   - **Events**: Emitted events (ProjectCreated, MilestoneApproved, etc.)
   - **Contract**: Source code (if verified)
   - **Read Contract**: Query contract state
   - **Write Contract**: Call contract functions

---

## Important Security Notes

- ❌ **NEVER** commit `.env` file to Git
- ❌ **NEVER** share your mnemonic/private keys
- ❌ **NEVER** use testnet wallets with mainnet funds
- ✅ **ALWAYS** use separate wallets for testing
- ✅ **ALWAYS** verify contract code before deployment
- ✅ **ALWAYS** test thoroughly on testnet first

---

## Next Steps

1. ✅ Complete local testing
2. ✅ Deploy to Sepolia testnet
3. ✅ Verify contract on Etherscan
4. ✅ Test all functionality on testnet
5. ✅ Document all contract addresses
6. ✅ Take screenshots for documentation
7. ✅ Prepare presentation/report

Good luck with your project! 🚀
