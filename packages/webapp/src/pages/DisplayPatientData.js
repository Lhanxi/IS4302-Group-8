import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function DisplayPatientPage() {
    const { cid } = useParams();
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!cid) {
                setError("CID not provided");
                return;
            }

            try {
                const response = await fetch(`http://localhost:5001/fetch-ipfs?cid=${cid}`);
                if (!response.ok) throw new Error("Failed to fetch patient data");

                const data = await response.json();
                setPatientData(data);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message);
            }
        };

        fetchData();
    }, [cid]);

    return (
        <div>
            <h2>Patient Data</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {patientData ? (
                <div>
                    <p><strong>Name:</strong> {patientData.name}</p>
                    <p><strong>Identification Number:</strong> {patientData.identificationNumber}</p>
                    <p><strong>Health Records:</strong> {patientData.healthRecords}</p>
                    <p><strong>Timestamp:</strong> {patientData.timestamp}</p>
                </div>
            ) : (
                !error && <p>Loading patient data...</p>
            )}
        </div>
    );
}

export default DisplayPatientPage;