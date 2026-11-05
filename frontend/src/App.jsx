import { useEffect, useState } from "react";
import Auth from "./Auth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  FileText,
  Users,
  Search,
  Bell,
  Menu,
  Plus,
  TrendingUp,
  AlertTriangle,
  Boxes,
  ChevronDown,
  Eye,
} from "lucide-react";

import "./App.css";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "customer"]
  },
  {
    name: "Products",
    icon: Package,
    roles: ["admin", "customer"]
  },
  {
    name: "Shopping Cart",
    icon: ShoppingCart,
    roles: ["customer"]
  },
  {
    name: "Checkout",
    icon: ClipboardList,
    roles: ["customer"]
  },
  {
    name: "Orders",
    icon: ClipboardList,
    roles: ["admin", "customer"]
  },
  {
    name: "Inventory",
    icon: Boxes,
    roles: ["admin"]
  },
  {
    name: "Invoices",
    icon: FileText,
    roles: ["admin"]
  },
  {
    name: "Customers",
    icon: Users,
    roles: ["admin"]
  },
];

function formatMoney(value) {
  return "Rs. " + Number(value).toLocaleString("en-LK");
}

const editInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#18324b",
  background: "#ffffff",
};

function App() {
  // In-app notification state (replaces browser alert popups).
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });

    window.setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  }

  // Attach the JWT saved after login to protected backend requests.
  function getAuthHeaders(extraHeaders = {}) {
    const token = localStorage.getItem("token");

    return {
      ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const [activePage, setActivePage] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  // Load products from SQL Server through the Express API.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const response = await fetch("http://localhost:5000/api/products", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || data.success !== true) {
          throw new Error(data.message || `Request failed (${response.status})`);
        }

        const rows = Array.isArray(data.products) ? data.products : [];

        const formattedProducts = rows.map((item) => {
          const stock = Number(item.stock_quantity ?? 0);

          return {
            id: String(item.product_id),
            name: item.product_name,
            category: item.category || "Uncategorized",
            price: Number(item.price),
            stock,
            status:
              stock <= 0
                ? "Out of Stock"
                : stock < 10
                  ? "Low Stock"
                  : "In Stock",
          };
        });

        setProducts(formattedProducts);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load products:", error);
          setProductsError(
            error.message || "Unable to load products from the server."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setProductsLoading(false);
        }
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, []);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({
    company_name: "",
    phone: "",
    address: "",
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Load orders from the Express API / SQL Server.
  async function refreshOrders() {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "GET",
        headers: getAuthHeaders({ Accept: "application/json" }),
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      const formattedOrders = (Array.isArray(data.orders) ? data.orders : []).map(
        (item) => ({
          backendId: item.order_id,
          id: `ORD-${String(item.order_id).padStart(4, "0")}`,
          customer: item.customer_name || "Unknown Customer",
          date: item.order_date
            ? new Date(item.order_date).toLocaleDateString("en-GB")
            : "",
          amount: Number(item.total_amount || 0),
          status: item.status || "Pending",
          items: [],
        })
      );

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      setOrdersError(error.message || "Unable to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }

  // Restore the logged-in user when the page is refreshed.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Dashboard analytics from the SQL Server-backed analytics endpoint.
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  async function refreshDashboardAnalytics() {
    if (!currentUser) return;
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const response = await fetch("http://localhost:5000/api/dashboard/analytics", {
        method: "GET",
        headers: getAuthHeaders({ Accept: "application/json" }),
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }
      setDashboardAnalytics(data);
    } catch (error) {
      console.error("Dashboard Analytics Error:", error);
      setAnalyticsError(error.message || "Unable to load dashboard analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) {
      refreshDashboardAnalytics();
    } else {
      setDashboardAnalytics(null);
      setAnalyticsError("");
    }
  }, [currentUser]);

  // Fetch orders only after a user has logged in and a JWT is available.
  useEffect(() => {
    if (currentUser) {
      refreshOrders();
    } else {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError("");
    }
  }, [currentUser]);

  function handleLogin(user) {
    setCurrentUser(user);
    setActivePage("Dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setProfileOpen(false);
    setActivePage("Dashboard");
  }

  const displayName =
    currentUser?.full_name ||
    [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(" ") ||
    currentUser?.name ||
    "User";

  const displayRole = currentUser?.role || "Customer";

  // Get logged-in user's role
const userRole = String(
  currentUser?.role || "customer"
).trim().toLowerCase();

// Filter sidebar menu according to user role
const filteredMenuItems = menuItems.filter((item) =>
  item.roles.includes(userRole)
);
  const userInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
  });

  // Product edit modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Stock update modal state
  const [stockProduct, setStockProduct] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const [isSavingStock, setIsSavingStock] = useState(false);

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.id} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalStock = products.reduce(
    (total, product) => total + product.stock,
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  async function addProduct(event) {
    event.preventDefault();

    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);

    if (
      !newProduct.name.trim() ||
      !newProduct.category.trim() ||
      newProduct.price === "" ||
      newProduct.stock === "" ||
      !Number.isFinite(price) ||
      !Number.isFinite(stock) ||
      price < 0 ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      showToast("Please enter valid product details.", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          product_name: newProduct.name.trim(),
          category: newProduct.category.trim(),
          price,
          stock_quantity: stock,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Failed to add product.");
      }

      const savedProduct = data.product;
      const savedStock = Number(savedProduct.stock_quantity ?? 0);

      setProducts((previous) => [
        {
          id: String(savedProduct.product_id),
          name: savedProduct.product_name,
          category: savedProduct.category || "Uncategorized",
          price: Number(savedProduct.price),
          stock: savedStock,
          status:
            savedStock <= 0
              ? "Out of Stock"
              : savedStock < 10
                ? "Low Stock"
                : "In Stock",
        },
        ...previous,
      ]);

      setNewProduct({
        name: "",
        category: "",
        price: "",
        stock: "",
      });

      setShowForm(false);
      showToast("Product added successfully!", "success");
    } catch (error) {
      console.error("Add Product Error:", error);
      showToast(error.message || "Unable to add product.", "error");
    }
  }



  // Open the edit form inside the application.
  function editProduct(product) {
    setSelectedProduct(product);
    setEditProductForm({
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    });
  }

  // Save edited product details to the backend.
  async function saveEditedProduct(event) {
    event.preventDefault();
    if (!selectedProduct) return;

    const price = Number(editProductForm.price);
    const stock = Number(editProductForm.stock);

    if (
      !editProductForm.name.trim() ||
      !editProductForm.category.trim() ||
      editProductForm.price.trim() === "" ||
      editProductForm.stock.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      showToast("Please enter valid product details.", "error");
      return;
    }

    setIsSavingProduct(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${encodeURIComponent(selectedProduct.id)}`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            product_name: editProductForm.name.trim(),
            category: editProductForm.category.trim(),
            price,
            stock_quantity: stock,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Failed to update product.");
      }

      const saved = data.product;
      const savedStock = Number(saved.stock_quantity ?? stock);

      setProducts((previous) =>
        previous.map((item) =>
          item.id === selectedProduct.id
            ? {
                ...item,
                name: saved.product_name,
                category: saved.category || "Uncategorized",
                price: Number(saved.price),
                stock: savedStock,
                status:
                  savedStock <= 0
                    ? "Out of Stock"
                    : savedStock < 10
                      ? "Low Stock"
                      : "In Stock",
              }
            : item
        )
      );

      setCart((previous) =>
        previous
          .map((item) =>
            item.id === selectedProduct.id
              ? {
                  ...item,
                  name: saved.product_name,
                  price: Number(saved.price),
                  quantity: Math.min(item.quantity, savedStock),
                }
              : item
          )
          .filter((item) => item.quantity > 0)
      );

      setSelectedProduct(null);
      showToast("Product updated successfully!", "success");
    } catch (error) {
      console.error("Edit Product Error:", error);
      showToast(error.message || "Unable to update product.", "error");
    } finally {
      setIsSavingProduct(false);
    }
  }

  // Open the stock update form inside the application.
  function handleUpdateStock(product) {
    setStockProduct(product);
    setStockInput(String(product.stock ?? 0));
  }

  // Save the updated stock quantity.
  async function saveUpdatedStock(event) {
    event.preventDefault();
    if (!stockProduct) return;

    const stock = Number(stockInput);

    if (
      stockInput.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      showToast("Please enter a valid whole-number stock quantity (0 or greater).", "error");
      return;
    }

    setIsSavingStock(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${encodeURIComponent(stockProduct.id)}/stock`,
        {
          method: "PATCH",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ stock_quantity: stock }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Failed to update stock.");
      }

      const savedStock = Number(data.product.stock_quantity ?? stock);

      setProducts((previous) =>
        previous.map((item) =>
          item.id === stockProduct.id
            ? {
                ...item,
                stock: savedStock,
                status:
                  savedStock <= 0
                    ? "Out of Stock"
                    : savedStock < 10
                      ? "Low Stock"
                      : "In Stock",
              }
            : item
        )
      );

      setCart((previous) =>
        previous
          .map((item) =>
            item.id === stockProduct.id
              ? { ...item, quantity: Math.min(item.quantity, savedStock) }
              : item
          )
          .filter((item) => item.quantity > 0)
      );

      setStockProduct(null);
      showToast("Stock updated successfully!", "success");
    } catch (error) {
      console.error("Update Stock Error:", error);
      showToast(error.message || "Unable to update stock.", "error");
    } finally {
      setIsSavingStock(false);
    }
  }

  // ADMIN: delete a product.
  async function deleteProduct(product) {
    if (userRole !== "admin") {
      showToast("Access denied. Only administrators can delete products.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${encodeURIComponent(product.id)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Failed to delete product.");
      }

      setProducts((previous) => previous.filter((item) => item.id !== product.id));
      setCart((previous) => previous.filter((item) => item.id !== product.id));
      showToast("Product deleted successfully!", "success");
    } catch (error) {
      console.error("Delete Product Error:", error);
      showToast(error.message || "Unable to delete product.", "error");
    }
  }

  function addToCart(product) {
    if (product.stock <= 0) {
      showToast("This product is out of stock.", "error");
      return;
    }

    setCart((previous) => {
      const existing = previous.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast("Maximum available stock reached.", "error");
          return previous;
        }

        return previous.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  }

  async function updateOrderStatus(orderId, status) {
    if (userRole !== "admin") {
      showToast("Access denied. Only administrators can update order status.", "error");
      return;
    }

    const order = orders.find((item) => item.id === orderId);

    if (!order || !order.backendId) {
      showToast("This order does not have a valid database ID.", "error");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${order.backendId}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Failed to update order status.");
      }

      setOrders((previous) =>
        previous.map((item) =>
          item.id === orderId ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error("Update Order Error:", error);
      showToast(error.message || "Unable to update order status.", "error");
    }
  }

  async function placeOrder(event) {
    if (event) event.preventDefault();

    if (cart.length === 0) {
      showToast("Your shopping cart is empty.", "error");
      setActivePage("Shopping Cart");
      return;
    }

    if (!checkoutForm.company_name.trim()) {
      showToast("Please enter your customer / company name.", "error");
      return;
    }

    const stockIsAvailable = cart.every((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product && product.stock >= item.quantity;
    });

    if (!stockIsAvailable) {
      showToast("Stock has changed. Please review your cart.", "error");
      setActivePage("Shopping Cart");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          company_name: checkoutForm.company_name.trim(),
          phone: checkoutForm.phone.trim(),
          address: checkoutForm.address.trim(),
          items: cart.map((item) => ({
            product_id: Number(item.id),
            quantity: Number(item.quantity),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Failed to create order.");
      }

      // The backend creates the order and reduces stock in SQL Server.
      setCart([]);
      setCheckoutForm({ company_name: "", phone: "", address: "" });
      setActivePage("Orders");

      await refreshOrders();

      try {
        const productsResponse = await fetch(
          "http://localhost:5000/api/products",
          { headers: getAuthHeaders({ Accept: "application/json" }) }
        );
        const productsData = await productsResponse.json();

        if (!productsResponse.ok || productsData.success !== true) {
          throw new Error(productsData.message || "Could not refresh products.");
        }

        const rows = Array.isArray(productsData.products)
          ? productsData.products
          : [];

        setProducts(
          rows.map((item) => {
            const stock = Number(item.stock_quantity ?? 0);
            return {
              id: String(item.product_id),
              name: item.product_name,
              category: item.category || "Uncategorized",
              price: Number(item.price),
              stock,
              status:
                stock <= 0
                  ? "Out of Stock"
                  : stock < 10
                    ? "Low Stock"
                    : "In Stock",
            };
          })
        );
      } catch (refreshError) {
        console.error("Product refresh error:", refreshError);
      }

      showToast(`Order created successfully! Order ID: ${data.order_id}`, "success");
    } catch (error) {
      console.error("Create Order Error:", error);
      showToast(error.message || "Unable to create order.", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  }


  function renderAdminDashboard() {
    const summary = dashboardAnalytics?.summary || {};
    const revenueRows = dashboardAnalytics?.monthlyRevenue || [];
    const orderRows = dashboardAnalytics?.monthlyOrders || [];
    const statusRows = dashboardAnalytics?.orderStatus || [];
    const lowStockRows = dashboardAnalytics?.lowStockProducts || [];
    const recentRows = dashboardAnalytics?.recentOrders || [];
    const maxRevenue = Math.max(1, ...revenueRows.map((row) => Number(row.monthlyRevenue || 0)));
    const maxOrders = Math.max(1, ...orderRows.map((row) => Number(row.monthlyOrders || 0)));
    const monthLabel = (year, month) => new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString("en", { month: "short" });

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Dashboard</h1>
            <p>Your business performance at a glance.</p>
          </div>
          <div className="dashboard-heading-actions">
            <button className="secondary-button" type="button" onClick={refreshDashboardAnalytics} disabled={analyticsLoading}>
              {analyticsLoading ? "Refreshing..." : "Refresh data"}
            </button>
            <button className="primary-button" onClick={() => { setActivePage("Products"); setShowForm(true); }}>
              <Plus size={18} /> Add Product
            </button>
          </div>
        </div>

        {analyticsError && <div className="analytics-error" role="alert">{analyticsError}</div>}

        <div className="stats-grid">
          <StatCard title="Total Products" value={summary.totalProducts ?? products.length} icon={Package} note="Products in catalogue" />
          <StatCard title="Total Orders" value={summary.totalOrders ?? orders.length} icon={ShoppingCart} note="Orders recorded" />
          <StatCard title="Pending Orders" value={summary.pendingOrders ?? pendingOrders} icon={ClipboardList} note="Awaiting processing" />
          <StatCard title="Total Stock Units" value={Number(summary.totalStockUnits ?? totalStock).toLocaleString()} icon={Boxes} note="Units currently available" />
          <StatCard title="Total Revenue" value={formatMoney(summary.totalRevenue ?? 0)} icon={TrendingUp} note="Revenue from invoices" />
          <StatCard title="Total Invoices" value={summary.totalInvoices ?? 0} icon={FileText} note="Invoices generated" />
        </div>

        {analyticsLoading && !dashboardAnalytics && <p className="empty-message">Loading business analytics...</p>}

        <div className="analytics-grid">
          <section className="panel analytics-panel">
            <div className="panel-heading"><div><h2>Revenue Overview</h2><p>Monthly invoice revenue · Last 6 months</p></div></div>
            {revenueRows.length ? (
              <div className="analytics-bars revenue-bars">
                {revenueRows.map((row) => { const value = Number(row.monthlyRevenue || 0); return (
                  <div className="analytics-bar-column" key={`${row.revenueYear}-${row.revenueMonth}`}>
                    <strong>{formatMoney(value)}</strong>
                    <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ height: `${Math.max(5, value / maxRevenue * 100)}%` }} /></div>
                    <span>{monthLabel(row.revenueYear, row.revenueMonth)}</span>
                  </div>
                ); })}
              </div>
            ) : <p className="empty-message">No revenue records for the selected period.</p>}
          </section>

          <section className="panel analytics-panel">
            <div className="panel-heading"><div><h2>Order Activity</h2><p>Monthly orders · Last 6 months</p></div></div>
            {orderRows.length ? (
              <div className="analytics-bars order-bars">
                {orderRows.map((row) => { const value = Number(row.monthlyOrders || 0); return (
                  <div className="analytics-bar-column" key={`${row.orderYear}-${row.orderMonth}`}>
                    <strong>{value}</strong>
                    <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ height: `${Math.max(5, value / maxOrders * 100)}%` }} /></div>
                    <span>{monthLabel(row.orderYear, row.orderMonth)}</span>
                  </div>
                ); })}
              </div>
            ) : <p className="empty-message">No order records for the selected period.</p>}
          </section>
        </div>

        <div className="content-grid">
          <section className="panel">
            <div className="panel-heading"><div><h2>Recent Orders</h2><p>Latest five orders from the database</p></div><button className="text-button" onClick={() => setActivePage("Orders")}>View all</button></div>
            <div className="table-wrapper"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{recentRows.map((row) => (<tr key={row.order_id}><td className="order-id">ORD-{String(row.order_id).padStart(4, "0")}</td><td>{row.company_name || "Unknown Customer"}</td><td>{row.order_date ? new Date(row.order_date).toLocaleDateString("en-GB") : "—"}</td><td>{formatMoney(row.total_amount)}</td><td><StatusBadge status={row.status || "Pending"} /></td></tr>))}
              {recentRows.length === 0 && <tr><td colSpan="5">No recent orders found.</td></tr>}</tbody></table></div>
          </section>

          <section className="panel inventory-panel">
            <div className="panel-heading"><div><h2>Inventory Health</h2><p>Products requiring attention</p></div><button className="text-button" onClick={() => setActivePage("Inventory")}>View inventory</button></div>
            {lowStockRows.map((item) => (<div className="inventory-item" key={item.product_id}><div className="inventory-icon"><AlertTriangle size={19} /></div><div className="inventory-info"><strong>{item.product_name}</strong><span>{item.stock_quantity} units remaining</span></div><StatusBadge status={item.stockStatus} /></div>))}
            {lowStockRows.length === 0 && <p className="empty-message">All products have sufficient stock.</p>}
          </section>
        </div>

        <section className="panel">
          <div className="panel-heading"><div><h2>Order Status Overview</h2><p>Current distribution of orders</p></div></div>
          {statusRows.length ? <div className="status-overview-list">{statusRows.map((row) => { const count = Number(row.totalOrders || 0); const total = Math.max(1, Number(summary.totalOrders || orders.length || 0)); return <div className="status-overview-row" key={row.status}><div><StatusBadge status={row.status} /><strong>{count}</strong></div><div className="status-progress"><span style={{ width: `${count / total * 100}%` }} /></div></div>; })}</div> : <p className="empty-message">No order status data available.</p>}
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h2>Product Catalogue</h2><p>Manage your available products</p></div><button className="text-button" onClick={() => setActivePage("Products")}>View products</button></div>
          {renderProductTable(products.slice(0, 4), false)}
        </section>
      </>
    );
  }

  // ADMIN AND CUSTOMER DASHBOARD
  function renderDashboard() {

    // ADMIN DASHBOARD
    if (userRole === "admin") {
      return renderAdminDashboard();
    }

    // CUSTOMER DASHBOARD
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Customer Dashboard</h1>
            <p>
              Welcome back, {displayName}!
              Explore products and manage your orders.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setActivePage("Products")}
          >
            <Package size={18} />
            Browse Products
          </button>
        </div>

        <div className="stats-grid">

          <StatCard
            title="Available Products"
            value={products.length}
            icon={Package}
            note="Products available"
          />

          <StatCard
            title="Shopping Cart"
            value={cart.length}
            icon={ShoppingCart}
            note="Items in your cart"
          />

        </div>

        <section className="panel">

          <div className="panel-heading">
            <div>
              <h2>Available Products</h2>
              <p>Explore our product catalogue</p>
            </div>

            <button
              className="text-button"
              onClick={() => setActivePage("Products")}
            >
              View All
            </button>
          </div>

          {renderProductTable(products.slice(0, 4))}

        </section>
      </>
    );
  }

  function renderProductTable(list, showActions = true) {
    const isAdmin = userRole === "admin";

    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              {showActions && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {list.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    <div className="product-icon">
                      <Package size={19} />
                    </div>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.id}</span>
                    </div>
                  </div>
                </td>

                <td>{product.category}</td>
                <td>{formatMoney(product.price)}</td>
                <td>{product.stock}</td>
                <td><StatusBadge status={product.status} /></td>

                {showActions && (
                  <td>
                    {isAdmin ? (
                      <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        alignItems: "center"
                      }}>
                        <button
                          type="button"
                          className="small-button"
                          onClick={() => editProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="small-button"
                          onClick={() => handleUpdateStock(product)}
                        >
                          Update Stock
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => deleteProduct(product)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="small-button"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <Plus size={15} />
                        {product.stock <= 0 ? "Out of Stock" : "Add to cart"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}

            {list.length === 0 && (
              <tr>
                <td colSpan={showActions ? 6 : 5}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function renderProducts() {
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Products</h1>
            <p>View and manage your product catalogue.</p>
          </div>

          {userRole === "admin" && (
  <button
    className="primary-button"
    onClick={() => setShowForm(!showForm)}
  >
    <Plus size={18} />
    Add Product
  </button>
)}
        </div>

        {userRole === "admin" && showForm && (
          <form className="panel product-form" onSubmit={addProduct}>
            <h2>Add New Product</h2>

            <div className="form-grid">
              <label>
                Product Name
                <input
                  value={newProduct.name}
                  onChange={(event) =>
                    setNewProduct({
                      ...newProduct,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Category
                <input
                  value={newProduct.category}
                  onChange={(event) =>
                    setNewProduct({
                      ...newProduct,
                      category: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Price (LKR)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(event) =>
                    setNewProduct({
                      ...newProduct,
                      price: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Stock Quantity
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newProduct.stock}
                  onChange={(event) =>
                    setNewProduct({
                      ...newProduct,
                      stock: event.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button className="primary-button" type="submit">
                Save Product
              </button>
            </div>
          </form>
        )}

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>All Products</h2>
              <p>{products.length} products loaded from the database</p>
            </div>
          </div>

          {productsLoading && (
            <p className="empty-message">Loading products from SQL Server...</p>
          )}

          {!productsLoading && productsError && (
            <p className="empty-message" role="alert">
              {productsError}
            </p>
          )}

          {!productsLoading && !productsError &&
            renderProductTable(filteredProducts)}
        </section>
      </>
    );
  }

  function renderCart() {
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Shopping Cart</h1>
            <p>Review selected products before placing an order.</p>
          </div>
        </div>

        <section className="panel">
          {cart.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={38} />
              <h2>Your cart is empty</h2>
              <p>Add products to start a new order.</p>

              <button
                className="primary-button"
                onClick={() => setActivePage("Products")}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{formatMoney(item.price)}</td>
                        <td>
                          <div className="quantity-control">
                            <button
                              onClick={() =>
                                setCart((previous) =>
                                  previous
                                    .map((entry) =>
                                      entry.id === item.id
                                        ? {
                                            ...entry,
                                            quantity:
                                              entry.quantity - 1,
                                          }
                                        : entry
                                    )
                                    .filter(
                                      (entry) => entry.quantity > 0
                                    )
                                )
                              }
                            >
                              −
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              onClick={() => {
                                const product = products.find(
                                  (entry) => entry.id === item.id
                                );

                                if (
                                  product &&
                                  item.quantity < product.stock
                                ) {
                                  setCart((previous) =>
                                    previous.map((entry) =>
                                      entry.id === item.id
                                        ? {
                                            ...entry,
                                            quantity:
                                              entry.quantity + 1,
                                          }
                                        : entry
                                    )
                                  );
                                } else {
                                  showToast("Maximum stock reached.", "error");
                                }
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>
                          {formatMoney(item.price * item.quantity)}
                        </td>
                        <td>
                          <button
                            className="danger-button"
                            onClick={() =>
                              setCart((previous) =>
                                previous.filter(
                                  (entry) => entry.id !== item.id
                                )
                              )
                            }
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="cart-summary">
                <div>
                  <span>Order Total</span>
                  <strong>{formatMoney(cartTotal)}</strong>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    setCheckoutForm((previous) => ({
                      ...previous,
                      company_name: previous.company_name || displayName,
                    }));
                    setActivePage("Checkout");
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </section>
      </>
    );
  }


  function renderCheckout() {
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Checkout</h1>
            <p>Enter your company details and confirm your order.</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <section className="panel checkout-empty">
            <div className="empty-state">
              <ShoppingCart size={38} />
              <h2>Your cart is empty</h2>
              <p>Add products before proceeding to checkout.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setActivePage("Products")}
              >
                Browse Products
              </button>
            </div>
          </section>
        ) : (
          <div className="checkout-layout">
            <section className="panel checkout-form-panel">
              <div className="panel-heading">
                <div>
                  <h2>Customer Information</h2>
                  <p>Provide the details required to process this order.</p>
                </div>
              </div>

              <form onSubmit={placeOrder} className="checkout-form">
                <label>
                  Customer / Company Name <span className="required-mark">*</span>
                  <input
                    type="text"
                    value={checkoutForm.company_name}
                    onChange={(event) =>
                      setCheckoutForm((previous) => ({
                        ...previous,
                        company_name: event.target.value,
                      }))
                    }
                    placeholder="Enter customer or company name"
                    required
                    maxLength={120}
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(event) =>
                      setCheckoutForm((previous) => ({
                        ...previous,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Enter contact number"
                    maxLength={30}
                  />
                </label>

                <label>
                  Delivery Address
                  <textarea
                    value={checkoutForm.address}
                    onChange={(event) =>
                      setCheckoutForm((previous) => ({
                        ...previous,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Enter delivery address"
                    rows={4}
                    maxLength={500}
                  />
                </label>

                <div className="checkout-form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setActivePage("Shopping Cart")}
                    disabled={isPlacingOrder}
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? "Placing Order..." : "Confirm Order"}
                  </button>
                </div>
              </form>
            </section>

            <aside className="panel checkout-summary-panel">
              <h2>Order Summary</h2>
              <div className="checkout-summary-items">
                {cart.map((item) => (
                  <div className="checkout-summary-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <strong>{formatMoney(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="checkout-total-row">
                <span>Total Amount</span>
                <strong>{formatMoney(cartTotal)}</strong>
              </div>
              <p className="checkout-note">
                Stock availability will be checked again when you confirm the order.
              </p>
            </aside>
          </div>
        )}
      </>
    );
  }

  function renderOrders() {
    const isAdmin = userRole === "admin";

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Orders</h1>
            <p>
              {isAdmin
                ? "Review all customer orders and update their status."
                : "View and track the status of your orders."}
            </p>
          </div>
        </div>

        <section className="panel">
          {ordersLoading && (
            <p className="empty-message">Loading orders from SQL Server...</p>
          )}

          {!ordersLoading && ordersError && (
            <p className="empty-message" role="alert">
              {ordersError}
            </p>
          )}

          {!ordersLoading && !ordersError && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    {isAdmin && <th>Update Status</th>}
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>{formatMoney(order.amount)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>

                      {isAdmin && (
                        <td>
                          <select
                            className="status-select"
                            value={order.status}
                            onChange={(event) =>
                              updateOrderStatus(order.id, event.target.value)
                            }
                            aria-label={`Update status for ${order.id}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5}>No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  }

  function renderInventory() {
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Inventory</h1>
            <p>Monitor available stock and inventory alerts.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            title="Total Stock Units"
            value={totalStock.toLocaleString()}
            icon={Boxes}
            note="Across all products"
          />

          <StatCard
            title="Low Stock Products"
            value={
              products.filter(
                (product) => product.stock > 0 && product.stock < 10
              ).length
            }
            icon={AlertTriangle}
            note="Fewer than 10 units"
          />

          <StatCard
            title="Out of Stock"
            value={
              products.filter((product) => product.stock === 0).length
            }
            icon={Package}
            note="Replenishment required"
          />
        </div>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Stock Details</h2>
              <p>Current inventory levels</p>
            </div>
          </div>

          {renderProductTable(filteredProducts, false)}
        </section>
      </>
    );
  }

  function renderInvoices() {
    const invoicedOrders = orders.filter(
      (order) => order.status !== "Cancelled"
    );

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Invoices</h1>
            <p>View and print invoices for recorded orders.</p>
          </div>
        </div>

        <section className="panel">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {invoicedOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">
                      INV-{order.id.replace("ORD-", "")}
                    </td>

                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{formatMoney(order.amount)}</td>

                    <td>
                      <button
                        className="small-button"
                        onClick={async () => {

    // Open invoice window
    const invoiceWindow = window.open(
        "",
        "_blank",
        "width=800,height=700"
    );

    if (!invoiceWindow) {
        showToast("Please allow pop-ups to view the invoice.", "error");
        return;
    }

    invoiceWindow.document.write(
        "<h2 style='font-family:Arial;padding:30px'>Loading Invoice...</h2>"
    );

    try {

        // Get actual database order ID
        const orderNumber = Number(order.backendId);

        if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
            throw new Error("Invalid order ID.");
        }

        // Fetch order items from backend
        const response = await fetch(
            `http://localhost:5000/api/orders/${orderNumber}/items`,
            {
                method: "GET",
                headers: getAuthHeaders({
                    Accept: "application/json"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || data.success !== true) {
            throw new Error(
                data.message || "Failed to load invoice items."
            );
        }

        // Get invoice items
        const invoiceItems = Array.isArray(data.items)
            ? data.items
            : [];

        if (invoiceItems.length === 0) {
            throw new Error("No products found for this order.");
        }

        // Generate product rows
        const itemRows = invoiceItems.map((item) => {

            const productName =
                item.product_name || item.name || "Unknown Product";

            const quantity = Number(item.quantity || 0);

            const unitPrice = Number(
                item.unit_price ?? item.price ?? 0
            );

            const subtotal = Number(
                item.subtotal ?? unitPrice * quantity
            );

            return `
                <tr>
                    <td>${escapeHtml(productName)}</td>
                    <td>${quantity}</td>
                    <td>${formatMoney(unitPrice)}</td>
                    <td>${formatMoney(subtotal)}</td>
                </tr>
            `;

        }).join("");

        // Invoice number
        const invoiceNumber = String(orderNumber).padStart(4, "0");

        // Generate invoice HTML
        invoiceWindow.document.open();

        invoiceWindow.document.write(`

            <!DOCTYPE html>
            <html>

            <head>

                <meta charset="UTF-8">

                <title>Invoice INV-${invoiceNumber}</title>

                <style>

                    body {
                        font-family: Arial, sans-serif;
                        padding: 35px;
                        color: #1e293b;
                    }

                    h1 {
                        color: #245d55;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 25px;
                    }

                    th, td {
                        padding: 12px;
                        border-bottom: 1px solid #ddd;
                        text-align: left;
                    }

                    th {
                        background: #f1f5f9;
                    }

                    .total {
                        text-align: right;
                        margin-top: 25px;
                        font-size: 20px;
                    }

                    button {
                        padding: 10px 20px;
                        background: #245d55;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }

                    @media print {
                        button {
                            display: none;
                        }
                    }

                </style>

            </head>

            <body>

                <h1>B2B Order Management</h1>

                <h2>Invoice</h2>

                <p>
                    Invoice Number: INV-${invoiceNumber}
                </p>

                <p>
                    Order ID: ${escapeHtml(order.id)}
                </p>

                <p>
                    Customer: ${escapeHtml(order.customer)}
                </p>

                <p>
                    Date: ${escapeHtml(order.date)}
                </p>

                <table>

                    <thead>

                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${itemRows}

                    </tbody>

                </table>

                <h3 class="total">
                    Grand Total: ${formatMoney(order.amount)}
                </h3>

                <button onclick="window.print()">
                    Print Invoice
                </button>

            </body>

            </html>

        `);

        invoiceWindow.document.close();

    } catch (error) {

        console.error("Invoice Error:", error);

        invoiceWindow.document.open();

        invoiceWindow.document.write(`

            <!DOCTYPE html>
            <html>

            <body style="font-family:Arial;padding:30px">

                <h2>Unable to load invoice</h2>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </body>

            </html>

        `);

        invoiceWindow.document.close();

    }

}}
                      >
                        <Eye size={15} />
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  function renderCustomers() {
    const customers = [
      ...new Set(orders.map((order) => order.customer)),
    ];

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Customers</h1>
            <p>Customers recorded in the demo order history.</p>
          </div>
        </div>

        <section className="panel">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Orders</th>
                  <th>Total Order Value</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => {
                  const customerOrders = orders.filter(
                    (order) => order.customer === customer
                  );

                  const total = customerOrders.reduce(
                    (sum, order) => sum + order.amount,
                    0
                  );

                  return (
                    <tr key={customer}>
                      <td>{customer}</td>
                      <td>{customerOrders.length}</td>
                      <td>{formatMoney(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return renderDashboard();

      case "Products":
        return renderProducts();

      case "Shopping Cart":
        return renderCart();

      case "Checkout":
        return renderCheckout();

      case "Orders":
        return renderOrders();

      case "Inventory":
        return renderInventory();

      case "Invoices":
        return renderInvoices();

      case "Customers":
        return renderCustomers();

      default:
        return renderDashboard();
    }
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      {toast.show && (
        <div
          className={`toast-message ${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span className="toast-icon" aria-hidden="true">
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
                ? "✕"
                : "⚠"}
          </span>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Close notification"
            onClick={() =>
              setToast({ show: false, message: "", type: "success" })
            }
          >
            ×
          </button>
        </div>
      )}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">B</div>

          <div>
            <h2>OrderFlow</h2>
            <span>BUSINESS MANAGEMENT</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav">
  {filteredMenuItems.map(({ name, icon: Icon }) => (
    <button
      key={name}
      className={`nav-item ${
        activePage === name ? "active" : ""
      }`}
      onClick={() => {
        setActivePage(name);
        setSidebarOpen(false);
      }}
    >
      <Icon size={19} />

      <span>{name}</span>

      {name === "Shopping Cart" && cart.length > 0 && (
        <span className="cart-count">
          {cart.length}
        </span>
      )}
    </button>
  ))}
</nav>

        <div
          className="sidebar-bottom"
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => setProfileOpen((open) => !open)}
          role="button"
          tabIndex={0}
          aria-expanded={profileOpen}
          aria-label="Open account menu"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setProfileOpen((open) => !open);
            }
          }}
        >
          <div className="profile-avatar">{userInitials}</div>

          <div className="profile-details">
            <strong>{displayName}</strong>
            <span>{displayRole}</span>
          </div>

          <ChevronDown
            size={17}
            style={{
              transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />

          {profileOpen && (
            <div
              role="menu"
              onClick={(event) => event.stopPropagation()}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "calc(100% + 10px)",
                zIndex: 1000,
                padding: "14px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.16)",
                color: "#18324b",
              }}
            >
              <div style={{ padding: "4px 4px 12px", borderBottom: "1px solid #e8edf2" }}>
                <strong style={{ display: "block", fontSize: "14px" }}>
                  {displayName}
                </strong>
                <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "#718096", overflowWrap: "anywhere" }}>
                  {currentUser?.email || ""}
                </span>
                <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "#718096" }}>
                  {displayRole}
                </span>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#fff1f0",
                  color: "#c53030",
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={18} />

              <input
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>

            <button
              type="button"
              className="topbar-avatar"
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Open account menu"
              title={displayName}
              style={{ border: "none", cursor: "pointer" }}
            >
              {userInitials}
            </button>
          </div>
        </header>

        <div className="page-content">
          {renderPage()}

          {selectedProduct && (
            <div
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSavingProduct) {
                  setSelectedProduct(null);
                }
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(15, 23, 42, 0.55)",
              }}
            >
              <form
                onSubmit={saveEditedProduct}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-product-title"
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  padding: "28px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                  color: "#18324b",
                }}
              >
                <h2 id="edit-product-title" style={{ marginTop: 0, marginBottom: "8px" }}>
                  Edit Product
                </h2>
                <p style={{ marginTop: 0, marginBottom: "22px", color: "#718096" }}>
                  Update the product details and save your changes.
                </p>

                <div style={{ display: "grid", gap: "14px" }}>
                  <label style={{ display: "grid", gap: "6px", fontWeight: 600 }}>
                    Product Name
                    <input
                      autoFocus
                      value={editProductForm.name}
                      onChange={(event) =>
                        setEditProductForm((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                      required
                      style={editInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px", fontWeight: 600 }}>
                    Category
                    <input
                      value={editProductForm.category}
                      onChange={(event) =>
                        setEditProductForm((previous) => ({
                          ...previous,
                          category: event.target.value,
                        }))
                      }
                      required
                      style={editInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px", fontWeight: 600 }}>
                    Price (LKR)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editProductForm.price}
                      onChange={(event) =>
                        setEditProductForm((previous) => ({
                          ...previous,
                          price: event.target.value,
                        }))
                      }
                      required
                      style={editInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px", fontWeight: 600 }}>
                    Stock Quantity
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editProductForm.stock}
                      onChange={(event) =>
                        setEditProductForm((previous) => ({
                          ...previous,
                          stock: event.target.value,
                        }))
                      }
                      required
                      style={editInputStyle}
                    />
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isSavingProduct}
                    onClick={() => setSelectedProduct(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSavingProduct}
                  >
                    {isSavingProduct ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {stockProduct && (
            <div
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSavingStock) {
                  setStockProduct(null);
                }
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2001,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(15, 23, 42, 0.55)",
              }}
            >
              <form
                onSubmit={saveUpdatedStock}
                role="dialog"
                aria-modal="true"
                aria-labelledby="update-stock-title"
                style={{
                  width: "100%",
                  maxWidth: "460px",
                  padding: "28px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                  color: "#18324b",
                }}
              >
                <h2 id="update-stock-title" style={{ marginTop: 0, marginBottom: "8px" }}>
                  Update Stock
                </h2>
                <p style={{ marginTop: 0, marginBottom: "22px", color: "#718096" }}>
                  Change the available quantity for {stockProduct.name}.
                </p>

                <label style={{ display: "grid", gap: "8px", fontWeight: 600 }}>
                  New Stock Quantity
                  <input
                    type="number"
                    min="0"
                    step="1"
                    autoFocus
                    value={stockInput}
                    onChange={(event) => setStockInput(event.target.value)}
                    required
                    style={editInputStyle}
                  />
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isSavingStock}
                    onClick={() => setStockProduct(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSavingStock}
                  >
                    {isSavingStock ? "Saving..." : "Save Stock"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <footer className="footer">
            <span>OrderFlow · B2B Management System</span>
            <span>Academic Project · Live Database</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>

        <div className="stat-icon">
          <Icon size={20} />
        </div>
      </div>

      <h2>{value}</h2>

      <div className="stat-note">
        <TrendingUp size={14} />
        <span>{note}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const className = status.toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`status-badge ${className}`}>
      <span className="status-dot"></span>
      {status}
    </span>
  );
}

export default App;
