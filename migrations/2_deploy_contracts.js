var SimpleStorage = artifacts.require("./Voting.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
};
