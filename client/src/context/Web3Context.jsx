import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Web3 from 'web3'
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json'

const Web3Context = createContext(null)

export const useWeb3 = () => {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider')
  return ctx
}

const resolveContractAddress = (networkId) => {
  const envAddr = import.meta?.env?.VITE_CONTRACT_ADDRESS
  if (envAddr) return envAddr
  // Fall back to the artifact network map when no explicit address is provided
  const fromArtifact = FreelanceEscrowABI?.networks?.[String(networkId)]?.address
  return fromArtifact || ''
}

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null)
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState(null)
  const [balance, setBalance] = useState('0')
  const [networkId, setNetworkId] = useState('')
  const [loading, setLoading] = useState(true)
  const contractAddressRef = useRef('')
  const isConnected = Boolean(account)

  useEffect(() => {
    if (!window.ethereum) {
      setLoading(false)
      return
    }
    // Instantiate Web3 against the injected provider (MetaMask or similar)
    const instance = new Web3(window.ethereum)
    setWeb3(instance)

    const init = async () => {
      // Resolve network + contract address before binding the contract
      const id = await instance.eth.net.getId()
      const addr = resolveContractAddress(id)
      if (!addr) {
        console.error(
          'No contract address configured for this network.',
          { networkId: String(id), hint: 'Set VITE_CONTRACT_ADDRESS or add networks[networkId].address to the artifact.' }
        )
        contractAddressRef.current = ''
        setNetworkId(String(id))
        setContract(null)
        setLoading(false)
        return
      }
      contractAddressRef.current = addr
      setNetworkId(String(id))
      console.log('Web3 init', { networkId: String(id), contractAddress: addr })
      const accs = await instance.eth.getAccounts()
      // Auto-connect if the wallet is already authorized
      await handleAccountsChanged(accs, addr)
      setLoading(false)
    }

    const handleAccountsChanged = async (accs, resolvedAddr) => {
      // Whenever the wallet changes accounts, refresh identity and balances
      const next = accs[0]
      if (!next) {
        setAccount('')
        setBalance('0')
        setContract(null)
        return
      }
      setAccount(next)
      const wei = await instance.eth.getBalance(next)
      setBalance(instance.utils.fromWei(wei, 'ether'))
      const addr = resolvedAddr || contractAddressRef.current || resolveContractAddress(networkId)
      if (!addr) {
        setContract(null)
        return
      }
      setContract(new instance.eth.Contract(FreelanceEscrowABI.abi, addr))
    }

    init().catch((err) => {
      console.error('Web3 init failed', err)
      setLoading(false)
    })

    const accountsChangedListener = (accs) => handleAccountsChanged(accs, contractAddressRef.current)
    window.ethereum.on('accountsChanged', accountsChangedListener)
    // Reload the page on network switch to ensure ABI/address stay in sync
    window.ethereum.on('chainChanged', () => window.location.reload())

    return () => {
      window.ethereum?.removeListener('accountsChanged', accountsChangedListener)
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) return
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (accs?.length) {
      // Build a Web3 instance for this session if one is not already set
      const instance = web3 || new Web3(window.ethereum)
      const id = await instance.eth.net.getId()
      setNetworkId(String(id))
      const addr = resolveContractAddress(id)
      if (!addr) {
        console.error(
          'No contract address configured for this network.',
          { networkId: String(id), hint: 'Set VITE_CONTRACT_ADDRESS or add networks[networkId].address to the artifact.' }
        )
        setContract(null)
        setWeb3(instance)
        return
      }
      const wei = await instance.eth.getBalance(accs[0])
      // Prime in-memory state to avoid extra round-trips after connect
      setAccount(accs[0])
      setBalance(instance.utils.fromWei(wei, 'ether'))
      setContract(new instance.eth.Contract(FreelanceEscrowABI.abi, addr))
      setWeb3(instance)
    }
  }

  const disconnectWallet = () => {
    // Clear ephemeral state; provider still keeps user authorization
    setAccount('')
    setBalance('0')
    setContract(null)
  }

  return (
    <Web3Context.Provider
      value={{ web3, account, contract, balance, networkId, loading, isConnected, connectWallet, disconnectWallet }}
    >
      {children}
    </Web3Context.Provider>
  )
}
