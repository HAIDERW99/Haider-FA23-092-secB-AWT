import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="px-6 md:px-10">
      <div className="grid md:grid-cols-[3fr_1fr_1fr] gap-12 my-10 mt-24 text-sm items-start">
        {/* Left Section */}
        <div className="flex items-start gap-4">
          <img className="w-28 mt-1" src={assets.logo} alt="Doctor Hub Logo" />
          <p className="text-gray-600 leading-6 md:max-w-[75%]">
            <strong>Doctor Hub – Healthcare Consultation &amp; Patient History</strong>
            <br />Search doctors by disease and treatment type (Allopathic, Homeopathic, Herbal), book appointments with verified payments, and manage secure medical history in one place.
          </p>
        </div>

        {/* Middle Section */}
        <div>
          <p className="text-lg font-semibold mb-4">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>
              <NavLink to="/" onClick={scrollToTop} className="hover:text-primary cursor-pointer transition-colors">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" onClick={scrollToTop} className="hover:text-primary cursor-pointer transition-colors">
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" onClick={scrollToTop} className="hover:text-primary cursor-pointer transition-colors">
                Contact Us
              </NavLink>
            </li>
            <li className="cursor-default">Privacy Policy</li>
          </ul>
        </div>

        {/* Right Section */}
        <div>
          <p className="text-lg font-semibold mb-4">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>+92-3067571707</li>
            <li>hamzaweb3565@gmail.com</li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <hr className="border-gray-300" />
      <p className="py-4 text-sm text-center text-gray-600">
        © 2026 Doctor Hub — All Rights Reserved.
      </p>
    </div>
  );
};

export default Footer;
