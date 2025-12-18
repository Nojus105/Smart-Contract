const FreelanceEscrow = artifacts.require("FreelanceEscrow");

contract("FreelanceEscrow", (accounts) => {
  let escrow;
  const [client, freelancer, arbiter] = accounts;
  const milestoneAmount = web3.utils.toWei("0.1", "ether");

  beforeEach(async () => {
    escrow = await FreelanceEscrow.new();
  });

  const createFundedProject = async () => {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const tx = await escrow.createProject(freelancer, arbiter, "Work", deadline, { from: client });
    const id = tx.logs[0].args.projectId.toString();
    await escrow.addMilestone(id, "M1", milestoneAmount, { from: client });
    const fee = (BigInt(milestoneAmount) * 2n) / 100n;
    await escrow.startProject(id, { from: client, value: (BigInt(milestoneAmount) + fee).toString() });
    return id;
  };

  it("rejects invalid freelancer", async () => {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    try {
      await escrow.createProject("0x0000000000000000000000000000000000000000", arbiter, "X", deadline, { from: client });
      assert.fail("expected revert");
    } catch (e) {
      assert(e.message.includes("Invalid freelancer address"));
    }
  });

  it("happy path: submit + approve pays milestone", async () => {
    const id = await createFundedProject();
    await escrow.submitMilestone(id, 0, "proof", { from: freelancer });
    await escrow.approveMilestone(id, 0, { from: client });
    const m = await escrow.getMilestone(id, 0);
    assert.equal(m.status.toString(), "4"); // Paid
    const p = await escrow.getProject(id);
    assert.equal(p.status.toString(), "2"); // Completed
  });

  it("dispute: arbiter can approve and keep project running", async () => {
    const id = await createFundedProject();
    await escrow.submitMilestone(id, 0, "proof", { from: freelancer });
    await escrow.disputeMilestone(id, 0, { from: client });
    await escrow.resolveDispute(id, 0, true, { from: arbiter });
    const p = await escrow.getProject(id);
    assert(["1", "2"].includes(p.status.toString())); // InProgress or Completed
  });
});
