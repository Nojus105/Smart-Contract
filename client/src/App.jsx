import { useEffect, useState } from 'react'
import { Web3Provider, useWeb3 } from './context/Web3Context'

const statusText = ['Created', 'In progress', 'Completed', 'Disputed', 'Cancelled', 'Refunded']
const milestoneText = ['Pending', 'Submitted', 'Approved', 'Disputed', 'Paid']

const ActionButton = ({ onClick, children, disabled }) => (
  <button className="btn" onClick={onClick} disabled={disabled}>
    {children}
  </button>
)

const Dashboard = () => {
  const { account, balance, connectWallet, disconnectWallet, contract, web3, isConnected, loading } = useWeb3()
  const [form, setForm] = useState({ freelancer: '', arbiter: '', description: '', deadline: '' })
  const [milestonesTextValue, setMilestonesTextValue] = useState('0.1:Design draft\n0.2:Final delivery')
  const [projects, setProjects] = useState([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (contract && account) loadProjects()
  }, [contract, account])

  const show = (msg) => setNote(msg || '')

  const parseMilestones = () =>
    milestonesTextValue
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const [amount, ...rest] = line.split(':')
        return {
          amount: Number(amount),
          description: (rest.join(':') || `Milestone ${idx + 1}`).trim(),
        }
      })
      .filter((m) => m.amount > 0 && m.description)

  const ethToNumber = (wei) => Number(web3.utils.fromWei(wei, 'ether'))

  const loadProjects = async () => {
    if (!contract || !account) return
    setBusy(true)
    try {
      const count = await contract.methods.projectCounter().call()
      const list = []
      for (let i = 0; i < Number(count); i++) {
        const p = await contract.methods.getProject(i).call()
        const mine = [p.client, p.freelancer, p.arbiter].some(
          (x) => x.toLowerCase() === account.toLowerCase()
        )
        if (!mine) continue
        const mCount = Number(p.milestoneCount)
        const milestones = []
        for (let j = 0; j < mCount; j++) {
          const m = await contract.methods.getMilestone(i, j).call()
          milestones.push({ index: j, ...m })
        }
        list.unshift({ id: i, ...p, milestones })
      }
      setProjects(list)
    } catch (err) {
      show(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const createProject = async (e) => {
    e.preventDefault()
    if (!contract || !web3) return
    const ms = parseMilestones()
    if (!ms.length) return show('Add at least one milestone as amount:description')
    if (!web3.utils.isAddress(form.freelancer) || !web3.utils.isAddress(form.arbiter)) {
      return show('Invalid freelancer or arbiter address')
    }
    const deadline = Math.floor(new Date(form.deadline).getTime() / 1000)
    if (!deadline || deadline <= Date.now() / 1000) return show('Set a future deadline')

    setBusy(true)
    try {
      const created = await contract.methods
        .createProject(form.freelancer, form.arbiter, form.description || 'Project', deadline)
        .send({ from: account })
      const projectId = created.events.ProjectCreated.returnValues.projectId

      for (const m of ms) {
        const wei = web3.utils.toWei(m.amount.toString(), 'ether')
        await contract.methods.addMilestone(projectId, m.description, wei).send({ from: account })
      }

      const totalWei = ms
        .map((m) => web3.utils.toWei(m.amount.toString(), 'ether'))
        .reduce((sum, val) => sum + BigInt(val), 0n)
      const fee = (totalWei * 2n) / 100n

      await contract.methods.startProject(projectId).send({
        from: account,
        value: (totalWei + fee).toString(),
      })

      show(`Project #${projectId} created and funded.`)
      loadProjects()
    } catch (err) {
      show(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const submitWork = async (pid, midx) => {
    const proof = prompt('IPFS hash or short proof of work:')
    if (!proof) return
    setBusy(true)
    try {
      await contract.methods.submitMilestone(pid, midx, proof).send({ from: account })
      loadProjects()
    } catch (err) {
      show(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const approveWork = async (pid, midx) => {
    setBusy(true)
    try {
      await contract.methods.approveMilestone(pid, midx).send({ from: account })
      loadProjects()
    } catch (err) {
      show(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const disputeWork = async (pid, midx) => {
    if (!window.confirm('Start a dispute?')) return
    setBusy(true)
    try {
      await contract.methods.disputeMilestone(pid, midx).send({ from: account })
      loadProjects()
    } catch (err) {
      show(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const resolveDispute = async (pid, midx, approve) => {
    setBusy(true)
    try {
      await contract.methods.resolveDispute(pid, midx, approve).send({ from: account })
      loadProjects()
    } catch (err) {
      show(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="layout">
      <header className="bar">
        <div>
          <h1>Freelance Escrow</h1>
          <p className="muted">Minimal dApp for milestone escrow with an arbiter.</p>
        </div>
        <div className="stack-right">
          {isConnected ? (
            <>
              <span className="pill">{balance} ETH</span>
              <span className="pill">{account.slice(0, 6)}...{account.slice(-4)}</span>
              <ActionButton onClick={disconnectWallet}>Disconnect</ActionButton>
            </>
          ) : (
            <ActionButton onClick={connectWallet} disabled={loading}>
              Connect wallet
            </ActionButton>
          )}
        </div>
      </header>

      {note && <div className="note">{note}</div>}

      <section className="card">
        <div className="flex between">
          <h2>Create & fund project</h2>
          {busy && <span className="pill">Working...</span>}
        </div>
        <form className="grid" onSubmit={createProject}>
          <label>
            Freelancer address
            <input
              value={form.freelancer}
              onChange={(e) => setForm({ ...form, freelancer: e.target.value })}
              placeholder="0x..."
              required
            />
          </label>
          <label>
            Arbiter address (gets 2%)
            <input
              value={form.arbiter}
              onChange={(e) => setForm({ ...form, arbiter: e.target.value })}
              placeholder="0x..."
              required
            />
          </label>
          <label>
            Short description
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Website build"
              required
            />
          </label>
          <label>
            Deadline
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
            />
          </label>
          <label>
            Milestones (one per line, amount:description)
            <textarea
              rows="3"
              value={milestonesTextValue}
              onChange={(e) => setMilestonesTextValue(e.target.value)}
            />
          </label>
          <ActionButton disabled={!isConnected || busy}>Create project</ActionButton>
        </form>
      </section>

      <section className="card">
        <div className="flex between">
          <h2>Your projects</h2>
          <ActionButton onClick={loadProjects} disabled={!isConnected || busy}>
            Refresh
          </ActionButton>
        </div>
        {!projects.length && <p className="muted">Nothing yet. Create or join a project.</p>}

        <div className="stack">
          {projects.map((p) => (
            <div key={p.id} className="panel">
              <div className="flex between">
                <div>
                  <strong>Project #{p.id}</strong>
                  <div className="muted">{p.projectDescription}</div>
                  <div className="muted">
                    Client {p.client.slice(0, 6)}... | Freelancer {p.freelancer.slice(0, 6)}... | Arbiter
                    {p.arbiter.slice(0, 6)}...
                  </div>
                </div>
                <span className="pill">{statusText[Number(p.status)]}</span>
              </div>

              <div className="muted small">
                Total {ethToNumber(p.totalAmount).toFixed(4)} ETH | Paid {ethToNumber(p.paidAmount).toFixed(4)} ETH
              </div>

              <div className="stack">
                {p.milestones.map((m) => {
                  const projectStatus = Number(p.status)
                  const ms = Number(m.status)
                  const isClient = p.client.toLowerCase() === account.toLowerCase()
                  const isFreelancer = p.freelancer.toLowerCase() === account.toLowerCase()
                  const isArbiter = p.arbiter.toLowerCase() === account.toLowerCase()
                  const canSubmit = isFreelancer && ms === 0 && projectStatus === 1
                  const canApprove = isClient && ms === 1 && projectStatus === 1
                  const canDispute = isClient && ms === 1 && projectStatus === 1
                  const canResolve = isArbiter && ms === 3 && projectStatus === 3
                  return (
                    <div key={m.index} className="milestone">
                      <div className="flex between">
                        <div>
                          <div className="strong">{m.description}</div>
                          <div className="muted small">
                            {ethToNumber(m.amount).toFixed(4)} ETH · {milestoneText[ms]}
                          </div>
                          {m.deliverableHash && <div className="muted small">Proof: {m.deliverableHash}</div>}
                        </div>
                        <span className="pill secondary">#{m.index + 1}</span>
                      </div>
                      <div className="actions">
                        {canSubmit && <ActionButton onClick={() => submitWork(p.id, m.index)}>Submit work</ActionButton>}
                        {canApprove && <ActionButton onClick={() => approveWork(p.id, m.index)}>Approve & pay</ActionButton>}
                        {canDispute && <ActionButton onClick={() => disputeWork(p.id, m.index)}>Dispute</ActionButton>}
                        {canResolve && (
                          <>
                            <ActionButton onClick={() => resolveDispute(p.id, m.index, true)}>
                              Approve freelancer
                            </ActionButton>
                            <ActionButton onClick={() => resolveDispute(p.id, m.index, false)}>
                              Refund client
                            </ActionButton>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const App = () => (
  <Web3Provider>
    <Dashboard />
  </Web3Provider>
)

export default App
