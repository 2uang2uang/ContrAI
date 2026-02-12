import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { Hexagon, ArrowRight, Shield, Database, FileText, Github, Twitter, Zap, Layers, Globe, Moon, Sun, Wallet } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// -----------------------------------------------------------------------------
// Rotating Globe Canvas Component
// -----------------------------------------------------------------------------
const RotatingGlobe = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Updated colors based on new Design System
    // Light Mode: Grey-300 (#D6D3D1) for inactive
    // Dark Mode: Grey-600 (#57534E) for inactive
    const dotColor = isDarkMode ? '#57534E' : '#D6D3D1'; 
    const activeDotColor = '#FF2867'; // Brand Pink

    // Modernize: Make it larger and position at bottom to create a "Horizon" effect
    const GLOBE_RADIUS = width > 800 ? 550 : 300; 
    const DOT_RADIUS = 2;
    const DOT_COUNT = 1000;
    let rotation = 0;

    const points: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < DOT_COUNT; i++) {
      const y = 1 - (i / (DOT_COUNT - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      points.push({ x: x * GLOBE_RADIUS, y: y * GLOBE_RADIUS, z: z * GLOBE_RADIUS });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Position center at the bottom of the canvas
      const cx = width / 2;
      const cy = height + (width > 800 ? 100 : 50); // Push slightly below viewport

      rotation += 0.0015;

      points.forEach((point) => {
        const x = point.x * Math.cos(rotation) - point.z * Math.sin(rotation);
        const z = point.z * Math.cos(rotation) + point.x * Math.sin(rotation);
        const y = point.y; 

        // Project 3D to 2D
        const scale = 800 / (800 - z); 
        const x2d = x * scale + cx;
        const y2d = y * scale + cy;

        // Size and Opacity based on Z
        const size = scale * DOT_RADIUS;
        const alpha = (z + GLOBE_RADIUS) / (2 * GLOBE_RADIUS); 

        if (alpha > 0) {
            ctx.beginPath();
            ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
            
            // Modern Glow Effect
            if (Math.random() > 0.95) {
                ctx.fillStyle = activeDotColor;
                ctx.shadowBlur = 15;
                ctx.shadowColor = activeDotColor;
            } else {
                ctx.fillStyle = dotColor;
                ctx.shadowBlur = 0;
            }
            
            ctx.globalAlpha = Math.max(0.1, alpha); 
            ctx.fill();
            ctx.shadowBlur = 0; // Reset
        }
      });
      
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        if (canvas) {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDarkMode]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Gradient Overlay to fade the top of the globe into the background */}
        <div className="absolute inset-0 bg-gradient-to-b from-grey-50 via-transparent to-transparent dark:from-grey-950 dark:via-transparent dark:to-transparent z-10 h-2/3" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Sub Components
// -----------------------------------------------------------------------------

const LandingNavbar = ({ onLaunch, isDarkMode, toggleTheme }: { onLaunch: () => void, isDarkMode: boolean, toggleTheme: () => void }) => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.8, ease: "circOut" }}
    className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-grey-200 dark:border-grey-800 bg-grey-50/80 dark:bg-grey-950/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-12 transition-colors duration-300"
  >
    <div className="flex items-center gap-3">
      <div className="relative group cursor-pointer">
        <Hexagon className="w-9 h-9 text-brand-pink fill-brand-pink/10 group-hover:fill-brand-pink/30 transition-all duration-500" strokeWidth={1.5} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-grey-900 dark:text-white font-mono">DR</span>
        </div>
      </div>
      <span className="font-serif text-2xl tracking-tight text-grey-900 dark:text-white">
        Dot<span className="text-brand-pink">Repute</span>
      </span>
    </div>
    
    <div className="flex items-center gap-6 md:gap-8">
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-grey-500 dark:text-grey-400">
        <a href="#" className="hover:text-brand-pink transition-colors">Docs</a>
        <a href="#" className="hover:text-brand-pink transition-colors">Governance</a>
        <a href="#" className="hover:text-brand-pink transition-colors">Leaderboard</a>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-grey-200 dark:hover:bg-grey-800 text-grey-600 dark:text-white transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLaunch}
          className="hidden md:flex items-center gap-2 bg-grey-900 dark:bg-white text-white dark:text-grey-900 hover:bg-grey-700 dark:hover:bg-grey-200 transition-colors px-5 py-2.5 rounded-lg text-sm font-bold tracking-tight shadow-md"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </motion.button>
      </div>
    </div>
  </motion.nav>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -5 }}
    className="group relative p-8 rounded-3xl bg-white dark:bg-grey-900/40 border border-grey-200 dark:border-grey-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/0 to-orange-500/0 group-hover:from-brand-pink/5 group-hover:to-orange-500/5 transition-all duration-500" />
    <div className="absolute inset-0 border border-transparent group-hover:border-brand-pink/20 rounded-3xl transition-colors duration-500" />
    
    <div className="relative z-10">
      <div className="w-12 h-12 bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-brand-pink/50 transition-all duration-500 shadow-sm">
        <Icon className="w-6 h-6 text-grey-900 dark:text-white group-hover:text-brand-pink transition-colors" />
      </div>
      <h3 className="text-2xl font-serif mb-3 text-grey-900 dark:text-white">{title}</h3>
      <p className="text-grey-500 dark:text-grey-400 text-base leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const StatItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col items-center justify-center p-6 border-r border-grey-200 dark:border-grey-800 last:border-r-0">
    <motion.span 
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-4xl font-serif text-grey-900 dark:text-white mb-1"
    >
      {value}
    </motion.span>
    <span className="text-[10px] text-brand-pink font-bold uppercase tracking-widest">{label}</span>
  </div>
);

