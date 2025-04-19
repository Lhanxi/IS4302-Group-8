import {
  Button,
  Card,
  CardContent,
  Container,
  createTheme,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import axios from "axios";
import { ethers } from "ethers";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { decryptAESKey } from "../utils/DecryptAES";
import { pinata } from "../utils/config";
import { researchAccessABI, patientABI, } from "../utils/contractABI";
import {
  patientHandlerAddress,
  researchAccessAddress,
} from "../utils/contractAddress";
import dataAnonymiser from "../utils/dataAnonymiser";
import encryptPatientData from "../utils/encryptPatientData";


const ResearchAccessABI = researchAccessABI;
const PatientHandlerAddress = patientHandlerAddress;
const ResearchAccessAddress = researchAccessAddress;

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

function UploadPatientData() {
  const [patientName, setPatientName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [healthRecords, setHealthRecords] = useState("");
  const [patientAccount, setPatientAccount] = useState(""); // New state for patient account
  const [insuranceAccess, setInsuranceAccess] = useState(""); //for setting the insurance access
  const [pin, setPin] = useState(""); // New state for doctor private key
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(null);
  const [error1, setError1] = useState(null);

  const navigate = useNavigate();

  const patientHandlerAbi = [
    "function getPatientContract(address patient) public view returns (address)",
  ];

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
      setError1("Error creating signer. Please check MetaMask.");
      return null;
    }
  };

  // Function to handle patient account submission
  const handleAccountSubmit = () => {
    if (!patientAccount) {
      setError("Patient account is required.");
      return;
    }

    // Store the patient account or submit it to a backend
    console.log("Patient Account set:", patientAccount);
    setError(""); // Clear error on successful account set
  };

  // Function to handle doctor private key input and store it
  const handleDoctorPinSubmit = () => {
    if (!pin) {
      setError("Doctor private key is required.");
      return;
    }

    // Store the doctor private key or submit it securely
    console.log("Doctor Private Key set:", pin);
    setError(""); // Clear error on successful key set
  };

  function isValidAESKeyLength(aesKey) {
    // Check if the length of the key is either 16 bytes (128 bits) or 32 bytes (256 bits)
    return aesKey.length === 16 || aesKey.length === 32;
  }

  const getPrivateKey = async (ad, pin) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/get-private-key/${ad}/${pin}`
      );
      const privKey = response.data.privateKey;
      console.log(privKey);
      return privKey; // Returning the privateKey
    } catch (error) {
      console.error("Error fetching private key:", error);
      throw error; // Optionally throw error if needed
    }
  };

  const handleSubmit = async () => {
    try {
      if (!patientName || !identificationNumber || !healthRecords) {
        setError("All fields are required.");
        return;
      }

      console.log("Fields validated, proceeding to get patient contract...");

      //get the patient contract and get the AES key
      const signer = await getSigner();
      console.log("Signer obtained:", signer);

      const patientHandler = await new ethers.Contract(
        PatientHandlerAddress,
        patientHandlerAbi,
        signer
      );
      console.log("Patient handler contract:", patientHandler);

      const patientContractAddress = await patientHandler.getPatientContract(
        patientAccount
      );
      console.log("Patient contract address:", patientContractAddress);

      const patientContract = await new ethers.Contract(
        patientContractAddress,
        patientABI,
        signer
      );
      console.log("Patient contract:", patientContract);

      //get the doctor's encrypted AES key and decrypt the AES key
      const encryptedAES = await patientContract.getDoctorEncryptionKey(
        await signer.getAddress()
      );
      console.log("Encrypted AES Key:", encryptedAES);

      // Fetch doctor's address
      const doctorAddress = await signer.getAddress();
      console.log("Doctor address:", doctorAddress);

      // Get doctor's private key from the backend
      const doctorPrivateKeyFromDB = await getPrivateKey(doctorAddress, pin);
      console.log(
        "Retrieved doctor's private key from DB",
        doctorPrivateKeyFromDB
      );

      // Decrypt AES key
      const decryptedAESKey = await decryptAESKey(
        encryptedAES,
        doctorPrivateKeyFromDB
      );
      console.log("Decrypted AES Key:", decryptedAESKey);

      console.log("AES test", isValidAESKeyLength(decryptedAESKey));
      console.log("AES length");

      const patientData = {
        name: patientName,
        identificationNumber,
        healthRecords,
        gender,
        age,
        insuranceAccess,
        account: patientAccount, // Include patient account in the data
        timestamp: new Date().toISOString(),
      };
      console.log("Patient data to encrypt:", patientData);

      //encrypt with the AES Key
      const encryptedPatientFile = await encryptPatientData(
        patientData,
        decryptedAESKey
      );
      console.log("Encrypted patient file:", encryptedPatientFile);

      // Log the file data to ensure it's correctly created
      console.log("File being uploaded:", encryptedPatientFile);

      // Log the Pinata instance and methods to confirm everything is set up correctly
      console.log("Pinata instance:", pinata);
      console.log("Pinata upload method:", pinata.upload);
      console.log(
        "File upload function exists?",
        typeof pinata.upload.public.file
      );

      // Attempt the file upload
      const upload = await pinata.upload.public.file(encryptedPatientFile);
      console.log("Pinata upload response:", upload);

      if (!upload.cid) throw new Error("Failed to upload to IPFS");

      console.log("Uploaded to IPFS:", upload.cid);

      //Upload the data and upload the CID for the patients
      await patientContract.addCID(upload.cid);
      console.log("CID uploaded to the patient contract:", upload.cid);

      //navigate(`/display/${upload.cid}`);
      //console.log("Navigation to display page with CID:", upload.cid);

      //anonymise the data and then store it onto the CID
      const anonymisedData = await dataAnonymiser(patientData);
      console.log("anonymised Data", anonymisedData);

      const publicResearchAccess = await patientContract.getResearchAccess();

      if (publicResearchAccess) {
        const anonymisedJson = JSON.stringify(anonymisedData); // Convert to string
        const blob = new Blob([anonymisedJson], { type: "application/json" }); // Create a Blob
        const file = new File([blob], "anonymised-data.json", {
          type: "application/json",
        }); // Create a File object

        const publicUpload = await pinata.upload.public.file(file);
        console.log("Pinata upload response:", publicUpload);

        const researchAccessInstance = await new ethers.Contract(
          researchAccessAddress,
          researchAccessABI,
          signer
        );
        await researchAccessInstance.addCID(publicUpload.cid);
        console.log(
          "CID uploaded to the researchaccess contract:",
          publicUpload.cid
        );
      }
    } catch (error) {
      // Log etailed error information
      console.error("Upload failed:", error);
      setError("File upload failed. Please try again.");
    }
  };

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
              Upload Patient Data
            </Typography>
            {error && <Typography color="error">{error}</Typography>}
            <TextField
              label="Patient Account"
              fullWidth
              margin="normal"
              value={patientAccount}
              onChange={(e) => setPatientAccount(e.target.value)}
            />
            <Button
              onClick={handleAccountSubmit}
              variant="contained"
              color="primary"
              fullWidth
            >
              Set Account
            </Button>
            <TextField
              label="Enter PIN"
              fullWidth
              margin="normal"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <Button
              onClick={handleDoctorPinSubmit}
              variant="contained"
              color="primary"
              fullWidth
            >
              Set Pin
            </Button>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <TextField
              label="Identification Number"
              fullWidth
              margin="normal"
              value={identificationNumber}
              onChange={(e) => setIdentificationNumber(e.target.value)}
            />
            <TextField
              label="Gender"
              fullWidth
              margin="normal"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
            <TextField
              label="Age"
              fullWidth
              margin="normal"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <TextField
              label="Insurance Access"
              fullWidth
              margin="normal"
              value={insuranceAccess}
              onChange={(e) => setInsuranceAccess(e.target.value)}
            />
            <TextField
              label="Health Records"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={healthRecords}
              onChange={(e) => setHealthRecords(e.target.value)}
            />
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              fullWidth
            >
              Submit
            </Button>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default UploadPatientData;
