import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

// ─── MOCK DATA (used when not connected to Gmail) ───
const MOCK_ARTICLES = [
  {
    id: "1", subject: "ASML Maintains #1 Semiconductor Equipment Position in 2025",
    from: "Dr. Robert Castellano", source: "Semiconductor Deep Dive",
    date: "2026-02-21", snippet: "ASML has maintained its position as the #1 semiconductor equipment company for the third year in a row, capturing nearly 25% of global WFE market share with 17.7% revenue growth.",
    body: "ASML has maintained its position as the #1 semiconductor equipment company in 2025 for the third year in a row. The Information Network's newly released report confirms ASML's continued dominance in the global Wafer Fab Equipment sector. Revenue growth of 17.7% in 2025 reinforced its lead over Applied Materials. The company's dominance is anchored in its unparalleled EUV lithography capabilities.",
    topics: ["Semiconductors", "Technology"], relevance: "high",
    tickers: ["ASML"], read: false, archived: false, starred: false, rating: null,
    ideas: [{ ticker: "ASML", thesis: "Dominant EUV lithography position with 25% global market share. No viable competitors.", risk: "Cyclical semiconductor capex slowdown" }]
  },
  {
    id: "2", subject: "Intel Foundry: The Stock Has Re-rated — Now the Economics Must Follow",
    from: "Dr. Robert Castellano", source: "Semiconductor Deep Dive",
    date: "2026-02-22", snippet: "Intel's stock has appreciated approximately 69% over the past year, but external foundry revenue remains negligible at roughly $166M.",
    body: "Intel's stock has appreciated approximately 69% over the past year, with the inflection starting in October 2025. However, external foundry revenue remains negligible at roughly $166M (less than 1% of total foundry revenue). The structural question of whether Intel can attract meaningful third-party wafer volume remains unanswered.",
    topics: ["Semiconductors", "Technology"], relevance: "high",
    tickers: ["INTC"], read: false, archived: false, starred: false, rating: null,
    ideas: [{ ticker: "INTC", thesis: "18A node progress driving re-rating. Watch for external foundry traction.", risk: "Market already priced in recovery; external revenue still negligible" }]
  },
  {
    id: "3", subject: "Healthcare Is Propping Up the Job Market",
    from: "Spencer Jakab", source: "WSJ Markets AM",
    date: "2026-02-10", snippet: "All of America's jobs growth now comes from healthcare, a category responsible for less than 15% of total employment. What happens if cutbacks hit?",
    body: "The U.S. economy might be in the hospital. Literally. Year-over-year payroll growth outside of healthcare turned negative in December for the first time since the last recession. All of America's jobs growth now comes from a category responsible for less than 15% of total employment. AI infrastructure spending could create jobless growth.",
    topics: ["Macro", "Healthcare"], relevance: "medium",
    tickers: [], read: true, archived: false, starred: false, rating: null,
    ideas: []
  },
  {
    id: "4", subject: "More SaaSpocalypse at $WIX",
    from: "Andrew Walker", source: "Yet Another Value Blog",
    date: "2026-02-20", snippet: "WIX trades at less than 7x FCF with a $2B buyback announced. The AI risk is real but the valuation is compelling.",
    body: "Wix trades at less than 7x free cash flow and recently announced a $2B buyback (roughly half its market cap). The core business is sticky and asset-light. However, AI/vibe-coding platforms could erode the moat. Base44 acquisition growing from $3M to $50M ARR raises questions about sustainable growth vs negative-ROI marketing.",
    topics: ["SaaS", "Technology"], relevance: "high",
    tickers: ["WIX"], read: false, archived: false, starred: false, rating: null,
    ideas: [{ ticker: "WIX", thesis: "Trading at <7x FCF with massive buyback. Sticky business model.", risk: "AI tools could make website building trivially easy, eroding moat" }]
  },
  {
    id: "5", subject: "Special Situations Digest - #3",
    from: "Clark Square Capital", source: "Clark Square Capital",
    date: "2026-02-22", snippet: "198 special situations tracked this week. Notable: Carlisle TOB for Hogi Medical, Rhim Advisors accumulating Kitagawa Seiki, Pleasant Lake pushing Funko sale.",
    body: "This week's digest tracks 198 situations globally. Notable activist campaigns include Carlisle Group's TOB for Hogi Medical at ¥6,700/share, Rhim Advisors accumulating 18.2% of Kitagawa Seiki (vacuum press manufacturer benefiting from AI data center demand), and Pleasant Lake Partners pushing Funko to explore a sale.",
    topics: ["Special Situations", "Activist"], relevance: "high",
    tickers: ["3892.T", "6327.T", "FNKO", "JACK"], read: false, archived: false, starred: false, rating: null,
    ideas: [
      { ticker: "3892.T", thesis: "Carlisle Group TOB at ¥6,700. Dalton reinvesting 20% post-privatization.", risk: "March 2 deadline — time-sensitive" },
      { ticker: "6327.T", thesis: "18.2% activist stake + AI data center demand for vacuum press machines.", risk: "Small-cap Japanese equity, liquidity risk" }
    ]
  },
  {
    id: "6", subject: "Latest Data Suggest a Rotation Back to the Technology Sector",
    from: "Dr. Robert Castellano", source: "Semiconductor Deep Dive",
    date: "2026-02-23", snippet: "Technology sector leadership stabilizing after months of rotation. Cyclical sectors rolling off highs suggest tech may regain leadership.",
    body: "Technology sector leadership hit its high in October 2025. By late February, tech was stabilizing while cyclical sectors were rolling off their own highs. This pattern suggests a broadening followed by normalization rather than a sustained exodus from tech.",
    topics: ["Macro", "Technology"], relevance: "medium",
    tickers: [], read: false, archived: false, starred: false, rating: null,
    ideas: []
  },
  {
    id: "7", subject: "Flying through the Volaris thesis with Antipodes",
    from: "Andrew Walker", source: "Yet Another Value Podcast",
    date: "2026-02-20", snippet: "Mexican low-cost airline with structural growth as air travel takes share from long-distance buses. Proposed Viva merger adds catalyst.",
    body: "Volaris (VLRS) is a Mexican low-cost airline with significant domestic exposure and cross-border US routes. Structural growth opportunity as air travel continues taking share from long-distance buses. Industry consolidation and proposed Volaris-Viva merger provide additional catalysts.",
    topics: ["Airlines", "Emerging Markets"], relevance: "high",
    tickers: ["VLRS"], read: false, archived: false, starred: false, rating: null,
    ideas: [{ ticker: "VLRS", thesis: "Structural growth from bus-to-air shift in Mexico. Merger catalyst with Viva.", risk: "Pratt & Whitney engine issues, regulatory hurdles, macro sensitivity" }]
  },
  {
    id: "8", subject: "[Update] Cloud Accounting in the Land of the Rising Sun",
    from: "Buyback Capital", source: "Buyback Capital",
    date: "2026-02-20", snippet: "Money Forward update: Japan's cloud accounting leader. Government digital mandates supporting adoption. Profitability lagging but revenue strong.",
    body: "Money Forward is one of Japan's leading cloud accounting SaaS companies. Japan is playing catch-up on cloud adoption, supported by government digital accounting mandates. Management targeting JPY8-10B in adjusted EBITDA. Stock caught in broader global software selloff but business fundamentals improving.",
    topics: ["SaaS", "Japan"], relevance: "medium",
    tickers: ["3994.T"], read: false, archived: false, starred: false, rating: null,
    ideas: [{ ticker: "3994.T", thesis: "Japan cloud accounting leader with government tailwinds. Profitability inflection ahead.", risk: "Global SaaS selloff sentiment; profitability still unproven" }]
  },
  {
    id: "9", subject: "OpenQuant Newsletter - Edition #157",
    from: "OpenQuant", source: "OpenQuant Newsletter",
    date: "2026-02-23", snippet: "BNP Paribas expanding Miami office after 47% revenue growth. Citadel suing former PM for stealing trade secrets to build Marshall Wace team.",
    body: "BNP Paribas is expanding its Miami office after 47% revenue growth driven by hedge fund and institutional investor services. Citadel has accused a former portfolio manager of stealing trade secrets to build a team at Marshall Wace.",
    topics: ["Quant", "Industry News"], relevance: "low",
    tickers: [], read: true, archived: false, starred: false, rating: null,
    ideas: []
  },
  {
    id: "10", subject: "Travelzoo at $5 — Subscription Inflection",
    from: "Clark Square Capital", source: "Clark Square Capital",
    date: "2026-02-19", snippet: "TZOO at $5 on net cash balance sheet. Q1 2026 key as paid subscribers begin renewing, boosting margins without acquisition costs.",
    body: "Travelzoo at $5 per share on a net cash balance sheet is approaching a key inflection as paid subscribers begin renewing in Q1 2026. If operating margins normalize to prior levels (~25%), could imply ~$1.50 in EPS or ~3x forward earnings. Small-cap, illiquid.",
    topics: ["Special Situations", "Consumer"], relevance: "high",
    tickers: ["TZOO"], read: false, archived: false, starred: false, rating: null,
    ideas: [{ ticker: "TZOO", thesis: "Subscription model inflection in Q1 2026. ~3x forward EPS on net cash.", risk: "Small-cap, illiquid. Subscription churn unknown." }]
  }
];

