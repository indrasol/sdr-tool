import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Rocket, Star, Coffee, Heart, Zap, Users } from "lucide-react";

interface PlayfulItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  emoji: string;
}

const playfulItems: PlayfulItem[] = [
  {
    icon: <Rocket className="w-8 h-8" />,
    title: "Coming Soon!",
    description: "We're building something amazing",
    color: "from-purple-500 to-purple-600",
    emoji: "🚀"
  },
  {
    icon: <Star className="w-8 h-8" />,
    title: "Be the First",
    description: "Join our early adopters waitlist",
    color: "from-yellow-500 to-orange-500",
    emoji: "⭐"
  },
  {
    icon: <Coffee className="w-8 h-8" />,
    title: "Made with Love",
    description: "And lots of coffee ☕",
    color: "from-amber-500 to-amber-600",
    emoji: "❤️"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Lightning Fast",
    description: "Coming faster than you think!",
    color: "from-blue-500 to-cyan-500",
    emoji: "⚡"
  }
];

interface InteractiveCardProps {
  item: PlayfulItem;
  index: number;
  isInView: boolean;
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({ item, index, isInView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <motion.div
      className="text-center group cursor-pointer"
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.8 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.2 + (index * 0.15),
        ease: "easeOut"
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <motion.div
        className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 group-hover:border-purple-200/50 relative overflow-hidden"
        whileHover={{ 
          scale: 1.08,
          y: -10,
          rotate: [0, 1, -1, 0]
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        animate={clickCount > 0 ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        } : {}}
      >
        {/* Playful background patterns */}
        <div className="absolute inset-0">
          <motion.div
            className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-10 rounded-full blur-2xl`}
            animate={isHovered ? {
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.2, 0.1]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/10 to-purple-400/10 rounded-full blur-xl"
            animate={{
              x: [0, 20, 0],
              y: [0, -10, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <div className="relative z-10">
          {/* Animated emoji */}
          <motion.div 
            className="text-6xl mb-4"
            animate={isHovered ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: isHovered ? 0.6 : 3,
              repeat: isHovered ? 1 : Infinity,
              ease: "easeInOut"
            }}
          >
            {item.emoji}
          </motion.div>

          {/* Icon with gradient background */}
          <motion.div 
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 mx-auto relative overflow-hidden`}
            whileHover={{ scale: 1.15, rotate: 10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Sparkle effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={isHovered ? {
                x: ["-100%", "100%"],
              } : {}}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
              }}
            />
            {item.icon}
          </motion.div>

          <motion.h3 
            className="text-xl font-bold mb-3 text-gray-900 group-hover:text-purple-700 transition-colors duration-300"
            animate={clickCount > 0 ? {
              color: ["#374151", "#7c3aed", "#374151"]
            } : {}}
            transition={{ duration: 1 }}
          >
            {item.title}
          </motion.h3>
          
          <p className="text-gray-600 leading-relaxed">
            {item.description}
          </p>

          {/* Click counter */}
          {clickCount > 0 && (
            <motion.div
              className="mt-4 text-purple-600 font-semibold"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              Clicked {clickCount} time{clickCount > 1 ? 's' : ''}! 🎉
            </motion.div>
          )}
        </div>

        {/* Floating hearts on click */}
        {clickCount > 0 && (
          <motion.div
            className="absolute top-4 right-4 text-red-500"
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 1.5], y: -50 }}
            transition={{ duration: 2 }}
          >
            <Heart className="w-6 h-6 fill-current" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const Stats: React.FC = () => {
  const statsRef = useRef<HTMLElement>(null);
  const isInView = useInView(statsRef, { once: true, margin: "-100px" });

  return (
    <section ref={statsRef} className="py-24 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/50 relative overflow-hidden">
      {/* Playful background decorations */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-10 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-10 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating shapes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-20"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i * 10)}%`,
            }}
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="w-full px-12 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900"
            animate={isInView ? {
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            } : {}}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600">
              Something Awesome is Cooking! 
            </span>
            <motion.span
              className="inline-block ml-2"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              👨‍🍳
            </motion.span>
          </motion.h2>
                     <p className="text-xl text-gray-600">
            We're putting the finishing touches on our revolutionary platform. Get ready to experience security design like never before!
          </p>
        </motion.div>

        {/* Interactive Cards Grid */}
                 <motion.div 
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {playfulItems.map((item, index) => (
            <InteractiveCard 
              key={index}
              item={item}
              index={index}
              isInView={isInView}
            />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.p 
            className="text-gray-600 text-lg mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Want to be notified when we launch?{" "}
            <motion.span 
              className="text-purple-600 font-semibold cursor-pointer hover:text-purple-700 transition-colors relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Join our VIP waitlist! 
              <motion.span
                className="absolute -top-2 -right-6 text-yellow-500"
                animate={{
                  rotate: [0, 20, -20, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ⭐
              </motion.span>
            </motion.span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}; 