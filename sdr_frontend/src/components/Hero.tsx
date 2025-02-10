import { motion } from "framer-motion";
import { ArrowRight, Shield, FileSearch, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-background -z-10" />
      
      {/* Background Security Pattern */}
      <div className="absolute inset-0 opacity-5 -z-10">
        <div className="absolute top-20 left-20 animate-float">
          <Shield size={100} />
        </div>
        <div className="absolute bottom-40 right-20 animate-float-delayed">
          <FileSearch size={80} />
        </div>
        <div className="absolute top-40 right-40 animate-float">
          <Lock size={60} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full mb-6">
            ThreatGuard: Design Analyzer
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent"
        >
          Streamline Your Security Design Process
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-secondary-dark max-w-2xl mx-auto mb-10"
        >
          Upload your design documents and get instant feedback on security considerations. Our tool helps you identify potential vulnerabilities early in the development cycle, ensuring robust security architecture from the start.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4 md:space-y-0 md:space-x-4"
        >
          <button
            onClick={() => navigate("/upload")}
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Get Started
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;