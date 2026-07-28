
import { useEffect, useRef } from "react";
import { getProducts } from "./googleSheet";
import { useState } from "react";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I'm ForgeBot, IronForge's AI Product Specialist.\n\nI know everything about our products, prices, suppliers, warehouses and stock.\n\nAsk me anything! 😄",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    getProducts()
      .then((loadedProducts) => {
        console.log("Products loaded:", loadedProducts);
        setProducts(loadedProducts);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
      });
  }, []);

  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const fallbackProductImages = [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092921461-39b9d08a9b2d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092335397-9fa3411089b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=800&q=80",
  ];

  const suggestions = [
    { label: "💰 Prices", query: "price" },
    { label: "📦 Stock", query: "stock" },
    { label: "🏭 Warehouse", query: "warehouse" },
    { label: "🚚 Supplier", query: "supplier" },
    { label: "🌍 Country", query: "country" },
  ];

  const getField = (product, keys) => {
    for (const key of keys) {
      if (product[key] !== undefined && product[key] !== null && product[key] !== "") {
        return product[key];
      }
    }
    return null;
  };

  const getProductDetails = (product) => ({
    name: getField(product, ["Product Name", "product name", "Name", "name"]) || "This item",
    category: getField(product, ["Category", "category"]),
    price: getField(product, ["Price", "price"]),
    warehouse: getField(product, ["Warehouse", "warehouse"]),
    supplier: getField(product, ["Supplier", "supplier"]),
    country: getField(product, ["Country", "country"]),
    stock: getField(product, ["Stock", "stock", "Quantity", "quantity"]),
    image: getField(product, [
      "Image",
      "image",
      "Image URL",
      "image url",
      "ImageURL",
      "Image Url",
    ]),
  });

  const fieldMatches = (fieldValue, q) => {
    if (!fieldValue) return false;
    const val = String(fieldValue).toLowerCase();
    return q.includes(val) || val.includes(q);
  };

  const searchProducts = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return products.filter((product) => {
      const details = getProductDetails(product);
      return (
        fieldMatches(details.name, q) ||
        fieldMatches(details.category, q) ||
        fieldMatches(details.supplier, q) ||
        fieldMatches(details.warehouse, q) ||
        fieldMatches(details.country, q)
      );
    });
  };

  const botReply = (userText) => {
    const text = userText.toLowerCase();

    const wantsPrice = text.includes("price") || text.includes("cost") || text.includes("💰");
    const wantsStock = text.includes("stock") || text.includes("quantity") || text.includes("📦");
    const wantsWarehouse = text.includes("warehouse") || text.includes("🏭");
    const wantsSupplier = text.includes("supplier") || text.includes("🚚");
    const wantsCountry = text.includes("country") || text.includes("🌍");

    const matches = searchProducts(userText);

    if (matches.length === 0) {
      if (wantsPrice || wantsStock || wantsWarehouse || wantsSupplier || wantsCountry) {
        return {
          text: "🤖 Sure thing! Which product, supplier, warehouse or country would you like to know about? Just type a name and I'll pull up the details.",
          image: null,
        };
      }
      return {
        text: "🤔 I couldn't find anything matching that in our inventory. Try a product name, category, supplier, warehouse or country — or tap one of the quick options below!",
        image: null,
      };
    }

    if (matches.length > 1) {
      const list = matches
        .slice(0, 5)
        .map((product) => `• ${getProductDetails(product).name}`)
        .join("\n");
      const extra = matches.length > 5 ? `\n...and ${matches.length - 5} more.` : "";
      return {
        text: `😄 I found ${matches.length} matching products:\n\n${list}${extra}\n\nTell me which one you'd like details on!`,
        image: null,
      };
    }

    const details = getProductDetails(matches[0]);

    if (wantsPrice) {
      return {
        text: details.price
          ? `😄 Great choice!\n\nI found this product in our inventory.\n\n💰 ${details.name} is priced at ${details.price}.`
          : `😕 Sorry, I couldn't find the price for ${details.name} right now.`,
        image: details.image,
      };
    }
    if (wantsStock) {
      return {
        text: details.stock
          ? `📦 Let me check our warehouse...\n\n${details.name} currently has ${details.stock} units in stock.`
          : `😕 Sorry, I couldn't find the stock information for ${details.name}.`,
        image: details.image,
      };
    }
    if (wantsWarehouse) {
      return {
        text: details.warehouse
          ? `🏭 ${details.name} is stored at: ${details.warehouse}.`
          : `😕 Sorry, I couldn't find the warehouse information for ${details.name}.`,
        image: details.image,
      };
    }
    if (wantsSupplier) {
      return {
        text: details.supplier
          ? `🚚 ${details.name} is supplied by: ${details.supplier}.`
          : `😕 Sorry, I couldn't find the supplier information for ${details.name}.`,
        image: details.image,
      };
    }
    if (wantsCountry) {
      return {
        text: details.country
          ? `🌍 ${details.name} originates from: ${details.country}.`
          : `😕 Sorry, I couldn't find the country of origin for ${details.name}.`,
        image: details.image,
      };
    }

    return {
      text: `😄 Great choice!\n\nI found this product in our inventory.\n\n📦 ${details.name}\n\n💰 ${
        details.price || "Price not available"
      }\n\n🏭 ${details.warehouse || "Warehouse not available"}\n\n🚚 ${
        details.supplier || "Supplier not available"
      }\n\n🌍 ${details.country || "Origin not available"}`,
      image: details.image,
    };
  };

  const handleSend = (customText) => {
    const text = (customText ?? input).trim();
    if (!text) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = botReply(text);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: reply.text, image: reply.image },
      ]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      <style>{`
        :root {
          --if-bg: #071426;
          --if-bg-elev: #0d1f36;
          --if-panel: #122a46;
          --if-border: #1f3d61;
          --if-text: #eaf1fa;
          --if-muted: #9eb3cd;
          --if-accent: #f18f2b;
          --if-accent-2: #ffd08a;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          background:
            radial-gradient(circle at 15% 20%, rgba(241, 143, 43, 0.09), transparent 35%),
            radial-gradient(circle at 85% 80%, rgba(93, 133, 184, 0.15), transparent 35%),
            linear-gradient(145deg, #060f1f 0%, #071426 55%, #0a1c33 100%);
          color: var(--if-text);
        }

        .if-app {
          min-height: 100vh;
          color: var(--if-text);
        }

        .if-wrap {
          width: min(1160px, 92%);
          margin: 0 auto;
        }

        .if-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(10px);
          background: rgba(7, 20, 38, 0.86);
          border-bottom: 1px solid rgba(159, 188, 223, 0.14);
        }

        .if-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 78px;
        }

        .if-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--if-text);
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .if-logo-mark {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(140deg, var(--if-accent), #c66b11);
          color: #09111f;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 8px 22px rgba(241, 143, 43, 0.35);
        }

        .if-logo-text {
          font-size: 1.02rem;
        }

        .if-links {
          display: flex;
          gap: 28px;
          align-items: center;
        }

        .if-links a {
          color: var(--if-muted);
          text-decoration: none;
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }

        .if-links a:hover {
          color: var(--if-text);
        }

        .if-menu-btn {
          display: none;
          border: 1px solid var(--if-border);
          background: var(--if-panel);
          color: var(--if-text);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .if-hero {
          padding: 78px 0 86px;
        }

        .if-hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .if-kicker {
          color: var(--if-accent-2);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 0.78rem;
          margin-bottom: 16px;
        }

        .if-title {
          font-size: clamp(2rem, 4.6vw, 3.85rem);
          line-height: 1.1;
          margin: 0;
          max-width: 13ch;
          text-wrap: balance;
        }

        .if-sub {
          margin-top: 20px;
          color: var(--if-muted);
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          line-height: 1.75;
          max-width: 58ch;
        }

        .if-actions {
          margin-top: 34px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .if-btn {
          border: none;
          border-radius: 12px;
          padding: 13px 22px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .if-btn:hover {
          transform: translateY(-2px);
        }

        .if-btn-primary {
          background: linear-gradient(120deg, var(--if-accent), #ca6e11);
          color: #09111f;
          box-shadow: 0 10px 28px rgba(241, 143, 43, 0.35);
        }

        .if-btn-secondary {
          background: transparent;
          color: var(--if-text);
          border: 1px solid var(--if-border);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .if-visual-card {
          position: relative;
          border-radius: 22px;
          border: 1px solid rgba(116, 151, 194, 0.25);
          background: linear-gradient(145deg, rgba(18, 42, 70, 0.92), rgba(9, 23, 40, 0.88));
          padding: 12px;
          box-shadow: 0 20px 55px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .if-visual-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(255, 255, 255, 0.11), transparent 40%);
        }

        .if-hero-img {
          display: block;
          width: 100%;
          height: 430px;
          object-fit: cover;
          border-radius: 16px;
          filter: saturate(0.84) contrast(1.06);
        }

        .if-section {
          padding: 82px 0;
        }

        .if-section-alt {
          background: linear-gradient(180deg, rgba(8, 20, 36, 0.72), rgba(11, 27, 46, 0.78));
          border-top: 1px solid rgba(165, 194, 226, 0.12);
          border-bottom: 1px solid rgba(165, 194, 226, 0.12);
        }

        .if-section-head {
          max-width: 720px;
          margin-bottom: 34px;
        }

        .if-section-title {
          margin: 0;
          font-size: clamp(1.6rem, 3.8vw, 2.5rem);
          line-height: 1.2;
        }

        .if-section-text {
          margin-top: 14px;
          color: var(--if-muted);
          line-height: 1.7;
        }

        .if-grid-products {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .if-product-card {
          border: 1px solid rgba(130, 165, 204, 0.2);
          border-radius: 16px;
          background: linear-gradient(160deg, rgba(18, 41, 69, 0.92), rgba(10, 26, 45, 0.9));
          overflow: hidden;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .if-product-card:hover {
          transform: translateY(-4px);
          border-color: rgba(241, 143, 43, 0.52);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.32);
        }

        .if-product-card img {
          width: 100%;
          height: 188px;
          object-fit: cover;
          display: block;
        }

        .if-card-body {
          padding: 16px 16px 18px;
        }

        .if-card-body h3 {
          margin: 0;
          font-size: 1.05rem;
        }

        .if-card-body p {
          margin: 10px 0 0;
          color: var(--if-muted);
          line-height: 1.6;
          font-size: 0.93rem;
        }

        .if-grid-features {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .if-feature-card {
          padding: 22px 18px;
          border-radius: 16px;
          border: 1px solid rgba(128, 162, 199, 0.22);
          background: linear-gradient(150deg, rgba(16, 37, 62, 0.9), rgba(10, 25, 43, 0.86));
        }

        .if-feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: rgba(241, 143, 43, 0.16);
          border: 1px solid rgba(241, 143, 43, 0.34);
          color: var(--if-accent-2);
          font-weight: 700;
          margin-bottom: 14px;
        }

        .if-feature-card h3 {
          margin: 0;
          font-size: 1rem;
        }

        .if-feature-card p {
          margin-top: 10px;
          color: var(--if-muted);
          line-height: 1.62;
          font-size: 0.92rem;
        }

        .if-grid-testimonials {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .if-testimonial {
          padding: 24px 22px;
          border-radius: 16px;
          border: 1px solid rgba(136, 170, 210, 0.2);
          background: linear-gradient(140deg, rgba(17, 40, 66, 0.9), rgba(9, 24, 41, 0.9));
        }

        .if-testimonial p {
          margin: 0;
          color: var(--if-muted);
          line-height: 1.75;
          font-size: 0.95rem;
        }

        .if-client {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(151, 181, 214, 0.18);
        }

        .if-client strong {
          display: block;
          font-size: 0.97rem;
        }

        .if-client span {
          color: var(--if-muted);
          font-size: 0.88rem;
        }

        .if-contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 22px;
        }

        .if-contact-info,
        .if-contact-form {
          border-radius: 18px;
          border: 1px solid rgba(137, 170, 209, 0.2);
          background: linear-gradient(150deg, rgba(15, 35, 58, 0.92), rgba(9, 24, 41, 0.9));
          padding: 24px;
        }

        .if-contact-info h3,
        .if-contact-form h3 {
          margin-top: 0;
          margin-bottom: 12px;
        }

        .if-contact-list {
          display: grid;
          gap: 12px;
        }

        .if-contact-item {
          color: var(--if-muted);
          line-height: 1.6;
          font-size: 0.93rem;
        }

        .if-form-grid {
          display: grid;
          gap: 12px;
        }

        .if-input,
        .if-textarea {
          width: 100%;
          border: 1px solid rgba(126, 161, 200, 0.3);
          background: rgba(7, 21, 37, 0.88);
          color: var(--if-text);
          border-radius: 10px;
          padding: 12px 13px;
          font-size: 0.93rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .if-input:focus,
        .if-textarea:focus {
          border-color: rgba(241, 143, 43, 0.72);
          box-shadow: 0 0 0 3px rgba(241, 143, 43, 0.14);
        }

        .if-textarea {
          min-height: 128px;
          resize: vertical;
        }

        .if-footer {
          padding: 34px 0;
          border-top: 1px solid rgba(154, 184, 216, 0.14);
          background: rgba(6, 16, 30, 0.9);
        }

        .if-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .if-footer p {
          margin: 0;
          color: var(--if-muted);
          font-size: 0.9rem;
        }

        .if-footer-links {
          display: flex;
          gap: 16px;
        }

        .if-footer-links a {
          text-decoration: none;
          color: var(--if-muted);
          font-size: 0.9rem;
        }

        .if-footer-links a:hover {
          color: var(--if-text);
        }

        .if-chat-wrap {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 90;
        }

        .if-chat-panel {
          width: min(350px, calc(100vw - 30px));
          border-radius: 16px;
          border: 1px solid rgba(136, 170, 210, 0.3);
          background: linear-gradient(150deg, rgba(15, 34, 57, 0.98), rgba(8, 20, 36, 0.98));
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.45);
          margin-bottom: 12px;
          overflow: hidden;
        }

        .if-chat-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(136, 170, 210, 0.2);
          font-size: 0.92rem;
          font-weight: 600;
        }

        .if-chat-head button {
          border: none;
          background: transparent;
          color: var(--if-muted);
          cursor: pointer;
          font-size: 1rem;
        }

        .if-chat-body {
          padding: 14px;
          color: var(--if-muted);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .if-chat-messages {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 320px;
          overflow-y: auto;
        }

        .if-message {
          max-width: 84%;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 0.88rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .if-message-image {
          display: block;
          width: 100%;
          max-width: 220px;
          height: 130px;
          object-fit: cover;
          border-radius: 10px;
          margin-bottom: 8px;
        }

        .if-bot {
          align-self: flex-start;
          background: rgba(30, 58, 92, 0.9);
          color: var(--if-text);
          border: 1px solid rgba(136, 170, 210, 0.25);
        }

        .if-user {
          align-self: flex-end;
          background: linear-gradient(120deg, var(--if-accent), #ca6e11);
          color: #09111f;
          font-weight: 500;
        }

        .if-typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 12px 14px;
        }

        .if-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--if-muted);
          animation: if-typing-bounce 1.2s infinite ease-in-out;
        }

        .if-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .if-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes if-typing-bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .if-suggestions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 0 14px 12px;
        }

        .if-suggestions-label {
          width: 100%;
          font-size: 0.78rem;
          color: var(--if-muted);
          margin-bottom: 2px;
        }

        .if-suggestion-btn {
          border: 1px solid rgba(241, 143, 43, 0.4);
          background: rgba(241, 143, 43, 0.12);
          color: var(--if-accent-2);
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .if-suggestion-btn:hover {
          background: rgba(241, 143, 43, 0.24);
        }

        .if-chat-input-row {
          display: flex;
          gap: 8px;
          padding: 12px 14px 14px;
          border-top: 1px solid rgba(136, 170, 210, 0.2);
        }

        .if-chat-input {
          flex: 1;
          border: 1px solid rgba(126, 161, 200, 0.3);
          background: rgba(7, 21, 37, 0.88);
          color: var(--if-text);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.88rem;
          outline: none;
        }

        .if-chat-input:focus {
          border-color: rgba(241, 143, 43, 0.72);
          box-shadow: 0 0 0 3px rgba(241, 143, 43, 0.14);
        }

        .if-send-btn {
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          background: linear-gradient(120deg, var(--if-accent), #ca6e11);
          color: #09111f;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .if-chat-toggle {
          width: 60px;
          height: 60px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(140deg, var(--if-accent), #c56a10);
          color: #09111f;
          font-size: 1.45rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 14px 30px rgba(241, 143, 43, 0.45);
        }

        @media (max-width: 980px) {
          .if-hero-grid {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .if-grid-products {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .if-grid-features {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .if-grid-testimonials {
            grid-template-columns: 1fr;
          }

          .if-contact-grid {
            grid-template-columns: 1fr;
          }

          .if-title {
            max-width: 18ch;
          }

          .if-hero-img {
            height: 340px;
          }
        }

        @media (max-width: 780px) {
          .if-menu-btn {
            display: inline-flex;
          }

          .if-links {
            position: absolute;
            top: 78px;
            left: 0;
            right: 0;
            display: ${menuOpen ? "flex" : "none"};
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
            padding: 20px 4%;
            background: rgba(8, 21, 38, 0.98);
            border-bottom: 1px solid rgba(159, 188, 223, 0.16);
          }
        }

        @media (max-width: 540px) {
          .if-hero {
            padding: 52px 0 64px;
          }

          .if-section {
            padding: 62px 0;
          }

          .if-grid-products,
          .if-grid-features {
            grid-template-columns: 1fr;
          }

          .if-title {
            font-size: 1.9rem;
          }

          .if-sub {
            line-height: 1.65;
          }
        }
      `}</style>

      <div className="if-app">
        <header className="if-navbar">
          <div className="if-wrap if-nav-inner">
            <a href="#" className="if-logo" aria-label="IronForge Components Home">
              <span className="if-logo-mark">IF</span>
              <span className="if-logo-text">IronForge Components</span>
            </a>

            <nav className="if-links" aria-label="Primary">
              <a href="#products">Products</a>
              <a href="#industries">Industries</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>

            <button
              type="button"
              className="if-menu-btn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              Menu
            </button>
          </div>
        </header>

        <main className="if-hero">
          <div className="if-wrap if-hero-grid">
            <section>
              <p className="if-kicker">Industrial Excellence</p>
              <h1 className="if-title">Engineering Strength. Delivering Precision.</h1>
              <p className="if-sub">
                Premium industrial components for manufacturing, construction and heavy
                engineering.
              </p>
              <div className="if-actions">
                <button type="button" className="if-btn if-btn-primary">
                  View Products
                </button>
                <button type="button" className="if-btn if-btn-secondary">
                  Contact Us
                </button>
              </div>
            </section>

            <aside className="if-visual-card">
              <img
                className="if-hero-img"
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&auto=format&fit=crop&q=80"
                alt="Industrial machinery and metal components"
              />
            </aside>
          </div>
        </main>

        <section className="if-section" id="products">
          <div className="if-wrap">
            <div className="if-section-head">
              <h2 className="if-section-title">Product Catalogue</h2>
              <p className="if-section-text">
                Explore high-performance industrial components engineered for durability,
                precision and long service life in demanding environments.
              </p>
            </div>

            <div className="if-grid-products">
              {products.length > 0 ? (
                products.slice(0, 6).map((product, index) => {
                  const details = getProductDetails(product);
                  return (
                    <article className="if-product-card" key={`${details.name}-${index}`}>
                      <img
                        src={
                          details.image ||
                          fallbackProductImages[index % fallbackProductImages.length]
                        }
                        alt={details.name}
                      />
                      <div className="if-card-body">
                        <h3>{details.name}</h3>
                        <p>
                          {details.category ? `${details.category} — ` : ""}
                          {details.price
                            ? `Priced at ${details.price}.`
                            : "Contact us for pricing and availability."}
                        </p>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="if-section-text">Loading products from our catalogue…</p>
              )}
            </div>
          </div>
        </section>

        <section className="if-section if-section-alt" id="about">
          <div className="if-wrap">
            <div className="if-section-head">
              <h2 className="if-section-title">Why Choose Us</h2>
              <p className="if-section-text">
                IronForge Components combines industrial expertise with strict quality control
                to deliver dependable parts for mission-critical operations.
              </p>
            </div>

            <div className="if-grid-features">
              <article className="if-feature-card">
                <div className="if-feature-icon">01</div>
                <h3>Certified Quality</h3>
                <p>
                  Every component is produced under rigorous manufacturing standards and
                  multi-stage inspection.
                </p>
              </article>

              <article className="if-feature-card">
                <div className="if-feature-icon">02</div>
                <h3>Custom Engineering</h3>
                <p>
                  We adapt dimensions, materials and tolerances to match your technical
                  requirements.
                </p>
              </article>

              <article className="if-feature-card">
                <div className="if-feature-icon">03</div>
                <h3>Reliable Supply</h3>
                <p>
                  Responsive logistics and production planning keep your projects on schedule.
                </p>
              </article>

              <article className="if-feature-card">
                <div className="if-feature-icon">04</div>
                <h3>Technical Support</h3>
                <p>
                  Our specialists provide guidance on component selection and lifecycle
                  performance.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="if-section" id="industries">
          <div className="if-wrap">
            <div className="if-section-head">
              <h2 className="if-section-title">Customer Testimonials</h2>
              <p className="if-section-text">
                Trusted by operations teams, project managers and procurement specialists
                across heavy industries.
              </p>
            </div>

            <div className="if-grid-testimonials">
              <article className="if-testimonial">
                <p>
                  "IronForge helped us standardize critical components across multiple plants.
                  The consistency and delivery reliability have been outstanding."
                </p>
                <div className="if-client">
                  <strong>Rachel Benton</strong>
                  <span>Operations Director, Apex Manufacturing Group</span>
                </div>
              </article>

              <article className="if-testimonial">
                <p>
                  "Their engineering team quickly translated our specs into production-ready
                  parts. We reduced downtime and improved equipment reliability."
                </p>
                <div className="if-client">
                  <strong>Omar Velez</strong>
                  <span>Maintenance Lead, Granite Ridge Construction</span>
                </div>
              </article>

              <article className="if-testimonial">
                <p>
                  "From initial consultation to delivery, the process was professional and
                  precise. The product quality exceeded our expected standards."
                </p>
                <div className="if-client">
                  <strong>Priya Menon</strong>
                  <span>Procurement Manager, Titan Heavy Engineering</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="if-section if-section-alt" id="contact">
          <div className="if-wrap if-contact-grid">
            <article className="if-contact-info">
              <h3>Contact IronForge Components</h3>
              <p className="if-section-text">
                Let us know your project requirements and our industrial specialists will get
                back to you promptly.
              </p>
              <div className="if-contact-list">
                <div className="if-contact-item">
                  <strong>Head Office:</strong> 1450 Foundry Avenue, Houston, TX 77002
                </div>
                <div className="if-contact-item">
                  <strong>Phone:</strong> +1 (713) 555-0148
                </div>
                <div className="if-contact-item">
                  <strong>Email:</strong> info@ironforgecomponents.com
                </div>
                <div className="if-contact-item">
                  <strong>Business Hours:</strong> Mon-Fri, 8:00 AM - 6:00 PM
                </div>
              </div>
            </article>

            <article className="if-contact-form">
              <h3>Send Us a Message</h3>
              <form className="if-form-grid" onSubmit={(event) => event.preventDefault()}>
                <input className="if-input" type="text" placeholder="Full Name" />
                <input className="if-input" type="email" placeholder="Work Email" />
                <input className="if-input" type="text" placeholder="Company" />
                <textarea
                  className="if-textarea"
                  placeholder="Tell us about your component needs"
                />
                <button type="submit" className="if-btn if-btn-primary">
                  Submit Inquiry
                </button>
              </form>
            </article>
          </div>
        </section>

        <footer className="if-footer">
          <div className="if-wrap if-footer-row">
            <p>© 2026 IronForge Components. All rights reserved.</p>
            <div className="if-footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#contact">Support</a>
            </div>
          </div>
        </footer>

        <div className="if-chat-wrap" aria-live="polite">
          {chatOpen ? (
            <div className="if-chat-panel">
              <div className="if-chat-head">
                <span>ForgeBot — AI Product Specialist</span>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close chat"
                >
                  ×
                </button>
              </div>

              <div className="if-chat-messages" ref={chatMessagesRef}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`if-message ${
                      message.sender === "user" ? "if-user" : "if-bot"
                    }`}
                  >
                    {message.image ? (
                      <img
                        className="if-message-image"
                        src={message.image}
                        alt="Product"
                      />
                    ) : null}
                    {message.text}
                  </div>
                ))}

                {typing ? (
                  <div className="if-message if-bot if-typing">
                    <span className="if-typing-dot"></span>
                    <span className="if-typing-dot"></span>
                    <span className="if-typing-dot"></span>
                  </div>
                ) : null}
              </div>

              <div className="if-suggestions">
                <span className="if-suggestions-label">💡 Try asking:</span>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    className="if-suggestion-btn"
                    onClick={() => handleSend(suggestion.query)}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>

              <div className="if-chat-input-row">
                <input
                  className="if-chat-input"
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSend();
                    }
                  }}
                  placeholder="Ask about a product, price, stock..."
                  aria-label="Type your message"
                />
                <button
                  type="button"
                  className="if-send-btn"
                  onClick={() => handleSend()}
                >
                  Send
                </button>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="if-chat-toggle"
            onClick={() => setChatOpen((open) => !open)}
            aria-expanded={chatOpen}
            aria-label="Open AI chatbot"
          >
            AI
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
