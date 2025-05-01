import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const DeveloperLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Developer credentials (in a real app, these would be stored securely)
  const DEV_USERNAME = "developer";
  const DEV_PASSWORD = "dev123"; // Use a strong password in production

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple authentication check
    if (username === DEV_USERNAME && password === DEV_PASSWORD) {
      // Store token in localStorage
      localStorage.setItem("dev_access_token", "dev-auth-token");
      // Redirect to developer dashboard - Updated path
      navigate("/dev-dash");
    } else {
      setError("Invalid developer credentials");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Developer Access</CardTitle>
          <CardDescription>
            This area is restricted to development team members only.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-white bg-red-500 rounded">{error}</div>}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Access Development Environment
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default DeveloperLogin;










// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// const DeveloperLogin = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   // Developer credentials (in a real app, these would be stored securely)
//   // For production, you'd use environment variables or better yet, a proper auth system
//   const DEV_USERNAME = "developer";
//   const DEV_PASSWORD = "dev123"; // Use a strong password in production

//   const handleLogin = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Simple authentication check
//     if (username === DEV_USERNAME && password === DEV_PASSWORD) {
//       // Store token in localStorage
//       localStorage.setItem("dev_access_token", "dev-auth-token");
//       // Redirect to homepage or dashboard
//       navigate("/");
//     } else {
//       setError("Invalid developer credentials");
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <Card className="w-full max-w-md">
//         <CardHeader>
//           <CardTitle>SecureTrack Developer Access</CardTitle>
//           <CardDescription>
//             This area is restricted to development team members only.
//           </CardDescription>
//         </CardHeader>
//         <form onSubmit={handleLogin}>
//           <CardContent className="space-y-4">
//             {error && <div className="p-3 text-sm text-white bg-red-500 rounded">{error}</div>}
//             <div className="space-y-2">
//               <label htmlFor="username" className="text-sm font-medium">
//                 Username
//               </label>
//               <Input
//                 id="username"
//                 type="text"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <label htmlFor="password" className="text-sm font-medium">
//                 Password
//               </label>
//               <Input
//                 id="password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//           </CardContent>
//           <CardFooter>
//             <Button type="submit" className="w-full">
//               Access Development Environment
//             </Button>
//           </CardFooter>
//         </form>
//       </Card>
//     </div>
//   );
// };

// export default DeveloperLogin;