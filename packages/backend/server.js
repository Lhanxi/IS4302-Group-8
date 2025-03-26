const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors({origin: "http://localhost:3000"}));
const PORT = 5001;
app.use(express.json());


// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const dbName = "keyManager";
let db;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const connectToDatabase = async () => {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
};

connectToDatabase();

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

// Route to store address and private key in MongoDB
app.post('/store-address', async (req, res) => {
    const { address, privateKeyP } = req.body;
    console.log("hi");
  
    if (!address || !privateKeyP ) {
      return res.status(400).send("Address and private key are required.");
    }
  
    try {
      const collection = db.collection('keys');
      
      // Check if the address already exists
      const existingUser = await collection.findOne({ address });
  
      if (!existingUser) {
        // Store address and private key (not recommended in production)
        await collection.insertOne({ address, privateKeyP });
        res.status(201).send("Address and private key stored successfully.");
      } else {
        res.status(200).send("Address already exists.");
      }
    } catch (err) {
      console.error("Error storing address and private key in MongoDB:", err);
      res.status(500).send("Error storing address.");
    }
  });

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));