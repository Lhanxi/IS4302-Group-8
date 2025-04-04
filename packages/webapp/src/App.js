import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import PatientPage from "./pages/PatientPage";
import DoctorPage from "./pages/DoctorPage";
import RegisterDoctor from "./pages/RegisterDoctor";
import DisplayPatientData from "./pages/DisplayPatientData";
import UploadPatientData from "./pages/UploadPatientData";
import PatientRecords from "./pages/PatientRecords";

function App() {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);

    return (
            <Routes>
                <Route
                    path="/"
                    element={<HomePage account={account} setAccount={setAccount} provider={provider} setProvider={setProvider} />}
                />
                <Route
                    path="/register"
                    element={<RegisterPage account={account} provider={provider} />}
                />
                <Route
                    path="/patient"
                    element={<PatientPage />}  
                />
                <Route 
                    path="/doctor"
                    element={<DoctorPage />} 
                />
                
                <Route 
                    path="/registerDoctor"
                    element={<RegisterDoctor />} 
                />

                <Route
                    path="/display"
                    element={<DisplayPatientData />} 
                />

                <Route
                    path="/uploadPatientData"
                    element={<UploadPatientData />} 
                />

                <Route 
                    path="/patient-records" 
                    element={<PatientRecords /> } /> 

            </Routes>
    );
}

export default App;
