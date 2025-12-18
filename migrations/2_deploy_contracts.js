const FreelanceEscrow = artifacts.require("FreelanceEscrow");

module.exports = function (deployer) {
  // Deploy the main escrow contract used by the dapp
  deployer.deploy(FreelanceEscrow);
};
