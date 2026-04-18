const express = require("express");
const app = express();
const PORT = 5000;

app.use(express.json());

const complaintRoutes = require("./routes/complaints");
app.use("/complaints", complaintRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the hostel complaint app!");
});

const { db } = require("./config/firebase");

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
