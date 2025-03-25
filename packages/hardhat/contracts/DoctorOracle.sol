// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.0;
 
 contract DoctorOracle {
     address public owner;
     
     // Mapping from a doctor's address to their name.
     mapping(address => string) public doctorName;
 
     // Events for logging changes.
     event DoctorAdded(address indexed doctor, string name);
     event DoctorRemoved(address indexed doctor);
 
     // Modifier to restrict access to the contract owner.
     modifier onlyOwner() {
         require(msg.sender == owner, "Not authorized");
         _;
     }
 
     constructor() {
         owner = msg.sender;
     }
 
     /// @notice Adds a new doctor to the oracle.
     /// @param _doctor The wallet address of the doctor.
     /// @param _name The name of the doctor (must be non-empty).
     function addDoctor(address _doctor, string calldata _name) external onlyOwner {
         require(bytes(_name).length > 0, "Doctor name must be non-empty");
         doctorName[_doctor] = _name;
         emit DoctorAdded(_doctor, _name);
     }
 
     /// @notice Batch adds multiple doctors to the oracle.
     /// @param _doctors An array of wallet addresses.
     /// @param _names An array of doctor names corresponding to the addresses.
     function batchAddDoctor(address[] calldata _doctors, string[] calldata _names) external onlyOwner {
         require(_doctors.length == _names.length, "Input arrays must have the same length");
         for (uint i = 0; i < _doctors.length; i++) {
             doctorName[_doctors[i]] = _names[i];
             emit DoctorAdded(_doctors[i], _names[i]);
         }
     }
 
     /// @notice Removes a doctor from the oracle.
     /// @param _doctor The wallet address of the doctor to remove.
     function removeDoctor(address _doctor) external onlyOwner {
         delete doctorName[_doctor];
         emit DoctorRemoved(_doctor);
     }
 
     /// @notice Batch removes doctors from the oracle.
     /// @param _doctors An array of wallet addresses to remove.
     function batchRemoveDoctor(address[] calldata _doctors) external onlyOwner {
         for (uint i = 0; i < _doctors.length; i++) {
             delete doctorName[_doctors[i]];
             emit DoctorRemoved(_doctors[i]);
         }
     }
 
     /// @notice Verifies whether a given address is registered as a doctor.
     /// @param _doctor The wallet address to verify.
     /// @return Returns true if the doctor is registered (i.e. name is non-empty), false otherwise.
     function verifyDoctor(address _doctor) external view returns (bool) {
         return bytes(doctorName[_doctor]).length > 0;
     }
 }