// ─── UTILITY HELPERS ───
const ALL_TOPICS = ["Semiconductors", "Technology", "Macro", "Healthcare", "SaaS", "Special Situations", "Activist", "Airlines", "Emerging Markets", "Japan", "Quant", "Industry News", "Consumer", "Defense"];
const ALL_SOURCES_DEFAULT = [...new Set(MOCK_ARTICLES.map(a => a.source))];
const RELEVANCE_LEVELS = ["high", "medium", "low"];

const formatDate = (d) => {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const relColor = (r) => r === "high" ? "#c2410c" : r === "medium" ? "#a16207" : "#6b7280";
const relBg = (r) => r === "high" ? "#fff7ed" : r === "medium" ? "#fefce8" : "#f9fafb";

// ─── GMAIL HELPERS ───
function decodeBase64Url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
  } catch {
    return atob(base64);
  }
}

function extractEmailBody(payload) {
  // Try to get text/plain or text/html from parts
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      // Recurse into nested parts (multipart/alternative, etc.)
      if (part.parts) {
        const nested = extractEmailBody(part);
        if (nested) return nested;
      }
    }
    // Fallback to text/html
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        // Strip HTML tags for plain text
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
      }
    }
  }
  // Single-part message
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  return "";
}

function getHeader(headers, name) {
  const h = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

function parseGmailToArticle(msg, idx) {
  const headers = msg.payload?.headers || [];
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const fromRaw = getHeader(headers, "From") || "Unknown";
  const dateRaw = getHeader(headers, "Date");

  // Parse "Name <email>" format
  const fromMatch = fromRaw.match(/^"?([^"<]+)"?\s*<.*>$/);
  const fromName = fromMatch ? fromMatch[1].trim() : fromRaw.split("@")[0];

  // Guess source from sender
  const sourceMatch = fromRaw.match(/<(.+)>/);
  const email = sourceMatch ? sourceMatch[1] : fromRaw;
  const sourceDomain = email.includes("@") ? email.split("@")[1].split(".")[0] : fromName;
  const source = fromName.length > 3 ? fromName : sourceDomain;

  // Parse date
  let dateStr;
  try {
    const d = new Date(dateRaw);
    dateStr = d.toISOString().split("T")[0];
  } catch {
    dateStr = new Date().toISOString().split("T")[0];
  }

  const body = extractEmailBody(msg.payload || {});
  const snippet = msg.snippet || body.slice(0, 200);

  // Simple ticker detection: find $TICKER patterns
  const tickerMatches = body.match(/\$([A-Z]{1,5}(?:\.[A-Z]{1,2})?)/g) || [];
  const tickers = [...new Set(tickerMatches.map(t => t.replace("$", "")))];

  return {
    id: msg.id || String(idx),
    subject,
    from: fromName,
    source,
    date: dateStr,
    snippet: snippet.slice(0, 250),
    body: body.slice(0, 3000),
    topics: [],
    relevance: "medium",
    tickers,
    read: false,
    archived: false,
    starred: false,
    rating: null,
    ideas: [],
    gmailId: msg.id,
  };
}

