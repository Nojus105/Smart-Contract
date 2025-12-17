const FreelanceEscrow = artifacts.require("FreelanceEscrow");

contract("FreelanceEscrow", (accounts) => {
  let escrow;
  const client = accounts[0];
  const freelancer = accounts[1];
  const arbiter = accounts[2];
  
  const projectDescription = "Build a website";
  const milestoneDescription = "Design mockups";
  const milestoneAmount = web3.utils.toWei("0.1", "ether");
  const arbiterFeePercentage = 2;

  beforeEach(async () => {
    escrow = await FreelanceEscrow.new();
  });

  describe("Project Creation", () => {
    it("should create a new project", async () => {
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      const result = await escrow.createProject(
        freelancer,
        arbiter,
        projectDescription,
        deadline,
        { from: client }
      );

      assert.equal(result.logs[0].event, "ProjectCreated");
      assert.equal(result.logs[0].args.client, client);
      assert.equal(result.logs[0].args.freelancer, freelancer);
      
      const project = await escrow.getProject(0);
      assert.equal(project.client, client);
      assert.equal(project.freelancer, freelancer);
      assert.equal(project.arbiter, arbiter);
      assert.equal(project.projectDescription, projectDescription);
      assert.equal(project.status, "0"); // Created status
    });

    it("should reject invalid addresses", async () => {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      try {
        await escrow.createProject(
          "0x0000000000000000000000000000000000000000",
          arbiter,
          projectDescription,
          deadline,
          { from: client }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Invalid freelancer address"));
      }
    });

    it("should reject if client is freelancer", async () => {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      try {
        await escrow.createProject(
          client, // Same as sender
          arbiter,
          projectDescription,
          deadline,
          { from: client }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Client cannot be freelancer"));
      }
    });
  });

  describe("Milestones", () => {
    let projectId;

    beforeEach(async () => {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const result = await escrow.createProject(
        freelancer,
        arbiter,
        projectDescription,
        deadline,
        { from: client }
      );
      projectId = result.logs[0].args.projectId.toString();
    });

    it("should add a milestone", async () => {
      const result = await escrow.addMilestone(
        projectId,
        milestoneDescription,
        milestoneAmount,
        { from: client }
      );

      assert.equal(result.logs[0].event, "MilestoneAdded");
      
      const project = await escrow.getProject(projectId);
      assert.equal(project.totalAmount, milestoneAmount);
      assert.equal(project.milestoneCount, "1");
      
      const milestone = await escrow.getMilestone(projectId, 0);
      assert.equal(milestone.description, milestoneDescription);
      assert.equal(milestone.amount, milestoneAmount);
      assert.equal(milestone.status, "0"); // Pending
    });

    it("should only allow client to add milestones", async () => {
      try {
        await escrow.addMilestone(
          projectId,
          milestoneDescription,
          milestoneAmount,
          { from: freelancer }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Only client can call this function"));
      }
    });
  });

  describe("Project Start and Funding", () => {
    let projectId;

    beforeEach(async () => {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const result = await escrow.createProject(
        freelancer,
        arbiter,
        projectDescription,
        deadline,
        { from: client }
      );
      projectId = result.logs[0].args.projectId.toString();
      
      await escrow.addMilestone(
        projectId,
        milestoneDescription,
        milestoneAmount,
        { from: client }
      );
    });

    it("should start project with correct funding", async () => {
      const totalAmount = parseFloat(web3.utils.fromWei(milestoneAmount, "ether"));
      const arbiterFee = totalAmount * (arbiterFeePercentage / 100);
      const totalRequired = web3.utils.toWei((totalAmount + arbiterFee).toString(), "ether");

      const result = await escrow.startProject(projectId, {
        from: client,
        value: totalRequired
      });

      assert.equal(result.logs[0].event, "ProjectStarted");
      
      const project = await escrow.getProject(projectId);
      assert.equal(project.status, "1"); // InProgress
    });

    it("should reject insufficient funding", async () => {
      const insufficientAmount = web3.utils.toWei("0.05", "ether");
      
      try {
        await escrow.startProject(projectId, {
          from: client,
          value: insufficientAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Must send exact total amount"));
      }
    });
  });

  describe("Milestone Submission and Approval", () => {
    let projectId;

    beforeEach(async () => {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const result = await escrow.createProject(
        freelancer,
        arbiter,
        projectDescription,
        deadline,
        { from: client }
      );
      projectId = result.logs[0].args.projectId.toString();
      
      await escrow.addMilestone(
        projectId,
        milestoneDescription,
        milestoneAmount,
        { from: client }
      );

      const totalAmount = parseFloat(web3.utils.fromWei(milestoneAmount, "ether"));
      const arbiterFee = totalAmount * (arbiterFeePercentage / 100);
      const totalRequired = web3.utils.toWei((totalAmount + arbiterFee).toString(), "ether");

      await escrow.startProject(projectId, {
        from: client,
        value: totalRequired
      });
    });

    it("should allow freelancer to submit milestone", async () => {
      const deliverableHash = "QmX1234..."; // IPFS hash

      const result = await escrow.submitMilestone(
        projectId,
        0,
        deliverableHash,
        { from: freelancer }
      );

      assert.equal(result.logs[0].event, "MilestoneSubmitted");
      
      const milestone = await escrow.getMilestone(projectId, 0);
      assert.equal(milestone.status, "1"); // Submitted
      assert.equal(milestone.deliverableHash, deliverableHash);
    });

    it("should allow client to approve milestone", async () => {
      const deliverableHash = "QmX1234...";
      await escrow.submitMilestone(projectId, 0, deliverableHash, { from: freelancer });

      const freelancerBalanceBefore = await web3.eth.getBalance(freelancer);

      const result = await escrow.approveMilestone(projectId, 0, { from: client });

      assert.equal(result.logs[0].event, "MilestoneApproved");
      
      const freelancerBalanceAfter = await web3.eth.getBalance(freelancer);
      const balanceIncrease = parseFloat(freelancerBalanceAfter) - parseFloat(freelancerBalanceBefore);
      
      assert(balanceIncrease > 0, "Freelancer should receive payment");
      
      const milestone = await escrow.getMilestone(projectId, 0);
      assert.equal(milestone.status, "2"); // Approved
    });
  });

  describe("Disputes", () => {
    let projectId;

    beforeEach(async () => {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const result = await escrow.createProject(
        freelancer,
        arbiter,
        projectDescription,
        deadline,
        { from: client }
      );
      projectId = result.logs[0].args.projectId.toString();
      
      await escrow.addMilestone(
        projectId,
        milestoneDescription,
        milestoneAmount,
        { from: client }
      );

      const totalAmount = parseFloat(web3.utils.fromWei(milestoneAmount, "ether"));
      const arbiterFee = totalAmount * (arbiterFeePercentage / 100);
      const totalRequired = web3.utils.toWei((totalAmount + arbiterFee).toString(), "ether");

      await escrow.startProject(projectId, {
        from: client,
        value: totalRequired
      });

      await escrow.submitMilestone(projectId, 0, "QmX1234...", { from: freelancer });
    });

    it("should allow client to dispute milestone", async () => {
      const result = await escrow.disputeMilestone(projectId, 0, { from: client });

      assert.equal(result.logs[0].event, "MilestoneDisputed");
      
      const project = await escrow.getProject(projectId);
      assert.equal(project.status, "3"); // Disputed
      
      const milestone = await escrow.getMilestone(projectId, 0);
      assert.equal(milestone.status, "3"); // Disputed
    });

    it("should allow arbiter to resolve dispute in favor of freelancer", async () => {
      await escrow.disputeMilestone(projectId, 0, { from: client });

      const freelancerBalanceBefore = await web3.eth.getBalance(freelancer);

      const result = await escrow.resolveDispute(projectId, 0, true, { from: arbiter });

      assert.equal(result.logs[1].event, "DisputeResolved");
      
      const freelancerBalanceAfter = await web3.eth.getBalance(freelancer);
      const balanceIncrease = parseFloat(freelancerBalanceAfter) - parseFloat(freelancerBalanceBefore);
      
      assert(balanceIncrease > 0, "Freelancer should receive payment");
      
      const project = await escrow.getProject(projectId);
      assert.equal(project.status, "1"); // Back to InProgress
    });
  });
});
