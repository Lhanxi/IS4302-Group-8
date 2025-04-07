import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { ethers } from 'ethers';
import { Link, useNavigate } from 'react-router-dom';
import {  patientHandlerAddress, doctorHandlerAddress  } from "../utils/contractAddress";
import { patientHandlerABI, patientABI, doctorHandlerABI, doctorABI } from "../utils/contractABI";
import encryptAESKey from '../utils/EncryptAES';
import { decryptAESKey } from '../utils/DecryptAES';
import axios from 'axios';

const PatientPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientHandlerContract, setPatientHandlerContract] = useState(null);
    const [patientContract, setPatientContract] = useState(null);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState(null);
    const [requestSigner, setSigner] = useState(null);
    const [requestProvider, setProvider] = useState(null);

    // State for private key input
    const [showPrivateKeyForm, setShowPrivateKeyForm] = useState(false);
    const [privateKey, setPrivateKey] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [pin, setPin] = useState("");

    const [allowAccess, setAllowAccess] = useState(false); 

    const navigate = useNavigate();


    const patientHandlerAbi = patientHandlerABI;
    const patientAbi = patientABI;
    const doctorHandlerAbi = doctorHandlerABI;
    const doctorAbi = doctorABI;

    const getProviderAndSigner = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return null;
        }

        console.log("Initializing provider and signer...");
        const { ethereum } = window;
        const newProvider = new ethers.BrowserProvider(ethereum);
        await newProvider.send("eth_requestAccounts", []);
        const signer = await newProvider.getSigner();
        await setSigner(signer);

        console.log("Provider and Signer initialized.");
        return { provider: newProvider, signer };
    };

    const handleAccessToggle = async() => {
        console.log("handle toggle inital state", allowAccess); 
        console.log("handle toggle patient contract", patientContract);
        const initialAccess = await patientContract.getResearchAccess(); 
        console.log("initial access", initialAccess); 

        if (initialAccess) {
            await patientContract.setResearchAccess(false); 
        } else {
            await patientContract.setResearchAccess(true); 
        }
        const result = await patientContract.getResearchAccess(); 
        console.log("after toggle", result);
    }

    useEffect(() => {
        const init = async () => {
            try {
                console.log("Starting initialization...");
                setError(null);

                const { ethereum } = window;
                if (!ethereum) {
                    alert("Please install MetaMask!");
                    return;
                }

                const { provider, signer } = await getProviderAndSigner();
                setProvider(provider);
                if (!provider || !signer) return;

                const accounts = await ethereum.request({ method: "eth_requestAccounts" });
                await setCurrentAccount(accounts[0]);
                console.log("Current account:", accounts[0]);

                const patientHandlerContractInstance = new ethers.Contract(patientHandlerAddress, patientHandlerAbi, signer);
                await setPatientHandlerContract(patientHandlerContractInstance);
                console.log("PatientHandler contract initialized:", patientHandlerContractInstance);

                console.log("Fetching patient contract for account:", accounts[0]);
                let patientAddress;
                try {
                    patientAddress = await patientHandlerContractInstance.getPatientContract(accounts[0]);
                    console.log("Fetched patient contract address:", patientAddress);
                    console.log("Signer address", signer.getAddress());
                } catch (err) {
                    console.error("Error fetching patient contract:", err);
                    setError("Failed to fetch patient contract. Please try again.");
                    setLoading(false);
                    return;
                }

                if (patientAddress === "0x0000000000000000000000000000000000000000") {
                    console.log("User is NOT registered.");
                    setIsRegistered(false);
                    setLoading(false);
                    return;
                }

                console.log("User is registered.");
                setIsRegistered(true);

                console.log("Initializing patient contract...");
                const patientContractInstance = new ethers.Contract(patientAddress, patientAbi, signer);
                setPatientContract(patientContractInstance);
                console.log("Patient contract initialized:", patientContractInstance);
                
                const patientInitialAccess = await patientContractInstance.getResearchAccess(); 
                await setAllowAccess(patientInitialAccess); 
                console.log("patient intial access", patientInitialAccess);

                console.log("Fetching pending doctor requests...");
                const doctorsList = await fetchPendingDoctors(patientHandlerContractInstance, accounts[0], signer);
                console.log("Fetched pending doctors:", doctorsList);
                setDoctors(doctorsList);
                setLoading(false);
            } catch (err) {
                console.error("Initialization error:", err);
                setError("Something went wrong. Please refresh the page or check your network.");
                setLoading(false);
            }
        };

        init();
    }, []);

    const fetchPendingDoctors = async (patientHandlerContract, patientAddress, signer) => {
        try {
            console.log("Fetching pending doctor requests for patient:", patientAddress);
            const pendingDoctors = await patientHandlerContract.getPendingRequestForPatient(patientAddress);
            console.log("Pending doctors retrieved:", pendingDoctors);

            console.log("Fetching patient contract address...");
            const patientContractAddress = await patientHandlerContract.getPatientContract(await signer.getAddress());
            console.log("Patient contract address:", patientContractAddress);
            
            console.log("Creating Patient contract instance...");
            const patientContract = new ethers.Contract(patientContractAddress, patientAbi, signer);


            const doctorsList = [];
            for (let address of pendingDoctors) {
                console.log("Checking access status for doctor:", address);
                
                const isApproved = await patientContract.checkDoctorAccess(address);
                console.log(`Doctor: ${address}, Approved: ${isApproved}`);

                doctorsList.push({
                    id: address,
                    doctor: address,
                    access: isApproved ? "Approved" : "Not Approved",
                });
            }
            return doctorsList;
        } catch (err) {
            console.error("Error fetching pending doctors:", err);
            return [];
        }
    };

    const handleGrantAccessClick = (doctor) => {
        setSelectedDoctor(doctor);
        setShowPrivateKeyForm(true); // Show form when button is clicked
    };

    const getPrivateKey = async (ad, pin) => {
        try {
            const response = await axios.get(`http://localhost:5001/get-private-key/${ad}/${pin}`);
            const privKey = response.data.privateKey;
            console.log(privKey);
            setPrivateKey(privKey); // Assuming setPrivateKey is a function to set the state
            return privKey; // Returning the privateKey
        } catch (error) {
            console.error("Error fetching private key:", error);
            throw error; // Optionally throw error if needed
        }
    };    

    const handleGrantAccess = async () => {
        if (!pin) {
          alert("Please enter your pin!");
          return;
        }
    
        try {
          console.log("Patient Contract:", patientContract);
    
          const encryptedAES = await patientContract.getAES();
          console.log("AES: ", encryptedAES);
    
          const ad = await requestSigner.getAddress();
          console.log("ad", ad);
          const privKey = await getPrivateKey(ad, pin);
          console.log(privKey);
          const decryptedAES = await decryptAESKey(encryptedAES, privKey);
          console.log("Decrypted AES Key:", decryptedAES);
    
          // Encrypt the AES again and first get the doctor public key
          const doctorHandler = await new ethers.Contract(
            doctorHandlerAddress,
            doctorHandlerAbi,
            requestSigner
          );
          console.log("Doctor Handler:", doctorHandler);
    
          const doctorAddress = await doctorHandler.getDoctorContractAddress(
            selectedDoctor
          );
          console.log("Doctor Contract Address:", doctorAddress);
    
          const doctorContract = await new ethers.Contract(
            doctorAddress,
            doctorAbi,
            requestSigner
          );
          console.log("Doctor Contract:", doctorContract);
    
          const doctorPublicKey = await doctorContract.getPublicKey();
          console.log("Doctor Public Key:", doctorPublicKey);
    
          const doctorEncryptedAES = await encryptAESKey(
            decryptedAES,
            doctorPublicKey
          );
          console.log("Encrypted AES Key for Doctor:", doctorEncryptedAES);
    
          await patientContract.setDoctorEncryptedAES(
            selectedDoctor,
            doctorEncryptedAES
          );
          console.log("Doctor's Encrypted AES Key set in the contract.");
    
          // Call the contract function to grant access
          const tx = await patientContract.grantAccess(
            selectedDoctor,
            doctorEncryptedAES
          );
          console.log("Transaction for granting access:", tx);
    
          await tx.wait(); // Wait for the transaction to be confirmed
          console.log("Access granted to doctor:", selectedDoctor);
    
          // Now check if access is granted
          const app = await patientContract.checkDoctorAccess(selectedDoctor);
          console.log("Doctor post approve:", app);
    
          // Update UI
          setDoctors(
            doctors.map((doc) =>
              doc.doctor === selectedDoctor ? { ...doc, access: "Approved" } : doc
            )
          );
          console.log("Doctors updated with approval status.");
        } catch (err) {
          console.error("Grant access error:", err);
          setError("Failed to grant access. Please try again.");
        }
    
        // Close the form
        setShowPrivateKeyForm(false);
        setPrivateKey("");
        console.log("Private key form closed.");
      };
    
    


    const handleRevokeAccess = async (doctor) => {
        await patientContract.revokeAccess(doctor);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div>
            {allowAccess !== null && (
                <h1>Currently you allow research access: {allowAccess.toString()}</h1>
                )}

             <button onClick={handleAccessToggle}>
                Toggle Research Access
            </button>

            {!isRegistered ? (
                <div>
                    <h2>You are not registered yet.</h2>
                    <button onClick={() => navigate('/patient-records')}>Go to Registration Page</button>
                </div>
                
            ) : (
                <>
                <button onClick={() => navigate('/patient-records')}>Go to Registration Page</button>

                    <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Doctor Address</th>
                                <th>Access</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map((doctor) => (
                                <tr key={doctor.id}>
                                    <td>{doctor.doctor}</td>
                                    <td>{doctor.access}</td>
                                    <td>
                                        <button onClick={() => handleGrantAccessClick(doctor.doctor)}>Grant Access</button>
                                        <button onClick={() => handleRevokeAccess(doctor.doctor)}>Revoke Access</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Private Key Input Form (Modal) */}
                    {showPrivateKeyForm && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
                            <h3>Enter Your PIN</h3>
                            <input
                                type="password"
                                value={pin} // This should be bound to the pin state
                                onChange={(e) => setPin(e.target.value)} // This updates the pin state
                                placeholder="Enter your PIN" // Update placeholder to match PIN
                                style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                            />
                            <button onClick={handleGrantAccess} style={{ marginRight: '10px' }}>Submit</button>
                            <button onClick={() => setShowPrivateKeyForm(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                </>
            )}
        </div>
    );
};

export default PatientPage;
