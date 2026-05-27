import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  Search,
  ShoppingCart,
  LogIn,
  LogOut,
  Plus,
  Minus,
  Trash2,
  Package,
  ShieldCheck,
  Home,
  ClipboardList,
  User,
  Menu,
  X,
} from "lucide-react";
import "./App.css";

const API_URL = "https://healgo-backend.onrender.com";

const ADMIN_EMAILS = ["nomayank04@gmail.com"];

const categories = [
  "All",
  "Generic Medicines",
  "Skin Care",
  "Nutritional Drinks",
  "Health Supplements",
  "Hair Care",
  "Pain Relief",
  "Ayurveda Products",
];

export default function App() {
  const [user, setUser] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    fetchMedicines();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/medicines`);
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/orders`);
      const allOrders = Array.isArray(data) ? data : [];
      if (isAdmin) {
        setOrders(allOrders);
      } else {
        setOrders(allOrders.filter((o) => o.userEmail === user?.email));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch {
      alert("Login failed");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCart([]);
    setOrders([]);
    setActivePage("home");
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchCategory =
        activeCategory === "All" || m.category === activeCategory;
      const matchSearch =
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.category?.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [medicines, activeCategory, search]);

  const addToCart = (medicine) => {
    setCart((prev) => {
      const exists = prev.find((item) => item._id === medicine._id);
      if (exists) {
        return prev.map((item) =>
          item._id === medicine._id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [...prev, { ...medicine, qty: 1 }];
    });
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, qty: item.qty + 1 } : item,
      ),
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id ? { ...item, qty: item.qty - 1 } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.qty,
    0,
  );

  const placeOrder = async () => {
    if (!user) return alert("Please login first");
    if (cart.length === 0) return alert("Your cart is empty");

    const phone = prompt("Enter your phone number:");
    if (!phone) return alert("Phone number is required");

    const address = prompt("Enter your delivery address:");
    if (!address) return alert("Address is required");

    try {
      const orderData = {
        customerName: user.displayName || "Customer",
        customerEmail: user.email,
        phone,
        address,
        items: cart.map((item) => ({
          medicineId: item._id,
          name: item.name,
          price: Number(item.price),
          quantity: item.qty,
        })),
        totalAmount,
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        status: "Order Placed",
      };

      console.log("SENDING ORDER:", orderData);

      await axios.post(`${API_URL}/api/orders`, orderData);

      alert("Order placed successfully!");
      setCart([]);
      setActivePage("orders");
      fetchOrders();
    } catch (err) {
      console.error("ORDER ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Order failed");
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "cart", label: `Cart (${cart.length})`, icon: ShoppingCart },
    { id: "orders", label: "My Orders", icon: ClipboardList },
  ];

  if (isAdmin) {
    navItems.push({ id: "admin", label: "Admin", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl">
              H
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">HealGo</h1>
              <p className="text-xs text-slate-500">Fast Medicine Delivery</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                    activePage === item.id
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "text-slate-600 hover:bg-emerald-50"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm font-bold text-slate-700">
                  {user.displayName}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold flex items-center gap-2"
              >
                <LogIn size={18} />
                Login
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden px-4 pb-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold flex items-center gap-2"
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}

            {user ? (
              <button
                onClick={logout}
                className="w-full px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-bold"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={login}
                className="w-full px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold"
              >
                Login
              </button>
            )}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activePage === "home" && (
          <>
            <section className="rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-500 p-8 md:p-12 text-white shadow-2xl shadow-emerald-100 mb-8">
              <h2 className="text-3xl md:text-5xl font-black max-w-2xl">
                Medicines delivered fast, safe and trusted.
              </h2>
              <p className="mt-4 text-emerald-50 max-w-xl">
                Search medicines, choose health categories and order online with
                HealGo.
              </p>

              <div className="mt-8 bg-white rounded-3xl p-3 max-w-2xl flex items-center gap-3">
                <Search className="text-slate-400 ml-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medicine or category..."
                  className="w-full outline-none text-slate-800"
                />
              </div>
            </section>

            <section className="flex gap-3 overflow-x-auto pb-4 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeCategory === cat
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "bg-white text-slate-600 hover:bg-emerald-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </section>

            {loading ? (
              <p className="text-center font-bold text-slate-500">
                Loading medicines...
              </p>
            ) : (
              <section className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMedicines.map((med) => (
                  <div
                    key={med._id}
                    className="bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="h-44 rounded-3xl bg-emerald-50 flex items-center justify-center overflow-hidden">
                      {med.image ? (
                        <img
                          src={med.image}
                          alt={med.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={56} className="text-emerald-600" />
                      )}
                    </div>

                    <p className="mt-5 text-xs font-bold text-emerald-700 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                      {med.category || "Medicine"}
                    </p>

                    <h3 className="mt-3 text-lg font-black text-slate-900">
                      {med.name}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {med.description || "Trusted healthcare product"}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-2xl font-black text-slate-900">
                        ₹{med.price}
                      </p>

                      <button
                        onClick={() => addToCart(med)}
                        className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:scale-105 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {activePage === "cart" && (
          <section className="bg-white rounded-[2rem] p-6 shadow-sm">
            <h2 className="text-3xl font-black text-slate-900 mb-6">
              Your Cart
            </h2>

            {cart.length === 0 ? (
              <p className="text-slate-500">Your cart is empty.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-50"
                    >
                      <div>
                        <h3 className="font-black text-slate-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          ₹{item.price} × {item.qty}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => decreaseQty(item._id)}
                          className="h-10 w-10 rounded-xl bg-white flex items-center justify-center"
                        >
                          <Minus size={18} />
                        </button>

                        <span className="font-black">{item.qty}</span>

                        <button
                          onClick={() => increaseQty(item._id)}
                          className="h-10 w-10 rounded-xl bg-white flex items-center justify-center"
                        >
                          <Plus size={18} />
                        </button>

                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col md:flex-row justify-between gap-4 items-center">
                  <h3 className="text-2xl font-black">Total: ₹{totalAmount}</h3>

                  <button
                    onClick={placeOrder}
                    className="w-full md:w-auto px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black shadow-lg shadow-emerald-200"
                  >
                    Place Order
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {activePage === "orders" && (
          <section className="bg-white rounded-[2rem] p-6 shadow-sm">
            <h2 className="text-3xl font-black text-slate-900 mb-6">
              {isAdmin ? "All Orders" : "My Orders"}
            </h2>

            {orders.length === 0 ? (
              <p className="text-slate-500">No orders found.</p>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <div key={order._id} className="rounded-3xl bg-slate-50 p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          {order.userName || "Customer"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {order.userEmail}
                        </p>
                      </div>

                      <p className="font-black text-emerald-700">
                        ₹{order.totalAmount}
                      </p>
                    </div>

                    <div className="mt-4 text-sm text-slate-600">
                      {order.items?.map((item) => (
                        <p key={item._id}>
                          {item.name} × {item.qty}
                        </p>
                      ))}
                    </div>

                    <p className="mt-3 text-xs font-bold text-emerald-700">
                      Status: {order.status || "Placed"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activePage === "admin" && isAdmin && (
          <AdminPanel fetchMedicines={fetchMedicines} />
        )}
      </main>
    </div>
  );
}

function AdminPanel({ fetchMedicines }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Generic Medicines",
    image: "",
    description: "",
  });

  const addMedicine = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/api/medicines`, form);
      alert("Medicine added successfully!");
      setForm({
        name: "",
        price: "",
        category: "Generic Medicines",
        image: "",
        description: "",
      });
      fetchMedicines();
    } catch (err) {
      console.error(err);
      alert("Failed to add medicine");
    }
  };

  return (
    <section className="bg-white rounded-[2rem] p-6 shadow-sm">
      <h2 className="text-3xl font-black text-slate-900 mb-6">Admin Panel</h2>

      <form onSubmit={addMedicine} className="grid md:grid-cols-2 gap-4">
        <input
          required
          placeholder="Medicine name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="p-4 rounded-2xl bg-slate-50 outline-none"
        />

        <input
          required
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="p-4 rounded-2xl bg-slate-50 outline-none"
        />

        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="p-4 rounded-2xl bg-slate-50 outline-none"
        >
          {categories.slice(1).map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>

        <input
          placeholder="Image URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          className="p-4 rounded-2xl bg-slate-50 outline-none"
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="md:col-span-2 p-4 rounded-2xl bg-slate-50 outline-none"
        />

        <button className="md:col-span-2 py-4 rounded-2xl bg-emerald-600 text-white font-black">
          Add Medicine
        </button>
      </form>
    </section>
  );
}
