// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./HealthRecordManager.sol";

// Doctors: Read & Write to patient's records

contract Doctor {
    HealthRecordManager public healthRecordManager;
    address public owner;

    constructor(address doctor, address _healthRecordManagerAddress) {
        owner = doctor;
        healthRecordManager = HealthRecordManager(_healthRecordManagerAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this function");
        _;
    }

    function readRecord(address patient) private view onlyOwner returns (string memory) {
        return healthRecordManager.getPatientData(patient);
    }
    
    function updateRecord(address patient, string memory data) public onlyOwner {
        healthRecordManager.updatePatientData(patient, data);
    }
}