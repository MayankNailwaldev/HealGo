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
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [activeBanner, setActiveBanner] = useState(0);

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

  const banners = [
    {
      badge: "30 Minute Delivery",
      title: "India's Modern Online Pharmacy",
      text: "Order medicines, wellness products, supplements and daily healthcare essentials with HealGo.",
      emoji: "🚀",
    },
    {
      badge: "Trusted Pharmacy",
      title: "Genuine Medicines Delivered Fast",
      text: "Buy from verified medicine listings with simple checkout and real-time updates.",
      emoji: "💊",
    },
    {
      badge: "Healthcare Essentials",
      title: "Everything For Your Daily Wellness",
      text: "Skin care, hair care, ayurveda, supplements, pain relief and more in one place.",
      emoji: "🌿",
    },
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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [banners.length]);

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
      if (!user || user.role !== "admin") {
        toast.error("Admin login required");
        return;
      }

      if (!medName || !medCategory || !medPrice || !medStock) {
        toast.error("Please fill medicine name, category, price and stock");
        return;
      }

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
      toast.error(error.response?.data?.message || "Medicine Add Failed");
    }
  };

  const addToCart = (medicine) => {
    if (!user) {
      setShowAuth(true);
      toast.error("Please login first");
      return;
    }

    if (medicine.stock <= 0) {
      toast.error("Out of stock");
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

  const increaseQuantity = (id) => {
    setCart(
      cart.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decreaseQuantity = (id) => {
    setCart(
      cart
        .map((item) =>
          item._id === id
            ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
    toast.success("Removed from Cart");
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const deliveryFee = cartTotal > 499 || cartTotal === 0 ? 0 : 40;
  const grandTotal = cartTotal + deliveryFee;
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async () => {
    try {
      if (!user) {
        toast.error("Please login first");
        return;
      }

      if (!customerName || !phone || !address) {
        toast.error("Please fill all checkout details");
        return;
      }

      if (cart.length === 0) {
        toast.error("Cart is empty");
        return;
      }

      const orderData = {
        user: user._id,
        userId: user._id,
        customerName,
        phone,
        address,
        prescriptionImage: prescriptionImage || "",
        items: cart.map((item) => ({
          medicine: item._id,
          medicineId: item._id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
        })),
        total: grandTotal,
        totalAmount: grandTotal,
        deliveryFee,
        status: "Pending",
        paymentMethod: "COD",
      };

      console.log("ORDER DATA:", orderData);

      await axios.post(
        "https://healgo-backend.onrender.com/api/orders",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      toast.success("Order Placed Successfully");
      alert("✅ Order placed successfully! You can check it in My Orders.");

      setCart([]);
      setCustomerName("");
      setPhone("");
      setAddress("");
      setPrescriptionImage("");

      await fetchOrders();
      await fetchMyOrders(user);

      setShowCart(false);
      setShowMyOrders(true);
    } catch (error) {
      console.log("ORDER ERROR:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Order Failed");
    }
  };

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch = med.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || med.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCartItemQuantity = (id) => {
    const item = cart.find((cartItem) => cartItem._id === id);
    return item ? item.quantity : 0;
  };

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
            onClick={() => {
              setShowCart(!showCart);
              setShowAdmin(false);
              setShowMyOrders(false);
            }}
          >
            🛒 Cart ({totalCartItems})
          </button>

          {user && (
            <button
              className="cart-top-btn"
              onClick={() => {
                setShowMyOrders(!showMyOrders);
                setShowCart(false);
                setShowAdmin(false);
                fetchMyOrders(user);
              }}
            >
              📦 My Orders
            </button>
          )}

          {user && user.role === "admin" && (
            <button
              className="login-btn"
              onClick={() => {
                setShowAdmin(!showAdmin);
                setShowCart(false);
                setShowMyOrders(false);
              }}
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

      {selectedMedicine && (
        <section className="modal-overlay">
          <div className="product-modal">
            <button
              className="close-auth"
              onClick={() => setSelectedMedicine(null)}
            >
              ×
            </button>

            <div className="modal-image">
              {selectedMedicine.image ? (
                <img src={selectedMedicine.image} alt={selectedMedicine.name} />
              ) : (
                <span>💊</span>
              )}
            </div>

            <div className="modal-info">
              <span className="product-badge">Verified Product</span>
              <h2>{selectedMedicine.name}</h2>
              <p className="category">{selectedMedicine.category}</p>
              <p className="desc">{selectedMedicine.description}</p>

              <div className="modal-stats">
                <div>
                  <strong>₹{selectedMedicine.price}</strong>
                  <span>Price</span>
                </div>
                <div>
                  <strong>{selectedMedicine.stock}</strong>
                  <span>Stock</span>
                </div>
                <div>
                  <strong>4.8★</strong>
                  <span>Rating</span>
                </div>
              </div>

              <button
                className="cart-btn"
                onClick={() => {
                  addToCart(selectedMedicine);
                  setSelectedMedicine(null);
                }}
              >
                Add to Cart
              </button>
            </div>
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

          <div className="admin-layout">
            <div className="stat-card">
              <h3>{medicines.length}</h3>
              <p>Total Medicines</p>
            </div>
            <div className="stat-card">
              <h3>{orders.length}</h3>
              <p>Total Orders</p>
            </div>
            <div className="stat-card">
              <h3>{pharmacyCategories.length - 1}</h3>
              <p>Categories</p>
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

      {showMyOrders && (
        <section className="medicine-section">
          <div className="section-header">
            <div>
              <h2>My Orders</h2>
              <p>Your recent medicine orders</p>
            </div>
          </div>

          {myOrders.length === 0 ? (
            <div className="empty-box">
              <h3>No orders yet</h3>
              <p>Your orders will appear here after checkout.</p>
            </div>
          ) : (
            <div className="medicine-grid">
              {myOrders.map((order) => (
                <div className="medicine-card" key={order._id}>
                  <h3>Order #{order._id?.slice(-6)}</h3>
                  <p className="category">{order.status || "Pending"}</p>
                  <p className="desc">
                    Total: ₹{order.totalAmount || order.total || 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showCart && (
        <section className="medicine-section">
          <div className="section-header">
            <div>
              <h2>Your Cart</h2>
              <p>{totalCartItems} products added</p>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="empty-box">
              <h3>🛒 Cart is empty</h3>
              <p>Add medicines and healthcare products to continue.</p>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item._id}>
                    <div className="cart-item-img">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>💊</span>
                      )}
                    </div>

                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <p>{item.category}</p>
                      <h4>₹{item.price}</h4>

                      <div className="qty-row">
                        <button onClick={() => decreaseQuantity(item._id)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item._id)}>
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      className="remove-mini"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="checkout-card">
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

                <label className="upload-label">
                  Upload Prescription if needed
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrescriptionUpload}
                  className="admin-input"
                />

                <div className="bill-box">
                  <p>
                    <span>Subtotal</span>
                    <strong>₹{cartTotal}</strong>
                  </p>
                  <p>
                    <span>Delivery Fee</span>
                    <strong>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </strong>
                  </p>
                  <p className="grand-total">
                    <span>Total</span>
                    <strong>₹{grandTotal}</strong>
                  </p>
                </div>

                <button className="cart-btn" onClick={placeOrder}>
                  Place Order
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="hero">
        <div className="hero-text">
          <span className="badge">{banners[activeBanner].badge}</span>
          <h1>{banners[activeBanner].title}</h1>
          <p>{banners[activeBanner].text}</p>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button>Search</button>
          </div>

          <div className="banner-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={activeBanner === index ? "dot active-dot" : "dot"}
                onClick={() => setActiveBanner(index)}
              />
            ))}
          </div>
        </div>

        <div className="hero-card premium-hero-card">
          <div className="hero-emoji">{banners[activeBanner].emoji}</div>
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
              {categoryProducts.map((med) => {
                const quantity = getCartItemQuantity(med._id);

                return (
                  <div className="medicine-card" key={med._id}>
                    <span className="product-badge">Best Seller</span>

                    <div
                      className="image-box"
                      onClick={() => setSelectedMedicine(med)}
                    >
                      {med.image ? (
                        <img src={med.image} alt={med.name} />
                      ) : (
                        <span>💊</span>
                      )}
                    </div>

                    <h3 onClick={() => setSelectedMedicine(med)}>{med.name}</h3>
                    <p className="category">{med.category}</p>
                    <p className="desc">{med.description}</p>

                    <div className="price-row">
                      <h4>₹{med.price}</h4>
                      <span
                        className={med.stock <= 0 ? "stock-out" : "stock-in"}
                      >
                        {med.stock <= 0
                          ? "Out of Stock"
                          : `Stock: ${med.stock}`}
                      </span>
                    </div>

                    {quantity > 0 ? (
                      <div className="qty-row card-qty">
                        <button onClick={() => decreaseQuantity(med._id)}>
                          -
                        </button>
                        <span>{quantity}</span>
                        <button onClick={() => increaseQuantity(med._id)}>
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        className="cart-btn"
                        onClick={() => addToCart(med)}
                        disabled={med.stock <= 0}
                      >
                        {med.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <footer className="footer">
        <div>
          <h2>HealGo</h2>
          <p>Fast Medicine Delivery</p>
        </div>

        <div>
          <h4>Company</h4>
          <p>About HealGo</p>
          <p>Contact Us</p>
          <p>Careers</p>
        </div>

        <div>
          <h4>Legal</h4>
          <p>Privacy Policy</p>
          <p>Terms & Conditions</p>
          <p>Refund Policy</p>
        </div>

        <div>
          <h4>Support</h4>
          <p>Email: support@healgo.in</p>
          <p>Delivery: 30–60 minutes</p>
          <p>Prescription support available</p>
        </div>
      </footer>

      {cart.length > 0 && (
        <div className="mobile-cart-bar" onClick={() => setShowCart(true)}>
          <span>🛒 {totalCartItems} Items</span>
          <strong>₹{grandTotal}</strong>
          <button>Checkout</button>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
}

export default App;
