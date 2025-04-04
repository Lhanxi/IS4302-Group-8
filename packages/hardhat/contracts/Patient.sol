// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/*
Each patient will have their own instance of the contract. Through this contract they grant access or revoke access to their health data
This will store the CID for Web3Storage and manage the encryption keys for doctors who request access. 
*/

contract Patient {
    //owner of the contract is the patient
    address public owner;
    
    // Structure to store record metadata
    struct Record {
        string cid;           // Content Identifier for the record
        address doctor;       // Doctor who created the record
        uint256 timestamp;    // When the record was created
        string recordType;    // Type of record (e.g., "medical", "prescription", "lab")
    }
    
    Record[] public records;  // Array of records with metadata
    string public patientAES; // AES key encrypted with patient's public key
    string public patientPublicKey;
    mapping(address => bool) public accessList;
    mapping(address => string) private encryptedKeys;
    address[] public doctors;

    // Events for tracking record creation
    event RecordAdded(string indexed cid, address indexed doctor, uint256 timestamp, string recordType);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the patient can perform this action");
        _;
    }

    modifier onlyAuthorizedDoctor() {
        require(accessList[msg.sender], "Only authorized doctors can perform this action");
        _;
    }

    constructor (address patient) {
        require(patient != address(0), "Invalid patient address");
        owner = patient;
    }

    // Function for doctors to add new records
    function addRecord(string memory cid, string memory recordType) external onlyAuthorizedDoctor {
        require(bytes(cid).length > 0, "CID cannot be empty");
        require(bytes(recordType).length > 0, "Record type cannot be empty");
        
        records.push(Record({
            cid: cid,
            doctor: msg.sender,
            timestamp: block.timestamp,
            recordType: recordType
        }));
        
        emit RecordAdded(cid, msg.sender, block.timestamp, recordType);
    }

    // Function for patient to view their own records
    function viewOwnRecords() external view onlyOwner returns (
        string[] memory cids,
        address[] memory recordDoctors,
        uint256[] memory timestamps,
        string[] memory recordTypes,
        string memory aesKey,
        string memory publicKey,
        address[] memory authorizedDoctors
    ) {
        uint recordCount = records.length;
        cids = new string[](recordCount);
        recordDoctors = new address[](recordCount);
        timestamps = new uint256[](recordCount);
        recordTypes = new string[](recordCount);
        
        for(uint i = 0; i < recordCount; i++) {
            cids[i] = records[i].cid;
            recordDoctors[i] = records[i].doctor;
            timestamps[i] = records[i].timestamp;
            recordTypes[i] = records[i].recordType;
        }
        
        aesKey = patientAES;
        publicKey = patientPublicKey;
        
        // Create array of authorized doctors
        uint count = 0;
        for(uint i = 0; i < doctors.length; i++) {
            if(accessList[doctors[i]]) {
                count++;
            }
        }
        
        authorizedDoctors = new address[](count);
        uint index = 0;
        for(uint i = 0; i < doctors.length; i++) {
            if(accessList[doctors[i]]) {
                authorizedDoctors[index] = doctors[i];
                index++;
            }
        }
    }

    // Function to get a specific record by index
    function getRecordByIndex(uint index) external view onlyOwner returns (
        string memory cid,
        address doctor,
        uint256 timestamp,
        string memory recordType
    ) {
        require(index < records.length, "Index out of bounds");
        Record memory record = records[index];
        return (record.cid, record.doctor, record.timestamp, record.recordType);
    }

    // Function to get records by doctor
    function getRecordsByDoctor(address doctor) external view onlyOwner returns (
        string[] memory cids,
        uint256[] memory timestamps,
        string[] memory recordTypes
    ) {
        require(doctor != address(0), "Invalid doctor address");
        
        // Count records by this doctor
        uint count = 0;
        for(uint i = 0; i < records.length; i++) {
            if(records[i].doctor == doctor) {
                count++;
            }
        }
        
        // Create arrays for the records
        cids = new string[](count);
        timestamps = new uint256[](count);
        recordTypes = new string[](count);
        
        // Fill arrays with matching records
        uint index = 0;
        for(uint i = 0; i < records.length; i++) {
            if(records[i].doctor == doctor) {
                cids[index] = records[i].cid;
                timestamps[index] = records[i].timestamp;
                recordTypes[index] = records[i].recordType;
                index++;
            }
        }
    }

    // Function to get total number of records
    function getTotalRecords() external view onlyOwner returns (uint) {
        return records.length;
    }

    // Function to check if a specific doctor has access
    function checkDoctorAccess(address doctor) external view onlyOwner returns (bool) {
        require(doctor != address(0), "Invalid doctor address");
        return accessList[doctor];
    }

    // Function to get list of all doctors who have requested access
    function getRequestingDoctors() external view onlyOwner returns (address[] memory) {
        return doctors;
    }

    function grantAccess(address doctor, string memory encryptedKey) external onlyOwner {
        require(doctor != address(0), "Invalid doctor address");
        require(bytes(encryptedKey).length > 0, "Encrypted key cannot be empty");
        require(!accessList[doctor], "Doctor already has access");
        
        accessList[doctor] = true;
        encryptedKeys[doctor] = encryptedKey;
    }

    function requestAccess(address doctor) external {
        require(doctor != address(0), "Invalid doctor address");
        require(doctor != owner, "Patient cannot request access to themselves");
        require(!accessList[doctor], "Doctor already has access");
        
        doctors.push(doctor);  // Store the doctor address in the array
        accessList[doctor] = false;  //set the initial request as false
    }

    function revokeAccess(address doctor) public onlyOwner {
        require(doctor != address(0), "Invalid doctor address");
        require(accessList[doctor], "Doctor does not have access");
        
        accessList[doctor] = false;
    }

    function getEncryptionKey() external view returns (string memory) {
        require(accessList[msg.sender], "Access denied"); 
        return encryptedKeys[msg.sender]; 
    }

    function getDoctorEncryptionKey(address doctor) external view onlyOwner returns (string memory) {
        require(doctor != address(0), "Invalid doctor address");
        return encryptedKeys[doctor];
    }

    /*function checkDoctorAccess(address doctor) external view returns (bool) {
        require(doctor != address(0), "Invalid doctor address");
        return accessList[doctor];
    }

    function addCID(string memory newCID) external onlyOwner {
        require(bytes(newCID).length > 0, "CID cannot be empty");
        CID.push(newCID);
    }

    function getCIDs() external view returns (string[] memory) {
        return CID;
    }*/
 
    function getAES() external view onlyOwner returns (string memory) {
        return patientAES;
    }

    function setPatientPublicKey(string memory publicKey) external onlyOwner {
        require(bytes(publicKey).length > 0, "Public key cannot be empty");
        patientPublicKey = publicKey;
    }

    function setEncryptedAESKey(string memory encryptedAES) external onlyOwner {
        require(bytes(encryptedAES).length > 0, "Encrypted AES key cannot be empty");
        patientAES = encryptedAES;
    }

    function setDoctorEncryptedAES(address doctor, string memory encryptedAES) external onlyOwner {
        require(doctor != address(0), "Invalid doctor address");
        require(bytes(encryptedAES).length > 0, "Encrypted AES key cannot be empty");
        encryptedKeys[doctor] = encryptedAES;
    }
}