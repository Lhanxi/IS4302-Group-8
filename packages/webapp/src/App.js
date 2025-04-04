import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import DisplayPatientData from "./pages/DisplayPatientData";
import DoctorPage from "./pages/DoctorPage";
import HomePage from "./pages/HomePage";
import PatientPage from "./pages/PatientPage";
import PatientRecords from "./pages/PatientRecords";
import RegisterDoctor from "./pages/RegisterDoctor";
import RegisterPage from "./pages/RegisterPage";
import UploadPatientData from "./pages/UploadPatientData";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            account={account}
            setAccount={setAccount}
            provider={provider}
            setProvider={setProvider}
          />
        }
      />
      <Route
        path="/register"
        element={<RegisterPage account={account} provider={provider} />}
      />
      <Route path="/patient" element={<PatientPage />} />
      <Route path="/doctor" element={<DoctorPage />} />

      <Route path="/registerDoctor" element={<RegisterDoctor />} />

      <Route path="/display/:cid" element={<DisplayPatientData />} />

      <Route path="/uploadPatientData" element={<UploadPatientData />} />

      <Route path="/patient-records" element={<PatientRecords />} />
    </Routes>
  );
}

export default App;
