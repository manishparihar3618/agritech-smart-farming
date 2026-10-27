const bcrypt = require("bcryptjs");

const DEMO_USER_ID = "65f000000000000000000001";
const DEMO_PASSWORD_HASH = bcrypt.hashSync("Password123", 10);

const demoStore = {
  users: [
    {
      _id: DEMO_USER_ID,
      id: DEMO_USER_ID,
      name: "Ramesh Patel",
      email: "demo@agritech.com",
      password: DEMO_PASSWORD_HASH,
      role: "farmer",
      phone: "+91 98765 43210",
      createdAt: new Date().toISOString(),
    },
  ],

  farms: [
    {
      _id: "65f100000000000000000001",
      id: "65f100000000000000000001",
      name: "Green Valley Organic Farm",
      location: {
        address: "Khandwa Road, Farm Sector 4",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001",
      },
      size: 25,
      sizeUnit: "acres",
      soilType: "Black Soil",
      irrigationType: "Drip Irrigation",
      farmer: DEMO_USER_ID,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      _id: "65f100000000000000000002",
      id: "65f100000000000000000002",
      name: "Sunrise Agro Fields",
      location: {
        address: "Village Sanwer",
        city: "Ujjain",
        state: "Madhya Pradesh",
        pincode: "456001",
      },
      size: 15,
      sizeUnit: "hectares",
      soilType: "Alluvial Soil",
      irrigationType: "Sprinkler",
      farmer: DEMO_USER_ID,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ],

  crops: [
    {
      _id: "65f200000000000000000001",
      id: "65f200000000000000000001",
      name: "Basmati Rice (Pusa 1121)",
      variety: "Premium Long Grain",
      stage: "flowering",
      area: 10,
      areaUnit: "acres",
      plantingDate: "2026-06-15",
      expectedHarvestDate: "2026-11-20",
      farm: {
        _id: "65f100000000000000000001",
        id: "65f100000000000000000001",
        name: "Green Valley Organic Farm",
      },
      farmer: DEMO_USER_ID,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      _id: "65f200000000000000000002",
      id: "65f200000000000000000002",
      name: "Sharbati Golden Wheat",
      variety: "C-306 MP Special",
      stage: "vegetative",
      area: 12,
      areaUnit: "acres",
      plantingDate: "2026-10-01",
      expectedHarvestDate: "2027-03-15",
      farm: {
        _id: "65f100000000000000000001",
        id: "65f100000000000000000001",
        name: "Green Valley Organic Farm",
      },
      farmer: DEMO_USER_ID,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      _id: "65f200000000000000000003",
      id: "65f200000000000000000003",
      name: "Soybean Yellow Miracle",
      variety: "JS 335",
      stage: "harvesting",
      area: 8,
      areaUnit: "hectares",
      plantingDate: "2026-07-01",
      expectedHarvestDate: "2026-10-30",
      farm: {
        _id: "65f100000000000000000002",
        id: "65f100000000000000000002",
        name: "Sunrise Agro Fields",
      },
      farmer: DEMO_USER_ID,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],

  products: [
    {
      _id: "65f300000000000000000001",
      id: "65f300000000000000000001",
      name: "Organic NPK Bio-Fertilizer (50kg)",
      category: "fertilizer",
      description: "100% organic enriched formulation providing balanced Nitrogen, Phosphorus, and Potassium for healthy plant growth.",
      brand: "BioAgro Naturals",
      price: 850,
      unit: "bag",
      stock: 45,
      seller: {
        _id: DEMO_USER_ID,
        id: DEMO_USER_ID,
        name: "Ramesh Patel",
        email: "demo@agritech.com",
      },
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      _id: "65f300000000000000000002",
      id: "65f300000000000000000002",
      name: "Hybrid Tomato Seeds F1 (100g)",
      category: "seeds",
      description: "High disease resistance, high yield variety producing uniform deep-red firm tomatoes.",
      brand: "AgroSeed Pro",
      price: 420,
      unit: "packet",
      stock: 80,
      seller: {
        _id: DEMO_USER_ID,
        id: DEMO_USER_ID,
        name: "Ramesh Patel",
        email: "demo@agritech.com",
      },
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      _id: "65f300000000000000000003",
      id: "65f300000000000000000003",
      name: "Solar Powered Drip Irrigation Pump 5HP",
      category: "equipment",
      description: "Complete brushless DC solar submersible water pumping system with automatic dry-run protection.",
      brand: "SolarKisan Tech",
      price: 45000,
      unit: "set",
      stock: 6,
      seller: {
        _id: DEMO_USER_ID,
        id: DEMO_USER_ID,
        name: "Ramesh Patel",
        email: "demo@agritech.com",
      },
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      _id: "65f300000000000000000004",
      id: "65f300000000000000000004",
      name: "Cold-Pressed Neem Oil Biopesticide (5L)",
      category: "pesticide",
      description: "Natural organic pest repellent with high Azadirachtin concentration for sustainable insect control.",
      brand: "PureNeem Organics",
      price: 1200,
      unit: "bottle",
      stock: 30,
      seller: {
        _id: DEMO_USER_ID,
        id: DEMO_USER_ID,
        name: "Ramesh Patel",
        email: "demo@agritech.com",
      },
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
  ],

  bookings: [
    {
      _id: "65f400000000000000000001",
      id: "65f400000000000000000001",
      bookingType: "equipment-rental",
      title: "John Deere 5310 Tractor with Rotavator",
      serviceProvider: "Kisan Agro Machinery Services",
      scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      durationHours: 8,
      status: "confirmed",
      totalCost: 3200,
      notes: "Field plowing before rabi crop sowing.",
      user: DEMO_USER_ID,
      farm: {
        _id: "65f100000000000000000001",
        name: "Green Valley Organic Farm",
      },
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      _id: "65f400000000000000000002",
      id: "65f400000000000000000002",
      bookingType: "expert-consultation",
      title: "Comprehensive Soil Health & Micro-Nutrient Audit",
      serviceProvider: "Dr. A. Sharma (Senior Agronomist)",
      scheduledDate: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0],
      durationHours: 2,
      status: "pending",
      totalCost: 800,
      notes: "Testing salinity and phosphorus levels in Sector 4.",
      user: DEMO_USER_ID,
      farm: {
        _id: "65f100000000000000000001",
        name: "Green Valley Organic Farm",
      },
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],

  orders: [
    {
      _id: "65f500000000000000000001",
      id: "65f500000000000000000001",
      buyer: DEMO_USER_ID,
      product: "65f300000000000000000001",
      productName: "Organic NPK Bio-Fertilizer (50kg)",
      productCategory: "fertilizer",
      unitPrice: 850,
      quantity: 2,
      totalAmount: 1700,
      shippingAddress: {
        address: "Green Valley Farm House, Khandwa Road",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001",
        phone: "+91 98765 43210",
      },
      paymentMethod: "Cash on Delivery",
      paymentStatus: "paid",
      status: "delivered",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ],
};

function generateId(prefix = "65f") {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, "0");
  return (timestamp + random).slice(0, 24);
}

module.exports = {
  DEMO_USER_ID,
  demoStore,
  generateId,
};
