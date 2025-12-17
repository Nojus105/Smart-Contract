# Freelance Escrow DApp - Quick Start Guide

## 🚀 Fastest Way to Get Started (5 minutes)

### 1. Install Everything

```bash
# Project root - install Truffle dependencies
npm install

# Client - install React dependencies
cd client && npm install && cd ..
```

### 2. Start Ganache

**Download Ganache**: https://trufflesuite.com/ganache/

- Create new Ethereum workspace
- Port: 7545
- Copy the mnemonic phrase

### 3. Setup Environment

```bash
# Create .env file
cp .env.example .env
```

Edit `.env` and paste your Ganache mnemonic:
```
MNEMONIC="your ganache mnemonic here"
```

### 4. Compile and Deploy

```bash
# Compile contracts
npm run compile

# Deploy to local Ganache
npm run migrate:dev
```

**IMPORTANT**: Copy the deployed contract address from the output!

### 5. Configure Frontend

Open `client/src/context/Web3Context.jsx` and update line 21:

```javascript
const CONTRACT_ADDRESS = '0xYourContractAddressHere'
```

### 6. Copy ABI to Frontend

```bash
cp build/contracts/FreelanceEscrow.json client/src/contracts/
```

### 7. Setup MetaMask

1. Install MetaMask browser extension
2. Add Ganache network:
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency: `ETH`
3. Import an account using private key from Ganache

### 8. Run the DApp

```bash
cd client
npm run dev
```

Open http://localhost:5173

### 9. Test the Application

1. **Connect Wallet** - Click "Connect Wallet" button
2. **Create Project**:
   - Go to "Create Project"
   - Freelancer address: Use second Ganache address
   - Arbiter address: Use third Ganache address
   - Add project details and milestones
   - Click "Create & Fund Project"
3. **Switch MetaMask account** to freelancer address
4. **Submit milestone work**
5. **Switch back** to client address
6. **Approve milestone**

---

## 📋 Quick Commands Reference

```bash
# Compile contracts
npm run compile

# Deploy to Ganache
npm run migrate:dev

# Deploy to Sepolia testnet
npm run migrate:sepolia

# Run tests
npm test

# Run DApp
cd client && npm run dev

# Build DApp for production
cd client && npm run build
```

---

## 🎯 Project Structure Quick Reference

```
Smart-Contract/
├── contracts/                    # Solidity smart contracts
│   └── FreelanceEscrow.sol      # Main contract
├── migrations/                   # Deployment scripts
├── test/                        # Contract tests
├── client/                      # React DApp
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── context/            # Web3 context
│   │   └── contracts/          # Contract ABIs
│   └── package.json
├── truffle-config.js           # Truffle configuration
├── package.json                # Project dependencies
└── README.md                   # Full documentation
```

---

## 🔥 Common Issues and Quick Fixes

### Issue: "Cannot find module '@truffle/hdwallet-provider'"
**Fix**: 
```bash
npm install
```

### Issue: "Invalid contract address" in DApp
**Fix**: 
1. Check you updated `CONTRACT_ADDRESS` in `Web3Context.jsx`
2. Make sure contract is deployed: `npm run migrate:dev`

### Issue: "Insufficient funds" error
**Fix**: 
- Import Ganache account into MetaMask using private key
- Make sure you're on Ganache network in MetaMask

### Issue: ABI errors in DApp
**Fix**: 
```bash
cp build/contracts/FreelanceEscrow.json client/src/contracts/
```

### Issue: Can't connect wallet
**Fix**:
1. Install MetaMask extension
2. Add Ganache network to MetaMask
3. Import account from Ganache

---

## 📊 Testing Accounts Setup

For testing, use these Ganache accounts with different roles:

- **Account 0**: Client (creates projects)
- **Account 1**: Freelancer (submits work)
- **Account 2**: Arbiter (resolves disputes)

Switch between accounts in MetaMask to test different roles.

---

## 🌐 Deploying to Sepolia Testnet

1. Get Sepolia ETH from faucet: https://sepoliafaucet.com/
2. Add your wallet mnemonic to `.env`
3. Get Infura API key: https://infura.io/
4. Deploy: `npm run migrate:sepolia`
5. Verify on Etherscan: `npm run verify`

See [SETUP.md](./SETUP.md) for detailed instructions.

---

## 📚 Key Features Implemented

✅ **Smart Contract**:
- Multi-party escrow (Client, Freelancer, Arbiter)
- Milestone-based payments
- Dispute resolution mechanism
- Auto-approval after 7 days
- 2% arbiter fee

✅ **DApp Features**:
- MetaMask integration
- Project creation with multiple milestones
- Dashboard with statistics
- Project management (submit, approve, dispute)
- Arbiter panel for dispute resolution
- Dark/Light theme
- Responsive design
- Real-time updates

---

## 🎓 For Grading/Presentation

### What to Show:

1. **README.md** - Business model, sequence diagrams
2. **Smart Contract** - [contracts/FreelanceEscrow.sol](contracts/FreelanceEscrow.sol)
3. **Local Test** - Working DApp on Ganache
4. **Sepolia Deployment** - Contract on testnet
5. **Etherscan** - Verified contract and transactions
6. **DApp Demo** - Full workflow demonstration

### Key Points to Highlight:

- ✨ Unique business model (not the example one)
- 🔒 Security features (access control, validation)
- 💰 Escrow and payment automation
- ⚖️ Dispute resolution mechanism
- 🎨 Advanced UI with dark mode, responsive design
- 📱 Real-time blockchain interaction
- 🧪 Comprehensive testing

---

## 💡 Tips for Maximum Points

- [ ] Test all scenarios thoroughly
- [ ] Take screenshots of working DApp
- [ ] Document any issues encountered
- [ ] Prepare demo script
- [ ] Have Etherscan transactions ready
- [ ] Explain security measures
- [ ] Show sequence diagram understanding

---

## 📞 Need Help?

1. Check [README.md](./README.md) for detailed documentation
2. Check [SETUP.md](./SETUP.md) for step-by-step setup
3. Review Solidity code comments
4. Check browser console for errors
5. Check Ganache logs for transactions

---

## 🎉 Success Checklist

- [ ] Ganache running
- [ ] Contracts compiled
- [ ] Contracts deployed locally
- [ ] MetaMask configured
- [ ] DApp running at localhost:5173
- [ ] Wallet connected
- [ ] Can create projects
- [ ] Can submit milestones
- [ ] Can approve/dispute
- [ ] Arbiter can resolve disputes
- [ ] Deployed to Sepolia (optional for testing)
- [ ] Contract verified on Etherscan (optional)

---

**Good luck with your project! You have everything needed for maximum points (4.5 balai)! 🚀**
