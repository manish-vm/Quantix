import React from "react";
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-section">
       
         <div className="footer-logo-img-container">
            <img src="Quantix-logopic.png" alt="Quantix Logo" className="footer-logo-image" /> 
         </div>
          <h2 className="footer-logo">Quantix</h2>
          
          <p className="footer-text">
            Intelligent weight-based validation system for accurate product counting
            in manufacturing environments.
          </p>
          
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li>Dashboard</li>
            <li>Reports</li>
            <li>Product Master</li>
            <li>Settings</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3 className="footer-heading">Contact</h3>
          <p className="footer-text">Chennai, India</p>
          <p className="footer-text">+91 98765 43210</p>
          <p className="footer-text">support@quantix.com</p>
        </div>

        {/* Newsletter */}
        <div className="footer-section">
          <h3 className="footer-heading">Stay Updated</h3>
          <p className="footer-text">Get product updates and insights.</p>

          <div className="footer-input-group">
            <input
              type="email"
              placeholder="Enter your email"
              className="footer-input"
            />
            <button className="footer-btn">Subscribe</button>
          </div>
        </div>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Quantix. All rights reserved.</p>
        <div className="footer-bottom-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;