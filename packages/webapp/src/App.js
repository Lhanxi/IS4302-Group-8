import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import PatientPage from "./pages/PatientPage";
import DoctorPage from "./pages/DoctorPage";

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
                
            </Routes>
    );
}

export default App;
