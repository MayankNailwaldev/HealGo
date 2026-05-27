const Order = require("../models/Order");
const cloudinary = require("../config/cloudinary");
const transporter = require("../config/email");

const placeOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod,
      userId,
      prescriptionImage,
    } = req.body;

    if (!customerName || !customerEmail || !phone || !address) {
      return res.status(400).json({
        message: "Customer name, email, phone and address are required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Order items are required",
      });
    }

    let uploadedPrescription = "";

    if (prescriptionImage) {
      const uploadedResponse = await cloudinary.uploader.upload(
        prescriptionImage,
        {
          folder: "healgo_prescriptions",
        },
      );

      uploadedPrescription = uploadedResponse.secure_url;
    }

    const order = await Order.create({
      user: userId || null,
      customerName,
      customerEmail,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: "Pending",
      prescriptionImage: uploadedPrescription,
      status: "Order Placed",
    });

    const itemList = items
      .map((item) => `${item.name} × ${item.quantity}`)
      .join(", ");

    if (customerEmail && process.env.EMAIL_USER) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: customerEmail,
          subject: "HealGo Order Confirmation",
          html: `
            <h2>Thank you for your order, ${customerName}</h2>
            <p>Your HealGo order has been placed successfully.</p>
            <p><b>Items:</b> ${itemList}</p>
            <p><b>Total:</b> ₹${totalAmount}</p>
            <p><b>Payment:</b> ${paymentMethod || "Cash on Delivery"}</p>
            <p><b>Status:</b> Order Placed</p>
          `,
        });
      } catch (emailError) {
        console.log("Customer email notification failed:", emailError.message);
      }
    }

    if (process.env.ADMIN_EMAIL && process.env.EMAIL_USER) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: "New HealGo Order Received",
          html: `
            <h2>New Order Received</h2>
            <p><b>Customer:</b> ${customerName}</p>
            <p><b>Email:</b> ${customerEmail}</p>
            <p><b>Phone:</b> ${phone}</p>
            <p><b>Address:</b> ${address}</p>
            <p><b>Items:</b> ${itemList}</p>
            <p><b>Total:</b> ₹${totalAmount}</p>
            <p><b>Payment:</b> ${paymentMethod || "Cash on Delivery"}</p>
          `,
        });
      } catch (emailError) {
        console.log("Admin email notification failed:", emailError.message);
      }
    }

    res.status(201).json({
      message: "Order Placed Successfully",
      order,
    });
  } catch (error) {
    console.log("ORDER ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userIdentifier = req.params.userId;

    const orders = await Order.find({
      $or: [{ user: userIdentifier }, { customerEmail: userIdentifier }],
    }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      message: "Order Status Updated",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  placeOrder,
  getOrders,
  getMyOrders,
  updateOrderStatus,
};
