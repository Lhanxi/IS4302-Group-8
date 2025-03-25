import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import forge from "node-forge";
import { decryptAESKey } from "./DecryptAES";
import { ethers } from 'ethers';
import { PatientHandlerAddress } from "./contractAdress";
import decryptPatientData from "./decryptPatientData";

function DisplayPatientPage() {
    const { cid } = useParams();
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState("");
    const [privateKey, setPrivateKey] = useState(""); // State for the doctor's private key
    const [decryptedData, setDecryptedData] = useState(null); // State to hold decrypted patient data
    const [provider, setProvider] = useState(null);
    const [error1, setError1] = useState(null);
    const [patientAccount, setPatientAccount] = useState(""); // State for patient account input

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

    useEffect(() => {
        const fetchData = async () => {
            if (!cid) {
                setError("CID not provided");
                return;
            }

            try {
                const response = await fetch(`http://localhost:5001/fetch-ipfs?cid=${cid}`);
                if (!response.ok) throw new Error("Failed to fetch patient data");

                const data = await response.json();
                setPatientData(data);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message);
            }
        };

        fetchData();
    }, [cid]);

    // Function to handle private key input
    const handlePrivateKeyChange = (event) => {
        setPrivateKey(event.target.value);
    };

    // Function to handle patient account input
    const handlePatientAccountChange = (event) => {
        setPatientAccount(event.target.value);
    };

    // Function to handle decryption after private key is entered
    const handleDecryption = async () => {
        if (!patientData || !privateKey || !patientAccount) {
            setError("Please provide patient data, a private key, and a patient account.");
            return;
        }

        const signer = await getSigner(); 
        console.log("Signer obtained:", signer);

        const patientHandler = await new ethers.Contract(PatientHandlerAddress, patientHandlerAbi, signer);
        console.log("Patient handler contract:", patientHandler);

        const patientContractAddress = await patientHandler.getPatientContract(patientAccount);
        console.log("Patient contract address:", patientContractAddress);

        const patientContract = await new ethers.Contract(patientContractAddress, patientAbi, signer);
        console.log("Patient contract:", patientContract);

        const encryptedAESKey = await patientContract.getDoctorEncryptionKey(await signer.getAddress());
        console.log("Encrypted AES Key:", encryptedAESKey);

        // Step 1: Decrypt the AES key using RSA private key
        const decryptedAESKey = await decryptAESKey(encryptedAESKey, privateKey);
        console.log("Decrypted AES Key:", decryptedAESKey);

        // Step 2: Decrypt the patient data using AES key
        const decryptedPatientData = await decryptPatientData(patientData, decryptedAESKey);
        if (decryptedPatientData) {
            setDecryptedData(decryptedPatientData);
        }
    };

    return (
        <div>
            <h2>Patient Data</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            
            {/* Input for doctor's private key */}
            <div>
                <label htmlFor="privateKey">Enter Doctor's Private Key:</label>
                <textarea
                    id="privateKey"
                    rows="5"
                    cols="50"
                    value={privateKey}
                    onChange={handlePrivateKeyChange}
                />
            </div>

            {/* Input for patient's account */}
            <div>
                <label htmlFor="patientAccount">Enter Patient's Account:</label>
                <input
                    type="text"
                    id="patientAccount"
                    value={patientAccount}
                    onChange={handlePatientAccountChange}
                    placeholder="Enter patient account"
                />
            </div>

            <button onClick={handleDecryption}>Decrypt Data</button>

            {decryptedData ? (
                <div>
                    <p><strong>Name:</strong> {decryptedData.name}</p>
                    <p><strong>Identification Number:</strong> {decryptedData.identificationNumber}</p>
                    <p><strong>Health Records:</strong> {decryptedData.healthRecords}</p>
                    <p><strong>Timestamp:</strong> {decryptedData.timestamp}</p>
                </div>
            ) : (
                !error && <p>Loading patient data...</p>
            )}
        </div>
    );
}

export default DisplayPatientPage;
