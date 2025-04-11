import {
  Button,
  Card,
  CardContent,
  Container,
  createTheme,
  ThemeProvider,
  Typography,
} from "@mui/material";
import axios from "axios";
import { ethers } from "ethers";
import forge from "node-forge";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateAESKey } from "../utils/AESgenerator";
import encryptAESKey from "../utils/EncryptAES";
import { patientABI, patientHandlerABI } from "../utils/contractABI";
import { patientHandlerAddress } from "../utils/contractAddress";

const PatientHandlerAddress = patientHandlerAddress;
const patientHandlerAbi = patientHandlerABI;
const patientAbi = patientABI;

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [pin, setPin] = useState("");
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
      setTimeout(() => {
        // Simulating async behavior
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

  const StoreAddressForm = async (address, pin, privateKey) => {
    try {
      const response = await axios.post("http://localhost:5001/store-address", {
        address,
        pin,
        privateKeyP: privateKey, // Ensure this matches the backend field
      });
      console.log("Response from backend:", response.data);
    } catch (err) {
      console.error("Error storing address:", err);
    }
  };

  const registerPatient = async () => {
    console.log("pin", pin);

    setLoading(true);
    try {
      console.log("Starting patient registration...");
      const signer = await getSigner();
      if (!signer) {
        console.log("Signer is null");
        return;
      }

      //store the user pin to the database

      console.log("Creating PatientHandler contract instance...");
      const patientHandler = await new ethers.Contract(
        PatientHandlerAddress,
        patientHandlerAbi,
        signer
      );
      console.log("Calling registerPatient...");

      const tx = await patientHandler.registerPatient();
      const receipt = await tx.wait();
      console.log("Transaction Receipt:", receipt);

      const { privateKeyPem, publicKeyPem } = await generateRSAKeyPair();
      const { key, exportedKey } = await generateAESKey();
      console.log("exported AES: ", key);
      console.log("exported AES: ", exportedKey);

      //store the private key and address into the database
      await StoreAddressForm(await signer.getAddress(), pin, privateKeyPem);

      //generate the encryptedKey
      console.log("encrypting the key");
      const encryptedAESKey = await encryptAESKey(exportedKey, publicKeyPem);
      console.log("encryptedAESKey", encryptedAESKey);

      console.log("Fetching patient contract address...");
      const patientContractAddress = await patientHandler.getPatientContract(
        await signer.getAddress()
      );
      console.log("Patient contract address:", patientContractAddress);

      console.log("Creating Patient contract instance...");

      const patientContract = new ethers.Contract(
        patientContractAddress,
        patientAbi,
        signer
      );
      console.log("Setting public key in patient contract...");
      const tx1 = await patientContract.setPatientPublicKey(publicKeyPem);
      await tx1.wait();
      console.log("Public key stored successfully.");

      await patientContract.setEncryptedAESKey(encryptedAESKey);

      alert(
        "Patient registered successfully! Please save your private key securely."
      );
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
          const [selectedAccount] = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
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

  const handleButtonClick = () => {
    const userPin = prompt("Please enter your PIN:");
    setPin(userPin);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 2,
          borderRadius: 2,
        }}
      >
        <Card
          sx={{
            width: "100%",
            p: 2,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          }}
        >
          <CardContent>
            <Typography variant="h4" align="center" gutterBottom>
              Register as a Patient
            </Typography>
            <Button onClick={handleButtonClick}>Enter PIN</Button>
            <Button
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={registerPatient}
              sx={{ mt: 2 }}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/patient")}
              sx={{ mt: 2 }}
            >
              Go to Patient Page
            </Button>
            {error && <Typography color="error">{error}</Typography>}
            {privateKey && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  border: "1px solid red",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Save Your Private Key
                </Typography>
                <Typography style={{ wordBreak: "break-all", color: "red" }}>
                  {privateKey}
                </Typography>
                <Typography>
                  <strong>Warning:</strong> This key will not be shown again.
                  Save it securely.
                </Typography>
              </div>
            )}
            {publicKey && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  border: "1px solid blue",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Your Public Key
                </Typography>
                <Typography style={{ wordBreak: "break-all", color: "blue" }}>
                  {publicKey}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

export default RegisterPage;
