const express = require("express");
const router = express.Router();

const {
  addMedicine,
  getMedicines,
  deleteMedicine,
  updateMedicine,
} = require("../controllers/medicineController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", getMedicines);

router.post("/", protect, adminOnly, addMedicine);

router.delete("/:id", protect, adminOnly, deleteMedicine);

router.put("/:id", protect, adminOnly, updateMedicine);

module.exports = router;
