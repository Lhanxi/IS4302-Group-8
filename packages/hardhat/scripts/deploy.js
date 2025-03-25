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
  const [patient, doctor] = await hre.ethers.getSigners();
  console.log("Signer address:", patient.address);  // Log the address to debug

  // Call the `registerPatient` function of PatientHandler to deploy a new Patient contract
  const registerTx = await patientHandler.connect(patient).registerPatient();
  await registerTx.wait(); // Wait for registration transaction to be mined

  // Get the deployed Patient contract address for the patient
  const patientContractAddress = await patientHandler.patientContracts(patient.address);
  console.log("Patient contract deployed for patient at address:", patientContractAddress);

  //Get the deployed DoctorOracle contract address
  const DoctorOracle = await hre.ethers.getContractFactory("DoctorOracle");
  const doctorOracle = await DoctorOracle.deploy();
  await doctorOracle.waitForDeployment();
  const doctorOracleAddress = await doctorOracle.getAddress();
  console.log("DoctorOracle contract deployed at address:", doctorOracleAddress);

  // Get the deployed DoctorHandler contract address
  const DoctorHandler = await hre.ethers.getContractFactory("DoctorHandler");
  const doctorHandler = await DoctorHandler.deploy(doctorOracleAddress);
  await doctorHandler.waitForDeployment();
  const doctorHandlerAddress = await doctorHandler.getAddress();
  console.log("DoctorHandler contract deployed at address:", doctorHandlerAddress);

  console.log("Doctor address:", doctor.address);
  await doctorOracle.addDoctor(doctor.address, "testDoctor")

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
