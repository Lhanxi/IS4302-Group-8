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
import React, { useEffect, useState } from "react";
import { patientABI, patientHandlerABI } from "../utils/contractABI";
import { patientHandlerAddress } from "../utils/contractAddress";
import { decryptAESKey } from "../utils/DecryptAES";
import decryptPatientDataCopy from "../utils/decryptPatientDataCopy";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const PatientRecords = () => {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [input, setInput] = useState("");
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [hasRequestedData, setHasRequestedData] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [patientData, setPatientData] = useState([]);
  const [decryptedPatientData, setDecryptedPatientData] = useState([]);

  const patientHandlerAbi = patientHandlerABI;
  const patientAbi = patientABI;

  const getPrivateKey = async (ad, pin) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/get-private-key/${ad}/${pin}`
      );
      const privKey = response.data.privateKey;
      console.log(privKey);
      setPrivateKey(privKey);
      return privKey;
    } catch (error) {
      console.error("Error fetching private key:", error);
      throw error;
    }
  };

  const fetchData = async (cid, localArray) => {
    try {
      const response = await fetch(
        `http://localhost:5001/fetch-ipfs?cid=${cid}`
      );
      if (!response.ok) throw new Error("Failed to fetch patient data");

      const data = await response.json();
      console.log("data", data);

      localArray.push(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (!hasRequestedData || !pin) return;

        console.log("Initializing PatientRecords component...");

        if (!window.ethereum) {
          console.error("MetaMask not detected.");
          setError("Please install MetaMask!");
          setLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const accounts = await provider.send("eth_requestAccounts", []);
        console.log("Connected account:", accounts[0]);
        setCurrentAccount(accounts[0]);

        console.log("Initializing PatientHandler contract...");
        const patientHandlerContract = new ethers.Contract(
          patientHandlerAddress,
          patientHandlerAbi,
          signer
        );

        console.log("Fetching patient contract address...");
        const patientAddress = await patientHandlerContract.getPatientContract(
          accounts[0]
        );
        console.log("Retrieved patient contract address:", patientAddress);

        if (patientAddress === "0x0000000000000000000000000000000000000000") {
          console.warn("No patient contract found for this address.");
          setError("You are not registered as a patient!");
          setLoading(false);
          return;
        }

        console.log("Initializing Patient contract...");
        const patientContractInstance = new ethers.Contract(
          patientAddress,
          patientAbi,
          signer
        );
        setPatientContract(patientContractInstance);

        console.log("Fetching patient records...");

        console.log("Fetching CIDS");
        const CIDs = await patientContractInstance.getCIDs();
        console.log("CIDs", CIDs);

        console.log("Fetching encrypted AES");
        const encryptedAES = await patientContractInstance.getAES();
        console.log("AES", encryptedAES);

        console.log("Fetching patient private key");
        const ad = await signer.getAddress();
        const privKey = await getPrivateKey(ad, pin);
        console.log("priv key", privKey);

        console.log("Decrypting the AES");
        const decryptedAES = await decryptAESKey(encryptedAES, privKey);
        console.log("decrypted AEs", decryptedAES);

        console.log("Getting the data from pinata");
        const localPatientData = [];

        for (const cid of Array.from(CIDs)) {
          await fetchData(cid, localPatientData);
          console.log("called data");
        }

        console.log("Final localPatientData:", localPatientData);

        for (let i = 0; i < localPatientData.length; i++) {
          console.log("power");
          let decryptedData = await decryptPatientDataCopy(
            localPatientData[i],
            decryptedAES
          );
          console.log("decrypte datat", decryptedData);
          console.log("tests");
          setDecryptedPatientData((prevData) => [...prevData, decryptedData]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing PatientRecords:", err);
        setError("Failed to load records. Please try again.");
        setLoading(false);
      }
    };

    init();
  }, [hasRequestedData, pin]);

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="md"
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
              Patient Records
            </Typography>
            {!showPinInput ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowPinInput(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Request Data
              </Button>
            ) : (
              <>
                <TextField
                  type="password"
                  placeholder="Enter PIN"
                  onChange={(e) => setInput(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setPin(input);
                    setHasRequestedData(true);
                  }}
                  fullWidth
                >
                  Set PIN
                </Button>
              </>
            )}
            {decryptedPatientData.length > 0 && (
              <div>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Decrypted Patient Records:
                </Typography>
                {decryptedPatientData.map((record, idx) => (
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
};

export default PatientRecords;
