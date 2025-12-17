import { useState, useEffect } from 'react'
import { useWeb3 } from '../context/Web3Context'
import { Link } from 'react-router-dom'
import { FaBriefcase, FaUsers, FaEthereum, FaCheckCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'

const Dashboard = () => {
  const { contract, account, isConnected } = useWeb3()
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalValue: '0'
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (contract && account) {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [contract, account])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get total project count
      const projectCount = await contract.methods.projectCounter().call()
      
      let active = 0
      let completed = 0
      let totalValue = 0
      const projects = []

      // Load recent projects (last 10)
      const startIndex = Math.max(0, Number(projectCount) - 10)
      
      for (let i = Number(projectCount) - 1; i >= startIndex && i >= 0; i--) {
        try {
          const project = await contract.methods.getProject(i).call()
          
          // Count statistics
          if (project.status === '2') { // InProgress
            active++
          } else if (project.status === '3') { // Completed
            completed++
          }
          
          totalValue += Number(project.totalAmount)

          // Add to recent projects if user is involved
          if (
            project.client.toLowerCase() === account.toLowerCase() ||
            project.freelancer.toLowerCase() === account.toLowerCase() ||
            project.arbiter.toLowerCase() === account.toLowerCase()
          ) {
            projects.push({
              id: i,
              ...project
            })
          }
        } catch (err) {
          console.error(`Error loading project ${i}:`, err)
        }
      }

      setStats({
        totalProjects: Number(projectCount),
        activeProjects: active,
        completedProjects: completed,
        totalValue: (totalValue / 1e18).toFixed(2)
      })

      setRecentProjects(projects)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
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

  const getUserRole = (project) => {
    if (project.client.toLowerCase() === account.toLowerCase()) return 'Client'
    if (project.freelancer.toLowerCase() === account.toLowerCase()) return 'Freelancer'
    if (project.arbiter.toLowerCase() === account.toLowerCase()) return 'Arbiter'
    return 'Unknown'
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <FaEthereum className="text-6xl text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your MetaMask wallet to view the dashboard
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner border-primary-600"></div>
        <span className="ml-3 text-gray-700 dark:text-gray-300">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of freelance escrow platform
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {stats.totalProjects}
              </p>
            </div>
            <FaBriefcase className="text-4xl text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {stats.activeProjects}
              </p>
            </div>
            <FaUsers className="text-4xl text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {stats.completedProjects}
              </p>
            </div>
            <FaCheckCircle className="text-4xl text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Value</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {stats.totalValue}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">ETH</p>
            </div>
            <FaEthereum className="text-4xl text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Your Recent Projects
          </h2>
          <Link to="/my-projects" className="text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
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
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-3 px-4">#{project.id}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {project.projectDescription}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-info text-xs">
                        {getUserRole(project)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(Number(project.totalAmount) / 1e18).toFixed(2)} ETH
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(project.status)}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/project/${project.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/create" className="card hover:scale-105 transition-transform text-center cursor-pointer">
          <FaBriefcase className="text-5xl text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Create Project
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Start a new freelance project with escrow protection
          </p>
        </Link>

        <Link to="/my-projects" className="card hover:scale-105 transition-transform text-center cursor-pointer">
          <FaUsers className="text-5xl text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            My Projects
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            View and manage your active projects
          </p>
        </Link>

        <Link to="/arbitrator" className="card hover:scale-105 transition-transform text-center cursor-pointer">
          <FaCheckCircle className="text-5xl text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Arbitrator Panel
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Resolve disputes and earn fees
          </p>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