// Animation Variants
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
};

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, isDarkMode, toggleTheme }) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-grey-950 text-grey-900 dark:text-white selection:bg-brand-pink/30 font-sans overflow-x-hidden transition-colors duration-300">
      <LandingNavbar onLaunch={onLaunch} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      {/* HERO SECTION */}
      <section className="relative h-screen min-h-[700px] flex flex-col items-center justify-center overflow-hidden pt-20">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-[0.4] dark:opacity-[0.15] transition-opacity duration-300" />
        
        {/* Rotating Globe Background (Positioned at bottom via Canvas logic) */}
        <RotatingGlobe isDarkMode={isDarkMode} />
        
        {/* Ambient Gradient for Depth */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-grey-50 to-transparent dark:from-grey-950 dark:to-transparent z-0 pointer-events-none" />

        <div className="relative z-10 container mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl flex flex-col items-center" 
          >
            <motion.div 
              variants={item} 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-grey-200 dark:border-grey-800 bg-white/50 dark:bg-white/5 backdrop-blur-sm text-xs font-medium mb-8 hover:border-brand-pink/50 transition-colors cursor-default"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-pink opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-pink"></span>
              </span>
              <span className="text-grey-600 dark:text-grey-300 uppercase tracking-wider">Polkadot / Ver-2.0</span>
            </motion.div>
            
            <motion.h1 variants={item} className="font-serif text-6xl md:text-8xl tracking-tight mb-8 leading-[1.0] text-grey-900 dark:text-white">
              Build transparent <br />
              <span className="italic text-grey-500 dark:text-grey-400">reputation systems,</span> <br />
              <span className="text-brand-pink">your way.</span>
            </motion.h1>
            
            <motion.p variants={item} className="text-xl text-grey-600 dark:text-grey-400 max-w-2xl mb-12 leading-relaxed font-light">
              DotRepute is a <span className="font-medium text-grey-900 dark:text-white">Rust-powered Contributor Reputation System</span> for the Polkadot ecosystem. Aggregating identity, governance, staking, and activity signals.
            </motion.p>
            
            <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto justify-center">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLaunch}
                className="w-full sm:w-auto px-8 py-4 bg-grey-900 dark:bg-white text-white dark:text-grey-900 font-bold tracking-wide text-sm rounded-lg uppercase transition-all shadow-lg hover:shadow-xl"
              >
                Getting Started
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLaunch}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-grey-300 dark:border-grey-700 hover:border-grey-900 dark:hover:border-white text-grey-900 dark:text-white font-bold tracking-wide text-sm rounded-lg uppercase transition-colors backdrop-blur-sm"
              >
                Open Demo
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS TICKER */}
      <div className="border-y border-grey-200 dark:border-grey-800 bg-white/50 dark:bg-black/80 backdrop-blur-md relative overflow-hidden transition-colors duration-300 z-20">
        <div className="absolute inset-0 bg-brand-pink/5 blur-3xl opacity-50" />
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-grey-200 dark:divide-grey-800 relative z-10">
            <StatItem label="Active Identities" value="12.4K" />
            <StatItem label="Governance Votes" value="850K" />
            <StatItem label="DOT Staked" value="2.2M" />
            <StatItem label="Trust Score" value="99.9%" />
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 lg:px-12">
           <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-serif text-5xl md:text-6xl mb-4 text-grey-900 dark:text-white">The Reputation <br/><span className="text-brand-pink italic">Machine</span></h2>
                <p className="text-grey-500 dark:text-grey-400 max-w-md text-lg">Our proprietary algorithm analyzes on-chain pallets to build a comprehensive identity profile.</p>
              </motion.div>
              <div className="h-px bg-grey-200 dark:bg-grey-800 flex-1 hidden md:block mb-8" />
           </div>

           <div className="grid md:grid-cols-3 gap-8">
             {[
               { icon: Globe, title: 'Connect', desc: 'Securely link your Polkadot wallet. No registration required, just pure Web3 authentication.' },
               { icon: Zap, title: 'Analyze', desc: 'Our AI engine scans Identity, Staking, and Governance pallets to reconstruct your activity history.' },
               { icon: Layers, title: 'Rank', desc: 'Receive your real-time score, mint your reputation badge, and climb the ecosystem leaderboard.' }
             ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative p-1 rounded-2xl"
                >
                  <div className="bg-white dark:bg-grey-900 h-full rounded-xl p-8 border border-grey-200 dark:border-grey-800 relative overflow-hidden group shadow-sm dark:shadow-none hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-6xl text-grey-900 dark:text-white group-hover:text-brand-pink transition-colors">0{i+1}</div>
                    <div className="w-12 h-12 rounded-full bg-grey-50 dark:bg-grey-800 flex items-center justify-center mb-6 border border-grey-200 dark:border-grey-700 group-hover:border-brand-pink transition-colors">
                      <item.icon className="w-5 h-5 text-grey-900 dark:text-white" />
                    </div>
                    <h3 className="text-2xl font-serif mb-4 text-grey-900 dark:text-white">{item.title}</h3>
                    <p className="text-grey-500 dark:text-grey-400 text-base leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
             ))}
           </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="py-32 bg-grey-100 dark:bg-grey-900/30 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand-pink to-transparent opacity-50" />
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-6xl mb-6 text-grey-900 dark:text-white"
            >
              Intelligence for <span className="text-brand-pink italic">DAOs</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Database}
              title="AI-Powered Insights" 
              desc="Gemini 3 Flash integration provides natural language summaries of complex on-chain behaviors."
              delay={0}
            />
            <FeatureCard 
              icon={Shield}
              title="Direct RPC Integration" 
              desc="No intermediaries or indexers. We query the Polkadot relay chain directly for maximum trustlessness."
              delay={0.2}
            />
            <FeatureCard 
              icon={FileText}
              title="Exportable Reports" 
              desc="Generate PDF or Docx certificates of your reputation score for DAO applications or grant proposals."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-grey-200 dark:border-grey-800 bg-grey-50 dark:bg-grey-950 relative transition-colors duration-300">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-grey-400 dark:text-grey-600" />
            <span className="text-grey-500 dark:text-grey-500 font-sans text-sm">© 2024 DotRepute Network</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-grey-400 dark:text-grey-500 hover:text-grey-900 dark:hover:text-white transition-colors transform hover:scale-110"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-grey-400 dark:text-grey-500 hover:text-grey-900 dark:hover:text-white transition-colors transform hover:scale-110"><Twitter className="w-5 h-5" /></a>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-grey-200 dark:bg-grey-900 border border-grey-300 dark:border-grey-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-grey-600 dark:text-grey-400 font-medium uppercase">All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};