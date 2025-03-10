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

    event PatientRegistered(address indexed patient, address contractAddress);
    event AccessRequested(address indexed patient, address indexed doctor);

    function registerPatient() external {
        require(patientContracts[msg.sender] == address(0), "Patient already registered");

        Patient patientContract = new Patient(msg.sender);
        patientContracts[msg.sender] = address(patientContract);

        emit PatientRegistered(msg.sender, address(patientContract));
    }

    function requestAccess(address patient) external {
        require(patientContracts[patient] != address(0), "Patient is not registered");
        require(!accessRequests[patient][msg.sender], "Access request already sent");

        accessRequests[patient][msg.sender] = true;
        pendingDoctors[patient].push(msg.sender); // Store doctor address

        emit AccessRequested(patient, msg.sender);
    }

    //grant access

    //emit an event for read and writing of data

    function getPendingRequestForPatient(address patient) public view returns (address[] memory) {
        return pendingDoctors[patient]; // Return list of doctors who requested access
    }
}



