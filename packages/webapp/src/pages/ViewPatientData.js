import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";
import { Container, Box, Typography, Button, Card, CardContent } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { connectWallet } from "../utils/connectWallet";
