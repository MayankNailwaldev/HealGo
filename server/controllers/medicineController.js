const Medicine = require("../models/medicine");
const cloudinary = require("../config/cloudinary");

const addMedicine = async (req, res) => {
  try {
    let imageUrl = "";

    if (req.body.image) {
      // Check if image data is too large (base64 > 5MB becomes problematic)
      if (req.body.image.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          message:
            "Image file is too large. Please choose an image smaller than 5MB.",
        });
      }

      try {
        const uploadedResponse = await cloudinary.uploader.upload(
          req.body.image,
          {
            folder: "healgo_medicines",
            resource_type: "auto",
          },
        );
        imageUrl = uploadedResponse.secure_url;
      } catch (uploadError) {
        return res.status(400).json({
          message: `Image upload failed: ${uploadError.message}`,
        });
      }
    }

    const medicine = await Medicine.create({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      description: req.body.description,
      prescriptionRequired: req.body.prescriptionRequired,
      image: imageUrl,
    });

    res.status(201).json({
      message: "Medicine Added Successfully",
      medicine,
    });
  } catch (error) {
    console.log("ADD MEDICINE ERROR:", error);

    res.status(500).json({
      message: error.message || "Failed to add medicine",
    });
  }
};

const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find();

    res.json(medicines);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    res.json({
      message: "Medicine Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const { price, stock } = req.body;

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      {
        price,
        stock,
      },
      { new: true },
    );

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    res.json({
      message: "Medicine Updated Successfully",
      medicine,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addMedicine,
  getMedicines,
  deleteMedicine,
  updateMedicine,
};
