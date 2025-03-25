
import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatTabsProps {
  activeTab: 'guardian' | 'history';
  onTabChange: (tab: 'guardian' | 'history') => void;
}

const tabVariants = {
  active: {
    boxShadow: "0 2px 10px rgba(124, 101, 246, 0.15)",
    transition: { duration: 0.3 }
  },
  inactive: {
    boxShadow: "none",
    transition: { duration: 0.3 }
  }
};

const iconVariants = {
  active: {
    scale: [1, 1.2, 1],
    rotate: [0, 5, -5, 0],
    transition: { duration: 0.5, repeat: 0 }
  },
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 }
  }
};

const ChatTabs: React.FC<ChatTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b bg-white shadow-sm h-12">
      <div className="flex px-3 py-2 space-x-3 h-full">
        <motion.button 
          className={cn(
            "flex-1 py-2 px-2 text-center font-medium transition-all relative rounded-xl border truncate",
            activeTab === 'guardian' 
              ? "text-securetrack-purple border-securetrack-purple/30 bg-securetrack-purple/5" 
              : "text-gray-500 border-transparent hover:bg-gray-50"
          )}
          onClick={() => onTabChange('guardian')}
          animate={activeTab === 'guardian' ? 'active' : 'inactive'}
          variants={tabVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ backdropFilter: 'none' }}
        >
          <div className="flex items-center justify-center gap-1">
            <motion.div
              variants={iconVariants}
              animate={activeTab === 'guardian' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <Bot size={16} />
            </motion.div>
            <span className="text-sm whitespace-nowrap">Guardian AI</span>
          </div>
          {/* <AnimatePresence> */}
            {activeTab === 'guardian' && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-securetrack-purple rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          {/* </AnimatePresence> */}
        </motion.button>
        <motion.button 
          className={cn(
            "flex-1 py-2 px-2 text-center font-medium transition-all relative rounded-xl border truncate",
            activeTab === 'history' 
              ? "text-securetrack-purple border-securetrack-purple/30 bg-securetrack-purple/5" 
              : "text-gray-500 border-transparent hover:bg-gray-50"
          )}
          onClick={() => onTabChange('history')}
          animate={activeTab === 'history' ? 'active' : 'inactive'}
          variants={tabVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ backdropFilter: 'none' }}
        >
          <div className="flex items-center justify-center gap-1">
            <motion.div
              variants={iconVariants}
              animate={activeTab === 'history' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <History size={16} />
            </motion.div>
            <span className="text-sm whitespace-nowrap">History</span>
          </div>
          <AnimatePresence>
            {activeTab === 'history' && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-securetrack-purple rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default ChatTabs;