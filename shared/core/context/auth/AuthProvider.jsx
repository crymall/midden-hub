import { useState, useEffect, useEffectEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "./AuthContext";
import * as iamApi from "../../services/iamApi";
import * as canteenApi from "../../services/canteenApi";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const verifyUser = useEffectEvent(async () => {
    try {
      const data = await iamApi.verify();
      let canteenId = null;
      try {
        const canteenUser = await canteenApi.fetchMe();
        canteenId = canteenUser?.id;
      } catch (err) {
        console.error("Failed to fetch Canteen user", err);
      }
      setUser({ ...data.user, canteenId });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    verifyUser();
  }, []);

  const login = async (username, password) => {
    const data = await iamApi.login(username, password);
    return data;
  };

  const verifyLogin = async (userId, code, rememberMe) => {
    const data = await iamApi.verify2FA(userId, code, rememberMe);
    
    let canteenId = null;
    try {
      const canteenUser = await canteenApi.fetchMe();
      canteenId = canteenUser?.id;
    } catch (err) {
      console.error("Failed to fetch Canteen user", err);
    }

    setUser({ ...data.user, canteenId });

    const origin = location.state?.from?.pathname || "/";
    navigate(origin);

    return data;
  };

  const register = async (username, email, password) => {
    return await iamApi.register(username, email, password);
  };

  const logout = async () => {
    await iamApi.logout();
    setUser(null);
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