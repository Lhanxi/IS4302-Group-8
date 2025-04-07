import contractABI from "hardhat-project/artifacts/contracts/ConnectWalletTest.sol/ConnectWalletTest.json";
const deployedAddresses = require("./utils/contractAddress");

// Paste the deployed contract address here
export const CONTRACT_ADDRESS = deployedAddresses.connectWalletTestAddress;
export const CONTRACT_ABI = contractABI.abi;