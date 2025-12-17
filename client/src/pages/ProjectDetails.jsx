import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { 
  FaUser, FaClock, FaEthereum, FaCheckCircle, 
  FaTimes, FaGavel, FaArrowLeft 
} from 'react-icons/fa'

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contract, account, web3, isConnected } = useWeb3()
  
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deliverableHash, setDeliverableHash] = useState('')
  const [selectedMilestone, setSelectedMilestone] = useState(null)

  useEffect(() => {
    if (contract && id) {
      loadProject()
    }
  }, [contract, id])

  const loadProject = async () => {
    try {
      setLoading(true)
      
      const projectData = await contract.methods.getProject(id).call()
      setProject(projectData)
      
      // Load all milestones
      const milestoneCount = Number(projectData.milestoneCount)
      const loadedMilestones = []
      
      for (let i = 0; i < milestoneCount; i++) {
        const milestone = await contract.methods.getMilestone(id, i).call()
        loadedMilestones.push({ index: i, ...milestone })
      }
      
      setMilestones(loadedMilestones)
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      '0': { text: 'Created', class: 'badge-info', icon: FaClock },
      '1': { text: 'In Progress', class: 'badge-warning', icon: FaClock },
      '2': { text: 'Completed', class: 'badge-success', icon: FaCheckCircle },
      '3': { text: 'Disputed', class: 'badge-danger', icon: FaGavel },
      '4': { text: 'Cancelled', class: 'badge-danger', icon: FaTimes },
      '5': { text: 'Refunded', class: 'badge-info', icon: FaTimes }
    }
    return statusMap[status] || statusMap['0']
  }

  const getMilestoneStatusInfo = (status) => {
    const statusMap = {
      '0': { text: 'Pending', class: 'badge-info' },
      '1': { text: 'Submitted', class: 'badge-warning' },
      '2': { text: 'Approved', class: 'badge-success' },
      '3': { text: 'Disputed', class: 'badge-danger' },
      '4': { text: 'Paid', class: 'badge-success' }
    }
    return statusMap[status] || statusMap['0']
  }

  const isClient = () => project && project.client.toLowerCase() === account?.toLowerCase()
  const isFreelancer = () => project && project.freelancer.toLowerCase() === account?.toLowerCase()
  const isArbiter = () => project && project.arbiter.toLowerCase() === account?.toLowerCase()

  const handleSubmitMilestone = async (milestoneIndex) => {
    if (!deliverableHash.trim()) {
      toast.error('Please provide deliverable hash/proof')
      return
    }

    setActionLoading(true)
    try {
      await contract.methods
        .submitMilestone(id, milestoneIndex, deliverableHash)
        .send({ from: account })
      
      toast.success('Milestone submitted successfully!')
      setDeliverableHash('')
      setSelectedMilestone(null)
      await loadProject()
    } catch (error) {
      console.error('Error submitting milestone:', error)
      toast.error(error.message || 'Failed to submit milestone')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveMilestone = async (milestoneIndex) => {
    setActionLoading(true)
    try {
      await contract.methods
        .approveMilestone(id, milestoneIndex)
        .send({ from: account })
      
      toast.success('Milestone approved and payment released!')
      await loadProject()
    } catch (error) {
      console.error('Error approving milestone:', error)
      toast.error(error.message || 'Failed to approve milestone')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisputeMilestone = async (milestoneIndex) => {
    if (!window.confirm('Are you sure you want to dispute this milestone?')) {
      return
    }

    setActionLoading(true)
    try {
      await contract.methods
        .disputeMilestone(id, milestoneIndex)
        .send({ from: account })
      
      toast.success('Milestone disputed. Arbiter will review.')
      await loadProject()
    } catch (error) {
      console.error('Error disputing milestone:', error)
      toast.error(error.message || 'Failed to dispute milestone')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolveDispute = async (milestoneIndex, approve) => {
    setActionLoading(true)
    try {
      await contract.methods
        .resolveDispute(id, milestoneIndex, approve)
        .send({ from: account })
      
      toast.success(`Dispute resolved: ${approve ? 'Approved' : 'Rejected'}`)
      await loadProject()
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast.error(error.message || 'Failed to resolve dispute')
    } finally {
      setActionLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          Connect Your Wallet
        </h2>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner border-primary-600"></div>
        <span className="ml-3">Loading project...</span>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          Project Not Found
        </h2>
      </div>
    )
  }

  const statusInfo = getStatusInfo(project.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary mb-4 flex items-center space-x-2"
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Project #{id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {project.projectDescription}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon className="text-2xl" />
            <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Milestones
            </h2>
            
            <div className="space-y-4">
              {milestones.map((milestone, index) => {
                const milestoneStatus = getMilestoneStatusInfo(milestone.status)
                const mStatus = Number(milestone.status)
                const pStatus = Number(project.status)
                const canSubmit = isFreelancer() && mStatus === 0 && pStatus === 1
                const canApprove = isClient() && mStatus === 1 && pStatus === 1
                const canDispute = isClient() && mStatus === 1 && pStatus === 1
                const canResolve = isArbiter() && mStatus === 3 && pStatus === 3
                
                return (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {milestone.description}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {(Number(milestone.amount) / 1e18).toFixed(4)} ETH
                        </p>
                      </div>
                      <span className={`badge ${milestoneStatus.class}`}>
                        {milestoneStatus.text}
                      </span>
                    </div>

                    {milestone.deliverableHash && (
                      <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Deliverable: </span>
                        <span className="font-mono break-all">{milestone.deliverableHash}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {canSubmit && (
                        <>
                          {selectedMilestone === index ? (
                            <div className="w-full space-y-2">
                              <input
                                type="text"
                                value={deliverableHash}
                                onChange={(e) => setDeliverableHash(e.target.value)}
                                placeholder="Enter IPFS hash or proof of work"
                                className="input-field text-sm"
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSubmitMilestone(index)}
                                  disabled={actionLoading}
                                  className="btn-primary text-sm"
                                >
                                  Submit
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMilestone(null)
                                    setDeliverableHash('')
                                  }}
                                  className="btn-secondary text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedMilestone(index)}
                              className="btn-primary text-sm"
                            >
                              Submit Work
                            </button>
                          )}
                        </>
                      )}

                      {canApprove && (
                        <>
                          <button
                            onClick={() => handleApproveMilestone(index)}
                            disabled={actionLoading}
                            className="btn-primary text-sm"
                          >
                            <FaCheckCircle className="inline mr-1" />
                            Approve & Pay
                          </button>
                          <button
                            onClick={() => handleDisputeMilestone(index)}
                            disabled={actionLoading}
                            className="btn-danger text-sm"
                          >
                            <FaTimes className="inline mr-1" />
                            Dispute
                          </button>
                        </>
                      )}

                      {canResolve && (
                        <>
                          <button
                            onClick={() => handleResolveDispute(index, true)}
                            disabled={actionLoading}
                            className="btn-primary text-sm"
                          >
                            Approve Freelancer
                          </button>
                          <button
                            onClick={() => handleResolveDispute(index, false)}
                            disabled={actionLoading}
                            className="btn-danger text-sm"
                          >
                            Reject Work
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Project Information
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Client</p>
                <p className="font-mono text-xs break-all">{project.client}</p>
                {isClient() && <span className="badge badge-info text-xs mt-1">You</span>}
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Freelancer</p>
                <p className="font-mono text-xs break-all">{project.freelancer}</p>
                {isFreelancer() && <span className="badge badge-info text-xs mt-1">You</span>}
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Arbiter</p>
                <p className="font-mono text-xs break-all">{project.arbiter}</p>
                {isArbiter() && <span className="badge badge-info text-xs mt-1">You</span>}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {(Number(project.totalAmount) / 1e18).toFixed(4)} ETH
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Paid Amount</p>
                <p className="text-lg font-semibold text-green-600">
                  {(Number(project.paidAmount) / 1e18).toFixed(4)} ETH
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Progress
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Completion</span>
                <span className="font-semibold">
                  {((Number(project.paidAmount) / Number(project.totalAmount)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${(Number(project.paidAmount) / Number(project.totalAmount)) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                {milestones.filter(m => m.status === '2').length} of {milestones.length} milestones completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails
