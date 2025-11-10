// src/components/SideNavigation.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  onNavigate: (page: string) => void;
}

function SideNavigation({ isOpen, onClose, currentPage = 'home', onNavigate }: SideNavigationProps) {
  const menuItems = [
    { id: 1, label: 'Profile', icon: '👤', page: 'profile' },
    { id: 2, label: 'Memory Bot', icon: '💬', page: 'chat' },
    { id: 3, label: 'Fix My Home', icon: '🏠', page: 'home' },
    { id: 4, label: 'My History', icon: '📚', page: 'history' }
  ];

  const handleMenuItemClick = (page: string) => {
    console.log('Menu item clicked:', page);
    onNavigate(page);
    onClose();
  };

  const isActive = (page: string) => currentPage === page;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          
          {/* Side Navigation Panel */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50"
          >
            {/* Header and Menu Items positioned from top */}
            <div className="pt-30"> {/* Adjust this value to change distance from top */}
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-header text-dark-grey">Menu</h2>
              </div>
              
              {/* Menu Items */}
              <nav className="p-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.page)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center gap-3 mb-2 ${
                      isActive(item.page)
                        ? 'bg-light-purple shadow-inner'
                        : 'hover:bg-pink text-dark-grey'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-big-text">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SideNavigation;