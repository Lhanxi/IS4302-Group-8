import React from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";
import { Container, Box, Typography, Button, Card, CardContent } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { connectWallet } from "../utils/connectWallet";
import { Link } from "react-router-dom"; // Import Link for navigation

function HomePage({ account, setAccount, provider, setProvider }) {
    const [contract, setContract] = React.useState(null);

    const handleConnectWallet = async () => {
        const walletData = await connectWallet();
        if (walletData) {
            setAccount(walletData.account);
            setProvider(walletData.provider);

            const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, walletData.signer);
            setContract(contractInstance);

            console.log("Connected to:", walletData.account);
        }
    };

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
                                    onClick={handleConnectWallet}
                                    size="large"
                                >
                                    Connect Wallet
                                </Button>
                            </Box>
                        )}

                        {/* Link to RegisterPage */}
                        <Box textAlign="center" mt={3}>
                            <Link to="/register">
                                <Button variant="contained" color="secondary" size="large">
                                    Go to Register Page
                                </Button>
                            </Link>
                        </Box>

                        {/* Link to Register Doctor Page */}
                        <Box textAlign="center" mt={3}>
                            <Link to="/registerDoctor">
                                <Button variant="contained" color="secondary" size="large">
                                    Register as a Doctor
                                </Button>
                            </Link>
                        </Box>

                        {/* Link to Register Insurance Company Page */}
                        <Box textAlign="center" mt={3}>
                            <Link to="/registerInsuranceCompany">
                                <Button variant="contained" color="secondary" size="large">
                                    Register as an insurance company
                                </Button>
                            </Link>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </ThemeProvider>
    );
}

export default HomePage;
