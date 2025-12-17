import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { toast } from 'react-toastify'
import { FaGavel } from 'react-icons/fa'

const ArbitratorPanel = () => {
  const { contract, account, isConnected } = useWeb3()
  const [disputedProjects, setDisputedProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (contract && account) {
      loadDisputedProjects()
    } else {
      setLoading(false)
    }
  }, [contract, account])

  const loadDisputedProjects = async () => {
    try {
      setLoading(true)
      
      const projectCount = await contract.methods.projectCounter().call()
      const disputed = []
      
      for (let i = 0; i < Number(projectCount); i++) {
        try {
          const project = await contract.methods.getProject(i).call()
          
          // Only show projects where user is arbiter and status is disputed
          if (
            project.arbiter.toLowerCase() === account.toLowerCase() &&
            project.status === '3' // Disputed status
          ) {
            // Load milestones to find disputed ones
            const milestoneCount = Number(project.milestoneCount)
            const milestones = []
            
            for (let j = 0; j < milestoneCount; j++) {
              const milestone = await contract.methods.getMilestone(i, j).call()
              if (milestone.status === '3') { // Disputed milestone
                milestones.push({ index: j, ...milestone })
              }
            }
            
            if (milestones.length > 0) {
              disputed.push({
                id: i,
                ...project,
                disputedMilestones: milestones
              })
            }
          }
        } catch (err) {
          console.error(`Error loading project ${i}:`, err)
        }
      }
      
      setDisputedProjects(disputed)
    } catch (error) {
      console.error('Error loading disputed projects:', error)
      toast.error('Failed to load disputed projects')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view arbitrator panel
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
          <FaGavel className="mr-3 text-primary-600 dark:text-primary-400" />
          Arbitrator Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and resolve disputed milestones
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner border-primary-600"></div>
            <span className="ml-3">Loading disputes...</span>
          </div>
        ) : disputedProjects.length === 0 ? (
          <div className="text-center py-12">
            <FaGavel className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No disputes to resolve at this time
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Disputed projects will appear here when you're assigned as an arbiter
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {disputedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                      Project #{project.id}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {project.projectDescription}
                    </p>
                  </div>
                  <span className="badge badge-danger">
                    {project.disputedMilestones.length} Dispute(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Client: </span>
                    <span className="font-mono text-xs">{project.client}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Freelancer: </span>
                    <span className="font-mono text-xs">{project.freelancer}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white">
                    Disputed Milestones:
                  </h4>
                  {project.disputedMilestones.map((milestone) => (
                    <div
                      key={milestone.index}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-800 dark:text-white">
                            Milestone {milestone.index + 1}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {milestone.description}
                          </p>
                        </div>
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          {(Number(milestone.amount) / 1e18).toFixed(4)} ETH
                        </span>
                      </div>

                      {milestone.deliverableHash && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Deliverable: 
                          </span>
                          <span className="text-xs font-mono ml-2 break-all">
                            {milestone.deliverableHash}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Link
                  to={`/project/${project.id}`}
                  className="btn-primary w-full text-center block"
                >
                  Review & Resolve Dispute →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card mt-6 bg-primary-50 dark:bg-primary-900/20">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
          Arbiter Responsibilities
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Review project details and deliverables carefully</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Make fair and unbiased decisions</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Consider both client and freelancer perspectives</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Earn 2% of project value as arbiter fee</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ArbitratorPanel
