import {
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import { ethers } from "ethers";
import React, { useState } from "react";
import { patientABI, patientHandlerABI } from "../utils/contractABI";
import { patientHandlerAddress } from "../utils/contractAddress";
import { decryptAESKey } from "../utils/DecryptAES";
import decryptPatientData from "../utils/decryptPatientData";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

function DisplayPatientInsurancePage() {
  const [allDecryptedData, setAllDecryptedData] = useState([]);
  const [error, setError] = useState("");
  const [patientAccount, setPatientAccount] = useState("");
  const [pin, setPin] = useState("");
  const [provider, setProvider] = useState(null);

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
      setError("Error creating signer. Please check MetaMask.");
      return null;
    }
  };

  const getPrivateKey = async (address, pin) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/get-private-key/${address}/${pin}`
      );
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

      const patientHandler = new ethers.Contract(
        patientHandlerAddress,
        patientHandlerABI,
        signer
      );
      const patientContractAddress = await patientHandler.getPatientContract(
        patientAccount
      );
      const patientContract = new ethers.Contract(
        patientContractAddress,
        patientABI,
        signer
      );

      const encryptedAESKey =
        await patientContract.getInsuranceCompanyEncryptionKey(
          insuranceAddress
        );
      const decryptedAESKey = await decryptAESKey(encryptedAESKey, privKey);

      const cids = await patientContract.getCIDs();
      const records = [];

      for (const cid of cids) {
        const response = await fetch(
          `http://localhost:5001/fetch-ipfs?cid=${cid}`
        );
        if (!response.ok) throw new Error("Failed to fetch patient data");

        const encryptedData = await response.json();
        const decryptedData = await decryptPatientData(
          encryptedData,
          decryptedAESKey
        );
        if (decryptedData && decryptedData.insuranceAccess === "True") {
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
              Patient Data
            </Typography>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <TextField
              label="Enter Patient's Account"
              variant="outlined"
              fullWidth
              value={patientAccount}
              onChange={(e) => setPatientAccount(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Enter Your PIN"
              type="password"
              variant="outlined"
              fullWidth
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleDecryption}
              fullWidth
            >
              Decrypt Data
            </Button>
            {allDecryptedData.length > 0 && (
              <div>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Decrypted Patient Records:
                </Typography>
                {allDecryptedData.map((record, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #ccc",
                      marginBottom: "1rem",
                      padding: "1rem",
                    }}
                  >
                    <Typography>
                      <strong>Name:</strong> {record.name}
                    </Typography>
                    <Typography>
                      <strong>ID:</strong> {record.identificationNumber}
                    </Typography>
                    <Typography>
                      <strong>Gender:</strong> {record?.gender || ""}
                    </Typography>
                    <Typography>
                      <strong>Age:</strong> {record?.age || ""}
                    </Typography>
                    <Typography>
                      <strong>Health:</strong> {record.healthRecords}
                    </Typography>
                    <Typography>
                      <strong>Timestamp:</strong> {record.timestamp}
                    </Typography>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default DisplayPatientInsurancePage;
