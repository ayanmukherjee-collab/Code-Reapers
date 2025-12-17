require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/mapping/app");

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
