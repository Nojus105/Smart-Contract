// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FreelanceEscrow
 * @dev Smart contract for managing freelance work payments with milestone-based releases
 * @notice This contract handles escrow payments between clients and freelancers with arbiter dispute resolution
 */
contract FreelanceEscrow {
    
    // Enums
    enum ProjectStatus { Created, InProgress, Completed, Disputed, Cancelled, Refunded }
    enum MilestoneStatus { Pending, Submitted, Approved, Disputed, Paid }
    
    // Structs
    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        uint256 submittedTime;
        string deliverableHash; // IPFS hash or proof of work
    }
    
    struct Project {
        address payable client;
        address payable freelancer;
        address payable arbiter;
        string projectDescription;
        uint256 totalAmount;
        uint256 arbiterFee;
        uint256 createdAt;
        uint256 deadline;
        ProjectStatus status;
        Milestone[] milestones;
        uint256 paidAmount;
        bool arbiterPaid;
    }
    
    // State variables
    mapping(uint256 => Project) public projects;
    uint256 public projectCounter;
    uint256 public constant ARBITER_FEE_PERCENTAGE = 2; // 2% arbiter fee
    uint256 public constant APPROVAL_DEADLINE = 7 days; // Auto-approve after 7 days
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed freelancer,
        uint256 totalAmount
    );
    
    event MilestoneAdded(
        uint256 indexed projectId,
        uint256 milestoneIndex,
        uint256 amount
    );
    
    event ProjectStarted(uint256 indexed projectId);
    
    event MilestoneSubmitted(
        uint256 indexed projectId,
        uint256 milestoneIndex,
        string deliverableHash
    );
    
    event MilestoneApproved(
        uint256 indexed projectId,
        uint256 milestoneIndex,
        uint256 amount
    );
    
    event MilestoneDisputed(
        uint256 indexed projectId,
        uint256 milestoneIndex
    );
    
    event DisputeResolved(
        uint256 indexed projectId,
        uint256 milestoneIndex,
        bool approvedByArbiter
    );
    
    event ProjectCompleted(uint256 indexed projectId);
    
    event ProjectCancelled(uint256 indexed projectId);
    
    event RefundIssued(
        uint256 indexed projectId,
        address indexed client,
        uint256 amount
    );
    
    event PaymentReleased(
        uint256 indexed projectId,
        address indexed freelancer,
        uint256 amount
    );
    
    // Modifiers
    modifier onlyClient(uint256 _projectId) {
        require(
            msg.sender == projects[_projectId].client,
            "Only client can call this function"
        );
        _;
    }
    
    modifier onlyFreelancer(uint256 _projectId) {
        require(
            msg.sender == projects[_projectId].freelancer,
            "Only freelancer can call this function"
        );
        _;
    }
    
    modifier onlyArbiter(uint256 _projectId) {
        require(
            msg.sender == projects[_projectId].arbiter,
            "Only arbiter can call this function"
        );
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(_projectId < projectCounter, "Project does not exist");
        _;
    }
    
    modifier inStatus(uint256 _projectId, ProjectStatus _status) {
        require(
            projects[_projectId].status == _status,
            "Invalid project status"
        );
        _;
    }
    
    /**
     * @dev Create a new freelance project
     * @param _freelancer Address of the freelancer
     * @param _arbiter Address of the arbiter for dispute resolution
     * @param _projectDescription Description of the project
     * @param _deadline Project deadline timestamp
     */
    function createProject(
        address payable _freelancer,
        address payable _arbiter,
        string memory _projectDescription,
        uint256 _deadline
    ) external returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_arbiter != address(0), "Invalid arbiter address");
        require(_freelancer != msg.sender, "Client cannot be freelancer");
        require(_arbiter != msg.sender, "Client cannot be arbiter");
        require(_arbiter != _freelancer, "Arbiter cannot be freelancer");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        uint256 projectId = projectCounter++;
        Project storage project = projects[projectId];
        
        project.client = payable(msg.sender);
        project.freelancer = _freelancer;
        project.arbiter = _arbiter;
        project.projectDescription = _projectDescription;
        project.createdAt = block.timestamp;
        project.deadline = _deadline;
        project.status = ProjectStatus.Created;
        
        emit ProjectCreated(projectId, msg.sender, _freelancer, 0);
        
        return projectId;
    }
    
    /**
     * @dev Add a milestone to the project
     * @param _projectId ID of the project
     * @param _description Description of the milestone
     * @param _amount Amount to be paid for this milestone
     */
    function addMilestone(
        uint256 _projectId,
        string memory _description,
        uint256 _amount
    ) external projectExists(_projectId) onlyClient(_projectId) inStatus(_projectId, ProjectStatus.Created) {
        require(_amount > 0, "Milestone amount must be greater than 0");
        
        Project storage project = projects[_projectId];
        
        Milestone memory newMilestone = Milestone({
            description: _description,
            amount: _amount,
            status: MilestoneStatus.Pending,
            submittedTime: 0,
            deliverableHash: ""
        });
        
        project.milestones.push(newMilestone);
        project.totalAmount += _amount;
        
        emit MilestoneAdded(_projectId, project.milestones.length - 1, _amount);
    }
    
    /**
     * @dev Start the project and fund the escrow
     * @param _projectId ID of the project
     */
    function startProject(uint256 _projectId)
        external
        payable
        projectExists(_projectId)
        onlyClient(_projectId)
        inStatus(_projectId, ProjectStatus.Created)
    {
        Project storage project = projects[_projectId];
        require(project.milestones.length > 0, "Project must have at least one milestone");
        
        // Calculate arbiter fee
        project.arbiterFee = (project.totalAmount * ARBITER_FEE_PERCENTAGE) / 100;
        uint256 totalRequired = project.totalAmount + project.arbiterFee;
        
        require(msg.value == totalRequired, "Must send exact total amount plus arbiter fee");
        
        project.status = ProjectStatus.InProgress;
        
        emit ProjectStarted(_projectId);
    }
    
    /**
     * @dev Freelancer submits a completed milestone
     * @param _projectId ID of the project
     * @param _milestoneIndex Index of the milestone
     * @param _deliverableHash IPFS hash or proof of work
     */
    function submitMilestone(
        uint256 _projectId,
        uint256 _milestoneIndex,
        string memory _deliverableHash
    ) external projectExists(_projectId) onlyFreelancer(_projectId) inStatus(_projectId, ProjectStatus.InProgress) {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(
            milestone.status == MilestoneStatus.Pending,
            "Milestone already submitted or processed"
        );
        
        milestone.status = MilestoneStatus.Submitted;
        milestone.submittedTime = block.timestamp;
        milestone.deliverableHash = _deliverableHash;
        
        emit MilestoneSubmitted(_projectId, _milestoneIndex, _deliverableHash);
    }
    
    /**
     * @dev Client approves a submitted milestone
     * @param _projectId ID of the project
     * @param _milestoneIndex Index of the milestone
     */
    function approveMilestone(uint256 _projectId, uint256 _milestoneIndex)
        external
        projectExists(_projectId)
        onlyClient(_projectId)
        inStatus(_projectId, ProjectStatus.InProgress)
    {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(
            milestone.status == MilestoneStatus.Submitted,
            "Milestone not submitted"
        );
        
        milestone.status = MilestoneStatus.Approved;
        
        // Release payment to freelancer
        project.paidAmount += milestone.amount;
        project.freelancer.transfer(milestone.amount);
        
        emit MilestoneApproved(_projectId, _milestoneIndex, milestone.amount);
        emit PaymentReleased(_projectId, project.freelancer, milestone.amount);
        
        // Check if all milestones are complete
        _checkProjectCompletion(_projectId);
    }
    
    /**
     * @dev Auto-approve milestone if client doesn't respond within deadline
     * @param _projectId ID of the project
     * @param _milestoneIndex Index of the milestone
     */
    function autoApproveMilestone(uint256 _projectId, uint256 _milestoneIndex)
        external
        projectExists(_projectId)
        inStatus(_projectId, ProjectStatus.InProgress)
    {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(
            milestone.status == MilestoneStatus.Submitted,
            "Milestone not submitted"
        );
        require(
            block.timestamp >= milestone.submittedTime + APPROVAL_DEADLINE,
            "Approval deadline not reached"
        );
        
        milestone.status = MilestoneStatus.Approved;
        
        // Release payment to freelancer
        project.paidAmount += milestone.amount;
        project.freelancer.transfer(milestone.amount);
        
        emit MilestoneApproved(_projectId, _milestoneIndex, milestone.amount);
        emit PaymentReleased(_projectId, project.freelancer, milestone.amount);
        
        // Check if all milestones are complete
        _checkProjectCompletion(_projectId);
    }
    
    /**
     * @dev Client disputes a submitted milestone
     * @param _projectId ID of the project
     * @param _milestoneIndex Index of the milestone
     */
    function disputeMilestone(uint256 _projectId, uint256 _milestoneIndex)
        external
        projectExists(_projectId)
        onlyClient(_projectId)
        inStatus(_projectId, ProjectStatus.InProgress)
    {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(
            milestone.status == MilestoneStatus.Submitted,
            "Milestone not submitted"
        );
        
        milestone.status = MilestoneStatus.Disputed;
        project.status = ProjectStatus.Disputed;
        
        emit MilestoneDisputed(_projectId, _milestoneIndex);
    }
    
    /**
     * @dev Arbiter resolves a disputed milestone
     * @param _projectId ID of the project
     * @param _milestoneIndex Index of the milestone
     * @param _approveFreelancer True to approve freelancer's work, false to refund client
     */
    function resolveDispute(
        uint256 _projectId,
        uint256 _milestoneIndex,
        bool _approveFreelancer
    ) external projectExists(_projectId) onlyArbiter(_projectId) inStatus(_projectId, ProjectStatus.Disputed) {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(
            milestone.status == MilestoneStatus.Disputed,
            "Milestone not disputed"
        );
        
        if (_approveFreelancer) {
            milestone.status = MilestoneStatus.Approved;
            project.paidAmount += milestone.amount;
            project.freelancer.transfer(milestone.amount);
            emit PaymentReleased(_projectId, project.freelancer, milestone.amount);
        } else {
            milestone.status = MilestoneStatus.Pending;
        }
        
        // Pay arbiter fee
        if (!project.arbiterPaid) {
            project.arbiter.transfer(project.arbiterFee);
            project.arbiterPaid = true;
        }
        
        project.status = ProjectStatus.InProgress;
        
        emit DisputeResolved(_projectId, _milestoneIndex, _approveFreelancer);
        
        // Check if all milestones are complete
        _checkProjectCompletion(_projectId);
    }
    
    /**
     * @dev Cancel project before it starts (only in Created status)
     * @param _projectId ID of the project
     */
    function cancelProject(uint256 _projectId)
        external
        projectExists(_projectId)
        onlyClient(_projectId)
        inStatus(_projectId, ProjectStatus.Created)
    {
        projects[_projectId].status = ProjectStatus.Cancelled;
        emit ProjectCancelled(_projectId);
    }
    
    /**
     * @dev Request refund for remaining milestones (mutual agreement)
     * @param _projectId ID of the project
     */
    function requestRefund(uint256 _projectId)
        external
        projectExists(_projectId)
        inStatus(_projectId, ProjectStatus.InProgress)
    {
        require(
            msg.sender == projects[_projectId].client ||
                msg.sender == projects[_projectId].freelancer,
            "Only client or freelancer can request refund"
        );
        
        Project storage project = projects[_projectId];
        
        // Calculate remaining amount
        uint256 remainingAmount = project.totalAmount - project.paidAmount;
        
        if (remainingAmount > 0) {
            project.status = ProjectStatus.Refunded;
            project.client.transfer(remainingAmount + project.arbiterFee);
            
            emit RefundIssued(_projectId, project.client, remainingAmount);
        }
        
        project.status = ProjectStatus.Cancelled;
        emit ProjectCancelled(_projectId);
    }
    
    /**
     * @dev Internal function to check if all milestones are completed
     * @param _projectId ID of the project
     */
    function _checkProjectCompletion(uint256 _projectId) private {
        Project storage project = projects[_projectId];
        
        bool allComplete = true;
        for (uint256 i = 0; i < project.milestones.length; i++) {
            if (project.milestones[i].status != MilestoneStatus.Approved &&
                project.milestones[i].status != MilestoneStatus.Paid) {
                allComplete = false;
                break;
            }
        }
        
        if (allComplete) {
            project.status = ProjectStatus.Completed;
            
            // Pay arbiter fee if not already paid
            if (!project.arbiterPaid) {
                project.arbiter.transfer(project.arbiterFee);
                project.arbiterPaid = true;
            }
            
            emit ProjectCompleted(_projectId);
        }
    }
    
    /**
     * @dev Get project details
     * @param _projectId ID of the project
     */
    function getProject(uint256 _projectId)
        external
        view
        projectExists(_projectId)
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
        Project storage project = projects[_projectId];
        return (
            project.client,
            project.freelancer,
            project.arbiter,
            project.projectDescription,
            project.totalAmount,
            project.paidAmount,
            project.status,
            project.milestones.length
        );
    }
    
    /**
     * @dev Get milestone details
     * @param _projectId ID of the project
     * @param _milestoneIndex Index of the milestone
     */
    function getMilestone(uint256 _projectId, uint256 _milestoneIndex)
        external
        view
        projectExists(_projectId)
        returns (
            string memory description,
            uint256 amount,
            MilestoneStatus status,
            uint256 submittedTime,
            string memory deliverableHash
        )
    {
        require(
            _milestoneIndex < projects[_projectId].milestones.length,
            "Invalid milestone index"
        );
        
        Milestone storage milestone = projects[_projectId].milestones[_milestoneIndex];
        return (
            milestone.description,
            milestone.amount,
            milestone.status,
            milestone.submittedTime,
            milestone.deliverableHash
        );
    }
    
    /**
     * @dev Get balance of the contract
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
