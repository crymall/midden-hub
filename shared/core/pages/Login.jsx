import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Field, Input, Label } from "@headlessui/react";
import useAuth from "../context/auth/useAuth";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [userId, setUserId] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const { login, verifyLogin, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      switch (mode) {
        case "login":
          {
            const data = await login(username, password);
            if (data.token) return;
            setUserId(data.userId);
            setInfo(data.message || "Enter the code sent to your email.");
            setMode("2fa");
          }
          break;
        case "2fa":
          await verifyLogin(userId, code);
          break;
        case "register":
          await register(username, email, password);
          setInfo("Registration successful! Please log in.");
          setMode("login");
          setPassword("");
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    }
  };

  const setCleanMode = (mode) => {
    setMode(mode);
    setError("");
    setInfo("");
  };

  const headerText =
    mode === "2fa"
      ? "2-Factor Verification"
      : mode === "register"
        ? "Create Account"
        : "Log In";

  const submitButtonText =
    mode === "2fa" ? "Verify" : mode === "register" ? "Register" : "Login";

  const pageInput = (label, type, placeholder, value, onInputChange) => (
    <Field>
      <Label className="mb-1 block text-sm font-bold">{label}</Label>
      <Input
        className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
        type={type}
        placeholder={placeholder}
        required
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
      />
    </Field>
  );

  const pageButton = (innerText, onClick = null) => (
    <Button
      type="button"
      {...(onClick && { onClick })}
      className="text-lightGrey text-sm underline hover:text-white"
    >
      {innerText}
    </Button>
  );

  return (
    <div className="bg-dark text-lightestGrey flex min-h-screen items-center justify-center font-mono">
      <div className="bg-primary md:border-accent flex min-h-screen w-full flex-col justify-center p-8 md:min-h-0 md:max-w-md md:border-4 md:border-dashed">
        <h1 className="font-gothic text-shadow-hard-grey mb-6 text-center text-4xl font-bold tracking-wide text-white">
          {headerText}
        </h1>

        {error && (
          <div className="mb-4 border border-red-500 bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 border border-blue-500 bg-blue-900/50 p-3 text-sm text-blue-200">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-4">
          {mode === "2fa" ? (
            pageInput("Verification Code", "text", "123456", code, setCode)
          ) : (
            <>
              {pageInput("Username", "text", "Your username", username, setUsername)}
              {mode === "register" &&
                pageInput("Email", "email", "you@example.com", email, setEmail)}
              {pageInput("Password", "password", "Your password", password, setPassword)}
            </>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="submit"
              className="bg-grey hover:bg-lightGrey text-dark w-full px-4 py-2 font-bold transition-colors"
            >
              {submitButtonText}
            </Button>

            {mode === "register" &&
              pageButton("Already have an account? Login", () => setCleanMode("login"))}

            {mode === "2fa" &&
              pageButton("Back to Login", () => setCleanMode("login"))}

            {mode === "login" && pageButton("Create Account", () => setCleanMode("register"))}
          </div>
        </form>
      </div>
    </div>
  );
}
