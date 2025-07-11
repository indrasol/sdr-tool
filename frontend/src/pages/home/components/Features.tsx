import React, { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { Shield, Zap, Users, ArrowRight, Brain, Code, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: FeatureItem[] = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "AI-Powered Design",
    description: "Generate secure architecture diagrams with natural language prompts. Our AI understands security patterns and best practices.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Security First",
    description: "Built-in threat modeling and vulnerability detection. Identify security risks before they become problems.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Lightning Fast",
    description: "Create complex system diagrams in minutes, not hours. Focus on innovation while we handle the heavy lifting.",
    color: "from-cyan-500 to-cyan-600"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Team Collaboration",
    description: "Real-time collaboration features for distributed teams. Share, review, and iterate on designs together.",
    color: "from-green-500 to-green-600"
  },
  {
    icon: <Code className="w-8 h-8" />,
    title: "Code Generation",
    description: "Export your designs as infrastructure code, documentation, or implementation templates.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Enterprise Ready",
    description: "SOC 2 compliant with enterprise-grade security, SSO integration, and audit logging.",
    color: "from-red-500 to-red-600"
  }
];

export const Features: React.FC = () => {
  const featuresRef = useRef<HTMLElement>(null);
  const isInView = useInView(featuresRef, { once: true, margin: "-100px" });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.95 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const cardHoverVariants: Variants = {
    rest: { 
      scale: 1,
      y: 0,
    },
    hover: { 
      scale: 1.02,
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <section ref={featuresRef} className="py-24 bg-gray-50/50">
      <div className="w-full px-12">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h2 
              className="text-4xl lg:text-5xl font-bold mb-6"
              animate={isInView ? {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              } : {}}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-600 to-blue-600">
                Why Choose Our Platform?
              </span>
            </motion.h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to accelerate your development workflow while maintaining the highest security standards.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group"
              >
                <motion.div
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="h-full"
                >
                  <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group-hover:border-purple-200/50 overflow-hidden relative">
                    {/* Gradient background overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <CardContent className="p-8 relative z-10">
                      {/* Icon with animated background */}
                      <motion.div 
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 relative overflow-hidden`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Animated shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: "easeInOut",
                          }}
                        />
                        {feature.icon}
                      </motion.div>

                      <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {feature.description}
                      </p>

                      {/* Animated arrow */}
                      <motion.div 
                        className="flex items-center text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="mr-2">Learn more</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <p className="text-gray-600 mb-4">
              Ready to transform your development workflow?
            </p>
            <motion.button
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Today
              <ArrowRight className="w-4 h-4 ml-2" />
            </motion.button>
          </motion.div>
      </div>
    </section>
  );
}; 