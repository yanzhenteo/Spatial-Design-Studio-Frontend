// src/components/AnimatedWaveBackground.tsx
import { motion } from 'framer-motion';

const AnimatedWaveBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-pink-to-purple">
      {/* Main Sine Wave - Large and prominent */}
      <div className="absolute bottom-0 left-0 w-full h-200">
        <motion.svg
          className="w-full h-full"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,100 C300,50 600,150 1200,100 L1200,200 L0,200 Z"
            fill="rgba(255,255,255,0.25)"
            animate={{
              d: [
                "M0,100 C300,50 600,150 1200,100 L1200,200 L0,200 Z",
                "M0,100 C300,150 600,50 1200,100 L1200,200 L0,200 Z",
                "M0,100 C300,50 600,150 1200,100 L1200,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.svg>
      </div>

      {/* Secondary Wave - Medium, faster */}
      <div className="absolute bottom-0 left-0 w-full h-200">
        <motion.svg
          className="w-full h-full"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,120 C400,80 800,160 1200,120 L1200,200 L0,200 Z"
            fill="rgba(255,255,255,0.2)"
            animate={{
              d: [
                "M0,120 C400,80 800,160 1200,120 L1200,200 L0,200 Z",
                "M0,120 C400,160 800,80 1200,120 L1200,200 L0,200 Z",
                "M0,120 C400,80 800,160 1200,120 L1200,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }}
          />
        </motion.svg>
      </div>

      {/* Third Wave - Small, fastest */}
      <div className="absolute bottom-0 left-0 w-full h-280">
        <motion.svg
          className="w-full h-full"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,140 C200,110 400,170 600,140 C800,110 1000,170 1200,140 L1200,200 L0,200 Z"
            fill="rgba(255,255,255,0.15)"
            animate={{
              d: [
                "M0,140 C200,110 400,170 600,140 C800,110 1000,170 1200,140 L1200,200 L0,200 Z",
                "M0,140 C200,170 400,110 600,140 C800,170 1000,110 1200,140 L1200,200 L0,200 Z",
                "M0,140 C200,110 400,170 600,140 C800,110 1000,170 1200,140 L1200,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2,
            }}
          />
        </motion.svg>
      </div>
      
      {/* Large Bubble 1 */}
      <motion.div
        className="absolute top-1/2 left-1/5 w-10 h-10 bg-white/40 rounded-full shadow-lg"
        animate={{
          y: [0, -120, 0],
          x: [0, 30, -20, 0],
          scale: [1, 1.4, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Large Bubble 2 */}
      <motion.div
        className="absolute top-2/5 right-1/4 w-8 h-8 bg-white/35 rounded-full shadow-md"
        animate={{
          y: [0, -100, 0],
          x: [0, -25, 15, 0],
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      {/* Medium Bubble 1 */}
      <motion.div
        className="absolute top-1/3 left-2/4 w-7 h-7 bg-white/45 rounded-full shadow-md"
        animate={{
          y: [0, -80, 0],
          x: [0, 20, -10, 0],
          scale: [1, 1.2, 1],
          opacity: [0.7, 0.95, 0.7],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      
      {/* Medium Bubble 2 */}
      <motion.div
        className="absolute top-1/4 right-1/5 w-6 h-6 bg-white/50 rounded-full shadow"
        animate={{
          y: [0, -90, 0],
          x: [0, -18, 12, 0],
          scale: [1, 1.25, 1],
          opacity: [0.6, 0.85, 0.6],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.8,
        }}
      />
      
      {/* Small Bubble 1 */}
      <motion.div
        className="absolute top-1/5 left-1/3 w-4 h-4 bg-white/60 rounded-full"
        animate={{
          y: [0, -60, 0],
          x: [0, 15, 0],
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
      
      {/* Small Bubble 2 */}
      <motion.div
        className="absolute top-1/2 right-2/5 w-3 h-3 bg-white/55 rounded-full"
        animate={{
          y: [0, -50, 0],
          x: [0, -12, 0],
          scale: [1, 1.15, 1],
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.2,
        }}
      />
      
      {/* Small Bubble 3 */}
      <motion.div
        className="absolute top-4/6 left-1/3 w-5 h-5 bg-white/40 rounded-full shadow-sm"
        animate={{
          y: [0, -70, 0],
          x: [0, 10, -5, 0],
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.3,
        }}
      />

      {/* Extra Small Bubbles for density */}
      <motion.div
        className="absolute top-2/4 left-3/4 w-2 h-2 bg-white/70 rounded-full"
        animate={{
          y: [0, -40, 0],
          x: [0, 8, 0],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.7,
        }}
      />
      
      <motion.div
        className="absolute top-2/4 left-1/6 w-2 h-2 bg-white/65 rounded-full"
        animate={{
          y: [0, -35, 0],
          x: [0, -6, 0],
          opacity: [0.8, 0.95, 0.8],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5,
        }}
      />
    </div>
  );
};

export default AnimatedWaveBackground;