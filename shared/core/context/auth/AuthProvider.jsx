import { useState, useEffect, useEffectEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AuthContext from "./AuthContext";
import * as iamApi from "../../services/iamApi";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const processToken = (token) => {
    try {
      if (!token) {
        localStorage.removeItem("token");
        setUser(null);
        return;
      }

      const decoded = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        localStorage.setItem("token", token);
        setUser({ ...decoded, token });
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const checkToken = useEffectEvent(processToken);
  const showPage = useEffectEvent(() => setLoading(false));

  useEffect(() => {
    const token = localStorage.getItem("token");
    checkToken(token);
    showPage();
  }, []);

  const login = async (username, password) => {
    const data = await iamApi.login(username, password);
    if (data.token) {
      processToken(data.token);
      const origin = location.state?.from?.pathname || "/";
      navigate(origin);
    }
    return data;
  };

  const verifyLogin = async (userId, code) => {
    const data = await iamApi.verify2FA(userId, code);
    processToken(data.token);

    const origin = location.state?.from?.pathname || "/";
    navigate(origin);

    return data;
  };

  const register = async (username, email, password) => {
    return await iamApi.register(username, email, password);
  };

  const logout = () => {
    processToken(null);
  };

  const value = {
    user,
    loading,
    login,
    verifyLogin,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;