const hre = require("hardhat");

async function main() {
  const ConnectWalletTest = await hre.ethers.getContractFactory("ConnectWalletTest");
  const connectWalletTest = await ConnectWalletTest.deploy();

  await connectWalletTest.waitForDeployment(); // ✅ Replace `deployed()` with `waitForDeployment()`

  const contractAddress = await connectWalletTest.getAddress(); // ✅ Get contract address

  console.log("ConnectWalletTest deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});