const PatientHandlerAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"; 
const PatientAddress = "0x9bd03768a7DCc129555dE410FF8E85528A4F88b5";
const DoctorHandlerAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
const ResearchAccessAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";

const ResearchAccessABI = [
    "function addCID(string memory newCID) external", 
    "function getCIDs() external view returns (string[] memory)"
]

export { PatientAddress, PatientHandlerAddress, DoctorHandlerAddress, ResearchAccessAddress, ResearchAccessABI};