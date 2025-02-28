const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthRecordManager", function () {
    let healthRecordManager, patientHandler, patientContract;
    let owner, doctor, patient, unauthorizedUser;

    beforeEach(async function () {
        // Get test accounts
        [owner, doctor, patient, unauthorizedUser] = await ethers.getSigners();

        // Deploy PatientHandler contract
        const PatientHandler = await ethers.getContractFactory("PatientHandler");
        patientHandler = await PatientHandler.deploy();
        await patientHandler.waitForDeployment();

        const patientHandlerAddress = await patientHandler.getAddress();

        // Deploy HealthRecordManager with PatientHandler reference
        const HealthRecordManager = await ethers.getContractFactory("HealthRecordManager");
        healthRecordManager = await HealthRecordManager.deploy(patientHandlerAddress);
        await healthRecordManager.waitForDeployment();

        // Register patient
        await patientHandler.connect(patient).registerPatient();

        // Get deployed patient contract address
        const patientContractAddress = await patientHandler.patientContracts(patient.address);
        patientContract = await ethers.getContractAt("Patient", patientContractAddress);

        // Grant patient & doctor access
        await patientContract.connect(patient).grantAccess(patient.address, "patient_key");
        await patientContract.connect(patient).grantAccess(doctor.address, "doctor_key");

        const patientHasAccess = await patientContract.accessList(patient.address);
        const doctorHasAccess = await patientContract.accessList(doctor.address);
        console.log("Patient access granted:", patientHasAccess);
        console.log("Doctor access granted:", doctorHasAccess);

        // Store fake medical record CID (Only if setCID exists)
        await patientContract.connect(patient).setCID("fakeCID123");
    });

    // Test 1: Allow patient to read their own data
    it("Should allow the patient to read their own data", async function () {
        const cid = await healthRecordManager.connect(patient).getPatientData(patient.address);
        expect(cid).to.equal("fakeCID123");
    });

    // Test 2: Allow an authorized doctor to read patient data
    it("Should allow an authorized doctor to read patient data", async function () {
        const cid = await healthRecordManager.connect(doctor).getPatientData(patient.address);
        expect(cid).to.equal("fakeCID123");
    });

    // Test 3: Prevent unauthorized users from reading patient data
    it("Should deny an unauthorized user from reading patient data", async function () {
        await expect(
            healthRecordManager.connect(unauthorizedUser).getPatientData(patient.address)
        ).to.be.revertedWith("Access denied");
    });
});
