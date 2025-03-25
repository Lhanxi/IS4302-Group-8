import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pinata } from "../utils/config";
import { PatientHandlerAddress } from "./contractAdress";
import forge from 'node-forge';
import { ethers } from 'ethers';
import { teal } from "@mui/material/colors";
import encryptPatientData from "./encryptPatientData";

function UploadPatientData() {
    const [patientName, setPatientName] = useState("");
    const [identificationNumber, setIdentificationNumber] = useState("");
    const [healthRecords, setHealthRecords] = useState("");
    const [patientAccount, setPatientAccount] = useState("");  // New state for patient account
    const [doctorPrivateKey, setDoctorPrivateKey] = useState(""); // New state for doctor private key
    const [error, setError] = useState("");
    const [provider, setProvider] = useState(null);
    const [error1, setError1] = useState(null);

    const navigate = useNavigate();
    
    const patientHandlerAbi = [
        "function getPatientContract(address patient) public view returns (address)",
    ]
    const patientAbi = [
        "function getDoctorEncryptionKey(address doctor) external view returns (string memory)",
        "function addCID(string memory newCID) external",
    ]

    const getSigner = async () => {
        if (!window.ethereum) {
          console.log("MetaMask not installed");
          alert("Please install MetaMask!");
          return null;
        }
        try {
          console.log("Requesting MetaMask accounts...");
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          await newProvider.send("eth_requestAccounts", []);
          setProvider(newProvider);
          const signer = await newProvider.getSigner();
          console.log("Signer obtained:", signer);
          return signer;
        } catch (error) {
          console.error("Error creating signer:", error);
          setError1("Error creating signer. Please check MetaMask.");
          return null;
        }
      };

    const decryptAESKey =  (encryptedAES, privateKey) => {
        return "decryptedKey";
    };

    // Function to handle patient account submission
    const handleAccountSubmit = () => {
        if (!patientAccount) {
            setError("Patient account is required.");
            return;
        }

        // Store the patient account or submit it to a backend
        console.log("Patient Account set:", patientAccount);
        setError("");  // Clear error on successful account set
    };

    // Function to handle doctor private key input and store it
    const handleDoctorPrivateKeySubmit = () => {
        if (!doctorPrivateKey) {
            setError("Doctor private key is required.");
            return;
        }

        // Store the doctor private key or submit it securely
        console.log("Doctor Private Key set:", doctorPrivateKey);
        setError("");  // Clear error on successful key set
    };

    const handleSubmit = async () => {
        try {
            if (!patientName || !identificationNumber || !healthRecords) {
                setError("All fields are required.");
                return;
            }

            //get the patient contract and get the AES key 
            const signer = await getSigner(); 
            const patientHandler = await new ethers.Contract(PatientHandlerAddress, patientHandlerAbi, signer);
            const patientContractAddress = await patientHandler.getPatientContract(patientAccount);
            const patientContract = await new ethers.Contract(patientContractAddress, patientAbi, signer);

            //get the doctor's encrypted AES key and decrypt the AES key
            const encryptedAES = await patientContract.getDoctorEncryptionKey(await signer.getAddress());
            const decryptedAESKey = await decryptAESKey(encryptedAES, doctorPrivateKey); 
            
            const patientData = {
                name: patientName,
                identificationNumber,
                healthRecords,
                account: patientAccount,  // Include patient account in the data
                timestamp: new Date().toISOString(),
            };

            //encrypt with the AES Key
            const encryptedPatientFile = await encryptPatientData(patientData, decryptedAESKey);

            //const jsonBlob = new Blob([JSON.stringify(patientData, null, 2)], { type: "application/json" });
            //const jsonFile = new File([jsonBlob], "patient_data.json", { type: "application/json" });

            // Log the file data to ensure it's correctly created
            console.log("File being uploaded:", encryptedPatientFile);

            // Log the Pinata instance and methods to confirm everything is set up correctly
            console.log("Pinata instance:", pinata);
            console.log("Pinata upload method:", pinata.upload);
            console.log("File upload function exists?", typeof pinata.upload.public.file);

            // Attempt the file upload
            const upload = await pinata.upload.public.file(encryptedPatientFile);

            if (!upload.cid) throw new Error("Failed to upload to IPFS");

            console.log("Uploaded to IPFS:", upload.cid);

            //Upload the data and upload the CID for the patients
            await patientContract.addCID(upload.cid);

            navigate(`/display/${upload.cid}`);

        } catch (error) {
            // Log detailed error information
            console.error("Upload failed:", error);
            setError("File upload failed. Please try again.");
        }
    };

    return (
        <div>
            <h2>Upload Patient Data</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Patient Account Section */}
            <label>Patient Account:</label>
            <input
                type="text"
                value={patientAccount}
                onChange={(e) => setPatientAccount(e.target.value)}
            />
            <button onClick={handleAccountSubmit}>Set Account</button> {/* Button to submit and store the account */}

            {/* Doctor Private Key Section */}
            <label>Doctor Private Key:</label>
            <input
                type="text"
                value={doctorPrivateKey}
                onChange={(e) => setDoctorPrivateKey(e.target.value)}
            />
            <button onClick={handleDoctorPrivateKeySubmit}>Set Doctor Private Key</button> {/* Button to submit and store the private key */}

            <label>Name:</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} />

            <label>Identification Number:</label>
            <input type="text" value={identificationNumber} onChange={(e) => setIdentificationNumber(e.target.value)} />

            <label>Health Records:</label>
            <textarea value={healthRecords} onChange={(e) => setHealthRecords(e.target.value)} />

            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default UploadPatientData;
