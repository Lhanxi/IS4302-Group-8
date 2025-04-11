// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/*
Each patient will have their own instance of the contract. Through this contract they grant access or revoke access to their health data
This will store the CID for Web3Storage and manage the encryption keys for doctors who request access. 
*/

contract Patient {
    //owner of the contract is the patient
    address public owner;
    string[] public CID; // this is where the data is stored on the IFPS
    string public patientAES; //this is the AES key that is used to encrypt datat, it is encrypted with the patient public key
    string public patientPublicKey; //this is the 
    mapping(address => bool) public doctorAccessList; //tracks whether a doctor has been given access
    mapping(address => string) private doctorEncryptedKeys; //the AES key for doctors 
    mapping(address => bool) public insuranceCompanyAccessList; //tracks whether a insurance company has been given access
    mapping(address => string) private insuranceCompanyEncryptedKeys; //the AES key for insurance company 
    address[] public doctors;
    address[] public insuranceCompanies;
    bool public allowResearchAccess;

    constructor (address patient) {
        owner = patient;
    }

    // Modifier to restrict access to the contract owner (patient).
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the patient can perform this action");
        _;
    }

    /// @notice Grants doctor access to the patient's medical records
    /// @param doctor The wallet address of the doctor
    /// @param encryptedKey The doctor's encrypted key
    function grantAccess(address doctor, string memory encryptedKey) external onlyOwner {
        doctorAccessList[doctor] = true;
        doctorEncryptedKeys[doctor] = encryptedKey; 
    }

    /// @notice Allows a doctor to send a request to this contract to access the patient's medical records.
    /// @param doctor The wallet address of the doctor who has requested access
    function requestAccess(address doctor) external {
        require(doctor != owner, "Patient cannot request access to themselves");
        doctors.push(doctor);  // Store the doctor address in the array
        doctorAccessList[doctor] = false;  //set the initial request as false
    }

    /// @notice Revokes doctor access to the patient's medical records
    /// @param doctor The wallet address of the doctor
    function revokeAccess(address doctor) public onlyOwner {
        doctorAccessList[doctor] = false;
        doctorEncryptedKeys[doctor] = ""; //remove the AES key of the doctor
    }

    /// @notice Retrieves the encryption key of the transaction sender, provided the sender is a registered doctor.
    function getEncryptionKey() external view returns (string memory) {
        require(doctorAccessList[msg.sender], "Access denied"); 
        return doctorEncryptedKeys[msg.sender]; 
    }

    /// @notice Retrieves the encryption key of the doctor
    /// @param doctor The wallet address of the doctor to get encryption key
    function getDoctorEncryptionKey(address doctor) external view returns (string memory) {
        return doctorEncryptedKeys[doctor];
    }

    /// @notice Checks doctor's access
    /// @param doctor The wallet address of the doctor
    function checkDoctorAccess(address doctor) external view returns (bool) {
        return doctorAccessList[doctor];
    }

    /// @notice Adds CID of a new patient medical record
    /// @param newCID The CID of the patient medical record
    function addCID(string memory newCID) external {
        CID.push(newCID);
    }

    /// @notice Get the list of CID for all medical records belonging to the patient
    function getCIDs() external view returns (string[] memory) {
        return CID;
    }

    /// @notice Get the patient's AES key
    function getAES() external view returns (string memory) {
        return patientAES;
    }

    /// @notice Set the patient's public key
    function setPatientPublicKey(string memory publicKey) external {
        patientPublicKey = publicKey;
    }

    /// @notice Set the patient's encrypted AES key. This AES key can be used by the patient to decrypt the patient's medical records.
    function setEncryptedAESKey(string memory encryptedAES) external onlyOwner {
        patientAES = encryptedAES;
    }

    /// @notice Set the doctor's encrypted AES key. This AES key can be used by the doctor to decrypt the patient's medical records.
    function setDoctorEncryptedAES(address doctor, string memory encryptedAES) external onlyOwner {
        doctorEncryptedKeys[doctor] = encryptedAES;
    }

    /// @notice Allows insurance company to send a request to this contract to access the patient's medical records.
    /// @param insuranceCompany The wallet address of the insurance company who has requested access
    function insuranceCompanyRequestAccess(address insuranceCompany) external {
        require(insuranceCompany != owner, "Patient cannot request access to themselves");
        insuranceCompanies.push(insuranceCompany);  // Store the doctor address in the array
        insuranceCompanyAccessList[insuranceCompany] = false;  //set the initial request as false
    }

    /// @notice Revokes insurance company access to the patient's medical records
    /// @param insuranceCompany The wallet address of the insurance company
    function insuranceCompanyRevokeAccess(address insuranceCompany) public onlyOwner {
        insuranceCompanyAccessList[insuranceCompany] = false;
        insuranceCompanyEncryptedKeys[insuranceCompany] = ""; //remove the AES key of the insurance company
    }

    /// @notice Retrieves the encryption key of the insurance company
    /// @param insuranceCompany The wallet address of the insurance company to get encryption key
    function getInsuranceCompanyEncryptionKey(address insuranceCompany) external view returns (string memory) {
        return insuranceCompanyEncryptedKeys[insuranceCompany];
    }

    /// @notice Set the insurance company's encrypted AES key. This AES key can be used by the insurance company to decrypt the patient's medical records.
    function setInsuranceCompanyEncryptedAES(address insuranceCompany, string memory encryptedAES) external onlyOwner {
        insuranceCompanyEncryptedKeys[insuranceCompany] = encryptedAES;
    }

    /// @notice Checks insurance company's access
    /// @param insuranceCompany The wallet address of the insurance company
    function checkInsuranceCompanyAccess(address insuranceCompany) external view returns (bool) {
        return insuranceCompanyAccessList[insuranceCompany];
    }

    /// @notice Grants the insurance company access to the patient's medical records
    /// @param insuranceCompany The wallet address of the insurance company
    /// @param encryptedKey The insurance company's encrypted key
    function grantInsuranceCompanyAccess(address insuranceCompany, string memory encryptedKey) external onlyOwner {
        insuranceCompanyAccessList[insuranceCompany] = true;
        insuranceCompanyEncryptedKeys[insuranceCompany] = encryptedKey; 
    }

    /// @notice Allows patients to toggle permissions on whether their data can be used for research purposes
    /// @param researchAccess A boolean value indicating whether the patient permits their data to be used for research purposes.
    function setResearchAccess(bool researchAccess) external onlyOwner {
        allowResearchAccess = researchAccess; 
    }

    /// @notice Gets the boolean value indicating whether the patient has permitted their data to be used for research purposes.
    function getResearchAccess() public view returns (bool) {
        return allowResearchAccess;
    }
}