require("dotenv").config();
const app = require("./app");
const connectToDatabase = require("./config/dbConnection");

const PORT = process.env.PORT || 8000;

// Connect to the database and start the server
connectToDatabase(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to start server:", error);
    });