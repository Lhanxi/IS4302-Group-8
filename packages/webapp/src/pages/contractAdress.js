const PatientHandlerAddress = "0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154"; 
const PatientAddress = "0x9bd03768a7DCc129555dE410FF8E85528A4F88b5";
const DoctorHandlerAddress = " 0x82e01223d51Eb87e16A03E24687EDF0F294da6f1";
const ResearchAccessAddress = "0x7969c5eD335650692Bc04293B07F5BF2e7A673C0";

const ResearchAccessABI = [
    "function addCID(string memory newCID) external", 
    "function getCIDs() external view returns (string[] memory)"
]

export { PatientAddress, PatientHandlerAddress, DoctorHandlerAddress, ResearchAccessAddress};