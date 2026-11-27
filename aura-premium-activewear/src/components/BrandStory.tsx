import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Sparkles, RefreshCw, Layers, Award } from 'lucide-react';

export default function BrandStory() {
  const values = [
    {
      icon: <Layers className="w-6 h-6 text-red-500" />,
      title: 'AURA-WEAVE™ TECHNOLOGY',
      description: 'Our proprietary nylon-elastane formulation provides an absolute second-skin feel with standard-shattering durability.',
    },
    {
      icon: <Zap className="w-6 h-6 text-red-500" />,
      title: 'THERMO-REGULATION',
      description: 'Zonal knit mapping and laser-perforated ventilation panels disperse body heat immediately under heavy athletic training.',
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-red-500" />,
      title: 'SHAPE PRESERVATION',
      description: '4-way elastic memory ensures complete structural retention and squat-proof shape defense after infinite wash cycles.',
    },
    {
      icon: <Shield className="w-6 h-6 text-red-500" />,
      title: 'SILVER-ION HYGIENE',
      description: 'Silver-ion threads woven into the fabric act as a permanent barrier against odor-causing particles.',
    },
  ];

  return (
    <section id="brand-architect" className="py-16 sm:py-20 md:py-24 bg-[#050505] text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-red-500 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase block mb-2 sm:mb-3 font-mono">
            FABRIC ENGINEERING DIVISION
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-wider uppercase leading-tight font-display">
            ENGINEERED WITHOUT COMPROMISE
          </h2>
          <p className="mt-3 sm:mt-4 text-[11px] sm:text-sm text-zinc-400 tracking-wide leading-relaxed">
            Every garment from DARVK is a product of rigorous kinetic research. We map the physical forces of training to design gear that enhances your athletic envelope.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          {values.map((val, idx) => (
            <motion.div
              key={val.title}
              id={`value-card-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="bg-[#0c0c0c] border border-white/5 p-6 rounded-sm hover:border-white/20 hover:shadow-xl hover:shadow-red-600/5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="bg-[#050505] p-2 sm:p-3 rounded-sm w-fit border border-white/5 mb-4 sm:mb-6">
                  {val.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-black tracking-widest uppercase mb-2 sm:mb-3">
                  {val.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed tracking-wider">
                  {val.description}
                </p>
              </div>
              <div className="mt-6 flex items-center space-x-1.5 text-[10px] text-red-500 font-mono tracking-widest uppercase">
                <span>VERIFIED STANDARD</span>
                <span></span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Premium Banner layout */}
        <div className="relative overflow-hidden bg-[#0c0c0c] border border-white/5 rounded-sm p-4 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.08),transparent_45%)]" />

          <div className="max-w-2xl relative z-1">
            <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] text-red-500 font-bold tracking-widest uppercase mb-2 sm:mb-3 font-mono">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>COMMITTED TO EXCELLENCE</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider font-display italic">
              JOIN THE LEAGUE OF OUTWORKERS
            </h3>
            <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs lg:text-sm text-zinc-300 leading-relaxed tracking-wide">
              We design, test, and ship our equipment under strict supervision of elite athletic coaches and competitive builders. No short-cuts. Just pure, uncompromised performance utility.
            </p>
          </div>

          <div className="flex-shrink-0 relative z-1 flex gap-4">
            <div className="text-center px-4 py-2 bg-[#050505] border border-white/5 rounded-sm w-24">
              <span className="block text-xl font-black text-white font-mono">100%</span>
              <span className="text-[8px] text-zinc-400 tracking-widest uppercase block mt-1">SQUAT SAFE</span>
            </div>
            <div className="text-center px-4 py-2 bg-[#050505] border border-white/5 rounded-sm w-24">
              <span className="block text-xl font-black text-white font-mono">460G</span>
              <span className="text-[8px] text-zinc-400 tracking-widest uppercase block mt-1">ORGANIC FT</span>
            </div>
            <div className="text-center px-4 py-2 bg-[#050505] border border-white/5 rounded-sm w-24">
              <span className="block text-xl font-black text-white font-mono">30D</span>
              <span className="text-[8px] text-zinc-400 tracking-widest uppercase block mt-1">FIT DEFENSE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
