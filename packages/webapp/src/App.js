import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig";
import { Container, Box, Typography, Button, Card, CardContent } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);

  // Connect to wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
        const accounts = await provider.send("eth_requestAccounts", []);
        
        setAccount(accounts[0]);
        setProvider(provider);

        // Load contract
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);

        console.log("Connected to:", accounts[0]);
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Call the smart contract function
  const triggerContract = async () => {
    if (contract) {
      try {
        const tx = await contract.connectWalletTest();
        await tx.wait();
        console.log("Wallet Connected Event Emitted");
      } catch (error) {
        console.error("Transaction error:", error);
      }
    } else {
      console.log("Contract not loaded yet.");
    }
  };

  // Create a custom dark theme
  const theme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#00bcd4",
      },
      background: {
        default: "#121212",
      },
    },
    typography: {
      fontFamily: "Roboto, sans-serif",
    },
  });

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
              The Future of Health Care
            </Typography>
            {account ? (
              <Box textAlign="center" mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={triggerContract}
                  size="large"
                >
                  Call connectWalletTest()
                </Button>
                <Typography variant="subtitle1" mt={2}>
                  Connected Account: {account}
                </Typography>
              </Box>
            ) : (
              <Box textAlign="center" mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={connectWallet}
                  size="large"
                >
                  Connect Wallet
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default App;
