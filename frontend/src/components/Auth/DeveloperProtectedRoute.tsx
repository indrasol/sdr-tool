import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const DeveloperProtectedRoute = () => {
  const [isDeveloper, setIsDeveloper] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if the developer is authenticated
    const checkDeveloperAuth = () => {
      const devToken = localStorage.getItem("dev_access_token");
      setIsDeveloper(!!devToken);
    };
    
    checkDeveloperAuth();
  }, []);

  // Show loading while checking auth
  if (isDeveloper === null) {
    return <div>Loading...</div>;
  }

  // If developer is not authenticated and not trying to access dev login, redirect to dev login
  if (!isDeveloper && location.pathname !== "/dev") {
    return <Navigate to="/dev" replace />;
  }

  // If authenticated or trying to access the dev login page, allow access
  return <Outlet />;
};

export default DeveloperProtectedRoute;

















// import { Navigate, Outlet, useLocation } from "react-router-dom";
// import { useState, useEffect } from "react";

// const DeveloperProtectedRoute = () => {
//   const [isDeveloper, setIsDeveloper] = useState<boolean | null>(null);
//   const location = useLocation();

//   useEffect(() => {
//     // Check if the developer is authenticated
//     const checkDeveloperAuth = () => {
//       const devToken = localStorage.getItem("dev_access_token");
//       setIsDeveloper(!!devToken);
//     };
    
//     checkDeveloperAuth();
//   }, []);

//   // Show loading while checking auth
//   if (isDeveloper === null) {
//     return <div>Loading...</div>;
//   }

//   // If developer is not authenticated and not trying to access dev login, redirect to dev login
//   if (!isDeveloper && location.pathname !== "/dev") {
//     return <Navigate to="/dev" replace />;
//   }

//   // If authenticated or trying to access the dev login page, allow access
//   return <Outlet />;
// };

// export default DeveloperProtectedRoute;