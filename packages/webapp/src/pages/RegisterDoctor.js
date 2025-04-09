import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import forge from 'node-forge';
import { Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { doctorHandlerAddress } from "../utils/contractAddress";
import { doctorHandlerABI } from "../utils/contractABI";

const doctorHandlerAbi = doctorHandlerABI;

const RegisterDoctor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const getSigner = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }

    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      await newProvider.send("eth_requestAccounts", []);
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
      setTimeout(() => {
        const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
        const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
        const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);
        console.log("Generated publicKey:", publicKeyPem);
        console.log("Generated privateKey:", privateKeyPem);
        resolve({ privateKeyPem, publicKeyPem });
        setPrivateKey(privateKeyPem);
        setPublicKey(publicKeyPem);
      }, 100);
    });
  };

  const StoreAddressForm = async (address, pin, privateKey) => {
    try {
      const response = await axios.post("http://localhost:5001/store-address", {
        address,
        pin,
        privateKeyP: privateKey,
      });
      console.log("Response from backend:", response.data);
    } catch (err) {
      console.error("Error storing address:", err);
    }
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

      const signer = await getSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      console.log("Signer Address: ", signer.address);
      const doctorHandlerContract = new ethers.Contract(doctorHandlerAddress, doctorHandlerAbi, signer);
      console.log("Doctor Handler Contract: ", doctorHandlerContract);

      let tx = await doctorHandlerContract.updateAuthentication(signer.address);
      await tx.wait();
      console.log("synced authentication status with oracle.");

      let isAuthenticated = await doctorHandlerContract.isAuthenticated(signer.address);
      if (isAuthenticated) {
        navigate("/doctor");
      } else {
        const { privateKeyPem, publicKeyPem } = await generateRSAKeyPair();

        // 🔐 Store doctor data to MongoDB
        await StoreAddressForm(await signer.getAddress(), pin, privateKeyPem);

        const tx = await doctorHandlerContract.authenticateDoctor(signer.address, publicKeyPem);
        await tx.wait();

        alert("Doctor's authentication status updated!");

        isAuthenticated = await doctorHandlerContract.isAuthenticated(signer.address);
        if (isAuthenticated) {
          navigate("/doctor");
        } else {
          return;
        }
      }
    } catch (err) {
      console.error("Error registering doctor:", err);
      setError("Authentication Rejected. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    const userPin = prompt("Please enter your PIN:");
    setPin(userPin);
  };

  return (
    <div style={{ marginLeft: '10px' }}>
      <h2>Register/Sign In as a Doctor</h2>
      <Button onClick={handleButtonClick}>Enter PIN</Button>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={registerDoctor}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Register Doctor"}
        </Button>

      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default RegisterDoctor;
