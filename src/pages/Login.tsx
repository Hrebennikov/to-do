import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [isRegistering, setIsRegistering] = useState(false); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error", error);
      alert("Login error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);

      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error", error);
      alert("Registration error");
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={isRegistering ? handleRegister : handleLogin} className="flex flex-col space-y-4">
        {isRegistering && (
          <input
            type="text"
            placeholder="Name"
            className="border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          {isRegistering ? "Register" : "Login"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-500"
        >
          {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
};

export default Login;

