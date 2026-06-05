const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const complaintRoutes = require("./routes/complaints");
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", complaintRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the hostel complaint app!");
});

const { db } = require("./config/firebase");

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
