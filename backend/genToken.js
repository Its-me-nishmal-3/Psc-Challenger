const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
    { id: '507f1f77bcf86cd799439011', role: 'admin' }, // Fake ObjectID
    process.env.JWT_SECRET || 'supersecretkey123',
    { expiresIn: '1d' }
);

console.log(token);
const fs = require('fs');
fs.writeFileSync('token.txt', token);
