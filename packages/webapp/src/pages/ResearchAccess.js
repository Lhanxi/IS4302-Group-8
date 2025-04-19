import {
  Button,
  Card,
  CardContent,
  Container,
  createTheme,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { researchAccessABI } from "../utils/contractABI";
import { researchAccessAddress } from "../utils/contractAddress";

const ResearchAccessABI = researchAccessABI;
const ResearchAccessAddress = researchAccessAddress;

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

function ResearchAccess() {
  const [researchAccess, setResearchAccess] = useState(null);
  const [requestSigner, setSigner] = useState("");
  const [records, setRecords] = useState([]);

  const handleClick = async () => {
    console.log("Research Access button clicked");
    console.log("research accesss", researchAccess);
    const cids = await researchAccess.getCIDs();

    const records = await Promise.all(
      cids.map(async (cid) => {
        const response = await fetch(
          `http://localhost:5001/fetch-ipfs?cid=${cid}`
        );
        console.log("response", response);
        if (!response.ok) throw new Error("Failed to fetch patient data");
        return await response.json();
      })
    );

    setRecords(records);
  };

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

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Starting initialization...");

        const { ethereum } = window;
        if (!ethereum) {
          alert("Please install MetaMask!");
          return;
        }

        const { provider, signer } = await getProviderAndSigner();
        if (!provider || !signer) return;

        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("Current account:", accounts[0]);

        const researchAccessInstance = new ethers.Contract(
          ResearchAccessAddress,
          ResearchAccessABI,
          signer
        );
        setResearchAccess(researchAccessInstance);
        console.log("research access instance", researchAccessInstance);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    init();
  }, []);

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
              Research Access
            </Typography>
            <Button variant="contained" color="primary" onClick={handleClick}>
              Get Research Access
            </Button>
            {records.length > 0 && (
              <div>
                <Typography variant="h6" gutterBottom>
                  Decrypted Patient Records:
                </Typography>
                {records.map((record, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #ccc",
                      marginBottom: "1rem",
                      padding: "1rem",
                    }}
                  >
                    <Typography>
                      <strong>Gender:</strong> {record?.gender || ""}
                    </Typography>
                    <Typography>
                      <strong>Age group:</strong> {record?.ageGroup || ""}
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

export default ResearchAccess;
