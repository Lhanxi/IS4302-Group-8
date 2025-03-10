import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DoctorPage from "./pages/DoctorPage";


const App = () => (
  <div>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/doctor" element={<DoctorPage />} />
    </Routes>
  </div>
)

export default App;
