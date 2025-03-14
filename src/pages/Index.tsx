
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-background to-accent/30">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIuNSIgY3g9IjEwIiBjeT0iMTAiIHI9IjEiLz48L2c+PC9zdmc+')] opacity-40"></div>
      
      <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.95 }}
            transition={{ duration: 0.5 }}
            className="section-title mb-2"
          >
            Minimalist Design
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Simplicity is the ultimate sophistication
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Less, but better - because it concentrates on the essential aspects, and the products are not burdened with non-essentials.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.button 
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.button>
            
            <motion.button 
              className="px-4 py-2 rounded-md text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-24 max-w-5xl mx-auto glass-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 40 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                className="flex flex-col items-center text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-foreground">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Simple</h3>
                <p className="text-muted-foreground text-sm">Good design is as little design as possible.</p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-foreground">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Useful</h3>
                <p className="text-muted-foreground text-sm">Products fulfill a purpose, they solve problems.</p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-foreground">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Aesthetic</h3>
                <p className="text-muted-foreground text-sm">The aesthetic quality of a product is integral to its usefulness.</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
