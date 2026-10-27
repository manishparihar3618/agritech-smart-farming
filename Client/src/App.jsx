import { useState, useEffect } from "react";
import "./App.css";
import Auth from "./Auth";
import { AGRI_CROPS_DATA, FARMING_SERVICES_DATA } from "./agriData";

function App() {
  const API = "http://localhost:5000";

  // Navigation and Auth states
  const [section, setSection] = useState("dashboard");
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agritech_user") || "null");
    } catch {
      return null;
    }
  });

  // Data states
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Modals
  const [selectedFarmDetails, setSelectedFarmDetails] = useState(null);
  const [selectedCropDetails, setSelectedCropDetails] = useState(null);
  const [selectedCropGuide, setSelectedCropGuide] = useState(null);
  const [orderingProduct, setOrderingProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderShipping, setOrderShipping] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    paymentMethod: "Cash on Delivery",
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Filters & Search
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [agriCategoryFilter, setAgriCategoryFilter] = useState("all");
  const [agriSearch, setAgriSearch] = useState("");
  const [productViewMode, setProductViewMode] = useState("all"); // 'all' or 'my'

  // Weather state
  const [weatherCity, setWeatherCity] = useState("Indore");
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // Service booking prefill
  const [servicePrefill, setServicePrefill] = useState(null);

  // Load weather on initial mount
  useEffect(() => {
    loadWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user logs in, load dashboard data
  useEffect(() => {
    if (loggedInUser) {
      loadAllUserData();
    }
  }, [loggedInUser]);

  const token = localStorage.getItem("agritech_token");

  async function loadAllUserData() {
    const activeToken = localStorage.getItem("agritech_token");
    if (!activeToken) return;

    try {
      const headers = { Authorization: `Bearer ${activeToken}` };
      const [farmsRes, cropsRes, productsRes, ordersRes, bookingsRes] = await Promise.all([
        fetch(`${API}/api/farms`, { headers }),
        fetch(`${API}/api/crops`, { headers }),
        fetch(`${API}/api/products`, { headers }),
        fetch(`${API}/api/orders`, { headers }),
        fetch(`${API}/api/bookings`, { headers }),
      ]);

      if (farmsRes.ok) {
        const data = await farmsRes.json();
        setFarms(data.farms || []);
      }
      if (cropsRes.ok) {
        const data = await cropsRes.json();
        setCrops(data.crops || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setMyOrders(data.orders || []);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.warn("Could not load initial user dataset:", err.message);
    }
  }

  async function loadSection(target = section) {
    const activeToken = localStorage.getItem("agritech_token") || token;
    setMobileMenuOpen(false);

    if (!activeToken && !["home", "features", "services", "agri-info", "weather"].includes(target)) {
      setShowAuth(true);
      return;
    }

    setSection(target);
    setError("");
    setMessage("");

    const endpoints = {
      farms: "/api/farms",
      crops: "/api/crops",
      products: productViewMode === "my" ? "/api/products?myProducts=true" : "/api/products",
      orders: "/api/orders",
      bookings: "/api/bookings",
    };

    if (!endpoints[target] || !activeToken) {
      if (target === "weather" && !weather) {
        loadWeather();
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API + endpoints[target], {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load data");
      }

      if (target === "farms") setFarms(data.farms || []);
      if (target === "crops") setCrops(data.crops || []);
      if (target === "products") setProducts(data.products || []);
      if (target === "orders") setMyOrders(data.orders || []);
      if (target === "bookings") setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || "Could not connect to the server");
    } finally {
      setLoading(false);
    }
  }

  // Farm Actions
  async function addFarm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formEl = event.currentTarget;
    setError("");
    setMessage("");

    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/farms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          name: form.get("name"),
          location: {
            address: form.get("address"),
            city: form.get("city"),
            state: form.get("state"),
            pincode: form.get("pincode"),
          },
          size: Number(form.get("size")),
          sizeUnit: form.get("sizeUnit"),
          soilType: form.get("soilType"),
          irrigationType: form.get("irrigationType"),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not add farm");

      formEl.reset();
      setMessage("✓ Farm registered successfully!");
      await loadSection("farms");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteFarm(id) {
    if (!window.confirm("Are you sure you want to delete this farm?")) return;
    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/farms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete farm");
      setMessage("✓ Farm deleted successfully!");
      if (selectedFarmDetails?._id === id) setSelectedFarmDetails(null);
      await loadSection("farms");
    } catch (err) {
      setError(err.message);
    }
  }

  // Crop Actions
  async function addCrop(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formEl = event.currentTarget;
    setError("");
    setMessage("");

    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/crops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          farm: form.get("farm"),
          name: form.get("name"),
          variety: form.get("variety"),
          plantingDate: form.get("plantingDate") || undefined,
          expectedHarvestDate: form.get("expectedHarvestDate") || undefined,
          growthStage: form.get("growthStage"),
          area: Number(form.get("area") || 0),
          status: "active",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not add crop");

      formEl.reset();
      setMessage("✓ Crop recorded successfully!");
      await loadSection("crops");
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateCropStage(cropId, newStage) {
    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/crops/${cropId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ growthStage: newStage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update crop stage");

      setMessage(`✓ Crop stage updated to "${newStage}"!`);
      if (selectedCropDetails?._id === cropId) {
        setSelectedCropDetails({ ...selectedCropDetails, growthStage: newStage });
      }
      await loadSection("crops");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteCrop(id) {
    if (!window.confirm("Are you sure you want to delete this crop record?")) return;
    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/crops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete crop");
      setMessage("✓ Crop removed successfully!");
      if (selectedCropDetails?._id === id) setSelectedCropDetails(null);
      await loadSection("crops");
    } catch (err) {
      setError(err.message);
    }
  }

  // Product Actions
  async function addProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formEl = event.currentTarget;
    setError("");
    setMessage("");

    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          name: form.get("name"),
          category: form.get("category"),
          description: form.get("description"),
          brand: form.get("brand"),
          price: Number(form.get("price")),
          unit: form.get("unit"),
          stock: Number(form.get("stock")),
          isAvailable: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not list product");

      formEl.reset();
      setMessage("✓ Product listed in marketplace!");
      await loadSection("products");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product listing?")) return;
    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete product");
      setMessage("✓ Product listing removed!");
      await loadSection("products");
    } catch (err) {
      setError(err.message);
    }
  }

  // Order Actions (Product Order Flow)
  function startOrderFlow(product) {
    if (!loggedInUser) {
      setShowAuth(true);
      return;
    }
    setOrderingProduct(product);
    setOrderQuantity(1);
    setOrderShipping({
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: loggedInUser.phone || "",
      paymentMethod: "Cash on Delivery",
    });
    setError("");
    setMessage("");
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (!orderingProduct) return;

    setOrderSubmitting(true);
    setError("");
    setMessage("");

    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          productId: orderingProduct._id,
          quantity: Number(orderQuantity),
          shippingAddress: {
            address: orderShipping.address,
            city: orderShipping.city,
            state: orderShipping.state,
            pincode: orderShipping.pincode,
            phone: orderShipping.phone,
          },
          paymentMethod: orderShipping.paymentMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to place order");
      }

      setOrderingProduct(null);
      setMessage(`✓ Order placed successfully for ${orderingProduct.name}! (Order #${data.order._id.slice(-6)})`);
      await loadSection("orders");
    } catch (err) {
      setError(err.message || "Order placement failed");
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function cancelOrder(orderId) {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not cancel order");
      setMessage("✓ Order cancelled successfully!");
      await loadSection("orders");
    } catch (err) {
      setError(err.message);
    }
  }

  // Booking Actions
  async function addBooking(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formEl = event.currentTarget;
    setError("");
    setMessage("");

    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          bookingType: form.get("bookingType"),
          farm: form.get("farm") || undefined,
          title: form.get("title"),
          description: form.get("description"),
          scheduledDate: form.get("scheduledDate"),
          totalAmount: Number(form.get("totalAmount") || 0),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create booking");

      formEl.reset();
      setServicePrefill(null);
      setMessage("✓ Booking scheduled successfully!");
      await loadSection("bookings");
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelBooking(id) {
    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not cancel booking");
      setMessage("✓ Booking status updated to cancelled!");
      await loadSection("bookings");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteBooking(id) {
    if (!window.confirm("Are you sure you want to delete this booking record?")) return;
    try {
      const activeToken = localStorage.getItem("agritech_token") || token;
      const response = await fetch(`${API}/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete booking");
      setMessage("✓ Booking record removed!");
      await loadSection("bookings");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleServiceBookingClick(service) {
    if (!loggedInUser) {
      setShowAuth(true);
      return;
    }
    setServicePrefill({
      type: service.id === "equipment" ? "equipment" : service.id === "consultation" ? "expert_consultation" : "farming_service",
      title: `${service.title} Booking`,
      amount: parseInt(service.startingRate.replace(/\D/g, "")) || 500,
    });
    setSection("bookings");
  }

  // Weather Logic
  async function loadWeather(event) {
    event?.preventDefault?.();
    const cityQuery = (weatherCity || "").trim();
    if (!cityQuery) {
      setWeatherError("Please enter a city name.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");

    try {
      const cityResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=en&format=json`
      );

      if (!cityResponse.ok) throw new Error("Unable to search city.");
      const cityData = await cityResponse.json();
      const place = cityData.results?.[0];

      if (!place) {
        throw new Error(`City "${cityQuery}" not found. Try a major district or state.`);
      }

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`
      );

      if (!weatherResponse.ok) throw new Error("Unable to fetch weather forecast data.");
      const data = await weatherResponse.json();

      setWeather({
        city: place.name,
        region: place.admin1 || place.country || "",
        current: data.current,
        daily: data.daily,
      });
    } catch (error) {
      setWeatherError(error.message || "Weather request failed.");
    } finally {
      setWeatherLoading(false);
    }
  }

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      productCategoryFilter === "all" || prod.category === productCategoryFilter;
    const matchesSearch =
      !productSearch.trim() ||
      prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (prod.brand && prod.brand.toLowerCase().includes(productSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Filtered Agri Crops
  const filteredAgriCrops = AGRI_CROPS_DATA.filter((c) => {
    const matchesCat = agriCategoryFilter === "all" || c.category === agriCategoryFilter;
    const matchesQuery =
      !agriSearch.trim() ||
      c.name.toLowerCase().includes(agriSearch.toLowerCase()) ||
      c.scientificName.toLowerCase().includes(agriSearch.toLowerCase()) ||
      c.season.toLowerCase().includes(agriSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Navigation items for logged in user
  const loggedInSections = [
    ["dashboard", "Dashboard", "📊"],
    ["farms", "My Farms", "🏡"],
    ["crops", "Crop Tracking", "🌾"],
    ["products", "Products Marketplace", "📦"],
    ["orders", "My Orders", "🛒"],
    ["bookings", "Bookings", "📅"],
    ["agri-info", "Agri Knowledge", "📚"],
    ["weather", "Weather Forecast", "🌦️"],
  ];

  return (
    <div className="app">
      {/* Authentication Modal */}
      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal-box auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowAuth(false)}
              aria-label="Close authentication"
            >
              ✕
            </button>
            <Auth
              onLogin={(user) => {
                setLoggedInUser(user);
                setShowAuth(false);
                setSection("dashboard");
                loadAllUserData();
              }}
            />
          </div>
        </div>
      )}

      {/* Product Order Flow Modal */}
      {orderingProduct && (
        <div className="modal-backdrop" onClick={() => setOrderingProduct(null)}>
          <div className="modal-box order-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setOrderingProduct(null)}
              aria-label="Close order dialog"
            >
              ✕
            </button>
            <div className="modal-header">
              <span className="modal-badge">Direct Farm Order</span>
              <h2>Order: {orderingProduct.name}</h2>
              <p className="modal-subtitle">
                {orderingProduct.brand ? `Brand: ${orderingProduct.brand} • ` : ""}
                Category: <span className="tag">{orderingProduct.category}</span>
              </p>
            </div>

            <form onSubmit={submitOrder} className="order-form">
              <div className="order-summary-box">
                <div className="order-row">
                  <span>Unit Price:</span>
                  <strong>₹{orderingProduct.price} / {orderingProduct.unit || "unit"}</strong>
                </div>
                <div className="order-row">
                  <span>Available Stock:</span>
                  <span>{orderingProduct.stock} {orderingProduct.unit || "items"}</span>
                </div>
                <div className="order-row quantity-selector">
                  <label htmlFor="order-qty">Order Quantity:</label>
                  <input
                    id="order-qty"
                    type="number"
                    min="1"
                    max={orderingProduct.stock}
                    value={orderQuantity}
                    onChange={(e) =>
                      setOrderQuantity(
                        Math.max(1, Math.min(Number(e.target.value), orderingProduct.stock))
                      )
                    }
                    required
                  />
                </div>
                <div className="order-row total-highlight">
                  <span>Total Amount:</span>
                  <strong>₹{(orderingProduct.price * orderQuantity).toFixed(2)}</strong>
                </div>
              </div>

              <h3>Delivery & Shipping Address</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Street / Farm Address *"
                  required
                  value={orderShipping.address}
                  onChange={(e) => setOrderShipping({ ...orderShipping, address: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="City / Village / District *"
                  required
                  value={orderShipping.city}
                  onChange={(e) => setOrderShipping({ ...orderShipping, city: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="State (e.g. Madhya Pradesh, Punjab)"
                  value={orderShipping.state}
                  onChange={(e) => setOrderShipping({ ...orderShipping, state: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={orderShipping.pincode}
                  onChange={(e) => setOrderShipping({ ...orderShipping, pincode: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Contact Phone Number *"
                  required
                  value={orderShipping.phone}
                  onChange={(e) => setOrderShipping({ ...orderShipping, phone: e.target.value })}
                />
                <select
                  value={orderShipping.paymentMethod}
                  onChange={(e) =>
                    setOrderShipping({ ...orderShipping, paymentMethod: e.target.value })
                  }
                >
                  <option value="Cash on Delivery">Cash on Delivery (Pay at Farm Delivery)</option>
                  <option value="UPI / Online">UPI / Instant QR Payment</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setOrderingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={orderSubmitting || orderingProduct.stock <= 0}
                >
                  {orderSubmitting ? "Placing Order..." : `Confirm Order (₹${(orderingProduct.price * orderQuantity).toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Farm Details Modal */}
      {selectedFarmDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedFarmDetails(null)}>
          <div className="modal-box details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedFarmDetails(null)}
              aria-label="Close farm details"
            >
              ✕
            </button>
            <div className="modal-header">
              <span className="modal-badge">Farm Profile</span>
              <h2>🏡 {selectedFarmDetails.name}</h2>
              <p className="modal-subtitle">
                {selectedFarmDetails.location?.city ? `${selectedFarmDetails.location.city}, ` : ""}
                {selectedFarmDetails.location?.state || "India"}
              </p>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Total Land Area</span>
                <span className="detail-val">
                  {selectedFarmDetails.size} {selectedFarmDetails.sizeUnit || "acre"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Soil Classification</span>
                <span className="detail-val">{selectedFarmDetails.soilType || "Alluvial / Loamy"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Irrigation System</span>
                <span className="detail-val">{selectedFarmDetails.irrigationType || "Drip / Tube-well"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Full Address</span>
                <span className="detail-val">{selectedFarmDetails.location?.address || "—"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pincode</span>
                <span className="detail-val">{selectedFarmDetails.location?.pincode || "—"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Registered Date</span>
                <span className="detail-val">
                  {selectedFarmDetails.createdAt
                    ? new Date(selectedFarmDetails.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>

            <h3>Active Crops on this Farm</h3>
            {crops.filter((c) => (c.farm?._id || c.farm) === selectedFarmDetails._id).length === 0 ? (
              <p className="muted-text">No crops linked to this farm yet. Go to Crop Tracking to register one.</p>
            ) : (
              <div className="mini-tags-list">
                {crops
                  .filter((c) => (c.farm?._id || c.farm) === selectedFarmDetails._id)
                  .map((crop) => (
                    <span key={crop._id} className="badge-tag">
                      🌾 {crop.name} ({crop.growthStage || "active"})
                    </span>
                  ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setSelectedFarmDetails(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => deleteFarm(selectedFarmDetails._id)}
              >
                Delete Farm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Details Modal */}
      {selectedCropDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedCropDetails(null)}>
          <div className="modal-box details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedCropDetails(null)}
              aria-label="Close crop details"
            >
              ✕
            </button>
            <div className="modal-header">
              <span className="modal-badge">Crop Lifecycle Status</span>
              <h2>🌾 {selectedCropDetails.name}</h2>
              <p className="modal-subtitle">
                Variety: {selectedCropDetails.variety || "Standard"} • Farm:{" "}
                {selectedCropDetails.farm?.name || "Assigned Farm"}
              </p>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Current Growth Stage</span>
                <span className="stage-pill stage-active">{selectedCropDetails.growthStage}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cultivated Area</span>
                <span className="detail-val">{selectedCropDetails.area || "—"} acres</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Planting Date</span>
                <span className="detail-val">
                  {selectedCropDetails.plantingDate
                    ? new Date(selectedCropDetails.plantingDate).toLocaleDateString()
                    : "Not specified"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Harvest Date</span>
                <span className="detail-val">
                  {selectedCropDetails.expectedHarvestDate
                    ? new Date(selectedCropDetails.expectedHarvestDate).toLocaleDateString()
                    : "Not specified"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Field Status</span>
                <span className="detail-val capitalize">{selectedCropDetails.status || "active"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Days In Field</span>
                <span className="detail-val">
                  {selectedCropDetails.plantingDate
                    ? `${Math.max(
                        0,
                        Math.floor(
                          (new Date() - new Date(selectedCropDetails.plantingDate)) /
                            (1000 * 60 * 60 * 24)
                        )
                      )} days`
                    : "—"}
                </span>
              </div>
            </div>

            <div className="stage-update-box">
              <h4>Update Crop Growth Stage</h4>
              <div className="stage-buttons">
                {["planned", "seedling", "vegetative", "flowering", "harvesting", "harvested"].map(
                  (stage) => (
                    <button
                      key={stage}
                      type="button"
                      className={`stage-btn ${selectedCropDetails.growthStage === stage ? "active" : ""}`}
                      onClick={() => updateCropStage(selectedCropDetails._id, stage)}
                    >
                      {stage}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setSelectedCropDetails(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => deleteCrop(selectedCropDetails._id)}
              >
                Delete Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Information Advisory Modal */}
      {selectedCropGuide && (
        <div className="modal-backdrop" onClick={() => setSelectedCropGuide(null)}>
          <div className="modal-box crop-guide-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedCropGuide(null)}
              aria-label="Close crop guide"
            >
              ✕
            </button>
            <div className="modal-header">
              <span className="modal-badge">{selectedCropGuide.category} Advisory</span>
              <h2>🌾 {selectedCropGuide.name}</h2>
              <p className="modal-subtitle">
                <em>{selectedCropGuide.scientificName}</em> • Recommended Season: <strong>{selectedCropGuide.season}</strong>
              </p>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Crop Lifecycle Duration</span>
                <span className="detail-val">{selectedCropGuide.duration}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Optimal Temperature</span>
                <span className="detail-val">{selectedCropGuide.optimalTemp}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Rainfall Requirements</span>
                <span className="detail-val">{selectedCropGuide.rainfall}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Recommended Soil Type</span>
                <span className="detail-val">{selectedCropGuide.soilType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ideal Soil pH</span>
                <span className="detail-val">{selectedCropGuide.idealPh}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Yield</span>
                <span className="detail-val highlight-yield">{selectedCropGuide.expectedYield}</span>
              </div>
            </div>

            <div className="guide-deep-dive">
              <div className="guide-section">
                <h4>📅 Sowing & Harvesting Schedule</h4>
                <p><strong>Sowing Period:</strong> {selectedCropGuide.sowingPeriod}</p>
                <p><strong>Harvest Period:</strong> {selectedCropGuide.harvestPeriod}</p>
              </div>

              <div className="guide-section">
                <h4>💧 Irrigation & NPK Nutrition</h4>
                <p><strong>Recommended NPK:</strong> {selectedCropGuide.npkRatio}</p>
                <p><strong>Watering:</strong> {selectedCropGuide.irrigation}</p>
              </div>

              <div className="guide-section">
                <h4>🛡️ Pests & Disease Management</h4>
                <p><strong>Common Threats:</strong> {selectedCropGuide.pestsAndDiseases}</p>
                <p><strong>Expert Tips:</strong> {selectedCropGuide.managementTips}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => setSelectedCropGuide(null)}
              >
                Close Advisory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => loadSection(loggedInUser ? "dashboard" : "home")}>
          <span className="brand-logo">🌱</span>
          <span className="brand-text">AgriTech</span>
          <span className="brand-badge">Smart Farming</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className={`nav-links ${mobileMenuOpen ? "nav-links-mobile-open" : ""}`}>
          {!loggedInUser ? (
            <>
              <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
              <a href="#crop-guide" onClick={() => setMobileMenuOpen(false)}>Crop Advisory</a>
              <a href="#landing-weather" onClick={() => setMobileMenuOpen(false)}>Weather</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
            </>
          ) : (
            <>
              {loggedInSections.map(([id, label, icon]) => (
                <button
                  key={id}
                  className={`nav-tab-btn ${section === id ? "nav-tab-active" : ""}`}
                  onClick={() => loadSection(id)}
                >
                  <span className="tab-icon">{icon}</span> {label}
                </button>
              ))}
            </>
          )}

          <div className="nav-auth-actions">
            {loggedInUser ? (
              <>
                <span className="user-greeting">
                  👤 {loggedInUser.name}
                  {loggedInUser.role ? ` (${loggedInUser.role})` : ""}
                </span>
                <button
                  className="login-btn btn-sm"
                  onClick={() => {
                    localStorage.removeItem("agritech_token");
                    localStorage.removeItem("agritech_user");
                    setLoggedInUser(null);
                    setSection("home");
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                className="primary-btn btn-sm"
                onClick={() => {
                  setShowAuth(true);
                  setMobileMenuOpen(false);
                }}
              >
                Sign In / Register
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Menu Hamburger */}
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Global Toast Alerts */}
      {message && (
        <div className="toast-notification toast-success">
          <span>{message}</span>
          <button className="toast-dismiss" onClick={() => setMessage("")}>✕</button>
        </div>
      )}
      {error && (
        <div className="toast-notification toast-error">
          <span>⚠ {error}</span>
          <button className="toast-dismiss" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* PUBLIC LANDING PAGE (If not logged in) */}
      {!loggedInUser ? (
        <main className="landing-page">
          {/* Hero Section */}
          <section id="home" className="hero">
            <div className="hero-content">
              <span className="eyebrow">DIGITAL AGRICULTURE • PRECISION FARMING</span>
              <h1>Intelligent Farm Management for Higher Crop Yields</h1>
              <p className="hero-description">
                AgriTech brings digital monitoring to every farmer: register farm land,
                track crop stages, browse verified agricultural supplies, book precision machinery,
                and leverage real-time hyper-local weather intelligence.
              </p>
              <div className="hero-cta-group">
                <button className="primary-btn btn-lg" onClick={() => setShowAuth(true)}>
                  Get Started Free →
                </button>
                <a href="#services" className="secondary-btn btn-lg">
                  Explore Services
                </a>
              </div>
            </div>

            <div className="hero-card">
              <div className="plant-icon">🌾</div>
              <h3>Smart Agriculture Hub</h3>
              <p>Everything your farm requires in one unified ecosystem.</p>
              <div className="stats">
                <div>
                  <strong>100%</strong>
                  <span>Cloud Data</span>
                </div>
                <div>
                  <strong>3-Day</strong>
                  <span>Forecast</span>
                </div>
                <div>
                  <strong>Direct</strong>
                  <span>Marketplace</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="features-section">
            <div className="section-head">
              <span className="eyebrow">OUR CAPABILITIES</span>
              <h2>Comprehensive Digital Farming Platform</h2>
              <p className="section-description">
                Built specifically for Indian farmers and modern agri-entrepreneurs.
              </p>
            </div>
            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-icon">🌱</div>
                <h3>Farm & Land Registry</h3>
                <p>Register multiple farm locations, soil types, acreage, and irrigation parameters.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon">🌾</div>
                <h3>Crop Lifecycle Tracking</h3>
                <p>Monitor crops from planting through seedling, vegetative, flowering, and harvesting stages.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon">📦</div>
                <h3>Agri Supplies Marketplace</h3>
                <p>Browse seeds, organic fertilizers, crop protection, and equipment with direct checkout.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon">🌦️</div>
                <h3>Hyper-Local Weather Forecast</h3>
                <p>Accurate 3-day precipitation probabilities, humidity, and temperature trends by city.</p>
              </article>
            </div>
          </section>

          {/* Services Section (Fulfills Requirement 1) */}
          <section id="services" className="services-section">
            <div className="section-head">
              <span className="eyebrow">ON-DEMAND FARM SERVICES</span>
              <h2>Farming Services & Mechanization</h2>
              <p className="section-description">
                Book machinery, expert agronomy sessions, soil testing, and harvest logistics.
              </p>
            </div>
            <div className="feature-grid services-grid">
              {FARMING_SERVICES_DATA.map((srv) => (
                <article className="service-card" key={srv.id}>
                  <div className="service-header">
                    <span className="service-icon">{srv.icon}</span>
                    <span className="service-badge">{srv.availability}</span>
                  </div>
                  <h3>{srv.title}</h3>
                  <p>{srv.description}</p>
                  <div className="service-footer">
                    <span className="service-price">Starting from {srv.startingRate}</span>
                    <button
                      className="primary-btn btn-sm"
                      onClick={() => handleServiceBookingClick(srv)}
                    >
                      Book Service →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Agricultural Crop Advisory Knowledge Hub (Requirement 5) */}
          <section id="crop-guide" className="crop-guide-section">
            <div className="section-head">
              <span className="eyebrow">AGRONOMY ENCYCLOPEDIA</span>
              <h2>Crop Advisory & Scientific Guidelines</h2>
              <p className="section-description">
                Expert cultivation practices, soil nutrition, pest management, and harvest advisories.
              </p>
            </div>

            <div className="feature-grid crop-cards-grid">
              {AGRI_CROPS_DATA.slice(0, 4).map((crop) => (
                <article className="crop-preview-card" key={crop.id}>
                  <div className="crop-card-top">
                    <span className="crop-season-tag">{crop.season}</span>
                    <span className="crop-cat-tag">{crop.category}</span>
                  </div>
                  <h3>{crop.name}</h3>
                  <p className="crop-sci-name"><em>{crop.scientificName}</em></p>
                  <div className="crop-quick-meta">
                    <div><span>Duration:</span> <strong>{crop.duration}</strong></div>
                    <div><span>Temp:</span> <strong>{crop.optimalTemp}</strong></div>
                  </div>
                  <button
                    className="secondary-btn btn-sm"
                    onClick={() => setSelectedCropGuide(crop)}
                  >
                    View Full Advisory →
                  </button>
                </article>
              ))}
            </div>
            <div className="center-action">
              <button
                className="secondary-btn"
                onClick={() => {
                  if (loggedInUser) loadSection("agri-info");
                  else setShowAuth(true);
                }}
              >
                Browse All Crops in Knowledge Hub →
              </button>
            </div>
          </section>

          {/* Real-time Weather Preview on Landing (Requirement 4) */}
          <section id="landing-weather" className="landing-weather-section">
            <div className="section-head">
              <span className="eyebrow">LIVE SATELLITE METEO</span>
              <h2>Check Weather For Your Farming Region</h2>
            </div>
            <div className="weather-wrapper">
              <form className="weather-search-bar" onSubmit={loadWeather}>
                <input
                  type="text"
                  value={weatherCity}
                  onChange={(e) => setWeatherCity(e.target.value)}
                  placeholder="Enter your town / district (e.g. Indore, Bhopal, Ludhiana, Pune)"
                  required
                />
                <button type="submit" className="primary-btn" disabled={weatherLoading}>
                  {weatherLoading ? "Checking Satellite..." : "Get Forecast"}
                </button>
              </form>

              {weatherError && <p className="alert-banner alert-danger">{weatherError}</p>}

              {weather && weather.current && (
                <div className="weather-card-display">
                  <div className="weather-primary-info">
                    <h3>{weather.city}{weather.region ? `, ${weather.region}` : ""}</h3>
                    <div className="weather-big-temp">
                      <span className="temp-val">{weather.current.temperature_2m}°C</span>
                      <span className="temp-sub">Feels like {weather.current.apparent_temperature}°C</span>
                    </div>
                  </div>
                  <div className="weather-metrics-row">
                    <div className="w-metric">
                      <span>💧 Humidity</span>
                      <strong>{weather.current.relative_humidity_2m}%</strong>
                    </div>
                    <div className="w-metric">
                      <span>💨 Wind</span>
                      <strong>{weather.current.wind_speed_10m} km/h</strong>
                    </div>
                    <div className="w-metric">
                      <span>🌧️ Rain Prob.</span>
                      <strong>{weather.daily?.precipitation_probability_max?.[0] ?? 0}%</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      ) : (
        /* LOGGED IN USER WORKSPACE */
        <main className="farmer-workspace">
          {/* Workspace Quick Switcher Pills */}
          <div className="workspace-tabs-bar">
            {loggedInSections.map(([id, label, icon]) => (
              <button
                key={id}
                className={`workspace-tab ${section === id ? "active" : ""}`}
                onClick={() => loadSection(id)}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          {loading && <div className="loading-bar">Updating farm workspace data...</div>}

          {/* SECTION: DASHBOARD (Requirement 3) */}
          {section === "dashboard" && (
            <section className="dashboard-view">
              <div className="dashboard-banner">
                <div>
                  <h2>Welcome to your Farm Dashboard, {loggedInUser.name}!</h2>
                  <p>Here is your real-time farm overview and agricultural operations status.</p>
                </div>
                <div className="user-badge-role">
                  <span>Role: {loggedInUser.role || "Farmer"}</span>
                </div>
              </div>

              {/* KPI Counters */}
              <div className="kpi-grid">
                <div className="kpi-card" onClick={() => loadSection("farms")}>
                  <div className="kpi-icon">🏡</div>
                  <div className="kpi-data">
                    <span className="kpi-num">{farms.length}</span>
                    <span className="kpi-title">Registered Farms</span>
                  </div>
                  <span className="kpi-link">Manage →</span>
                </div>

                <div className="kpi-card" onClick={() => loadSection("crops")}>
                  <div className="kpi-icon">🌾</div>
                  <div className="kpi-data">
                    <span className="kpi-num">{crops.length}</span>
                    <span className="kpi-title">Monitored Crops</span>
                  </div>
                  <span className="kpi-link">Track Stages →</span>
                </div>

                <div className="kpi-card" onClick={() => loadSection("products")}>
                  <div className="kpi-icon">📦</div>
                  <div className="kpi-data">
                    <span className="kpi-num">{products.length}</span>
                    <span className="kpi-title">Market Products</span>
                  </div>
                  <span className="kpi-link">Shop Supplies →</span>
                </div>

                <div className="kpi-card" onClick={() => loadSection("orders")}>
                  <div className="kpi-icon">🛒</div>
                  <div className="kpi-data">
                    <span className="kpi-num">{myOrders.length}</span>
                    <span className="kpi-title">My Orders</span>
                  </div>
                  <span className="kpi-link">View Orders →</span>
                </div>

                <div className="kpi-card" onClick={() => loadSection("bookings")}>
                  <div className="kpi-icon">📅</div>
                  <div className="kpi-data">
                    <span className="kpi-num">{bookings.length}</span>
                    <span className="kpi-title">Active Bookings</span>
                  </div>
                  <span className="kpi-link">Schedule →</span>
                </div>
              </div>

              {/* Quick Actions & Weather Snapshot */}
              <div className="dashboard-columns">
                <div className="dashboard-actions-card">
                  <h3>⚡ Quick Farm Operations</h3>
                  <div className="quick-actions-list">
                    <button className="action-button" onClick={() => loadSection("farms")}>
                      <span>🏡</span> Register New Land / Farm
                    </button>
                    <button className="action-button" onClick={() => loadSection("crops")}>
                      <span>🌾</span> Add Crop for Tracking
                    </button>
                    <button className="action-button" onClick={() => loadSection("products")}>
                      <span>🛒</span> Order Seeds & Fertilizers
                    </button>
                    <button className="action-button" onClick={() => loadSection("bookings")}>
                      <span>🚜</span> Book Machinery / Agronomist
                    </button>
                    <button className="action-button" onClick={() => loadSection("agri-info")}>
                      <span>📚</span> Check Crop Agronomy Advice
                    </button>
                  </div>
                </div>

                <div className="dashboard-weather-card">
                  <h3>🌦️ Current Weather Outlook</h3>
                  {weather ? (
                    <div className="compact-weather">
                      <div className="compact-weather-main">
                        <div>
                          <strong>{weather.city}</strong>
                          <p>{weather.region}</p>
                        </div>
                        <div className="compact-temp">{weather.current?.temperature_2m}°C</div>
                      </div>
                      <div className="compact-details">
                        <span>Humidity: {weather.current?.relative_humidity_2m}%</span>
                        <span>Wind: {weather.current?.wind_speed_10m} km/h</span>
                        <span>Rain Chance: {weather.daily?.precipitation_probability_max?.[0] ?? 0}%</span>
                      </div>
                      <button className="secondary-btn btn-sm" onClick={() => loadSection("weather")}>
                        Full 3-Day Forecast →
                      </button>
                    </div>
                  ) : (
                    <button className="secondary-btn" onClick={loadWeather}>Check Weather</button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: FARMS (Requirement 6) */}
          {section === "farms" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <h2>🏡 Farm Land Registry</h2>
                  <p>Register and manage your farm plots, soil types, and irrigation infrastructure.</p>
                </div>
                <span className="count-pill">{farms.length} Farms</span>
              </div>

              {farms.length === 0 ? (
                <div className="empty-state-box">
                  <span className="empty-icon">🏡</span>
                  <h3>No farms registered yet</h3>
                  <p>Register your first farm plot below to start tracking crops and booking services.</p>
                </div>
              ) : (
                <div className="feature-grid records-grid">
                  {farms.map((farm) => (
                    <article className="feature-card record-card" key={farm._id}>
                      <div className="record-header">
                        <span className="record-tag">Farm Plot</span>
                        <h4>{farm.name}</h4>
                      </div>
                      <div className="record-content">
                        <p><strong>Location:</strong> {farm.location?.city || farm.location?.address || "—"}</p>
                        <p><strong>Size:</strong> {farm.size} {farm.sizeUnit || "acre"}</p>
                        <p><strong>Soil Type:</strong> {farm.soilType || "Standard"}</p>
                        <p><strong>Irrigation:</strong> {farm.irrigationType || "Not specified"}</p>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="secondary-btn btn-sm"
                          onClick={() => setSelectedFarmDetails(farm)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="danger-btn btn-sm"
                          onClick={() => deleteFarm(farm._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="form-wrapper">
                <h3>+ Register a New Farm</h3>
                <form className="feature-card form-card" onSubmit={addFarm}>
                  <div className="form-grid">
                    <input name="name" placeholder="Farm Plot Name (e.g. Green Meadows Plot A) *" required />
                    <input name="address" placeholder="Village / Street Address *" required />
                    <input name="city" placeholder="City / District *" required />
                    <input name="state" placeholder="State (e.g. Madhya Pradesh) *" required />
                    <input name="pincode" placeholder="Pincode *" required />
                    <div className="input-group-row">
                      <input name="size" type="number" min="0.1" step="any" placeholder="Farm Size *" required />
                      <select name="sizeUnit">
                        <option value="acre">Acre</option>
                        <option value="hectare">Hectare</option>
                      </select>
                    </div>
                    <select name="soilType">
                      <option value="Alluvial Soil">Alluvial Soil</option>
                      <option value="Black Soil (Regur)">Black Soil (Regur)</option>
                      <option value="Red and Yellow Soil">Red and Yellow Soil</option>
                      <option value="Laterite Soil">Laterite Soil</option>
                      <option value="Sandy Loam">Sandy Loam</option>
                      <option value="Clayey Loam">Clayey Loam</option>
                    </select>
                    <select name="irrigationType">
                      <option value="Drip Irrigation">Drip Irrigation</option>
                      <option value="Sprinkler System">Sprinkler System</option>
                      <option value="Canal / Flood Irrigation">Canal / Flood Irrigation</option>
                      <option value="Tube Well / Borewell">Tube Well / Borewell</option>
                      <option value="Rainfed Only">Rainfed Only</option>
                    </select>
                  </div>
                  <button className="primary-btn" type="submit">
                    Register Farm Plot
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* SECTION: CROPS (Requirement 7) */}
          {section === "crops" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <h2>🌾 Crop Lifecycle Tracking</h2>
                  <p>Track planting schedules, growth progression, and estimated harvest dates.</p>
                </div>
                <span className="count-pill">{crops.length} Crops</span>
              </div>

              {crops.length === 0 ? (
                <div className="empty-state-box">
                  <span className="empty-icon">🌾</span>
                  <h3>No crop records monitored yet</h3>
                  <p>Link a crop to one of your farms below to track its full growth cycle.</p>
                </div>
              ) : (
                <div className="feature-grid records-grid">
                  {crops.map((crop) => (
                    <article className="feature-card record-card" key={crop._id}>
                      <div className="record-header">
                        <span className={`stage-pill stage-${crop.growthStage}`}>
                          {crop.growthStage}
                        </span>
                        <h4>{crop.name}</h4>
                      </div>
                      <div className="record-content">
                        <p><strong>Farm:</strong> {crop.farm?.name || "Assigned Farm"}</p>
                        <p><strong>Variety:</strong> {crop.variety || "Standard"}</p>
                        <p><strong>Area:</strong> {crop.area ? `${crop.area} acres` : "—"}</p>
                        <p>
                          <strong>Planted:</strong>{" "}
                          {crop.plantingDate ? new Date(crop.plantingDate).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="secondary-btn btn-sm"
                          onClick={() => setSelectedCropDetails(crop)}
                        >
                          Details & Stage
                        </button>
                        <button
                          type="button"
                          className="danger-btn btn-sm"
                          onClick={() => deleteCrop(crop._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="form-wrapper">
                <h3>+ Add Crop to Monitor</h3>
                {farms.length === 0 ? (
                  <div className="notice-box">
                    <p>⚠️ Please register at least one farm plot before adding crops.</p>
                    <button className="primary-btn btn-sm" onClick={() => loadSection("farms")}>
                      Go to Farm Registry →
                    </button>
                  </div>
                ) : (
                  <form className="feature-card form-card" onSubmit={addCrop}>
                    <div className="form-grid">
                      <div className="field-group">
                        <label>Select Farm Plot *</label>
                        <select name="farm" required>
                          {farms.map((f) => (
                            <option key={f._id} value={f._id}>
                              {f.name} ({f.location?.city || "Plot"})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Crop Name *</label>
                        <input name="name" placeholder="e.g. Wheat, Basmati Rice, Cotton" required />
                      </div>
                      <div className="field-group">
                        <label>Crop Variety</label>
                        <input name="variety" placeholder="e.g. Sharbati, Pusa 1121" />
                      </div>
                      <div className="field-group">
                        <label>Planting Date</label>
                        <input name="plantingDate" type="date" />
                      </div>
                      <div className="field-group">
                        <label>Expected Harvest Date</label>
                        <input name="expectedHarvestDate" type="date" />
                      </div>
                      <div className="field-group">
                        <label>Initial Growth Stage *</label>
                        <select name="growthStage">
                          <option value="planned">Planned (Pre-sowing)</option>
                          <option value="seedling">Seedling (Germination)</option>
                          <option value="vegetative">Vegetative (Leaf/Stem)</option>
                          <option value="flowering">Flowering / Heading</option>
                          <option value="harvesting">Harvesting Window</option>
                          <option value="harvested">Harvested / Completed</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Cultivated Area (Acres)</label>
                        <input name="area" type="number" min="0" step="any" placeholder="Acreage" />
                      </div>
                    </div>
                    <button className="primary-btn" type="submit">
                      Record Crop
                    </button>
                  </form>
                )}
              </div>
            </section>
          )}

          {/* SECTION: PRODUCTS MARKETPLACE & ORDER FLOW (Requirement 8) */}
          {section === "products" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <h2>📦 Agricultural Products Marketplace</h2>
                  <p>Browse genuine certified seeds, fertilizers, crop protection, and farming tools.</p>
                </div>
                <div className="filter-button-group">
                  <button
                    className={`filter-btn ${productViewMode === "all" ? "active" : ""}`}
                    onClick={() => {
                      setProductViewMode("all");
                      loadSection("products");
                    }}
                  >
                    All Supplies
                  </button>
                  <button
                    className={`filter-btn ${productViewMode === "my" ? "active" : ""}`}
                    onClick={async () => {
                      setProductViewMode("my");
                      const activeToken = localStorage.getItem("agritech_token");
                      const res = await fetch(`${API}/api/products?myProducts=true`, {
                        headers: { Authorization: `Bearer ${activeToken}` },
                      });
                      if (res.ok) {
                        const d = await res.json();
                        setProducts(d.products || []);
                      }
                    }}
                  >
                    My Listings ({products.filter((p) => p.seller?._id === loggedInUser.id || p.seller === loggedInUser.id).length})
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="search-filter-bar">
                <input
                  type="text"
                  placeholder="🔍 Search products by name, brand..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="seeds">Seeds</option>
                  <option value="fertilizer">Fertilizers & Nutrition</option>
                  <option value="pesticide">Crop Protection / Pesticides</option>
                  <option value="equipment">Tools & Equipment</option>
                  <option value="other">Other Agri Supplies</option>
                </select>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="empty-state-box">
                  <span className="empty-icon">📦</span>
                  <h3>No products found</h3>
                  <p>Try adjusting your search query or list a new product below.</p>
                </div>
              ) : (
                <div className="feature-grid products-grid">
                  {filteredProducts.map((prod) => {
                    const isMyProduct = (prod.seller?._id || prod.seller) === loggedInUser.id;
                    return (
                      <article className="product-card" key={prod._id}>
                        <div className="product-card-head">
                          <span className="product-badge">{prod.category}</span>
                          {prod.stock > 0 ? (
                            <span className="stock-tag in-stock">{prod.stock} in stock</span>
                          ) : (
                            <span className="stock-tag out-of-stock">Out of stock</span>
                          )}
                        </div>
                        <h3>{prod.name}</h3>
                        {prod.brand && <p className="product-brand">By {prod.brand}</p>}
                        {prod.description && <p className="product-desc">{prod.description}</p>}
                        <div className="product-pricing">
                          <span className="price-tag">₹{prod.price}</span>
                          <span className="unit-tag">/ {prod.unit || "unit"}</span>
                        </div>
                        <div className="card-actions">
                          {isMyProduct ? (
                            <button
                              type="button"
                              className="danger-btn btn-sm"
                              onClick={() => deleteProduct(prod._id)}
                            >
                              Delete Listing
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="primary-btn btn-sm"
                              disabled={prod.stock <= 0}
                              onClick={() => startOrderFlow(prod)}
                            >
                              {prod.stock > 0 ? "Order Now 🛒" : "Sold Out"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Add Product Form */}
              <div className="form-wrapper">
                <h3>+ List a Product for Sale</h3>
                <form className="feature-card form-card" onSubmit={addProduct}>
                  <div className="form-grid">
                    <input name="name" placeholder="Product Name (e.g. Certified Wheat HD-2967 Seeds) *" required />
                    <select name="category" required>
                      <option value="seeds">Seeds</option>
                      <option value="fertilizer">Fertilizer & Nutrition</option>
                      <option value="pesticide">Crop Protection / Pesticide</option>
                      <option value="equipment">Equipment & Tools</option>
                      <option value="other">Other</option>
                    </select>
                    <input name="brand" placeholder="Brand / Manufacturer" />
                    <input name="price" type="number" min="0" step="any" placeholder="Price (₹) *" required />
                    <input name="unit" placeholder="Unit (e.g. 50kg bag, 1L bottle, packet, piece) *" required />
                    <input name="stock" type="number" min="0" placeholder="Available Stock Quantity *" required />
                    <textarea name="description" placeholder="Product specifications, usage instructions, germination rate..." rows={3} />
                  </div>
                  <button className="primary-btn" type="submit">
                    Publish Product Listing
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* SECTION: MY ORDERS (Requirement 8 Order Flow) */}
          {section === "orders" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <h2>🛒 My Placed Orders</h2>
                  <p>Track your agricultural supply purchases, delivery status, and order history.</p>
                </div>
                <button className="primary-btn btn-sm" onClick={() => loadSection("products")}>
                  + Browse Products
                </button>
              </div>

              {myOrders.length === 0 ? (
                <div className="empty-state-box">
                  <span className="empty-icon">🛒</span>
                  <h3>No orders placed yet</h3>
                  <p>Browse our marketplace to purchase seeds, fertilizers, and farm equipment.</p>
                  <button className="primary-btn" onClick={() => loadSection("products")}>
                    Shop Supplies Now
                  </button>
                </div>
              ) : (
                <div className="feature-grid orders-grid">
                  {myOrders.map((order) => (
                    <article className="feature-card order-card" key={order._id}>
                      <div className="order-card-header">
                        <span className={`order-status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                        <span className="order-id">Order #{order._id.slice(-6)}</span>
                      </div>
                      <h4>{order.productName}</h4>
                      <div className="order-details">
                        <p><strong>Quantity:</strong> {order.quantity} units</p>
                        <p><strong>Unit Price:</strong> ₹{order.unitPrice}</p>
                        <p><strong>Total Amount:</strong> <span className="highlight-price">₹{order.totalAmount}</span></p>
                        <p><strong>Delivery City:</strong> {order.shippingAddress?.city || "—"}</p>
                        <p><strong>Payment:</strong> {order.paymentMethod || "Cash on Delivery"}</p>
                        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      {order.status === "placed" && (
                        <div className="card-actions">
                          <button
                            type="button"
                            className="danger-btn btn-sm"
                            onClick={() => cancelOrder(order._id)}
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SECTION: BOOKINGS (Requirement 9) */}
          {section === "bookings" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <h2>📅 Service & Machinery Bookings</h2>
                  <p>Manage bookings for tractors, harvesters, drone spraying, and expert consultations.</p>
                </div>
                <span className="count-pill">{bookings.length} Bookings</span>
              </div>

              {bookings.length === 0 ? (
                <div className="empty-state-box">
                  <span className="empty-icon">📅</span>
                  <h3>No active bookings</h3>
                  <p>Schedule farm machinery or consult an agronomist using the form below.</p>
                </div>
              ) : (
                <div className="feature-grid records-grid">
                  {bookings.map((booking) => (
                    <article className="feature-card record-card" key={booking._id}>
                      <div className="record-header">
                        <span className={`status-pill status-${booking.status}`}>
                          {booking.status}
                        </span>
                        <span className="booking-type-tag">{booking.bookingType}</span>
                      </div>
                      <h4>{booking.title}</h4>
                      <div className="record-content">
                        {booking.farm?.name && <p><strong>Farm Plot:</strong> {booking.farm.name}</p>}
                        <p>
                          <strong>Scheduled Date:</strong>{" "}
                          {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleString() : "—"}
                        </p>
                        {booking.totalAmount > 0 && (
                          <p><strong>Total Amount:</strong> ₹{booking.totalAmount}</p>
                        )}
                        {booking.description && <p className="booking-desc">{booking.description}</p>}
                      </div>
                      <div className="card-actions">
                        {booking.status !== "cancelled" && (
                          <button
                            type="button"
                            className="secondary-btn btn-sm"
                            onClick={() => cancelBooking(booking._id)}
                          >
                            Cancel Booking
                          </button>
                        )}
                        <button
                          type="button"
                          className="danger-btn btn-sm"
                          onClick={() => deleteBooking(booking._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="form-wrapper">
                <h3>+ Schedule a New Booking</h3>
                <form className="feature-card form-card" onSubmit={addBooking}>
                  <div className="form-grid">
                    <div className="field-group">
                      <label>Service / Booking Type *</label>
                      <select name="bookingType" defaultValue={servicePrefill?.type || "equipment"}>
                        <option value="equipment">Farm Machinery / Tractor Rental</option>
                        <option value="farming_service">Drone Spraying / Field Service</option>
                        <option value="expert_consultation">Agronomy Expert Consultation</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label>Link to Farm Plot (Optional)</label>
                      <select name="farm">
                        <option value="">None / General</option>
                        {farms.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name} ({f.location?.city || "Plot"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label>Booking Title *</label>
                      <input
                        name="title"
                        defaultValue={servicePrefill?.title || ""}
                        placeholder="e.g. Combine Harvester 4-hour rental"
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label>Scheduled Date & Time *</label>
                      <input name="scheduledDate" type="datetime-local" required />
                    </div>

                    <div className="field-group">
                      <label>Estimated Amount (₹)</label>
                      <input
                        name="totalAmount"
                        type="number"
                        min="0"
                        defaultValue={servicePrefill?.amount || 0}
                        placeholder="Amount"
                      />
                    </div>

                    <div className="field-group full-width">
                      <label>Instructions & Requirements</label>
                      <textarea
                        name="description"
                        placeholder="Specify field location details, crop stage, operator requirements..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <button className="primary-btn" type="submit">
                    Confirm & Schedule Booking
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* SECTION: AGRICULTURAL ADVISORY (Requirement 5) */}
          {section === "agri-info" && (
            <section className="section-container">
              <div className="section-head">
                <span className="eyebrow">SCIENTIFIC AGRONOMY KNOWLEDGE</span>
                <h2>Agricultural Information & Crop Advisory</h2>
                <p className="section-description">
                  Comprehensive reference guide for soil preparation, NPK nutrition, pest mitigation, and harvest management.
                </p>
              </div>

              {/* Filters */}
              <div className="search-filter-bar">
                <input
                  type="text"
                  placeholder="🔍 Search crops (e.g. Wheat, Rice, Cotton, Tomato)..."
                  value={agriSearch}
                  onChange={(e) => setAgriSearch(e.target.value)}
                />
                <select
                  value={agriCategoryFilter}
                  onChange={(e) => setAgriCategoryFilter(e.target.value)}
                >
                  <option value="all">All Crop Categories</option>
                  <option value="Cereals">Cereals</option>
                  <option value="Cash Crops">Cash Crops</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Oilseeds & Pulses">Oilseeds & Pulses</option>
                </select>
              </div>

              <div className="feature-grid crop-cards-grid">
                {filteredAgriCrops.map((crop) => (
                  <article className="crop-preview-card" key={crop.id}>
                    <div className="crop-card-top">
                      <span className="crop-season-tag">{crop.season}</span>
                      <span className="crop-cat-tag">{crop.category}</span>
                    </div>
                    <h3>{crop.name}</h3>
                    <p className="crop-sci-name"><em>{crop.scientificName}</em></p>
                    <div className="crop-quick-meta">
                      <div><span>Duration:</span> <strong>{crop.duration}</strong></div>
                      <div><span>Yield:</span> <strong>{crop.expectedYield}</strong></div>
                    </div>
                    <div className="crop-meta-row">
                      <span>NPK: {crop.npkRatio}</span>
                      <span>pH: {crop.idealPh}</span>
                    </div>
                    <button
                      className="primary-btn btn-sm"
                      onClick={() => setSelectedCropGuide(crop)}
                    >
                      Open Full Agronomy Guide →
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: WEATHER FORECAST (Requirement 4) */}
          {section === "weather" && (
            <section className="section-container">
              <div className="section-head">
                <span className="eyebrow">METEOROLOGICAL SATELLITE INTELLIGENCE</span>
                <h2>🌦️ Hyper-Local Weather Forecast</h2>
                <p className="section-description">
                  Plan sowing, irrigation, pesticide spraying, and harvesting based on reliable 3-day forecasts.
                </p>
              </div>

              <form className="weather-form" onSubmit={loadWeather}>
                <input
                  type="text"
                  value={weatherCity}
                  onChange={(e) => setWeatherCity(e.target.value)}
                  placeholder="Enter city or district name (e.g. Indore, Bhopal, Nagpur, Chandigarh)"
                  required
                />
                <button className="primary-btn" type="submit" disabled={weatherLoading}>
                  {weatherLoading ? "Fetching Satellite..." : "Check Weather"}
                </button>
              </form>

              {weatherError && <div className="alert-banner alert-danger">{weatherError}</div>}

              {weather && weather.current && (
                <div className="weather-dashboard-box">
                  <div className="weather-city-banner">
                    <div>
                      <h3>{weather.city}{weather.region ? `, ${weather.region}` : ""}</h3>
                      <p>Real-Time Open-Meteo Satellite Feed</p>
                    </div>
                    <div className="big-degree">{weather.current.temperature_2m}°C</div>
                  </div>

                  <div className="feature-grid weather-metrics">
                    <article className="metric-box">
                      <span className="m-label">Apparent Temp</span>
                      <span className="m-val">{weather.current.apparent_temperature}°C</span>
                    </article>
                    <article className="metric-box">
                      <span className="m-label">Relative Humidity</span>
                      <span className="m-val">{weather.current.relative_humidity_2m}%</span>
                    </article>
                    <article className="metric-box">
                      <span className="m-label">Wind Velocity</span>
                      <span className="m-val">{weather.current.wind_speed_10m} km/h</span>
                    </article>
                    <article className="metric-box">
                      <span className="m-label">Precipitation</span>
                      <span className="m-val">{weather.current.precipitation ?? 0} mm</span>
                    </article>
                  </div>

                  {weather.daily && weather.daily.time && (
                    <div className="forecast-container">
                      <h4>📅 3-Day Agricultural Forecast</h4>
                      <div className="forecast-cards-row">
                        {weather.daily.time.map((day, idx) => (
                          <div className="forecast-day-card" key={day}>
                            <span className="forecast-date">
                              {new Date(day).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <div className="forecast-temps">
                              <span className="max-temp">
                                {weather.daily.temperature_2m_max?.[idx] ?? "—"}°C
                              </span>
                              <span className="min-temp">
                                {weather.daily.temperature_2m_min?.[idx] ?? "—"}°C
                              </span>
                            </div>
                            <span className="rain-chance">
                              🌧️ {weather.daily.precipitation_probability_max?.[idx] ?? 0}% rain
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {/* Comprehensive Footer */}
      <footer id="about" className="app-footer">
        <div className="footer-columns">
          <div className="footer-col">
            <h3>🌱 AgriTech Platform</h3>
            <p>
              Smart precision farming platform bridging technology and sustainable agriculture.
              Empowering farmers to maximize yields, streamline operations, and minimize input costs.
            </p>
          </div>
          <div className="footer-col">
            <h4>Quick Navigation</h4>
            <ul>
              <li><button onClick={() => loadSection(loggedInUser ? "dashboard" : "home")}>Home / Dashboard</button></li>
              <li><button onClick={() => loadSection("farms")}>My Farms Registry</button></li>
              <li><button onClick={() => loadSection("crops")}>Crop Lifecycle Tracking</button></li>
              <li><button onClick={() => loadSection("products")}>Marketplace Supplies</button></li>
              <li><button onClick={() => loadSection("agri-info")}>Crop Agronomy Hub</button></li>
              <li><button onClick={() => loadSection("weather")}>Weather Forecast</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Farming Services</h4>
            <ul>
              <li>Equipment & Tractor Rental</li>
              <li>GPS Drone Spraying</li>
              <li>Soil & Water Lab Analysis</li>
              <li>Agronomy Expert Consultation</li>
              <li>Cold Storage & Distribution</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 AgriTech Platform · Built for SkillWallet Full Stack Development Assignment</p>
          <p>MERN Stack Architecture · Express, MongoDB Atlas, Node.js & React 19</p>
        </div>
      </footer>
    </div>
  );
}

export default App;