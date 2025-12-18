const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  // Deploy the helper that tracks migration progress for Truffle
  deployer.deploy(Migrations);
};
