import { motion } from "framer-motion";
import { DataTable } from "@/components/ui/code.demo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RiskAnalyzer = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-accent/50 to-background px-4 py-16"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
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
            onClick={() => navigate("/upload")}
          >
            <ArrowLeft className="h-6 w-6 text-secondary-dark hover:text-primary transition-colors" />
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent text-center">
          Risk Analyzer
        </h1>
        <div className="flex justify-center mt-8">
          <DataTable />
        </div>
      </div>
    </motion.div>
  );
};

export default RiskAnalyzer;