import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { io } from "socket.io-client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("https://healgo-backend.onrender.com");

function App() {
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  const [showCart, setShowCart] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [user, setUser] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [prescriptionImage, setPrescriptionImage] = useState("");

  const [medName, setMedName] = useState("");
  const [medCategory, setMedCategory] = useState("");
  const [medPrice, setMedPrice] = useState("");
  const [medStock, setMedStock] = useState("");
  const [medDescription, setMedDescription] = useState("");
  const [medImage, setMedImage] = useState("");

  useEffect(() => {
    fetchMedicines();
    fetchOrders();

    const savedUser = localStorage.getItem("healgoUser");

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchMyOrders(parsedUser);
    }

    socket.on("medicineUpdated", () => {
      fetchMedicines();
    });

    socket.on("orderUpdated", () => {
      fetchOrders();
      fetchMyOrders();
    });

    return () => {
      socket.off("medicineUpdated");
      socket.off("orderUpdated");
    };
  }, []);

  const savedUser = localStorage.getItem("healgoUser");

  if (savedUser) {
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchMyOrders(parsedUser);
  }

  const fetchMedicines = async () => {
    setMedicines(data);
    const { data } = await axios.get(
      "https://healgo-backend.onrender.com/api/medicines",
    );
    setMedicines(data);
  };

  const fetchOrders = async () => {
    const { data } = await axios.get(
      "https://healgo-backend.onrender.com/api/orders",
    );
    setOrders(data);
  };

  const fetchMyOrders = async (currentUser = user) => {
    if (!currentUser) return;

    const { data } = await axios.get(
      `https://healgo-backend.onrender.com/api/orders/my-orders/${currentUser._id}`,
    );

    setMyOrders(data);
  };

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const { data } = await axios.post(
        "https://healgo-backend.onrender.com/api/users/google-login",
        {
          name: googleUser.displayName,
          email: googleUser.email,
        },
      );

      localStorage.setItem("healgoUser", JSON.stringify(data));
      setUser(data);
      fetchMyOrders(data);
      setShowAuth(false);

      toast.success("Google Login Successful");
    } catch (error) {
      console.log(error);
      toast.error("Google Login Failed");
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("healgoUser");
    setUser(null);
    setShowAdmin(false);
    setShowCart(false);
    setShowMyOrders(false);
    setMyOrders([]);

    toast.success("Logged out successfully");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setMedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPrescriptionImage(reader.result);
    reader.readAsDataURL(file);
  };

  const addMedicine = async () => {
    try {
      const token = user?.token;

      await axios.post(
        "https://healgo-backend.onrender.com/api/medicines",
        {
          name: medName,
          category: medCategory,
          price: Number(medPrice),
          stock: Number(medStock),
          description: medDescription,
          image: medImage,
          prescriptionRequired: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Medicine Added");

      setMedName("");
      setMedCategory("");
      setMedPrice("");
      setMedStock("");
      setMedDescription("");
      setMedImage("");

      fetchMedicines();
    } catch (error) {
      console.log(error);
      toast.error("Medicine Add Failed");
    }
  };

  const deleteMedicine = async (id) => {
    try {
      const token = user?.token;

      await axios.delete(
        `https://healgo-backend.onrender.com/api/medicines/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Medicine Deleted");
      fetchMedicines();
    } catch (error) {
      console.log(error);
      toast.error("Delete Failed");
    }
  };

  const updateMedicine = async (id) => {
    try {
      const newPrice = prompt("Enter new price:");
      const newStock = prompt("Enter new stock:");

      if (!newPrice || !newStock) return;

      const token = user?.token;

      await axios.put(
        `https://healgo-backend.onrender.com/api/medicines/${id}`,
        {
          price: Number(newPrice),
          stock: Number(newStock),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Medicine Updated");
      fetchMedicines();
    } catch (error) {
      console.log(error);
      toast.error("Update Failed");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(
        `https://healgo-backend.onrender.com/api/orders/${orderId}/status`,
        {
          status,
        },
      );

      toast.success("Order Status Updated");
      fetchOrders();
      fetchMyOrders();
    } catch (error) {
      console.log(error);
      toast.error("Status Update Failed");
    }
  };

  const addToCart = (medicine) => {
    if (!user) {
      setShowAuth(true);
      toast.error("Please login first");
      return;
    }

    const exists = cart.find((item) => item._id === medicine._id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item._id === medicine._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }

    toast.success("Added to Cart");
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
    toast.success("Removed from Cart");
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const placeOrder = async () => {
    if (!user) {
      setShowAuth(true);
      toast.error("Please login first");
      return;
    }

    try {
      const { data } = await axios.post(
        "https://healgo-backend.onrender.com/api/orders",
        {
          userId: user._id,
          customerEmail: user.email,
          customerName,
          phone,
          address,
          totalAmount: cartTotal,
          paymentMethod: "Cash on Delivery",
          prescriptionImage,
          items: cart.map((item) => ({
            medicineId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      );

      toast.success(data.message);

      setCart([]);
      setCustomerName("");
      setPhone("");
      setAddress("");
      setPrescriptionImage("");
      setShowCart(false);

      fetchOrders();
      fetchMyOrders();
    } catch (error) {
      console.log(error);
      toast.error("Order Failed");
    }
  };

  const filteredMedicines = medicines.filter((med) =>
    med.name.toLowerCase().includes(search.toLowerCase()),
  );

  const Timeline = ({ status }) => (
    <div className="timeline">
      <div
        className={`timeline-step ${
          ["Order Placed", "Packed", "Out for Delivery", "Delivered"].includes(
            status,
          )
            ? "active-step"
            : "inactive-step"
        }`}
      >
        <div className="timeline-dot active"></div>
        Order Placed
      </div>

      <div
        className={`timeline-step ${
          ["Packed", "Out for Delivery", "Delivered"].includes(status)
            ? "active-step"
            : "inactive-step"
        }`}
      >
        <div
          className={`timeline-dot ${
            ["Packed", "Out for Delivery", "Delivered"].includes(status)
              ? "active"
              : ""
          }`}
        ></div>
        Packed
      </div>

      <div
        className={`timeline-step ${
          ["Out for Delivery", "Delivered"].includes(status)
            ? "active-step"
            : "inactive-step"
        }`}
      >
        <div
          className={`timeline-dot ${
            ["Out for Delivery", "Delivered"].includes(status) ? "active" : ""
          }`}
        ></div>
        Out for Delivery
      </div>

      <div
        className={`timeline-step ${
          status === "Delivered" ? "active-step" : "inactive-step"
        }`}
      >
        <div
          className={`timeline-dot ${status === "Delivered" ? "active" : ""}`}
        ></div>
        Delivered
      </div>
    </div>
  );

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">✚</span>
          <div>
            <h2>HealGo</h2>
            <p>Fast Medicine Delivery</p>
          </div>
        </div>

        <div className="nav-links">
          <button className="dark-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button
            className="cart-top-btn"
            onClick={() => setShowCart(!showCart)}
          >
            🛒 Cart ({cart.length})
          </button>

          {user && (
            <button
              className="login-btn"
              onClick={() => {
                fetchMyOrders();
                setShowMyOrders(!showMyOrders);
              }}
            >
              My Orders
            </button>
          )}

          {user && user.role === "admin" && (
            <button
              className="login-btn"
              onClick={() => setShowAdmin(!showAdmin)}
            >
              Admin Dashboard
            </button>
          )}

          {user ? (
            <>
              <span className="user-name">Hi, {user.name}</span>
              <button className="logout-btn" onClick={logoutUser}>
                Logout
              </button>
            </>
          ) : (
            <button className="login-btn" onClick={() => setShowAuth(true)}>
              Login with Google
            </button>
          )}
        </div>
      </nav>

      {showAuth && (
        <section className="auth-panel">
          <div className="auth-card">
            <button className="close-auth" onClick={() => setShowAuth(false)}>
              ×
            </button>

            <h2>Secure Login</h2>
            <p>Use your Google account to continue with HealGo.</p>

            <button onClick={googleLogin}>Continue with Google</button>
          </div>
        </section>
      )}

      {showAdmin && (
        <section className="admin-panel">
          <h2>📦 HealGo Admin Dashboard</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>{orders.length}</h3>
              <p>Total Orders</p>
            </div>

            <div className="stat-card">
              <h3>{medicines.length}</h3>
              <p>Total Medicines</p>
            </div>
          </div>

          <div className="add-medicine-form">
            <h3>Add Medicine</h3>

            <input
              type="text"
              placeholder="Medicine Name"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Category"
              value={medCategory}
              onChange={(e) => setMedCategory(e.target.value)}
            />

            <input
              type="number"
              placeholder="Price"
              value={medPrice}
              onChange={(e) => setMedPrice(e.target.value)}
            />

            <input
              type="number"
              placeholder="Stock"
              value={medStock}
              onChange={(e) => setMedStock(e.target.value)}
            />

            <textarea
              placeholder="Description"
              value={medDescription}
              onChange={(e) => setMedDescription(e.target.value)}
            ></textarea>

            <input type="file" accept="image/*" onChange={handleImageUpload} />

            {medImage && (
              <img className="image-preview" src={medImage} alt="Preview" />
            )}

            <button onClick={addMedicine}>Add Medicine</button>
          </div>

          <div className="orders-section">
            <h3>Manage Medicines</h3>

            {medicines.map((med) => (
              <div className="order-card" key={med._id}>
                <h4>{med.name}</h4>
                <p>Category: {med.category}</p>
                <p>Price: ₹{med.price}</p>
                <p>Stock: {med.stock}</p>

                <div className="medicine-actions">
                  <button onClick={() => updateMedicine(med._id)}>
                    Update
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteMedicine(med._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="orders-section">
            <h3>Recent Orders</h3>

            {orders.map((order) => (
              <div className="order-card" key={order._id}>
                <h4>{order.customerName}</h4>
                <p>📞 {order.phone}</p>
                <p>📍 {order.address}</p>
                <p>💰 ₹{order.totalAmount}</p>
                <p>💳 Payment: {order.paymentMethod}</p>
                <p>Payment Status: {order.paymentStatus}</p>

                {order.prescriptionImage && (
                  <div>
                    <p>📄 Prescription:</p>
                    <img
                      className="image-preview"
                      src={order.prescriptionImage}
                      alt="Prescription"
                    />
                  </div>
                )}

                <div className="status-row">
                  <p>Status: {order.status}</p>

                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                  >
                    <option>Order Placed</option>
                    <option>Packed</option>
                    <option>Out for Delivery</option>
                    <option>Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showMyOrders && (
        <section className="admin-panel">
          <h2>📦 My Orders</h2>

          {myOrders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            myOrders.map((order) => (
              <div className="order-card" key={order._id}>
                <h4>Order Total: ₹{order.totalAmount}</h4>
                <p>💳 Payment: {order.paymentMethod}</p>
                <p>Payment Status: {order.paymentStatus}</p>
                <p>🚚 Status: {order.status}</p>

                <Timeline status={order.status} />

                <p>📍 {order.address}</p>

                {order.prescriptionImage && (
                  <div>
                    <p>📄 Prescription Uploaded</p>
                    <img
                      className="image-preview"
                      src={order.prescriptionImage}
                      alt="Prescription"
                    />
                  </div>
                )}

                <div>
                  {order.items.map((item, index) => (
                    <p key={index}>
                      {item.name} × {item.quantity}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {showCart && (
        <section className="cart-panel">
          <h2>Your Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item._id}>
                  <div>
                    <h4>{item.name}</h4>
                    <p>
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>

                  <button onClick={() => removeFromCart(item._id)}>
                    Remove
                  </button>
                </div>
              ))}

              <div className="checkout-form">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <textarea
                  placeholder="Delivery Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                ></textarea>

                <p>Upload Prescription if required:</p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrescriptionUpload}
                />

                {prescriptionImage && (
                  <img
                    className="image-preview"
                    src={prescriptionImage}
                    alt="Prescription Preview"
                  />
                )}
              </div>

              <div className="cart-total">
                <h3>Total: ₹{cartTotal}</h3>
                <button onClick={placeOrder}>Place Order (COD)</button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="hero">
        <div className="hero-text">
          <span className="badge">30 Minute Delivery</span>
          <h1>Fast Medicine Delivery at Your Doorstep</h1>
          <p>
            Order genuine medicines online and get them delivered quickly with
            HealGo.
          </p>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button>Search</button>
          </div>
        </div>

        <div className="hero-card">
          <h3>Why HealGo?</h3>
          <p>✅ Genuine medicines</p>
          <p>✅ Secure checkout</p>
          <p>✅ Fast delivery</p>
          <p>✅ Easy reorder</p>
        </div>
      </section>

      <section className="medicine-section">
        <div className="section-header">
          <h2>Popular Medicines</h2>
          <p>{filteredMedicines.length} medicines available</p>
        </div>

        <div className="medicine-grid">
          {filteredMedicines.map((med) => (
            <div className="medicine-card" key={med._id}>
              <div className="image-box">
                {med.image ? (
                  <img src={med.image} alt={med.name} />
                ) : (
                  <span>💊</span>
                )}
              </div>

              <h3>{med.name}</h3>
              <p className="category">{med.category}</p>
              <p className="desc">{med.description}</p>

              <div className="price-row">
                <h4>₹{med.price}</h4>
                <span>Stock: {med.stock}</span>
              </div>

              <button className="cart-btn" onClick={() => addToCart(med)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
}

export default App;
