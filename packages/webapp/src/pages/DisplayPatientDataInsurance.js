import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { decryptAESKey } from "../utils/DecryptAES";
import { ethers } from 'ethers';
import { patientHandlerAddress } from "../utils/contractAddress";
import { patientABI, patientHandlerABI } from "../utils/contractABI";
import decryptPatientData from "../utils/decryptPatientData";
import axios from 'axios'; // ✅ fetch private key from backend

function DisplayPatientInsurancePage() {
    const [allDecryptedData, setAllDecryptedData] = useState([]);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState("");
    const [decryptedData, setDecryptedData] = useState(null);
    const [provider, setProvider] = useState(null);
    const [error1, setError1] = useState(null);
    const [patientAccount, setPatientAccount] = useState("");
    const [pin, setPin] = useState(""); // ✅ pin instead of private key

    const patientHandlerAbi = patientHandlerABI;
    const patientAbi = patientABI;

    const getSigner = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return null;
        }
        try {
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            await newProvider.send("eth_requestAccounts", []);
            setProvider(newProvider);
            return await newProvider.getSigner();
        } catch (error) {
            console.error("Error creating signer:", error);
            setError1("Error creating signer. Please check MetaMask.");
            return null;
        }
    };

    const getPrivateKey = async (address, pin) => {
        try {
            const response = await axios.get(`http://localhost:5001/get-private-key/${address}/${pin}`);
            return response.data.privateKey;
        } catch (err) {
            console.error("Failed to fetch private key:", err);
            throw new Error("Private key fetch failed.");
        }
    };

    const handleDecryption = async () => {
        if (!pin || !patientAccount) {
            setError("Please provide your PIN and the patient's account.");
            return;
        }

        try {
            const signer = await getSigner();
            const insuranceAddress = await signer.getAddress();
            const privKey = await getPrivateKey(insuranceAddress, pin);

            const patientHandler = new ethers.Contract(patientHandlerAddress, patientHandlerAbi, signer);
            const patientContractAddress = await patientHandler.getPatientContract(patientAccount);
            const patientContract = new ethers.Contract(patientContractAddress, patientAbi, signer);

            const encryptedAESKey = await patientContract.getInsuranceCompanyEncryptionKey(insuranceAddress);
            const decryptedAESKey = await decryptAESKey(encryptedAESKey, privKey);

            const cids = await patientContract.getCIDs();
            const records = [];

            for (const cid of cids) {
                const response = await fetch(`http://localhost:5001/fetch-ipfs?cid=${cid}`);
                if (!response.ok) throw new Error("Failed to fetch patient data");

                const encryptedData = await response.json();
                const decryptedData = await decryptPatientData(encryptedData, decryptedAESKey);
                if (decryptedData) {
                    records.push(decryptedData);
                }
            }

            setAllDecryptedData(records);
        } catch (error) {
            console.error("Error during decryption:", error);
            setError("Error during decryption. Please try again.");
        }
    };

    return (
        <div>
            <h2>Patient Data</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Patient account input */}
            <div>
                <label htmlFor="patientAccount">Enter Patient's Account:</label>
                <input
                    type="text"
                    id="patientAccount"
                    value={patientAccount}
                    onChange={(e) => setPatientAccount(e.target.value)}
                    placeholder="Enter patient account"
                />
            </div>

            {/* PIN input */}
            <div>
                <label htmlFor="pin">Enter Your PIN:</label>
                <input
                    type="password"
                    id="pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your PIN"
                />
            </div>

            <button onClick={handleDecryption}>Decrypt Data</button>

            {allDecryptedData.length > 0 && (
                <div>
                    <h3>Decrypted Patient Records:</h3>
                    {allDecryptedData.map((record, idx) => (
                        <div key={idx} style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
                            <p><strong>Name:</strong> {record.name}</p>
                            <p><strong>ID:</strong> {record.identificationNumber}</p>
                            <p><strong>Gender:</strong> {record?.gender || ""}</p>
                            <p><strong>Age:</strong> {record?.age || ""}</p>
                            <p><strong>Health:</strong> {record.healthRecords}</p>
                            <p><strong>Timestamp:</strong> {record.timestamp}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DisplayPatientInsurancePage;
