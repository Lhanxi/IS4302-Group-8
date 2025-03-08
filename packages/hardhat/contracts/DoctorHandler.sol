// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Doctor.sol";

/*
DoctorHandler contract acts like a registry for all doctors and their contracts. 
An external oracle will be used to confirm the Doctor's identity
*/

contract DoctorHandler {
    address private owner = msg.sender;
    address public healthRecordManagerAddress;

    mapping(address => address) public doctorContracts; // Maps doctors to their contract
    mapping(address => bool) public authenticationStatus; // Tracks authentication status, false means pending authentication, true means accepted

    event DoctorRegistered(address indexed doctor, address contractAddress);
    event DoctorAuthenticated(address indexed doctor);

    constructor(address _healthRecordManagerAddress) {
        healthRecordManagerAddress = _healthRecordManagerAddress;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this function");
        _;
    }

    function registerDoctor() external {
        require(doctorContracts[msg.sender] == address(0), "Doctor already registered");

        Doctor doctorContract = new Doctor(msg.sender, healthRecordManagerAddress);
        doctorContracts[msg.sender] = address(doctorContract);

        emit DoctorRegistered(msg.sender, address(doctorContract));
    }

    function authenticate(address doctor) external onlyOwner {
        require(doctorContracts[doctor] != address(0), "Doctor is not registered");
        require(authenticationStatus[doctor] == false, "Doctor already authenticated");

        authenticationStatus[doctor] = true;

        emit DoctorAuthenticated(doctor);
    }

    function removeDoctor(address doctor) public {
        require(msg.sender == owner || msg.sender == doctor, "Only owner or doctor in question can perform this function");
        delete doctorContracts[doctor];
    }
}