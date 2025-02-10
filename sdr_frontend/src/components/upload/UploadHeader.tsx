import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";

const UploadHeader = () => {
  const navigate = useNavigate();
  const [assessmentName, setAssessmentName] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16 relative"
    >
      <div className="flex items-center gap-2 absolute left-0 top-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <Home className="h-6 w-6 text-secondary-dark hover:text-primary transition-colors" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-6 w-6 text-secondary-dark hover:text-primary transition-colors" />
        </Button>
      </div>
      
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
        Launch Assessment
      </h2>
      
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-left mb-2 text-secondary-dark">
          Assessment Name
        </h3>
        <Input
          type="text"
          placeholder="Enter Assessment Name"
          value={assessmentName}
          onChange={(e) => setAssessmentName(e.target.value)}
          className="mb-6"
        />
      </div>
    </motion.div>
  );
};

export default UploadHeader;