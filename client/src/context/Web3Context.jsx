import { createContext, useState, useEffect, useContext } from 'react'
import Web3 from 'web3'
import { toast } from 'react-toastify'
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json'

const Web3Context = createContext()

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider')
  }
  return context
}

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null)
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState(null)
  const [networkId, setNetworkId] = useState(null)
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // Contract address - use Vite env (import.meta.env) in browser builds
  // To override, create `client/.env` with `VITE_CONTRACT_ADDRESS=0x...`
  const CONTRACT_ADDRESS = import.meta?.env?.VITE_CONTRACT_ADDRESS || '0x3ed0245356818f09E559d464BB0D2641e8fE4fc5'

  const initWeb3 = async () => {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum)
        setWeb3(web3Instance)

        // Get network ID
        const netId = await web3Instance.eth.net.getId()
        setNetworkId(Number(netId))

        // Check if already connected
        const accounts = await web3Instance.eth.getAccounts()
        if (accounts.length > 0) {
          await handleAccountsChanged(accounts, web3Instance)
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          handleAccountsChanged(accounts, web3Instance)
        })

        // Listen for network changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload()
        })

        setLoading(false)
      } else {
        toast.error('Please install MetaMask to use this DApp')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error initializing Web3:', error)
      toast.error('Failed to initialize Web3')
      setLoading(false)
    }
  }

  const handleAccountsChanged = async (accounts, web3Instance) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount(null)
      setBalance('0')
      setIsConnected(false)
      setContract(null)
    } else {
      // User connected
      setAccount(accounts[0])
      setIsConnected(true)

      // Get balance
      const balanceWei = await web3Instance.eth.getBalance(accounts[0])
      const balanceEth = web3Instance.utils.fromWei(balanceWei, 'ether')
      setBalance(parseFloat(balanceEth).toFixed(4))

      // Initialize contract
      try {
        const contractInstance = new web3Instance.eth.Contract(
          FreelanceEscrowABI.abi,
          CONTRACT_ADDRESS
        )
        setContract(contractInstance)
      } catch (error) {
        console.error('Error initializing contract:', error)
      }
    }
  }

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask')
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      await handleAccountsChanged(accounts, web3)
      toast.success('Wallet connected successfully!')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setBalance('0')
    setIsConnected(false)
    setContract(null)
    toast.info('Wallet disconnected')
  }

  const switchNetwork = async (chainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: Web3.utils.toHex(chainId) }]
      })
    } catch (error) {
      if (error.code === 4902) {
        toast.error('Please add this network to MetaMask')
      } else {
        console.error('Error switching network:', error)
        toast.error('Failed to switch network')
      }
    }
  }

  const getNetworkName = () => {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      1337: 'Ganache Local',
      5777: 'Ganache Local'
    }
    return networks[networkId] || 'Unknown Network'
  }

  const refreshBalance = async () => {
    if (web3 && account) {
      const balanceWei = await web3.eth.getBalance(account)
      const balanceEth = web3.utils.fromWei(balanceWei, 'ether')
      setBalance(parseFloat(balanceEth).toFixed(4))
    }
  }

  useEffect(() => {
    initWeb3()
  }, [])

  const value = {
    web3,
    account,
    contract,
    networkId,
    balance,
    loading,
    isConnected,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getNetworkName,
    refreshBalance,
    CONTRACT_ADDRESS
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}
