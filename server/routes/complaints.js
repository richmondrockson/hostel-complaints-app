const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
// Create a new complaint
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, roomNumber, category, description } = req.body;

    // Basic validation
    if (!title || !roomNumber || !category || !description) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const complaint = {
      title,
      roomNumber,
      category,
      description,
      status: "open",
      studentId: req.user.uid,
      guestName: req.user.name || req.user.email,
      studentEmail: req.user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("complaints").add(complaint);
    const complaintId = `CMP-${docRef.id.slice(0, 7).toUpperCase()}`;
    await docRef.update({ complaintId });

    res.status(201).json({
      message: "Complaint submitted successfully.",
      id: docRef.id,
      complaintId,
    });
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get all complaints
router.get("/", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.uid;

    const snapshot = await db
      .collection("complaints")
      .where("studentId", "==", studentId)
      .orderBy("createdAt", "desc")
      .get();

    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/complaints", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status, category } = req.query;

    let complaintsQuery = db
      .collection("complaints")
      .orderBy("createdAt", "desc");
    if (status) {
      complaintsQuery = complaintsQuery.where("status", "==", status);
    }
    if (category) {
      complaintsQuery = complaintsQuery.where("category", "==", category);
    }

    const snapshot = await complaintsQuery.get();
    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Error fetching all complaints:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get a specific complaint by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = await db.collection("complaints").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Complaint not found." });
    }
    const complaint = { id: doc.id, ...doc.data() };

    //only allow students to view their own complaints
    if (complaint.studentId !== req.user.uid) {
      return res.status(403).json({
        error: "Access denied. You can only view your own complaints.",
      });
    }

    res.status(200).json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.patch("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ["open", "in-progress", "resolved", "pending"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const docRef = db.collection("complaints").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      resolvedBy: req.user.email,
    };

    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    await docRef.update(updateData);
    res.status(200).json({
      message: "Complaint updated successfully.",
      updatedFields: updateData,
    });
  } catch (error) {
    console.error("Error updating complaint:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("complaints").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    await docRef.update({
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: req.user.email,
    });

    await docRef.delete();
    res.status(200).json({ message: "Complaint deleted successfully.", id });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
