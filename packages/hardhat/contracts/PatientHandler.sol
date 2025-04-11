// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Patient.sol";

/*
PatientHandler contract acts like a registry for all the patients and their contracts. 
Third parties that want a patient's data  will request that data via this contract.  
*/

contract PatientHandler {
    mapping(address => address) public patientContracts; // Maps patient to their contract
    mapping(address => mapping(address => bool)) public accessRequests; // Tracks access requests
    mapping(address => address[]) private pendingDoctors; // List of doctors per patient
    mapping(address => string) patientPublicKeys;
    mapping(address => address[]) private pendingInsuranceCompanies; // List of insurance companies per patient
    mapping(address => mapping(address => bool)) public insuranceCompanyAccessRequests; // Tracks access requests

    event InsuranceCompanyAccessRequested(address indexed patient, address indexed insuranceCompany);
    event PatientRegistered(address indexed patient, address contractAddress);
    event AccessRequested(address indexed patient, address indexed doctor);

    /// @notice Registers the transaction sender as a patient if the transaction sender has not already registered
    function registerPatient() external {
        require(patientContracts[msg.sender] == address(0), "Patient already registered");

        Patient patientContract = new Patient(msg.sender);
        address deployedAddress = address(patientContract);
        require(deployedAddress != address(0), "Failed to deploy Patient contract");

        patientContracts[msg.sender] = deployedAddress;

        emit PatientRegistered(msg.sender, deployedAddress);
    }

    /// @notice Allows doctor to request access to a specific patient
    /// @param patient The wallet address of the patient
    function requestAccess(address patient) external {
        require(patientContracts[patient] != address(0), "Patient is not registered");
        require(!accessRequests[patient][msg.sender], "Access request already sent");

        accessRequests[patient][msg.sender] = true;
        pendingDoctors[patient].push(msg.sender); 

        address patientContract = patientContracts[patient];
        Patient patientContractInstance = Patient(patientContract);

        patientContractInstance.requestAccess(msg.sender);

        emit AccessRequested(patient, msg.sender);
    }

    /// @notice Gets list of doctors who have requested for access to the patient's medical records
    /// @param patient The wallet address of the patient
    function getPendingRequestForPatient(address patient) public view returns (address[] memory) {
        return pendingDoctors[patient]; // Return list of doctors who requested access
    }

    /// @notice Gets the address of the patient contract that is owned by the given patient wallet address
    /// @param patient The wallet address of the patient
    function getPatientContract(address patient) public view returns (address) {
        return patientContracts[patient];
    }

    /// @notice Allows insurance company to request access to a specific patient
    /// @param patient The wallet address of the patient
    function insuranceCompanyRequestAccess(address patient) external {
        require(patientContracts[patient] != address(0), "Patient is not registered");
        require(!insuranceCompanyAccessRequests[patient][msg.sender], "Access request already sent");

        insuranceCompanyAccessRequests[patient][msg.sender] = true;
        pendingInsuranceCompanies[patient].push(msg.sender); 

        address patientContract = patientContracts[patient];
        Patient patientContractInstance = Patient(patientContract);

        patientContractInstance.requestAccess(msg.sender);

        emit InsuranceCompanyAccessRequested(patient, msg.sender);
    }

    /// @notice Gets list of insurance companies who have requested for access to the patient's medical records
    /// @param patient The wallet address of the patient
    function getInsuranceCompanyPendingRequestForPatient(address patient) public view returns (address[] memory) {
        return pendingInsuranceCompanies[patient]; // Return list of doctors who requested access
    }
}



