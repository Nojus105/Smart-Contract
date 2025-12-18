import { createContext, useContext, useEffect, useState } from 'react'
import Web3 from 'web3'
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json'

const Web3Context = createContext(null)

export const useWeb3 = () => {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider')
  return ctx
}

const FALLBACK_CONTRACT_ADDRESS = '0x3ed0245356818f09E559d464BB0D2641e8fE4fc5'

const resolveContractAddress = (networkId) => {
  const envAddr = import.meta?.env?.VITE_CONTRACT_ADDRESS
  if (envAddr) return envAddr
  const fromArtifact = FreelanceEscrowABI?.networks?.[String(networkId)]?.address
  return fromArtifact || FALLBACK_CONTRACT_ADDRESS
}

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null)
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState(null)
  const [balance, setBalance] = useState('0')
  const [networkId, setNetworkId] = useState('')
  const [loading, setLoading] = useState(true)
  const isConnected = Boolean(account)

  useEffect(() => {
    if (!window.ethereum) {
      setLoading(false)
      return
    }
    const instance = new Web3(window.ethereum)
    setWeb3(instance)
    let contractAddress = ''
    instance.eth.net.getId().then((id) => {
      setNetworkId(String(id))
      contractAddress = resolveContractAddress(id)
      console.log('Web3 init', { networkId: String(id), contractAddress })
    })

    const handleAccountsChanged = async (accs) => {
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
      const addr = contractAddress || resolveContractAddress(networkId)
      setContract(new instance.eth.Contract(FreelanceEscrowABI.abi, addr))
    }

    instance.eth.getAccounts().then(handleAccountsChanged)
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', () => window.location.reload())
    setLoading(false)

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) return
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (accs?.length) {
      const instance = web3 || new Web3(window.ethereum)
      const id = await instance.eth.net.getId()
      setNetworkId(String(id))
      const addr = resolveContractAddress(id)
      const wei = await instance.eth.getBalance(accs[0])
      setAccount(accs[0])
      setBalance(instance.utils.fromWei(wei, 'ether'))
      setContract(new instance.eth.Contract(FreelanceEscrowABI.abi, addr))
      setWeb3(instance)
    }
  }

  const disconnectWallet = () => {
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
