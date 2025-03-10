const hre = require("hardhat");

async function main() {
  const ConnectWalletTest = await hre.ethers.getContractFactory("ConnectWalletTest");
  const connectWalletTest = await ConnectWalletTest.deploy();
  await connectWalletTest.waitForDeployment();
  const contractAddress = await connectWalletTest.getAddress();
  console.log("ConnectWalletTest deployed to:", contractAddress);

  // Deploy PatientHandler contract
  const PatientHandler = await hre.ethers.getContractFactory("PatientHandler");
  const patientHandler = await PatientHandler.deploy();
  await patientHandler.waitForDeployment();
  const patientHandlerAddress = await patientHandler.getAddress();
  console.log("PatientHandler deployed to:", patientHandlerAddress);

  // Get the first signer (patient) from Hardhat network
  const [patient] = await hre.ethers.getSigners();
  console.log("Signer address:", patient.address);  // Log the address to debug

  // Call the `registerPatient` function of PatientHandler to deploy a new Patient contract
  const registerTx = await patientHandler.connect(patient).registerPatient();
  await registerTx.wait(); // Wait for registration transaction to be mined

  // Get the deployed Patient contract address for the patient
  const patientContractAddress = await patientHandler.patientContracts(patient.address);
  console.log("Patient contract deployed for patient at address:", patientContractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
