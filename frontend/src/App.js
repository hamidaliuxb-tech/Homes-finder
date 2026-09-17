import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";

import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Buy from "@/pages/Buy";
import Rent from "@/pages/Rent";
import Sell from "@/pages/Sell";
import Invest from "@/pages/Invest";
import OffPlan from "@/pages/OffPlan";
import Commercial from "@/pages/Commercial";
import Services from "@/pages/Services";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Legal from "@/pages/Legal";
import PropertyDetail from "@/pages/PropertyDetail";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ProtectedRoute from "@/pages/admin/ProtectedRoute";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/buy" element={<Buy />} />
                <Route path="/rent" element={<Rent />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/invest" element={<Invest />} />
                <Route path="/off-plan" element={<OffPlan />} />
                <Route path="/commercial" element={<Commercial />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/property/:slug" element={<PropertyDetail />} />
                <Route path="/legal/:slug" element={<Legal />} />
              </Route>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Home />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
