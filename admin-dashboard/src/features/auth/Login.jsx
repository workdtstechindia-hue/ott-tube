import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin, clearAuthError } from "./authSlice";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(adminLogin(formData));
  };

  useEffect(() => {
    if (!token) return;
    const redirectPath = location.state?.from?.pathname || "/";
    const timeout = setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 600);

    return () => clearTimeout(timeout);
  }, [token, navigate, location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 transition-colors duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-gray-900 dark:bg-white rounded-xl mb-3"></div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Admin Login
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to access the dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/40 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {token && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/40 dark:text-green-400 rounded-lg">
            Login successful. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@mail.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white 
                         placeholder:text-gray-400 dark:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white
                         transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white 
                         placeholder:text-gray-400 dark:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white
                         transition"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-xl font-medium transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
