const Medicine = require("../models/medicine");

// Get all medicines
const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.status(200).json(medicines);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch medicines", error: error.message });
  }
};

// Add medicine
const addMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);

    const io = req.app.get("io");
    if (io) io.emit("medicineUpdated");

    res.status(201).json(medicine);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add medicine", error: error.message });
  }
};

// Update medicine
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const io = req.app.get("io");
    if (io) io.emit("medicineUpdated");

    res.status(200).json(medicine);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update medicine", error: error.message });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const io = req.app.get("io");
    if (io) io.emit("medicineUpdated");

    res.status(200).json({ message: "Medicine deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete medicine", error: error.message });
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
};
