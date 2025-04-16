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
import { useNavigate } from "react-router-dom";
import {
  doctorABI,
  doctorHandlerABI,
  patientABI,
  patientHandlerABI,
} from "../utils/contractABI";
import {
  doctorHandlerAddress,
  patientHandlerAddress,
} from "../utils/contractAddress";
import { decryptAESKey } from "../utils/DecryptAES";
import encryptAESKey from "../utils/EncryptAES";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const PatientPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [insuranceAgents, setInsuranceAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientHandlerContract, setPatientHandlerContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);
  const [requestSigner, setSigner] = useState(null);
  const [requestProvider, setProvider] = useState(null);
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

  const handleAccessToggle = async () => {
    console.log("handle toggle inital state", allowAccess);
    console.log("handle toggle patient contract", patientContract);
    const initialAccess = await patientContract.getResearchAccess();
    console.log("initial access", initialAccess);

    if (initialAccess) {
      const tx = await patientContract.setResearchAccess(false);
      await tx.wait();
    } else {
      const tx = await patientContract.setResearchAccess(true);
      await tx.wait();
    }
    const result = await patientContract.getResearchAccess();
    console.log("after toggle", result);
    await setAllowAccess(result);
  };

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

        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        await setCurrentAccount(accounts[0]);
        console.log("Current account:", accounts[0]);

        const patientHandlerContractInstance = new ethers.Contract(
          patientHandlerAddress,
          patientHandlerAbi,
          signer
        );
        await setPatientHandlerContract(patientHandlerContractInstance);
        console.log(
          "PatientHandler contract initialized:",
          patientHandlerContractInstance
        );

        console.log("Fetching patient contract for account:", accounts[0]);
        let patientAddress;
        try {
          patientAddress =
            await patientHandlerContractInstance.getPatientContract(
              accounts[0]
            );
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
        const patientContractInstance = new ethers.Contract(
          patientAddress,
          patientAbi,
          signer
        );
        setPatientContract(patientContractInstance);
        console.log("Patient contract initialized:", patientContractInstance);

        const patientInitialAccess =
          await patientContractInstance.getResearchAccess();
        await setAllowAccess(patientInitialAccess);
        console.log("patient intial access", patientInitialAccess);

        console.log("Fetching pending doctor requests...");
        const doctorsList = await fetchPendingDoctors(
          patientHandlerContractInstance,
          accounts[0],
          signer
        );
        console.log("Fetched pending doctors:", doctorsList);
        setDoctors(doctorsList);
        setLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(
          "Something went wrong. Please refresh the page or check your network."
        );
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchPendingDoctors = async (
    patientHandlerContract,
    patientAddress,
    signer
  ) => {
    try {
      console.log(
        "Fetching pending doctor requests for patient:",
        patientAddress
      );
      const pendingDoctors =
        await patientHandlerContract.getPendingRequestForPatient(
          patientAddress
        );
      console.log("Pending doctors retrieved:", pendingDoctors);

      console.log("Fetching patient contract address...");
      const patientContractAddress =
        await patientHandlerContract.getPatientContract(
          await signer.getAddress()
        );
      console.log("Patient contract address:", patientContractAddress);

      console.log("Creating Patient contract instance...");
      const patientContract = new ethers.Contract(
        patientContractAddress,
        patientAbi,
        signer
      );

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
    setShowPrivateKeyForm(true);
  };

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

      const tx = await patientContract.grantAccess(
        selectedDoctor,
        doctorEncryptedAES
      );
      console.log("Transaction for granting access:", tx);

      await tx.wait();
      console.log("Access granted to doctor:", selectedDoctor);

      const app = await patientContract.checkDoctorAccess(selectedDoctor);
      console.log("Doctor post approve:", app);

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

    setShowPrivateKeyForm(false);
    setPrivateKey("");
    console.log("Private key form closed.");
  };

  const handleRevokeAccess = async (doctor) => {
    await patientContract.revokeAccess(doctor);
    setDoctors(
      doctors.map((doc) =>
        doc.doctor === selectedDoctor ? { ...doc, access: "Not Approved" } : doc
      )
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

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
              Patient Page
            </Typography>
            {allowAccess !== null && (
              <Typography variant="h6" align="center" gutterBottom>
                Currently you allow research access: {allowAccess.toString()}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleAccessToggle}
              fullWidth
              sx={{ mb: 2 }}
            >
              Toggle Research Access
            </Button>
            {!isRegistered ? (
              <div>
                <Typography variant="h6" align="center" gutterBottom>
                  You are not registered yet.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/patient-records")}
                  fullWidth
                >
                  Go to Registration Page
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/patient-records")}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Go to Registration Page
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/patient-insurance")}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Go to Insurance Page
                </Button>
                <table
                  border="1"
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
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
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              handleGrantAccessClick(doctor.doctor)
                            }
                            sx={{ mr: 1 }}
                          >
                            Grant Access
                          </Button>
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => handleRevokeAccess(doctor.doctor)}
                          >
                            Revoke Access
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {showPrivateKeyForm && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        backgroundColor: "#1e1e1e",
        color: "#fff",
        padding: "30px",
        borderRadius: "12px",
        width: "90%",
        maxWidth: "400px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Enter Your PIN
      </Typography>
      <TextField
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter your PIN"
        fullWidth
        sx={{
          input: { color: "#fff" },
          label: { color: "#ccc" },
          mb: 2,
        }}
        InputProps={{
          sx: {
            "& .MuiInputBase-input": { color: "#fff" },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#00bcd4",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#80deea",
            },
          },
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGrantAccess}
        >
          Submit
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setShowPrivateKeyForm(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  </div>
)}

              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

export default PatientPage;
