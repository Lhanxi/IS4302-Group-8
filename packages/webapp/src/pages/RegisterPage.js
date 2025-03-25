import React, { useState, useEffect } from 'react';
import forge from 'node-forge';
import { ethers } from 'ethers';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { generateAESKey } from './AESgenerator';
import encryptAESKey from './EncryptAES';
import { PatientHandlerAddress } from './contractAdress';

const patientHandlerAbi = [
  "function registerPatient() external",
  "function getPatientContract(address patient) public view returns (address)", 
    "function setPatientPublicKey(string memory publicKey) public",
];
const patientAbi = [
  "function setPatientPublicKey(string memory publicKey) external", 
  "function setEncryptedAESKey(string memory encryptedAES) external" 
];

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const navigate = useNavigate();

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
      setError("Error creating signer. Please check MetaMask.");
      return null;
    }
  };

  const generateRSAKeyPair = async () => {
    console.log("Generating RSA key pair...");
    return new Promise((resolve) => {
      setTimeout(() => { // Simulating async behavior
        const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
        const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
        const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);
        console.log("Generated publicKey:", publicKeyPem);
        console.log("Generated privateKey:", privateKeyPem);
        resolve({ privateKeyPem, publicKeyPem });
        setPrivateKey(privateKeyPem);
        setPublicKey(publicKeyPem);
      }, 100); // Small delay to mimic async execution
    });
  };
  

  
  const registerPatient = async () => {

    setLoading(true);
    try {
      console.log("Starting patient registration...");
      const signer = await getSigner();
      if (!signer) {
        console.log("Signer is null");
        return;
      }

      console.log("Creating PatientHandler contract instance...");
      const patientHandler = new ethers.Contract(PatientHandlerAddress, patientHandlerAbi, signer);
      console.log("Calling registerPatient...");

      const tx = await patientHandler.registerPatient();
      const receipt = await tx.wait();
      console.log("Transaction Receipt:", receipt);

      const { privateKeyPem, publicKeyPem } = await generateRSAKeyPair();
      const { key, exportedKey } = await generateAESKey(); 
      console.log("exported AES: ", key); 
      console.log("exported AES: ", exportedKey); 

      //generate the encryptedKey
      console.log("encrypting the key")
      const encryptedAESKey = await encryptAESKey(exportedKey, publicKeyPem);
      console.log("encryptedAESKey", encryptedAESKey);
      
      console.log("Fetching patient contract address...");
      const patientContractAddress = await patientHandler.getPatientContract(await signer.getAddress());
      console.log("Patient contract address:", patientContractAddress);
      
      console.log("Creating Patient contract instance...");

      const patientContract = new ethers.Contract(patientContractAddress, patientAbi, signer);
      console.log("Setting public key in patient contract...");
      const tx1 = await patientContract.setPatientPublicKey(publicKeyPem);
      await tx1.wait();
      console.log("Public key stored successfully.");

      await patientContract.setEncryptedAESKey(encryptedAESKey);


      alert("Patient registered successfully! Please save your private key securely.");
    } catch (err) {
      console.error("Error registering patient:", err);
      setError("Failed to register patient. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const initAccount = async () => {
      if (window.ethereum) {
        try {
          console.log("Requesting Ethereum accounts...");
          const [selectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log("Selected account:", selectedAccount);
          if (selectedAccount) {
            setAccount(selectedAccount);
          }
        } catch (err) {
          console.error("Error requesting account:", err);
          setError("Error accessing MetaMask. Please try again.");
        }
      }
    };
    initAccount();
  }, []);

  return (
    <div>
      <h2>Register as a Patient</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button
        variant="contained"
        color="primary"
        disabled={loading}
        onClick={registerPatient}
      >
        {loading ? "Registering..." : "Register"}
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => navigate('/patient')}
        style={{ marginTop: '10px' }}
      >
        Go to Patient Page
      </Button>
      {privateKey && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid red' }}>
          <h3>Save Your Private Key</h3>
          <p style={{ wordBreak: 'break-all', color: 'red' }}>{privateKey}</p>
          <p><strong>Warning:</strong> This key will not be shown again. Save it securely.</p>
        </div>
      )}
      {publicKey && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid blue' }}>
          <h3>Your Public Key</h3>
          <p style={{ wordBreak: 'break-all', color: 'blue' }}>{publicKey}</p>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;