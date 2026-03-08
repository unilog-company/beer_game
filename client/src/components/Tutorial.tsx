import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory, Truck, Warehouse, Store, Package, TrendingUp,
  DollarSign, Eye, ChevronLeft, ArrowRight, X,
} from './Icons';

interface TutorialProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: 'The Supply Chain',
    subtitle: 'You manage one node in a 4-stage supply chain',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {[
            { Icon: Factory, label: 'Manufacturer', color: '#00c9b1' },
            { Icon: Truck, label: 'Distributor', color: '#3dd9c4' },
            { Icon: Warehouse, label: 'Warehouse', color: '#6ae08c' },
            { Icon: Store, label: 'Retailer', color: '#7ed321' },
          ].map((node, i) => (
            <div key={node.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${node.color}15`, border: `1px solid ${node.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: node.color,
                }}>
                  <node.Icon size={22} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.5, textTransform: 'uppercase' }}>
                  {node.label}
                </span>
              </div>
              {i < 3 && <ArrowRight size={16} style={{ opacity: 0.2, marginTop: -16 }} />}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.6, textAlign: 'center' }}>
          Goods flow from Manufacturer → Retailer.
          Orders flow the other way. Each stage decides how much to order
          from its supplier <strong style={{ opacity: 0.9 }}>without seeing the full picture</strong>.
        </p>
      </div>
    ),
  },
  {
    title: 'Your Goal',
    subtitle: 'Minimize total cost by balancing stock',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <div style={{
            flex: 1, maxWidth: 200, padding: 20, borderRadius: 16,
            background: 'rgba(0,201,177,0.05)', border: '1px solid rgba(0,201,177,0.15)',
            textAlign: 'center',
          }}>
            <Package size={24} style={{ color: '#00c9b1', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Holding Cost</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#00c9b1' }}>$0.50</div>
            <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>per unit / week</div>
          </div>
          <div style={{
            flex: 1, maxWidth: 200, padding: 20, borderRadius: 16,
            background: 'rgba(255,77,106,0.05)', border: '1px solid rgba(255,77,106,0.15)',
            textAlign: 'center',
          }}>
            <DollarSign size={24} style={{ color: '#ff4d6a', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Backlog Cost</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#ff4d6a' }}>$1.00</div>
            <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>per unit / week</div>
          </div>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.6, textAlign: 'center' }}>
          Too much stock? You pay holding costs.
          Too little? Unfilled orders become <strong style={{ opacity: 0.9 }}>backlog</strong> at
          double the cost. Find the sweet spot.
        </p>
      </div>
    ),
  },
  {
    title: 'The Bullwhip Effect',
    subtitle: 'Small demand changes cause wild upstream swings',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
          {[
            { label: 'Consumer', height: 40, color: '#7ed321' },
            { label: 'Retailer', height: 55, color: '#6ae08c' },
            { label: 'Warehouse', height: 80, color: '#3dd9c4' },
            { label: 'Distributor', height: 110, color: '#00c9b1' },
            { label: 'Manufacturer', height: 150, color: '#ffb84d' },
          ].map((bar) => (
            <div key={bar.label} style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: bar.height }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                style={{
                  width: 44, borderRadius: '8px 8px 0 0',
                  background: `linear-gradient(to top, ${bar.color}40, ${bar.color})`,
                  marginBottom: 8,
                }}
              />
              <span style={{ fontSize: 9, fontFamily: 'monospace', opacity: 0.4, textTransform: 'uppercase' }}>
                {bar.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 10,
          background: 'rgba(255,184,77,0.08)', border: '1px solid rgba(255,184,77,0.15)',
        }}>
          <TrendingUp size={16} style={{ color: '#ffb84d' }} />
          <span style={{ fontSize: 13, color: '#ffb84d', fontWeight: 500 }}>
            Order variance amplifies at each stage upstream
          </span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.6, textAlign: 'center' }}>
          This is the <strong style={{ opacity: 0.9 }}>Bullwhip Effect</strong>.
          Each player overreacts to small changes, causing chaos upstream.
          Your mission: keep orders steady.
        </p>
      </div>
    ),
  },
  {
    title: 'Each Week',
    subtitle: 'The turn sequence — what happens behind the scenes',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { num: '1', text: 'Receive shipments that were in transit' },
          { num: '2', text: 'Receive incoming orders from your customer' },
          { num: '3', text: 'Fulfill what you can (rest becomes backlog)' },
          { num: '4', text: 'Decide how much to order from your supplier' },
          { num: '5', text: 'Pay holding + backlog costs' },
        ].map((step) => (
          <div key={step.num} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
            borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(0,201,177,0.1)', border: '1px solid rgba(0,201,177,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, fontFamily: 'monospace', color: '#00c9b1',
            }}>
              {step.num}
            </div>
            <span style={{ fontSize: 14, opacity: 0.7 }}>{step.text}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: '4PL Control Tower',
    subtitle: 'Unilog mode unlocks full visibility',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center',
        }}>
          <div style={{
            flex: 1, maxWidth: 180, padding: 20, borderRadius: 16,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.5, marginBottom: 12 }}>Standard Mode</div>
            <div style={{ fontSize: 12, opacity: 0.4, lineHeight: 1.7 }}>
              You only see <strong style={{ opacity: 0.7 }}>your own</strong> inventory and incoming orders.
              No idea what's happening upstream or downstream.
            </div>
          </div>
          <div style={{
            flex: 1, maxWidth: 180, padding: 20, borderRadius: 16,
            background: 'rgba(0,201,177,0.05)', border: '1px solid rgba(0,201,177,0.2)',
            textAlign: 'center',
          }}>
            <Eye size={20} style={{ color: '#00c9b1', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#00c9b1', marginBottom: 12 }}>4PL Mode</div>
            <div style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.7 }}>
              <strong style={{ opacity: 0.8 }}>Everyone</strong> sees the full chain — inventory,
              orders, and real consumer demand.
            </div>
          </div>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.6, textAlign: 'center' }}>
          Play both modes to see how <strong style={{ opacity: 0.9 }}>information sharing</strong> dramatically
          reduces the bullwhip effect. That's the power of a 4PL.
        </p>
      </div>
    ),
  },
];

export function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(5,12,24,0.85)', backdropFilter: 'blur(8px)', padding: 12 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-strong rounded-2xl w-full max-w-lg relative"
        style={{ padding: '28px 20px 24px' }}
      >
        <button
          onClick={onClose}
          className="absolute text-white/30 hover:text-white/60 transition-colors"
          style={{ top: 16, right: 16 }}
        >
          <X size={20} />
        </button>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                background: i === step ? '#00c9b1' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                border: 'none', cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{current.title}</h2>
              <p style={{ fontSize: 14, opacity: 0.45, fontFamily: 'monospace' }}>{current.subtitle}</p>
            </div>

            <div style={{ minHeight: 180 }}>
              {current.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="text-white/40 hover:text-white/70 transition-colors disabled:opacity-20"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
          >
            <ChevronLeft size={18} /> Back
          </button>

          <span style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.3 }}>
            {step + 1} / {STEPS.length}
          </span>

          <button
            onClick={isLast ? onClose : () => setStep(step + 1)}
            className="transition-all"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: isLast ? 'linear-gradient(to right, #00c9b1, #7ed321)' : 'rgba(255,255,255,0.05)',
              color: isLast ? '#0a1628' : 'rgba(255,255,255,0.7)',
              border: isLast ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {isLast ? 'Start Playing' : 'Next'}
            {!isLast && <ArrowRight size={16} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
