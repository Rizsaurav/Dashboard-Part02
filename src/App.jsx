import React, { useState, useEffect } from 'react';
import { Search, MapPin, Beer, Phone, Globe } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './index.css';
import './App.css';

const API_KEY = import.meta.env.VITE_APP_API_KEY;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/brewery/:id" element={<BreweryDetail />} />
      </Routes>
    </Router>
  );
}

function Dashboard() {
  const [breweries, setBreweries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [minBreweryCount, setMinBreweryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreweries = async () => {
      try {
        const response = await fetch(`https://api.openbrewerydb.org/v1/breweries?per_page=50&key=${API_KEY}`);
        const data = await response.json();
        setBreweries(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching breweries:', error);
        setLoading(false);
      }
    };
    fetchBreweries();
  }, []);

  const breweryTypes = ['all', ...new Set(breweries.map(b => b.brewery_type))];

  const filteredBreweries = breweries
    .filter(brewery =>
      brewery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brewery.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brewery.state.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(brewery => selectedType === 'all' || brewery.brewery_type === selectedType);

  const stats = {
    total: breweries.length,
    types: Object.entries(
      breweryTypes.reduce((acc, type) => {
        if (type !== 'all') {
          acc[type] = breweries.filter(b => b.brewery_type === type).length;
        }
        return acc;
      }, {})
    ),
    states: Object.entries(
      breweries.reduce((acc, brewery) => {
        acc[brewery.state] = (acc[brewery.state] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).filter(([_, count]) => count >= minBreweryCount).slice(0, 5)
  };

  const chartDataTypes = stats.types.map(([name, value]) => ({ name, value }));
  const chartDataStates = stats.states.map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <header className="topbar">
        <div className="header-content">
          <h1 className="header-title">
            <Beer className="icon" /> Brewery Dashboard
          </h1>
          <div className="search-bar">
            <div className="search-input">
              <Search className="icon" />
              <input
                type="text"
                placeholder="Search breweries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {breweryTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="summary-grid">
          <div className="card">
            <h2>Total Breweries</h2>
            <p className="stat">{stats.total}</p>
          </div>
          <div className="card">
            <h2>Brewery Types</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartDataTypes}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2>Top States</h2>
            <label className="slider-label">
              Min Brewery Count:
              <input
                type="range"
                min="0"
                max="10"
                value={minBreweryCount}
                onChange={(e) => setMinBreweryCount(Number(e.target.value))}
              />
              <span>{minBreweryCount}</span>
            </label>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartDataStates} barSize={30}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="brewery-list">
          {filteredBreweries.map(brewery => (
            <Link to={`/brewery/${brewery.id}`} key={brewery.id} className="brewery-item">
              <div className="brewery-header">
                <div>
                  <h3>{brewery.name}</h3>
                  <div className="brewery-info">
                    <span><MapPin className="icon" /> {brewery.city}, {brewery.state}</span>
                    {brewery.phone && <span><Phone className="icon" /> {brewery.phone}</span>}
                    {brewery.website_url && (
                      <span className="website-link">
                        <Globe className="icon" /> Website
                      </span>
                    )}
                  </div>
                </div>
                <span className="brewery-type">{brewery.brewery_type}</span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}

function BreweryDetail() {
  const { id } = useParams();
  const [brewery, setBrewery] = useState(null);

  useEffect(() => {
    const fetchBrewery = async () => {
      const response = await fetch(`https://api.openbrewerydb.org/v1/breweries/${id}`);
      const data = await response.json();
      setBrewery(data);
    };
    fetchBrewery();
  }, [id]);

  if (!brewery) return <div className="loader-screen"><div className="loading-spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <header className="topbar">
        <div className="header-content">
          <h1 className="header-title">
            <Beer className="icon" /> {brewery.name}
          </h1>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="card">
          <h2>Full Details</h2>
          <p><strong>Brewery Type:</strong> {brewery.brewery_type}</p>
          <p><strong>Address:</strong> {brewery.street}, {brewery.city}, {brewery.state} {brewery.postal_code}</p>
          <p><strong>Phone:</strong> {brewery.phone}</p>
          {brewery.website_url && <p><a href={brewery.website_url} target="_blank" rel="noreferrer">Visit Website</a></p>}
        </div>
      </main>
    </div>
  );
}

export default App;