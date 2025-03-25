const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
const PORT = 5001;

app.get("/fetch-ipfs", async (req, res) => {
    try {
        const { cid } = req.query;
        if (!cid) return res.status(400).json({ error: "Missing CID" });

        const ipfsUrl = `https://fuchsia-genetic-pelican-990.mypinata.cloud/ipfs/${cid}`;
        const response = await fetch(ipfsUrl);
        if (!response.ok) throw new Error("Failed to fetch IPFS data");

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));