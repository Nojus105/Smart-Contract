import { Link } from 'react-router-dom'
import { FaSun, FaMoon, FaWallet, FaEthereum } from 'react-icons/fa'
import { useWeb3 } from '../context/Web3Context'

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const { account, balance, isConnected, connectWallet, disconnectWallet, getNetworkName } = useWeb3()

  const shortenAddress = (address) => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <FaEthereum className="text-3xl text-primary-600 dark:text-primary-400" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              Freelance Escrow
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/create"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Create Project
            </Link>
            <Link
              to="/my-projects"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              My Projects
            </Link>
            <Link
              to="/arbitrator"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Arbitrator
            </Link>
          </div>

          {/* Right Side - Theme Toggle and Wallet */}
          <div className="flex items-center space-x-4">
            {/* Network Badge */}
            {isConnected && (
              <div className="hidden sm:block">
                <span className="text-xs badge badge-info">
                  {getNetworkName()}
                </span>
              </div>
            )}

            {/* Balance Display */}
            {isConnected && (
              <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                <FaEthereum className="text-primary-600 dark:text-primary-400" />
                <span className="font-semibold">{balance} ETH</span>
              </div>
            )}

            {/* Wallet Button */}
            {isConnected ? (
              <button
                onClick={disconnectWallet}
                className="flex items-center space-x-2 btn-secondary text-sm"
              >
                <FaWallet />
                <span className="hidden sm:inline">{shortenAddress(account)}</span>
                <span className="sm:hidden">Disconnect</span>
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 btn-primary text-sm"
              >
                <FaWallet />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <FaSun className="text-yellow-500 text-xl" />
              ) : (
                <FaMoon className="text-gray-700 text-xl" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
