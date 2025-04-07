const connectWalletTestABI = ["function connectWalletTest() public"]

const doctorABI = ["function getPublicKey() public view returns (string memory)"]

const doctorHandlerABI = [
    "function authenticateDoctor(address _doctor, string memory _publicKey) external",
    "function isAuthenticated(address _doctor) view external returns (bool)",
    "function removeDoctor(address _doctor) public",
    "function getDoctorContractAddress(address _doctor) view public returns (address)"
]

const patientABI = [
    "function grantAccess(address doctor, string memory encryptedKey) external",
    "function requestAccess(address doctor) external",
    "function revokeAccess(address doctor) public",
    "function getEncryptionKey() external view returns (string memory)",
    "function getDoctorEncryptionKey(address doctor) external view returns (string memory)",
    "function checkDoctorAccess(address doctor) external view returns (bool)",
    "function addCID(string memory newCID) external",
    "function getCIDs() external view returns (string[] memory)",
    "function getAES() external view returns (string memory)",
    "function setPatientPublicKey(string memory publicKey) external",
    "function setEncryptedAESKey(string memory encryptedAES) external",
    "function setDoctorEncryptedAES(address doctor, string memory encryptedAES) external",
    "function insuranceCompanyRequestAccess(address insuranceCompany) external",
    "function insuranceCompanyRevokeAccess(address insuranceCompany) public",
    "function getInsuranceCompanyEncryptionKey(address insuranceCompany) external view returns (string memory)", 
    "function setInsuranceCompanyEncryptedAES(address insuranceCompany, string memory encryptedAES) external",
    "function grantInsuranceCompanyAccess(address insuranceCompany, string memory encryptedKey) external",
    "function doctorRequestAccess(address doctor) external",
    "function setResearchAccess(bool researchAccess) external",
    "function getResearchAccess() public view returns (bool)"
]

const patientHandlerABI = [
    "function registerPatient() external",
    "function requestAccess(address patient) external",
    "function setPatientPublicKey(string memory publicKey) public",
    "function getPendingRequestForPatient(address patient) public view returns (address[] memory)",
    "function getPatientContract(address patient) public view returns (address)",
    "function insuranceCompanyRequestAccess(address patient) external",
    "function getInsuranceCompanyPendingRequestForPatient(address patient) public view returns (address[] memory)"
]

const researchAccessABI = [
    "function addCID(string memory newCID) external",
    "function getCIDs() external view returns (string[] memory)"
]

const insuranceCompanyHandlerABI = [
    "function authenticateInsuranceCompany(address _insuranceCompany, string memory _publicKey) external",
    "function isAuthenticated(address _insuranceCompany) view external returns (bool)",
    "function removeInsuranceCompany(address _insuranceCompany) public",
    "function getDoctorContractAddress(address _insuranceCompany) view public returns (address)"
]

const insuranceCompanyABI = [
    "function getPublicKey() public view returns (string memory)"
]

export { insuranceCompanyABI, insuranceCompanyHandlerABI, connectWalletTestABI, doctorABI, doctorHandlerABI, patientABI, patientHandlerABI, researchAccessABI }