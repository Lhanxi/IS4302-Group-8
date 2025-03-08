import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ViewPatientData from "./pages/ViewPatientData";


const App = () => (
  <div>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/patient-data/:walletAddress" element={<ViewPatientData />} />
    </Routes>
  </div>
)

export default App;
