// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./PatientHandler.sol";
import "./Patient.sol";

contract HealthRecordManager {
    PatientHandler public patientHandler;

    event WalletConnected(address user);
    event PatientDataRetrieved(address patient, address requester);

    constructor(address _patientHandler) {
        patientHandler = PatientHandler(_patientHandler);
    }

    function connectWallet() public {
        emit WalletConnected(msg.sender);
    }

    // Read patient data
    function getPatientData(
        address patient
    ) public view returns (string memory) {
        address patientContractAddress = patientHandler.patientContracts(
            patient
        );
        require(patientContractAddress != address(0), "Patient not registered");

        Patient patientContract = Patient(payable(patientContractAddress));

        // If the requester is the patient, allow access
        if (msg.sender == patient) {
            return patientContract.getCID(msg.sender);
        }

        // If the requester is a doctor with access, allow access
        if (patientContract.accessList(msg.sender)) {
            return patientContract.getCID(msg.sender);
        }

        // If neither condition is met, access is denied
        revert("Access denied");
    }
}
