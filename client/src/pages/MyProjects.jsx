import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { toast } from 'react-toastify'
import { FaBriefcase, FaFilter } from 'react-icons/fa'

const MyProjects = () => {
  const { contract, account, isConnected } = useWeb3()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, client, freelancer, arbiter

  useEffect(() => {
    if (contract && account) {
      loadProjects()
    } else {
      setLoading(false)
    }
  }, [contract, account, filter])

  const loadProjects = async () => {
    try {
      setLoading(true)
      
      const projectCount = await contract.methods.projectCounter().call()
      const loadedProjects = []
      
      for (let i = 0; i < Number(projectCount); i++) {
        try {
          const project = await contract.methods.getProject(i).call()
          
          const isClient = project.client.toLowerCase() === account.toLowerCase()
          const isFreelancer = project.freelancer.toLowerCase() === account.toLowerCase()
          const isArbiter = project.arbiter.toLowerCase() === account.toLowerCase()
          
          // Apply filter
          if (filter === 'client' && !isClient) continue
          if (filter === 'freelancer' && !isFreelancer) continue
          if (filter === 'arbiter' && !isArbiter) continue
          if (filter === 'all' && !isClient && !isFreelancer && !isArbiter) continue
          
          let role = ''
          if (isClient) role = 'Client'
          else if (isFreelancer) role = 'Freelancer'
          else if (isArbiter) role = 'Arbiter'
          
          loadedProjects.push({
            id: i,
            role,
            ...project
          })
        } catch (err) {
          console.error(`Error loading project ${i}:`, err)
        }
      }
      
      setProjects(loadedProjects.reverse())
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      '0': { text: 'Created', class: 'badge-info' },
      '1': { text: 'In Progress', class: 'badge-warning' },
      '2': { text: 'Completed', class: 'badge-success' },
      '3': { text: 'Disputed', class: 'badge-danger' },
      '4': { text: 'Cancelled', class: 'badge-danger' },
      '5': { text: 'Refunded', class: 'badge-info' }
    }
    const { text, class: className } = statusMap[status] || { text: 'Unknown', class: 'badge-info' }
    return <span className={`badge ${className}`}>{text}</span>
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view your projects
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          My Projects
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your projects
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-600 dark:text-gray-400" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">Filter by Role:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('client')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'client'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            As Client
          </button>
          <button
            onClick={() => setFilter('freelancer')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'freelancer'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            As Freelancer
          </button>
          <button
            onClick={() => setFilter('arbiter')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'arbiter'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            As Arbiter
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner border-primary-600"></div>
            <span className="ml-3">Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FaBriefcase className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No projects found
            </p>
            <Link to="/create" className="btn-primary">
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">ID</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Role</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Paid</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold">#{project.id}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {project.projectDescription}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-info text-xs">
                        {project.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(Number(project.totalAmount) / 1e18).toFixed(2)} ETH
                    </td>
                    <td className="py-3 px-4">
                      {(Number(project.paidAmount) / 1e18).toFixed(2)} ETH
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(project.status)}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/project/${project.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyProjects
