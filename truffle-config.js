const HDWalletProvider = require('@truffle/hdwallet-provider');
const ganache = require('ganache');
require('dotenv').config();

const ganacheProvider = ganache.provider({
  logging: { quiet: true },
  chain: { chainId: 1337, networkId: 1337 }
});

module.exports = {
  networks: {
    // In-memory chain for `truffle test`
    test: {
      provider: () => ganacheProvider,
      network_id: 1337
    },
    // Local development network (Ganache)
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 6721975,
      gasPrice: 20000000000
    },
    
    // Sepolia testnet configuration
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
      ),
      network_id: 11155111,
      gas: 4500000,
      gasPrice: 10000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  // Truffle DB settings (optional)
  db: {
    enabled: false
  }
};
