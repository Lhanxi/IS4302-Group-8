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

    event PatientRegistered(address indexed patient, address contractAddress);
    event AccessRequested(address indexed patient, address indexed doctor);

    function registerPatient() external {
        require(msg.sender != address(0), "Invalid sender address");
        require(patientContracts[msg.sender] == address(0), "Patient already registered");

        Patient patientContract = new Patient(msg.sender);
        address deployedAddress = address(patientContract);
        require(deployedAddress != address(0), "Failed to deploy Patient contract");

        patientContracts[msg.sender] = deployedAddress;

        emit PatientRegistered(msg.sender, deployedAddress);
    }

    function requestAccess(address patient) external {
        require(msg.sender != address(0), "Invalid sender address");
        require(patient != address(0), "Invalid patient address");
        require(patientContracts[patient] != address(0), "Patient is not registered");
        require(!accessRequests[patient][msg.sender], "Access request already sent");

        accessRequests[patient][msg.sender] = true;
        pendingDoctors[patient].push(msg.sender); 

        address patientContract = patientContracts[patient];
        Patient patientContractInstance = Patient(patientContract);

        patientContractInstance.requestAccess(msg.sender);

        emit AccessRequested(patient, msg.sender);
    }

    function setPatientPublicKey(string memory publicKey) public {
        require(msg.sender != address(0), "Invalid sender address");
        require(bytes(publicKey).length > 0, "Public key cannot be empty");
        require(patientContracts[msg.sender] != address(0), "Patient not registered");
        
        patientPublicKeys[msg.sender] = publicKey;
        
        // Update the patient's contract with the public key
        address patientContract = patientContracts[msg.sender];
        Patient patientContractInstance = Patient(patientContract);
        patientContractInstance.setPatientPublicKey(publicKey);
    }

    function getPendingRequestForPatient(address patient) public view returns (address[] memory) {
        require(patient != address(0), "Invalid patient address");
        require(patientContracts[patient] != address(0), "Patient not registered");
        return pendingDoctors[patient]; // Return list of doctors who requested access
    }

    function getPatientContract(address patient) public view returns (address) {
        require(patient != address(0), "Invalid patient address");
        return patientContracts[patient];
    }
}



