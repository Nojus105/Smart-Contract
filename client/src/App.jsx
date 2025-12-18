import { useEffect, useState } from 'react'
import { Web3Provider, useWeb3 } from './context/Web3Context'

// UI labels mirror the Solidity enums (ProjectStatus and MilestoneStatus)
const statusText = ['Created', 'In progress', 'Completed', 'Disputed', 'Cancelled', 'Refunded']
const milestoneText = ['Pending', 'Submitted', 'Approved', 'Disputed', 'Paid']

const ActionButton = ({ onClick, children, disabled, variant = 'primary', size = 'md', type }) => (
  <button
    className={`btn btn-${variant} btn-${size}`}
    onClick={onClick}
    disabled={disabled}
    type={type}
  >
    {children}
  </button>
)

const Dashboard = () => {
  const { account, balance, connectWallet, disconnectWallet, contract, web3, isConnected, loading } = useWeb3()
  // Form fields for creating a new project
  const [form, setForm] = useState({ freelancer: '', arbiter: '', description: '' })
  // Multiline textarea input encoded as amount:description per line
  const [milestonesTextValue, setMilestonesTextValue] = useState('0.1:Design draft\n0.2:Final delivery')
  // Locally cached projects involving the connected account
  const [projects, setProjects] = useState([])
  // When true, buttons show a working state to avoid duplicate sends
  const [busy, setBusy] = useState(false)
  // Surface friendly status or error messages to the user
  const [note, setNote] = useState('')

  useEffect(() => {
    // Refresh projects whenever wallet or contract becomes ready
    if (contract && account) loadProjects()
  }, [contract, account])

  const show = (msg) => setNote(msg || '')

  const parseMilestones = () =>
    // Turn textarea lines into validated milestone objects (ignores blanks/invalid rows)
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
      // Query total projects on-chain then filter to ones that involve the user
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
          // Pull each milestone to show per-milestone actions
          const m = await contract.methods.getMilestone(i, j).call()
          milestones.push({ index: j, ...m })
        }
        // Newest project displayed first
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

    setBusy(true)
    try {
      const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      // Contract createProject currently accepts (freelancer, arbiter, description); the extra deadline arg will revert until the ABI is updated
      const created = await contract.methods
        .createProject(form.freelancer, form.arbiter, form.description || 'Project', deadline)
        .send({ from: account })
      const projectId = created.events.ProjectCreated.returnValues.projectId

      // Add milestones on-chain before funding so totalAmount is correct
      for (const m of ms) {
        const wei = web3.utils.toWei(m.amount.toString(), 'ether')
        await contract.methods.addMilestone(projectId, m.description, wei).send({ from: account })
      }

      // Compute full escrow value plus arbiter fee (2%)
      const totalWei = ms
        .map((m) => web3.utils.toWei(m.amount.toString(), 'ether'))
        .reduce((sum, val) => sum + BigInt(val), 0n)
      const fee = (totalWei * 2n) / 100n

      // Fund and start the project in a single transaction
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
      // Freelancer submits evidence for the milestone deliverable
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
      // Client releases payment to freelancer for this milestone
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
      // Client moves milestone into Disputed, pausing payouts until arbiter steps in
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
      // Arbiter decision: approve pays freelancer, reject reopens milestone
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
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <h1>Freelance Escrow</h1>
            <p className="muted">Milestone escrow with an arbiter (2% fee).</p>
          </div>
        </div>

        <div className="topbar-actions">
          {isConnected ? (
            <>
              <span className="badge">{Number(balance).toFixed(4)} ETH</span>
              <span className="badge mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
              <ActionButton onClick={disconnectWallet} variant="secondary" size="sm">
                Disconnect
              </ActionButton>
            </>
          ) : (
            <ActionButton onClick={connectWallet} disabled={loading} variant="primary" size="sm">
              {loading ? 'Loading…' : 'Connect wallet'}
            </ActionButton>
          )}
        </div>
      </header>

      {note && (
        <div className="note" role="status" aria-live="polite">
          {note}
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Create & fund project</h2>
            <p className="muted small">Creates the project, adds milestones, then funds + starts it.</p>
          </div>
          <div className="card-head-actions">
            {busy && <span className="badge">Working…</span>}
          </div>
        </div>

        <form className="form" onSubmit={createProject}>
          <div className="form-grid">
            <label className="field">
              <span>Freelancer address</span>
              <input
                value={form.freelancer}
                onChange={(e) => setForm({ ...form, freelancer: e.target.value })}
                placeholder="0x..."
                required
              />
            </label>
            <label className="field">
              <span>Arbiter address</span>
              <input
                value={form.arbiter}
                onChange={(e) => setForm({ ...form, arbiter: e.target.value })}
                placeholder="0x..."
                required
              />
              <span className="help">Arbiter receives a 2% fee on funding.</span>
            </label>
            <label className="field">
              <span>Short description</span>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Website build"
                required
              />
            </label>
            {/* Deadline removed */}
            <label className="field field-full">
              <span>Milestones</span>
              <textarea
                rows="4"
                value={milestonesTextValue}
                onChange={(e) => setMilestonesTextValue(e.target.value)}
              />
              <span className="help">One per line: <span className="mono">amount:description</span> (amount in ETH)</span>
            </label>
          </div>

          <div className="form-actions">
            <ActionButton type="submit" disabled={!isConnected || busy} variant="primary">
              Create project
            </ActionButton>
            <ActionButton
              onClick={(e) => {
                e.preventDefault()
                setForm({ freelancer: '', arbiter: '', description: '' })
                setMilestonesTextValue('0.1:Design draft\n0.2:Final delivery')
                show('')
              }}
              disabled={busy}
              variant="ghost"
            >
              Reset
            </ActionButton>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Your projects</h2>
            <p className="muted small">Shows projects where you are client, freelancer, or arbiter.</p>
          </div>
          <div className="card-head-actions">
            <ActionButton onClick={loadProjects} disabled={!isConnected || busy} variant="secondary" size="sm">
              Refresh
            </ActionButton>
          </div>
        </div>
        {!projects.length && <p className="muted">Nothing yet. Create or join a project.</p>}

        <div className="stack">
          {projects.map((p) => (
            <div key={p.id} className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-kicker">Project #{p.id}</div>
                  <div className="panel-desc">{p.projectDescription}</div>
                  <div className="panel-meta">
                    <span className="mono">Client {p.client.slice(0, 6)}…</span>
                    <span className="dot" aria-hidden="true" />
                    <span className="mono">Freelancer {p.freelancer.slice(0, 6)}…</span>
                    <span className="dot" aria-hidden="true" />
                    <span className="mono">Arbiter {p.arbiter.slice(0, 6)}…</span>
                  </div>
                </div>
                <span className="badge">{statusText[Number(p.status)]}</span>
              </div>

              <div className="panel-stats">
                <div className="stat">
                  <div className="stat-label">Total</div>
                  <div className="stat-value">{ethToNumber(p.totalAmount).toFixed(4)} ETH</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Paid</div>
                  <div className="stat-value">{ethToNumber(p.paidAmount).toFixed(4)} ETH</div>
                </div>
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
                      <div className="milestone-head">
                        <div>
                          <div className="milestone-title">{m.description}</div>
                          <div className="milestone-sub">
                            <span className="mono">{ethToNumber(m.amount).toFixed(4)} ETH</span>
                            <span className="dot" aria-hidden="true" />
                            <span>{milestoneText[ms]}</span>
                          </div>
                          {m.deliverableHash && (
                            <div className="milestone-proof">Proof: <span className="mono">{m.deliverableHash}</span></div>
                          )}
                        </div>
                        <span className="badge badge-soft">#{m.index + 1}</span>
                      </div>
                      <div className="actions">
                        {canSubmit && (
                          <ActionButton onClick={() => submitWork(p.id, m.index)} variant="primary" size="sm">
                            Submit work
                          </ActionButton>
                        )}
                        {canApprove && (
                          <ActionButton onClick={() => approveWork(p.id, m.index)} variant="primary" size="sm">
                            Approve & pay
                          </ActionButton>
                        )}
                        {canDispute && (
                          <ActionButton onClick={() => disputeWork(p.id, m.index)} variant="danger" size="sm">
                            Dispute
                          </ActionButton>
                        )}
                        {canResolve && (
                          <>
                            <ActionButton
                              onClick={() => resolveDispute(p.id, m.index, true)}
                              variant="primary"
                              size="sm"
                            >
                              Approve freelancer
                            </ActionButton>
                            <ActionButton
                              onClick={() => resolveDispute(p.id, m.index, false)}
                              variant="warning"
                              size="sm"
                            >
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
