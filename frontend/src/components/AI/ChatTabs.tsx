
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
    backgroundColor: 'rgba(29, 78, 216, 0.1)',
    borderColor: 'rgba(29, 78, 216, 0.3)',
    transition: { duration: 0.3 }
  },
  inactive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    transition: { duration: 0.3 }
  }
};

const iconVariants = {
  active: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.4 }
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  }
};

const ChatTabs: React.FC<ChatTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 bg-white shadow-sm shrink-0 relative z-20">
      <div className="flex h-12 px-4 gap-2">
        {/* Guardian AI Tab */}
        <motion.button 
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-200 relative rounded-lg border min-w-0",
            activeTab === 'guardian' 
              ? "text-blue-700 border-blue-700/30 bg-blue-100/30" 
              : "text-gray-600 border-transparent hover:bg-blue-50 hover:text-blue-700"
          )}
          onClick={() => onTabChange('guardian')}
          animate={activeTab === 'guardian' ? 'active' : 'inactive'}
          variants={tabVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            variants={iconVariants}
            animate={activeTab === 'guardian' ? 'active' : 'inactive'}
            whileHover="hover"
            className="shrink-0"
          >
            <Bot size={16} className="shrink-0" />
          </motion.div>
          <span className="font-medium tracking-wide select-none">Guardian AI</span>
          
          {activeTab === 'guardian' && (
            <motion.div 
              className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-700 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>

        {/* History Tab */}
        <motion.button 
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-200 relative rounded-lg border min-w-0",
            activeTab === 'history' 
              ? "text-blue-700 border-blue-700/30 bg-blue-100/30" 
              : "text-gray-600 border-transparent hover:bg-blue-50 hover:text-blue-700"
          )}
          onClick={() => onTabChange('history')}
          animate={activeTab === 'history' ? 'active' : 'inactive'}
          variants={tabVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            variants={iconVariants}
            animate={activeTab === 'history' ? 'active' : 'inactive'}
            whileHover="hover"
            className="shrink-0"
          >
            <History size={16} className="shrink-0" />
          </motion.div>
          <span className="font-medium tracking-wide select-none">History</span>
          
          {activeTab === 'history' && (
            <motion.div 
              className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-700 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ChatTabs;