// ─── MAIN APP ───
export default function NewsletterDashboard() {
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ topics: [], sources: [], relevance: [], search: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState({});
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("inbox");
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem("gmail_token") || null);
  const [fetchError, setFetchError] = useState(null);
  const [emailCount, setEmailCount] = useState(0);
  const feedbackRef = useRef(null);
  const tokenClientRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Save token to sessionStorage whenever it changes
  const saveToken = useCallback((token) => {
    setAccessToken(token);
    if (token) {
      sessionStorage.setItem("gmail_token", token);
    } else {
      sessionStorage.removeItem("gmail_token");
    }
  }, []);

  // Initialize Google OAuth token client
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: () => {},
        });
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Fetch newsletters from Gmail
  const fetchGmail = useCallback(async (token) => {
    setLoading(true);
    setFetchError(null);
    try {
      // First: test that the token works with a simple profile call
      const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();

      if (profileData.error) {
        const errMsg = profileData.error.message || profileData.error.status || JSON.stringify(profileData.error);
        console.error("Gmail API error:", profileData.error);
        if (profileData.error.code === 401 || profileData.error.code === 403) {
          // Token expired or insufficient permissions — clear and re-auth
          saveToken(null);
          setGmailConnected(false);
          showToast("Session expired — click Connect Gmail again");
        } else {
          showToast("Gmail API error: " + errMsg);
        }
        setLoading(false);
        return;
      }

      setGmailEmail(profileData.emailAddress || "");
      setGmailConnected(true);

      // Broad search queries
      const queries = [
        "category:updates newer_than:14d",
        "category:promotions newer_than:14d",
        "from:substack.com newer_than:14d",
        "newer_than:14d (newsletter OR digest OR weekly OR briefing OR recap)",
        "newer_than:14d list:*.substack.com",
      ];

      const allMessageIds = new Set();
      const queryErrors = [];

      for (const q of queries) {
        try {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=30`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          if (data.error) {
            queryErrors.push(`"${q}": ${data.error.message}`);
            console.error(`Query "${q}" error:`, data.error);
          } else {
            console.log(`"${q}" → ${data.messages?.length || 0} results (total estimate: ${data.resultSizeEstimate})`);
            if (data.messages) {
              data.messages.forEach(m => allMessageIds.add(m.id));
            }
          }
        } catch (e) {
          queryErrors.push(`"${q}": ${e.message}`);
        }
      }

      // If targeted queries found nothing, try a broad fallback
      if (allMessageIds.size === 0) {
        console.log("Targeted queries returned 0, trying broad fallback...");
        try {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          if (data.error) {
            queryErrors.push(`fallback: ${data.error.message}`);
            console.error("Fallback error:", data.error);
          } else {
            console.log(`Fallback (all mail) → ${data.messages?.length || 0} results`);
            if (data.messages) {
              data.messages.forEach(m => allMessageIds.add(m.id));
            }
          }
        } catch (e) {
          queryErrors.push(`fallback: ${e.message}`);
        }
      }

      if (allMessageIds.size === 0) {
        const errDetail = queryErrors.length > 0
          ? "API errors: " + queryErrors[0]
          : "0 results from all queries";
        showToast("No emails found — " + errDetail);
        setFetchError(errDetail);
        setLoading(false);
        return;
      }

      setEmailCount(allMessageIds.size);

      // Fetch full message details
      const ids = [...allMessageIds].slice(0, 30);
      const messageFetches = ids.map(id =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => null)
      );

      const messages = (await Promise.all(messageFetches)).filter(Boolean);
      const parsed = messages
        .filter(m => !m.error) // skip any that errored
        .map((msg, i) => parseGmailToArticle(msg, i));

      parsed.sort((a, b) => b.date.localeCompare(a.date));

      setArticles(parsed);
      showToast(`Loaded ${parsed.length} emails from Gmail`);
    } catch (err) {
      console.error("Gmail fetch error:", err);
      setFetchError(err.message);
      showToast("Error: " + err.message);
    }
    setLoading(false);
  }, [showToast, saveToken]);

  // Auto-reconnect on page load if we have a saved token
  useEffect(() => {
    if (accessToken && !gmailConnected) {
      fetchGmail(accessToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectGmail = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      showToast("Add VITE_GOOGLE_CLIENT_ID to .env to connect Gmail");
      return;
    }
    if (!tokenClientRef.current) {
      showToast("Google Sign-In still loading, try again in a moment");
      return;
    }

    tokenClientRef.current.callback = async (response) => {
      if (response.error) {
        showToast("Auth error: " + response.error);
        return;
      }
      saveToken(response.access_token);
      setGmailConnected(true);
      fetchGmail(response.access_token);
    };

    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  }, [fetchGmail, showToast, saveToken]);

  const handleRefresh = useCallback(() => {
    if (accessToken) {
      fetchGmail(accessToken);
    }
  }, [accessToken, fetchGmail]);

  // Filter logic
  const filtered = articles.filter(a => {
    if (view === "archived") return a.archived;
    if (view === "ideas") return a.starred;
    if (a.archived) return false;
    const { topics, sources, relevance, search } = filters;
    if (topics.length && !topics.some(t => a.topics.includes(t))) return false;
    if (sources.length && !sources.includes(a.source)) return false;
    if (relevance.length && !relevance.includes(a.relevance)) return false;
    if (search && !`${a.subject} ${a.from} ${a.snippet} ${a.tickers.join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = articles.find(a => a.id === selectedId);
  const allSources = [...new Set(articles.map(a => a.source))];

  const toggleFilter = (type, val) => {
    setFilters(f => ({
      ...f,
      [type]: f[type].includes(val) ? f[type].filter(v => v !== val) : [...f[type], val]
    }));
  };

  const updateArticle = (id, patch) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const handleArchive = (id) => {
    updateArticle(id, { archived: true });
    if (selectedId === id) setSelectedId(null);
    showToast("Archived");
  };

  const handleStar = (id) => {
    const a = articles.find(x => x.id === id);
    updateArticle(id, { starred: !a.starred });
    showToast(a.starred ? "Removed from watchlist" : "Added to watchlist");
  };

  const handleRate = (id, rating) => {
    updateArticle(id, { rating });
    showToast(rating === "up" ? "Rated helpful" : "Rated not useful");
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    updateArticle(id, { read: true });
  };

  const saveFeedbackNote = () => {
    if (!feedbackText.trim()) return;
    setFeedbackNotes(prev => ({
      ...prev,
      [selectedId || "general"]: [...(prev[selectedId || "general"] || []),
        { text: feedbackText, time: new Date().toLocaleTimeString(), articleTitle: selected?.subject || "General" }]
    }));
    setFeedbackText("");
    showToast("Note saved");
  };

  const activeFilterCount = filters.topics.length + filters.sources.length + filters.relevance.length + (filters.search ? 1 : 0);

  // ─── STYLES ───
  const font = "'Newsreader', 'Georgia', serif";
  const sansFont = "'DM Sans', 'Helvetica Neue', sans-serif";
  const monoFont = "'JetBrains Mono', 'SF Mono', monospace";

  return (
    <div style={{
      fontFamily: sansFont, background: "#faf9f7", height: "100vh", color: "#1a1a1a",
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* ─── HEADER ─── */}
      <header style={{
        background: "#fffffe", borderBottom: "1px solid #e8e5e0",
        padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <h1 style={{
            fontFamily: font, fontSize: 26, fontWeight: 700, margin: 0,
            letterSpacing: "-0.02em", color: "#1a1a1a"
          }}>
            The Daily Digest
          </h1>
          <span style={{ fontSize: 12, color: "#999", fontFamily: monoFont, letterSpacing: "0.05em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Nav tabs */}
          {[
            { key: "inbox", label: "Inbox", count: articles.filter(a => !a.archived).length },
            { key: "ideas", label: "Watchlist", count: articles.filter(a => a.starred).length },
            { key: "archived", label: "Archived", count: articles.filter(a => a.archived).length }
          ].map(tab => (
            <button key={tab.key} onClick={() => { setView(tab.key); setSelectedId(null); }} style={{
              background: view === tab.key ? "#1a1a1a" : "transparent",
              color: view === tab.key ? "#fff" : "#666",
              border: "1px solid " + (view === tab.key ? "#1a1a1a" : "#ddd"),
              borderRadius: 20, padding: "6px 16px", fontSize: 13, fontFamily: sansFont,
              fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6
            }}>
              {tab.label}
              <span style={{
                background: view === tab.key ? "rgba(255,255,255,0.2)" : "#f0eeeb",
                borderRadius: 10, padding: "1px 7px", fontSize: 11, fontFamily: monoFont
              }}>{tab.count}</span>
            </button>
          ))}

          <div style={{ width: 1, height: 24, background: "#e0ddd8", margin: "0 4px" }} />

          {/* Gmail connection status + button */}
          {gmailConnected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "4px 12px",
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 12, color: "#15803d", fontFamily: monoFont }}>
                {gmailEmail || "Connected"}
              </span>
            </div>
          )}

          <button onClick={gmailConnected ? handleRefresh : handleConnectGmail} style={{
            background: gmailConnected ? "#f0eeeb" : "#c2410c", color: gmailConnected ? "#1a1a1a" : "#fff",
            border: "none", borderRadius: 20, padding: "7px 18px", fontSize: 13,
            fontWeight: 600, cursor: "pointer", fontFamily: sansFont, transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 6,
            opacity: loading ? 0.7 : 1
          }} disabled={loading}>
            {loading ? (
              <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : gmailConnected ? "↻ Refresh" : "Connect Gmail"}
          </button>
        </div>
      </header>

      {/* ─── FILTER BAR ─── */}
      <div style={{
        background: "#fffffe", borderBottom: "1px solid #e8e5e0", padding: "10px 32px",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 14 }}>⌕</span>
          <input
            type="text" placeholder="Search newsletters, tickers, topics..."
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{
              width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e0ddd8",
              borderRadius: 8, fontSize: 13, fontFamily: sansFont, background: "#faf9f7",
              outline: "none", color: "#1a1a1a", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Filter toggle */}
        <button onClick={() => setShowFilters(!showFilters)} style={{
          background: showFilters ? "#1a1a1a" : "#f0eeeb", color: showFilters ? "#fff" : "#555",
          border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13,
          cursor: "pointer", fontFamily: sansFont, fontWeight: 500, display: "flex", alignItems: "center", gap: 6
        }}>
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              background: "#c2410c", color: "#fff", borderRadius: 10,
              padding: "1px 7px", fontSize: 10, fontFamily: monoFont
            }}>{activeFilterCount}</span>
          )}
        </button>

        {/* Quick topic pills */}
        {!showFilters && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Semiconductors", "Macro", "SaaS", "Special Situations"].map(t => (
              <button key={t} onClick={() => toggleFilter("topics", t)} style={{
                background: filters.topics.includes(t) ? "#1a1a1a" : "transparent",
                color: filters.topics.includes(t) ? "#fff" : "#888",
                border: "1px solid " + (filters.topics.includes(t) ? "#1a1a1a" : "#ddd"),
                borderRadius: 14, padding: "4px 12px", fontSize: 11, cursor: "pointer",
                fontFamily: sansFont, fontWeight: 500, transition: "all 0.15s"
              }}>{t}</button>
            ))}
          </div>
        )}

        {activeFilterCount > 0 && (
          <button onClick={() => setFilters({ topics: [], sources: [], relevance: [], search: "" })} style={{
            background: "none", border: "none", color: "#c2410c", fontSize: 12,
            cursor: "pointer", fontFamily: sansFont, fontWeight: 500, padding: "4px 8px"
          }}>Clear all</button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div style={{
          background: "#fffffe", borderBottom: "1px solid #e8e5e0", padding: "16px 32px",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.08em", marginBottom: 8, fontFamily: monoFont }}>TOPICS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_TOPICS.map(t => (
                <button key={t} onClick={() => toggleFilter("topics", t)} style={{
                  background: filters.topics.includes(t) ? "#1a1a1a" : "#f5f4f1",
                  color: filters.topics.includes(t) ? "#fff" : "#555",
                  border: "none", borderRadius: 14, padding: "5px 12px", fontSize: 12,
                  cursor: "pointer", fontFamily: sansFont, fontWeight: 500
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.08em", marginBottom: 8, fontFamily: monoFont }}>SOURCES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {allSources.map(s => (
                <button key={s} onClick={() => toggleFilter("sources", s)} style={{
                  background: filters.sources.includes(s) ? "#1a1a1a" : "#f5f4f1",
                  color: filters.sources.includes(s) ? "#fff" : "#555",
                  border: "none", borderRadius: 14, padding: "5px 12px", fontSize: 12,
                  cursor: "pointer", fontFamily: sansFont, fontWeight: 500
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.08em", marginBottom: 8, fontFamily: monoFont }}>RELEVANCE</div>
            <div style={{ display: "flex", gap: 6 }}>
              {RELEVANCE_LEVELS.map(r => (
                <button key={r} onClick={() => toggleFilter("relevance", r)} style={{
                  background: filters.relevance.includes(r) ? relColor(r) : "#f5f4f1",
                  color: filters.relevance.includes(r) ? "#fff" : relColor(r),
                  border: `1px solid ${filters.relevance.includes(r) ? relColor(r) : "#e0ddd8"}`,
                  borderRadius: 14, padding: "5px 14px", fontSize: 12,
                  cursor: "pointer", fontFamily: sansFont, fontWeight: 600, textTransform: "capitalize"
                }}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Article List — independent scroll */}
        <div style={{
          width: 420, borderRight: "1px solid #e8e5e0", background: "#fffffe",
          overflowY: "auto", flexShrink: 0, height: "100%"
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>∅</div>
              <div style={{ fontFamily: font, fontStyle: "italic", fontSize: 15 }}>No newsletters match your filters</div>
            </div>
          ) : filtered.map(a => (
            <div key={a.id} onClick={() => handleSelect(a.id)} style={{
              padding: "16px 24px", borderBottom: "1px solid #f0eeeb", cursor: "pointer",
              background: selectedId === a.id ? "#f5f4f1" : a.read ? "#fffffe" : "#fffffe",
              transition: "background 0.15s", position: "relative",
              borderLeft: selectedId === a.id ? "3px solid #c2410c" : "3px solid transparent"
            }}>
              {/* Unread dot */}
              {!a.read && (
                <div style={{
                  position: "absolute", left: 10, top: 24, width: 6, height: 6,
                  borderRadius: "50%", background: "#c2410c"
                }} />
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <span style={{
                  fontSize: 11, fontFamily: monoFont, color: "#999", letterSpacing: "0.02em"
                }}>{a.source}</span>
                <span style={{ fontSize: 11, color: "#bbb", fontFamily: monoFont }}>{formatDate(a.date)}</span>
              </div>

              <div style={{
                fontFamily: font, fontSize: 15, fontWeight: a.read ? 400 : 600,
                lineHeight: 1.35, marginBottom: 6, color: "#1a1a1a"
              }}>{a.subject}</div>

              <div style={{ fontSize: 12.5, color: "#777", lineHeight: 1.45, marginBottom: 8 }}>
                {a.snippet.slice(0, 120)}{a.snippet.length > 120 ? "..." : ""}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {a.tickers.map(t => (
                  <span key={t} style={{
                    fontFamily: monoFont, fontSize: 10.5, fontWeight: 600,
                    background: "#f0eeeb", color: "#c2410c", padding: "2px 8px",
                    borderRadius: 4, letterSpacing: "0.03em"
                  }}>${t}</span>
                ))}
                {a.topics.slice(0, 2).map(t => (
                  <span key={t} style={{
                    fontSize: 10.5, color: "#999", padding: "2px 8px",
                    border: "1px solid #e8e5e0", borderRadius: 10, fontFamily: sansFont
                  }}>{t}</span>
                ))}
                <span style={{
                  fontSize: 10, fontWeight: 600, color: relColor(a.relevance),
                  background: relBg(a.relevance), padding: "2px 8px", borderRadius: 4,
                  textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: monoFont
                }}>{a.relevance}</span>
                {a.starred && <span style={{ fontSize: 13 }}>★</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Reading Pane — independent scroll */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
          {selected ? (
            <>
              {/* Article content — scrollable */}
              <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
                {/* Meta bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleStar(selected.id)} style={{
                      background: selected.starred ? "#fef3c7" : "#f5f4f1",
                      border: `1px solid ${selected.starred ? "#f59e0b" : "#e0ddd8"}`,
                      borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer",
                      fontFamily: sansFont, fontWeight: 500, display: "flex", alignItems: "center", gap: 4
                    }}>{selected.starred ? "★" : "☆"} {selected.starred ? "On Watchlist" : "Add to Watchlist"}</button>
                    <button onClick={() => handleRate(selected.id, "up")} style={{
                      background: selected.rating === "up" ? "#dcfce7" : "#f5f4f1",
                      border: `1px solid ${selected.rating === "up" ? "#22c55e" : "#e0ddd8"}`,
                      borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer"
                    }}>👍</button>
                    <button onClick={() => handleRate(selected.id, "down")} style={{
                      background: selected.rating === "down" ? "#fee2e2" : "#f5f4f1",
                      border: `1px solid ${selected.rating === "down" ? "#ef4444" : "#e0ddd8"}`,
                      borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer"
                    }}>👎</button>
                  </div>
                  <button onClick={() => handleArchive(selected.id)} style={{
                    background: "#f5f4f1", border: "1px solid #e0ddd8", borderRadius: 8,
                    padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: sansFont,
                    fontWeight: 500, color: "#888"
                  }}>Archive ↓</button>
                </div>

                {/* Title */}
                <div style={{
                  fontFamily: monoFont, fontSize: 11, color: "#c2410c", fontWeight: 500,
                  letterSpacing: "0.06em", marginBottom: 6, textTransform: "uppercase"
                }}>{selected.source}</div>
                <h2 style={{
                  fontFamily: font, fontSize: 28, fontWeight: 700, lineHeight: 1.25,
                  margin: "0 0 8px 0", letterSpacing: "-0.01em", color: "#1a1a1a"
                }}>{selected.subject}</h2>
                <div style={{ fontSize: 13, color: "#999", marginBottom: 24, fontFamily: sansFont }}>
                  By {selected.from} · {new Date(selected.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </div>

                {/* Relevance + Topics */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: relColor(selected.relevance),
                    background: relBg(selected.relevance), padding: "4px 12px", borderRadius: 4,
                    textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: monoFont
                  }}>{selected.relevance} relevance</span>
                  {selected.topics.map(t => (
                    <span key={t} style={{
                      fontSize: 11, color: "#666", padding: "4px 12px",
                      border: "1px solid #e0ddd8", borderRadius: 14, fontFamily: sansFont, fontWeight: 500
                    }}>{t}</span>
                  ))}
                </div>

                {/* Body */}
                <div style={{
                  fontFamily: font, fontSize: 17, lineHeight: 1.7, color: "#2a2a2a",
                  maxWidth: 640, marginBottom: 32, whiteSpace: "pre-wrap"
                }}>{selected.body}</div>

                {/* Investment Ideas */}
                {selected.ideas.length > 0 && (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.08em",
                      marginBottom: 12, fontFamily: monoFont
                    }}>INVESTMENT IDEAS</div>
                    {selected.ideas.map((idea, i) => (
                      <div key={i} style={{
                        background: "#fffffe", border: "1px solid #e8e5e0",
                        borderTop: "3px solid #c2410c", borderRadius: 8,
                        padding: 20, marginBottom: 12
                      }}>
                        <div style={{
                          fontFamily: monoFont, fontSize: 16, fontWeight: 700,
                          color: "#c2410c", marginBottom: 6
                        }}>${idea.ticker}</div>
                        <div style={{ fontFamily: font, fontSize: 15, lineHeight: 1.55, color: "#333", marginBottom: 8 }}>
                          {idea.thesis}
                        </div>
                        <div style={{ fontSize: 13, color: "#888" }}>
                          <span style={{ fontWeight: 600, color: "#b91c1c" }}>Risk:</span> {idea.risk}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tickers mentioned */}
                {selected.tickers.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.08em", marginBottom: 8, fontFamily: monoFont }}>
                      TICKERS MENTIONED
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {selected.tickers.map(t => (
                        <span key={t} style={{
                          fontFamily: monoFont, fontSize: 13, fontWeight: 600,
                          background: "#f0eeeb", color: "#c2410c", padding: "4px 12px",
                          borderRadius: 6
                        }}>${t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── FEEDBACK BAR ─── */}
              <div style={{
                borderTop: "1px solid #e8e5e0", background: "#fffffe", padding: "12px 32px",
                display: "flex", gap: 12, alignItems: "center", flexShrink: 0
              }}>
                <input
                  ref={feedbackRef}
                  type="text" placeholder="Add a note, question, or feedback on this article..."
                  value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveFeedbackNote()}
                  style={{
                    flex: 1, padding: "10px 16px", border: "1px solid #e0ddd8",
                    borderRadius: 8, fontSize: 13, fontFamily: sansFont,
                    background: "#faf9f7", outline: "none", color: "#1a1a1a"
                  }}
                />
                <button onClick={saveFeedbackNote} style={{
                  background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8,
                  padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: sansFont, whiteSpace: "nowrap"
                }}>Save Note</button>
                <button onClick={() => {
                  const text = `${selected.subject}\n\n${selected.snippet}\n\nTickers: ${selected.tickers.map(t=>"$"+t).join(", ")}`;
                  navigator.clipboard?.writeText(text);
                  showToast("Copied to clipboard");
                }} style={{
                  background: "#f5f4f1", border: "1px solid #e0ddd8", borderRadius: 8,
                  padding: "10px 14px", fontSize: 12, cursor: "pointer", fontFamily: sansFont,
                  fontWeight: 500, color: "#666", whiteSpace: "nowrap"
                }}>Copy Summary</button>
              </div>

              {/* Notes for this article */}
              {(feedbackNotes[selectedId] || []).length > 0 && (
                <div style={{
                  borderTop: "1px solid #f0eeeb", background: "#faf9f7", padding: "10px 32px",
                  maxHeight: 120, overflowY: "auto", flexShrink: 0
                }}>
                  {feedbackNotes[selectedId].map((n, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: "#666", padding: "4px 0",
                      borderBottom: "1px solid #f0eeeb", display: "flex", gap: 8
                    }}>
                      <span style={{ fontFamily: monoFont, fontSize: 10, color: "#bbb", minWidth: 60 }}>{n.time}</span>
                      <span>{n.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: 48, color: "#bbb"
            }}>
              <div style={{ fontFamily: font, fontSize: 48, marginBottom: 16, fontWeight: 300 }}>
                ☞
              </div>
              <div style={{ fontFamily: font, fontSize: 20, fontStyle: "italic", color: "#aaa", marginBottom: 8 }}>
                Select a newsletter to read
              </div>
              <div style={{ fontSize: 13, color: "#ccc" }}>
                {filtered.length} {view === "archived" ? "archived" : view === "ideas" ? "saved" : "unread"} item{filtered.length !== 1 ? "s" : ""}
              </div>
              {!gmailConnected && (
                <div style={{
                  marginTop: 32, padding: "16px 24px", background: "#fff7ed",
                  border: "1px solid #fed7aa", borderRadius: 12, maxWidth: 360, textAlign: "center"
                }}>
                  <div style={{ fontSize: 13, color: "#c2410c", fontWeight: 600, marginBottom: 4 }}>
                    {GOOGLE_CLIENT_ID ? "Click \"Connect Gmail\" to get started" : "Sample data loaded"}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                    {GOOGLE_CLIENT_ID
                      ? "Sign in with Google to pull your latest newsletters from the Updates tab."
                      : "Add VITE_GOOGLE_CLIENT_ID to your .env file to connect Gmail. For now, explore with sample data."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── TOAST ─── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#fff", padding: "10px 24px", borderRadius: 10,
          fontSize: 13, fontFamily: sansFont, fontWeight: 500, zIndex: 1000,
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)", animation: "fadeUp 0.3s ease"
        }}>{toast}</div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        input::placeholder { color: #bbb; }
        button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #ccc; }
      `}</style>
    </div>
  );
}
