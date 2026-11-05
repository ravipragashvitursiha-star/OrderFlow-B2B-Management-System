import { useState } from "react";
import "./Auth.css";

const API_URL = "http://localhost:5000/api/auth";

function Auth({ onLogin }) {

  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Login and Registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {

      const endpoint = isLogin ? "login" : "register";

      const url = `${API_URL}/${endpoint}`;

      // Prepare Request Body
      const body = isLogin
        ? {
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          };

      // API Request
      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      });

      const data = await response.json();

      // Handle API Errors
      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed"
        );
      }

      // LOGIN SUCCESS
      if (isLogin) {

        if (!data.token || !data.user) {
          throw new Error("Invalid login response from server");
        }

        // Save JWT Token
        localStorage.setItem("token", data.token);

        // Save User Details
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        // Update Application State
        onLogin(data.user);

      }

      // REGISTRATION SUCCESS
      else {

        setMessage(
          "Registration successful! Please login."
        );

        setIsLogin(true);

        setFormData({
          first_name: "",
          last_name: "",
          email: formData.email,
          password: "",
        });

      }

    } catch (error) {

      console.error("Authentication Error:", error);

      setMessage(error.message || "Something went wrong");

    } finally {

      setLoading(false);

    }
  };

  // Switch Between Login and Register
  const handleSwitch = () => {

    setIsLogin(!isLogin);

    setMessage("");

    setFormData({
      first_name: "",
      last_name: "",
      email: formData.email,
      password: "",
    });

  };

  return (

    <div className="auth-container">

      <div className="auth-card">

        {/* Heading */}
        <h1>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>

        <p>
          {isLogin
            ? "Login to your OrderFlow account"
            : "Register to get started with OrderFlow"}
        </p>

        {/* Success / Error Message */}
        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit}>

          {/* First Name and Last Name */}
          {!isLogin && (

            <div className="auth-name-fields">

              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />

            </div>

          )}

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Create Account"}

          </button>

        </form>

        {/* Switch Login / Register */}
        <div className="auth-switch">

          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={handleSwitch}
            disabled={loading}
          >

            {isLogin ? "Sign Up" : "Login"}

          </button>

        </div>

      </div>

    </div>

  );

}

export default Auth;