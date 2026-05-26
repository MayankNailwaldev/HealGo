const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    customerName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    items: [
      {
        medicineId: String,
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
    },

    paymentStatus: {
      type: String,
      default: "Pending",
    },

    prescriptionImage: {
      type: String,
      default: "",
    },

    prescriptionVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "Order Placed",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
