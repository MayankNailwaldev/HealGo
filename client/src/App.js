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

  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const pharmacyCategories = [
    { name: "All", icon: "🛍️" },
    { name: "Generic Medicines", icon: "💊" },
    { name: "Skin Care", icon: "🧴" },
    { name: "Nutritional Drinks", icon: "🥤" },
    { name: "Health Supplements", icon: "💪" },
    { name: "Hair Care", icon: "✨" },
    { name: "Pain Relief", icon: "🩹" },
    { name: "Ayurveda Products", icon: "🌿" },
  ];

  const fetchMedicines = async () => {
    try {
      const { data } = await axios.get(
        "https://healgo-backend.onrender.com/api/medicines",
      );

      setMedicines(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        "https://healgo-backend.onrender.com/api/orders",
      );

      setOrders(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMyOrders = async (currentUser = user) => {
    if (!currentUser || !currentUser._id) return;

    try {
      const { data } = await axios.get(
        `https://healgo-backend.onrender.com/api/orders/my-orders/${currentUser._id}`,
      );

      setMyOrders(data);
    } catch (error) {
      console.error(error);
    }
  };

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

      const savedUser = localStorage.getItem("healgoUser");

      if (savedUser) {
        fetchMyOrders(JSON.parse(savedUser));
      }
    });

    return () => {
      socket.off("medicineUpdated");
      socket.off("orderUpdated");
    };
  }, []);

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

    toast.success("Logged out successfully");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setMedImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPrescriptionImage(reader.result);
    };

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
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
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

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch = med.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || med.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
        <section className="medicine-section">
          <div className="section-header">
            <div>
              <h2>Admin Dashboard</h2>

              <p>Add and manage medicines</p>
            </div>
          </div>

          <div className="hero-card">
            <h3>Add Medicine</h3>

            <input
              type="text"
              placeholder="Medicine Name"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              className="admin-input"
            />

            <select
              value={medCategory}
              onChange={(e) => setMedCategory(e.target.value)}
              className="admin-input"
            >
              <option value="">Select Category</option>

              <option>Generic Medicines</option>

              <option>Skin Care</option>

              <option>Nutritional Drinks</option>

              <option>Health Supplements</option>

              <option>Hair Care</option>

              <option>Pain Relief</option>

              <option>Ayurveda Products</option>
            </select>

            <input
              type="number"
              placeholder="Price"
              value={medPrice}
              onChange={(e) => setMedPrice(e.target.value)}
              className="admin-input"
            />

            <input
              type="number"
              placeholder="Stock"
              value={medStock}
              onChange={(e) => setMedStock(e.target.value)}
              className="admin-input"
            />

            <textarea
              placeholder="Description"
              value={medDescription}
              onChange={(e) => setMedDescription(e.target.value)}
              className="admin-input"
            />

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="admin-input"
            />

            <button className="cart-btn" onClick={addMedicine}>
              Add Medicine
            </button>
          </div>
        </section>
      )}

      {showCart && (
        <section className="medicine-section">
          <div className="section-header">
            <div>
              <h2>Your Cart</h2>

              <p>{cart.length} products added</p>
            </div>
          </div>

          {cart.length === 0 ? (
            <p>Cart is empty.</p>
          ) : (
            <>
              <div className="medicine-grid">
                {cart.map((item) => (
                  <div className="medicine-card" key={item._id}>
                    <div className="image-box">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>💊</span>
                      )}
                    </div>

                    <h3>{item.name}</h3>

                    <p className="desc">Quantity: {item.quantity}</p>

                    <div className="price-row">
                      <h4>₹{item.price * item.quantity}</h4>
                    </div>

                    <button
                      className="logout-btn"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div
                className="hero-card"
                style={{
                  marginTop: "30px",
                }}
              >
                <h3>Checkout Details</h3>

                <input
                  type="text"
                  placeholder="Your Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="admin-input"
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="admin-input"
                />

                <textarea
                  placeholder="Delivery Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="admin-input"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrescriptionUpload}
                  className="admin-input"
                />

                <h2
                  style={{
                    marginTop: "20px",
                  }}
                >
                  Total: ₹{cartTotal}
                </h2>

                <button className="cart-btn">Place Order</button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="hero">
        <div className="hero-text">
          <span className="badge">30 Minute Delivery</span>

          <h1>India's Modern Online Pharmacy</h1>

          <p>
            Browse medicines, wellness products, healthcare supplements and more
            with HealGo.
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

          <p>✅ Fast delivery</p>

          <p>✅ Healthcare products</p>

          <p>✅ Trusted pharmacy</p>
        </div>
      </section>

      <section className="category-showcase">
        <div className="section-header">
          <div>
            <h2>Popular Categories</h2>

            <p>Explore products category wise</p>
          </div>
        </div>

        <div className="category-showcase-grid">
          {pharmacyCategories.map((cat) => (
            <button
              key={cat.name}
              className={
                selectedCategory === cat.name
                  ? "category-showcase-card active-category-card"
                  : "category-showcase-card"
              }
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span>{cat.icon}</span>

              <p>{cat.name}</p>
            </button>
          ))}
        </div>
      </section>

      {pharmacyCategories.map((cat) => {
        if (cat.name === "All") return null;

        const categoryProducts = filteredMedicines.filter(
          (med) => med.category === cat.name,
        );

        if (categoryProducts.length === 0) return null;

        return (
          <section className="medicine-section" key={cat.name}>
            <div className="section-header">
              <div>
                <h2>{cat.name}</h2>

                <p>{categoryProducts.length} products</p>
              </div>
            </div>

            <div className="medicine-grid">
              {categoryProducts.map((med) => (
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
        );
      })}

      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
}

export default App;
