import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import forge from 'node-forge';
import { Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Smart contract details (replace with actual contract details)
const doctorHandlerAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"; // replace with actual address
const doctorHandlerAbi = [
  "function isAuthenticated(address _doctor) view external returns (bool)",
  "function authenticateDoctor(address _doctor, string memory _publicKey) external"
];

const RegisterDoctor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const navigate = useNavigate();
const [privateKey, setPrivateKey] = useState(null);
const [publicKey, setPublicKey] = useState(null);

  // Function to get signer (used to send transactions)
  const getSigner = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }

    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      await newProvider.send("eth_requestAccounts", []); // Request permission
      setProvider(newProvider);

      const signer = await newProvider.getSigner();
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

  useEffect(() => {
      const initAccount = async () => {
        if (window.ethereum) {
          try {
            const [selectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (selectedAccount) {
              setAccount(selectedAccount);
              console.log("Selected Account: ", selectedAccount);
            }
          } catch (err) {
            console.error("Error requesting account:", err);
            setError("Error accessing MetaMask. Please try again.");
          }
        }
      };
  
      initAccount();
    }, []);

  // Function to handle authentication
  const registerDoctor = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        alert("MetaMask is not available. Please install it.");
        setLoading(false);
        return;
      }

      if (!account) {
        alert("Account is not available. Please connect your wallet.");
        setLoading(false);
        return;
      }

      // Get the signer from the provider
      const signer = await getSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      console.log("Signer Address: ", signer.address); // In ethers v6, getAddress() is not needed

      // Create contract instance with signer
      const doctorHandlerContract = new ethers.Contract(doctorHandlerAddress, doctorHandlerAbi, signer);
      console.log("Doctor Handler Contract: ", doctorHandlerContract);

      const { privateKeyPem, publicKeyPem } = await generateRSAKeyPair();

      //parse the data into the contract
      const tx = await doctorHandlerContract.authenticateDoctor(signer.address, publicKeyPem);
      await tx.wait()
      
      alert("Doctor's authentication status updated!");

      const isAuthenticated = await doctorHandlerContract.isAuthenticated(signer.address);
        if (isAuthenticated) {
            navigate("/doctor");
        } else {
            return;
        }
    } catch (err) {
      console.error("Error registering doctor:", err);
      setError("Authentication Rejected. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{marginLeft: '10px'}}>
      <h2>Register as a Doctor</h2>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
            variant="contained"
            color="primary"
            onClick={registerDoctor}
            disabled={loading}
        >
        {loading ? <CircularProgress size={24} /> : "Register Doctor"}
        </Button>
      </div>
      {error && <p style={{ color: 'red'}}>{error}</p>}
    </div>
  );
};

export default RegisterDoctor;