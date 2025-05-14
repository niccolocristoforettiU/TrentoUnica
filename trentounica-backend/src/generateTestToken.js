// src/generateTestToken.js
require("dotenv").config(); 
const jwt = require("jsonwebtoken");

const payload = {
    userId: "test-user",
    role: "user"
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
console.log(token);
