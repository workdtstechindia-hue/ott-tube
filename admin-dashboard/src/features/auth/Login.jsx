import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin, clearAuthError } from "./authSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [successMessage, setSuccessMessage] = useState("");

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

    setSuccessMessage("Login successful. Redirecting...");
    const timeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 600);

    return () => clearTimeout(timeout);
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-gray-900 rounded-xl mb-3"></div>
          <h2 className="text-2xl font-semibold text-gray-800">Admin Login</h2>
          <p className="text-sm text-gray-500">Sign in to access the dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-black placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="admin@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-black placeholder:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-xl text-white font-medium transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
