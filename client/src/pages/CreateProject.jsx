import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { toast } from 'react-toastify'
import { FaPlus, FaTrash } from 'react-icons/fa'

const CreateProject = () => {
  const { contract, account, web3, isConnected } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    freelancer: '',
    arbiter: '',
    description: '',
    deadline: ''
  })
  
  const [milestones, setMilestones] = useState([
    { description: '', amount: '' }
  ])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...milestones]
    newMilestones[index][field] = value
    setMilestones(newMilestones)
  }

  const addMilestone = () => {
    setMilestones([...milestones, { description: '', amount: '' }])
  }

  const removeMilestone = (index) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index))
    }
  }

  const calculateTotalAmount = () => {
    return milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
  }

  const calculateArbiterFee = () => {
    return calculateTotalAmount() * 0.02
  }

  const validateForm = () => {
    if (!web3.utils.isAddress(formData.freelancer)) {
      toast.error('Invalid freelancer address')
      return false
    }
    
    if (!web3.utils.isAddress(formData.arbiter)) {
      toast.error('Invalid arbiter address')
      return false
    }
    
    if (formData.freelancer.toLowerCase() === account.toLowerCase()) {
      toast.error('You cannot be the freelancer')
      return false
    }
    
    if (formData.arbiter.toLowerCase() === account.toLowerCase()) {
      toast.error('You cannot be the arbiter')
      return false
    }
    
    if (formData.arbiter.toLowerCase() === formData.freelancer.toLowerCase()) {
      toast.error('Freelancer and arbiter must be different')
      return false
    }
    
    if (!formData.description.trim()) {
      toast.error('Project description is required')
      return false
    }
    
    if (!formData.deadline) {
      toast.error('Deadline is required')
      return false
    }
    
    const deadlineTimestamp = new Date(formData.deadline).getTime() / 1000
    const now = Math.floor(Date.now() / 1000)
    if (deadlineTimestamp <= now) {
      toast.error('Deadline must be in the future')
      return false
    }
    
    for (let i = 0; i < milestones.length; i++) {
      if (!milestones[i].description.trim()) {
        toast.error(`Milestone ${i + 1} description is required`)
        return false
      }
      if (!milestones[i].amount || parseFloat(milestones[i].amount) <= 0) {
        toast.error(`Milestone ${i + 1} amount must be greater than 0`)
        return false
      }
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000)
      
      // Step 1: Create project
      toast.info('Creating project...')
      const createTx = await contract.methods
        .createProject(
          formData.freelancer,
          formData.arbiter,
          formData.description,
          deadlineTimestamp
        )
        .send({ from: account })
      
      const projectId = createTx.events.ProjectCreated.returnValues.projectId
      
      // Step 2: Add milestones
      for (let i = 0; i < milestones.length; i++) {
        toast.info(`Adding milestone ${i + 1}...`)
        const amountWei = web3.utils.toWei(milestones[i].amount, 'ether')
        await contract.methods
          .addMilestone(projectId, milestones[i].description, amountWei)
          .send({ from: account })
      }
      
      // Step 3: Fund and start project
      toast.info('Funding escrow...')
      const totalAmount = calculateTotalAmount()
      const arbiterFee = calculateArbiterFee()
      const totalRequired = totalAmount + arbiterFee
      const totalRequiredWei = web3.utils.toWei(totalRequired.toString(), 'ether')
      
      await contract.methods
        .startProject(projectId)
        .send({ from: account, value: totalRequiredWei })
      
      toast.success(`Project #${projectId} created successfully!`)
      navigate(`/project/${projectId}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error(error.message || 'Failed to create project')
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
          Please connect your wallet to create a project
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Create New Project
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Set up a new freelance project with escrow protection
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Project Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Freelancer Address</label>
                <input
                  type="text"
                  name="freelancer"
                  value={formData.freelancer}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Arbiter Address</label>
                <input
                  type="text"
                  name="arbiter"
                  value={formData.arbiter}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="input-field"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Neutral third party for dispute resolution (2% fee)
                </p>
              </div>

              <div>
                <label className="label">Project Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the project requirements and deliverables..."
                  className="input-field"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="label">Deadline</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Milestones
              </h2>
              <button
                type="button"
                onClick={addMilestone}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <FaPlus />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Milestone {index + 1}
                    </h3>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <input
                      type="text"
                      value={milestone.description}
                      onChange={(e) =>
                        handleMilestoneChange(index, 'description', e.target.value)
                      }
                      placeholder="e.g., Design mockups, First draft, Final delivery"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Amount (ETH)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={milestone.amount}
                      onChange={(e) =>
                        handleMilestoneChange(index, 'amount', e.target.value)
                      }
                      placeholder="0.1"
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Payment Summary
            </h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Total Milestones:</span>
                <span className="font-semibold">{calculateTotalAmount().toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Arbiter Fee (2%):</span>
                <span className="font-semibold">{calculateArbiterFee().toFixed(4)} ETH</span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Required:</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {(calculateTotalAmount() + calculateArbiterFee()).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="spinner mr-2"></div>
                  Creating Project...
                </>
              ) : (
                'Create & Fund Project'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProject
