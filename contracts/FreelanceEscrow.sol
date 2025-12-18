// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FreelanceEscrow {
    enum ProjectStatus {
        Created,
        InProgress,
        Completed,
        Disputed,
        Cancelled,
        Refunded
    }
    enum MilestoneStatus {
        Pending,
        Submitted,
        Approved,
        Disputed,
        Paid
    }

    uint256 public constant ARBITER_FEE_PERCENTAGE = 2;

    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        uint256 submittedTime;
        string deliverableHash;
    }

    struct Project {
        address payable client;
        address payable freelancer;
        address payable arbiter;
        string projectDescription;
        uint256 totalAmount;
        uint256 arbiterFee;
        ProjectStatus status;
        uint256 paidAmount;
        bool arbiterPaid;
        Milestone[] milestones;
    }

    mapping(uint256 => Project) public projects;
    uint256 public projectCounter;

    event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer);
    event MilestoneAdded(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount);
    event ProjectStarted(uint256 indexed projectId);
    event MilestoneSubmitted(uint256 indexed projectId, uint256 milestoneIndex, string deliverableHash);
    event MilestoneApproved(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount);
    event MilestoneDisputed(uint256 indexed projectId, uint256 milestoneIndex);
    event DisputeResolved(uint256 indexed projectId, uint256 milestoneIndex, bool approvedByArbiter);
    event ProjectCompleted(uint256 indexed projectId);

    modifier exists(uint256 id) {
        require(id < projectCounter, "Project does not exist");
        _;
    }
    modifier onlyClient(uint256 id) {
        require(msg.sender == projects[id].client, "Only client can call this function");
        _;
    }
    modifier onlyFreelancer(uint256 id) {
        require(msg.sender == projects[id].freelancer, "Only freelancer can call this function");
        _;
    }
    modifier onlyArbiter(uint256 id) {
        require(msg.sender == projects[id].arbiter, "Only arbiter can call this function");
        _;
    }

    function createProject(
        address payable freelancer,
        address payable arbiter,
        string memory projectDescription,
        uint256 deadline
    ) external returns (uint256 id) {
        require(freelancer != address(0), "Invalid freelancer address");
        require(arbiter != address(0), "Invalid arbiter address");
        require(freelancer != msg.sender, "Client cannot be freelancer");
        require(arbiter != msg.sender, "Client cannot be arbiter");
        require(arbiter != freelancer, "Arbiter cannot be freelancer");
        require(deadline > block.timestamp, "Deadline must be in the future");

        id = projectCounter++;
        Project storage p = projects[id];
        p.client = payable(msg.sender);
        p.freelancer = freelancer;
        p.arbiter = arbiter;
        p.projectDescription = projectDescription;
        p.status = ProjectStatus.Created;
        emit ProjectCreated(id, msg.sender, freelancer);
    }

    function addMilestone(uint256 id, string memory description, uint256 amount)
        external
        exists(id)
        onlyClient(id)
    {
        Project storage p = projects[id];
        require(p.status == ProjectStatus.Created, "Invalid project status");
        require(amount > 0, "Milestone amount must be greater than 0");
        p.milestones.push(Milestone(description, amount, MilestoneStatus.Pending, 0, ""));
        p.totalAmount += amount;
        emit MilestoneAdded(id, p.milestones.length - 1, amount);
    }

    function startProject(uint256 id) external payable exists(id) onlyClient(id) {
        Project storage p = projects[id];
        require(p.status == ProjectStatus.Created, "Invalid project status");
        require(p.milestones.length > 0, "Project must have at least one milestone");
        p.arbiterFee = (p.totalAmount * ARBITER_FEE_PERCENTAGE) / 100;
        require(msg.value == p.totalAmount + p.arbiterFee, "Must send exact total amount plus arbiter fee");
        p.status = ProjectStatus.InProgress;
        emit ProjectStarted(id);
    }

    function submitMilestone(uint256 id, uint256 milestoneIndex, string memory deliverableHash)
        external
        exists(id)
        onlyFreelancer(id)
    {
        Project storage p = projects[id];
        require(p.status == ProjectStatus.InProgress, "Invalid project status");
        require(milestoneIndex < p.milestones.length, "Invalid milestone index");
        Milestone storage m = p.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Pending, "Milestone already submitted or processed");
        m.status = MilestoneStatus.Submitted;
        m.submittedTime = block.timestamp;
        m.deliverableHash = deliverableHash;
        emit MilestoneSubmitted(id, milestoneIndex, deliverableHash);
    }

    function approveMilestone(uint256 id, uint256 milestoneIndex) external exists(id) onlyClient(id) {
        Project storage p = projects[id];
        require(p.status == ProjectStatus.InProgress, "Invalid project status");
        require(milestoneIndex < p.milestones.length, "Invalid milestone index");
        Milestone storage m = p.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "Milestone not submitted");
        _payMilestone(p, id, milestoneIndex, m);
        _checkCompletion(p, id);
    }

    function disputeMilestone(uint256 id, uint256 milestoneIndex) external exists(id) onlyClient(id) {
        Project storage p = projects[id];
        require(p.status == ProjectStatus.InProgress, "Invalid project status");
        require(milestoneIndex < p.milestones.length, "Invalid milestone index");
        Milestone storage m = p.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "Milestone not submitted");
        m.status = MilestoneStatus.Disputed;
        p.status = ProjectStatus.Disputed;
        emit MilestoneDisputed(id, milestoneIndex);
    }

    function resolveDispute(uint256 id, uint256 milestoneIndex, bool approveFreelancer)
        external
        exists(id)
        onlyArbiter(id)
    {
        Project storage p = projects[id];
        require(p.status == ProjectStatus.Disputed, "Invalid project status");
        require(milestoneIndex < p.milestones.length, "Invalid milestone index");
        Milestone storage m = p.milestones[milestoneIndex];
        require(m.status == MilestoneStatus.Disputed, "Milestone not disputed");

        if (approveFreelancer) {
            _payMilestone(p, id, milestoneIndex, m);
        } else {
            m.status = MilestoneStatus.Pending;
        }

        if (!p.arbiterPaid) {
            p.arbiterPaid = true;
            p.arbiter.transfer(p.arbiterFee);
        }

        p.status = ProjectStatus.InProgress;
        emit DisputeResolved(id, milestoneIndex, approveFreelancer);
        _checkCompletion(p, id);
    }

    function _payMilestone(Project storage p, uint256 id, uint256 milestoneIndex, Milestone storage m) private {
        m.status = MilestoneStatus.Paid;
        p.paidAmount += m.amount;
        p.freelancer.transfer(m.amount);
        emit MilestoneApproved(id, milestoneIndex, m.amount);
    }

    function _checkCompletion(Project storage p, uint256 id) private {
        for (uint256 i = 0; i < p.milestones.length; i++) {
            if (p.milestones[i].status != MilestoneStatus.Paid) return;
        }

        p.status = ProjectStatus.Completed;
        if (!p.arbiterPaid) {
            p.arbiterPaid = true;
            p.arbiter.transfer(p.arbiterFee);
        }
        emit ProjectCompleted(id);
    }

    function getProject(uint256 id)
        external
        view
        exists(id)
        returns (
            address client,
            address freelancer,
            address arbiter,
            string memory projectDescription,
            uint256 totalAmount,
            uint256 paidAmount,
            ProjectStatus status,
            uint256 milestoneCount
        )
    {
        Project storage p = projects[id];
        return (p.client, p.freelancer, p.arbiter, p.projectDescription, p.totalAmount, p.paidAmount, p.status, p.milestones.length);
    }

    function getMilestone(uint256 id, uint256 milestoneIndex)
        external
        view
        exists(id)
        returns (string memory description, uint256 amount, MilestoneStatus status, uint256 submittedTime, string memory deliverableHash)
    {
        Project storage p = projects[id];
        require(milestoneIndex < p.milestones.length, "Invalid milestone index");
        Milestone storage m = p.milestones[milestoneIndex];
        return (m.description, m.amount, m.status, m.submittedTime, m.deliverableHash);
    }
}
