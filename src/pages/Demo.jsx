import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Lightbulb, 
  Blueprint, 
  ListChecks, 
  Code2, 
  Search, 
  Rocket,
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw
} from 'lucide-react';

const PIPELINE_STAGES = [
  {
    id: 'refinery',
    name: 'Refinery',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-500',
    description: 'Transforms your idea into a structured Product Requirements Document',
    duration: '2-3 min'
  },
  {
    id: 'foundry',
    name: 'Foundry',
    icon: Blueprint,
    color: 'from-blue-500 to-cyan-500',
    description: 'Designs technical architecture and system blueprints',
    duration: '3-4 min'
  },
  {
    id: 'planner',
    name: 'Planner',
    icon: ListChecks,
    color: 'from-purple-500 to-pink-500',
    description: 'Creates detailed work orders and implementation plan',
    duration: '1-2 min'
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: Code2,
    color: 'from-emerald-500 to-teal-500',
    description: 'Generates production-ready code for all features',
    duration: '5-8 min'
  },
  {
    id: 'inspector',
    name: 'Inspector',
    icon: Search,
    color: 'from-rose-500 to-red-500',
    description: 'Reviews code quality, tests functionality, catches bugs',
    duration: '2-3 min'
  },
  {
    id: 'deployer',
    name: 'Deployer',
    icon: Rocket,
    color: 'from-indigo-500 to-violet-500',
    description: 'Deploys to production and creates live URL',
    duration: '1-2 min'
  }
];

const DEMO_DATA = {
  project: {
    name: 'PetPal AI',
    tagline: 'AI-powered pet care companion',
    idea: 'An intelligent app that helps pet owners track health, find vets, and get personalized care recommendations using AI'
  },
  refinery: {
    prd: {
      overview: 'PetPal AI is a comprehensive pet care platform that uses artificial intelligence to provide personalized health tracking, veterinary recommendations, and care schedules for pets.',
      targetAudience: 'Pet owners aged 25-45, primarily millennials and Gen Z who view pets as family members',
      keyFeatures: [
        { name: 'Health Tracker', description: 'Log symptoms, medications, and vet visits with AI-powered insights' },
        { name: 'Smart Recommendations', description: 'Personalized diet, exercise, and care tips based on pet profile' },
        { name: 'Vet Finder', description: 'Location-based search for veterinarians with reviews and booking' },
        { name: 'Emergency Guide', description: 'AI chatbot for urgent pet health questions' }
      ]
    }
  },
  foundry: {
    architecture: {
      frontend: 'React + Vite + Tailwind CSS',
      backend: 'Node.js + Express + Supabase',
      ai: 'OpenAI GPT-4 for recommendations, Gemini for image analysis',
      deployment: 'Vercel (frontend) + Supabase (backend)'
    },
    components: [
      'PetProfileForm - Multi-step onboarding',
      'HealthDashboard - Charts and metrics',
      'AIChatWidget - Floating chat interface',
      'VetSearchMap - Interactive location search',
      'EmergencyModal - Quick action overlay'
    ]
  },
  planner: {
    workOrders: [
      { id: 1, task: 'Create database schema for pets, owners, and health logs', priority: 'high', estimate: '2h' },
      { id: 2, task: 'Build pet profile creation flow with image upload', priority: 'high', estimate: '4h' },
      { id: 3, task: 'Implement health tracking dashboard with charts', priority: 'high', estimate: '5h' },
      { id: 4, task: 'Integrate OpenAI for care recommendations', priority: 'medium', estimate: '3h' },
      { id: 5, task: 'Add vet finder with Google Maps integration', priority: 'medium', estimate: '4h' },
      { id: 6, task: 'Create emergency AI chatbot interface', priority: 'medium', estimate: '3h' }
    ]
  },
  builder: {
    files: [
      { path: 'src/components/PetProfileForm.jsx', lines: 245, type: 'component' },
      { path: 'src/components/HealthDashboard.jsx', lines: 189, type: 'component' },
      { path: 'src/components/AIChatWidget.jsx', lines: 156, type: 'component' },
      { path: 'src/components/VetSearchMap.jsx', lines: 203, type: 'component' },
      { path: 'src/hooks/usePetData.js', lines: 87, type: 'hook' },
      { path: 'src/lib/openai.js', lines: 64, type: 'lib' },
      { path: 'server/routes/pets.js', lines: 142, type: 'api' },
      { path: 'server/routes/health.js', lines: 98, type: 'api' },
      { path: 'supabase/migrations/001_pets.sql', lines: 56, type: 'migration' }
    ]
  },
  inspector: {
    checks: [
      { name: 'Syntax Validation', status: 'passed', details: 'All 9 files compile without errors' },
      { name: 'Import Resolution', status: 'passed', details: 'No broken imports detected' },
      { name: 'Security Scan', status: 'passed', details: 'No vulnerabilities in dependencies' },
      { name: 'Code Quality', status: 'passed', details: '90/100 score - excellent' },
      { name: 'AI Tests', status: 'passed', details: '6/6 test cases passed' }
    ]
  },
  deployer: {
    url: 'https://petpal-ai.vercel.app',
    status: 'live',
    deployTime: '47 seconds'
  }
};

export default function DemoPage() {
  const [currentStage, setCurrentStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setTimeout(() => {
      if (currentStage < PIPELINE_STAGES.length - 1) {
        setCurrentStage(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStage]);

  const handleReset = () => {
    setCurrentStage(0);
    setIsPlaying(false);
    setShowDetails(false);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setShowDetails(true);
  };

  const renderStageContent = () => {
    const stage = PIPELINE_STAGES[currentStage];
    
    switch (stage.id) {
      case 'refinery':
        return (
          <div className="space-y-4">
            <div className="bg-surface-tonal p-6 rounded-xl">
              <h4 className="text-lg font-semibold text-primary mb-2">Product Requirements Document</h4>
              <p className="text-on-surface-variant mb-4">{DEMO_DATA.refinery.prd.overview}</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_DATA.refinery.prd.keyFeatures.map((feature, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {feature.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'foundry':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-tonal p-4 rounded-xl">
                <h5 className="font-medium text-primary mb-2">Tech Stack</h5>
                <ul className="space-y-1 text-sm text-on-surface-variant">
                  <li>• {DEMO_DATA.foundry.architecture.frontend}</li>
                  <li>• {DEMO_DATA.foundry.architecture.backend}</li>
                  <li>• {DEMO_DATA.foundry.architecture.ai}</li>
                </ul>
              </div>
              <div className="bg-surface-tonal p-4 rounded-xl">
                <h5 className="font-medium text-primary mb-2">Key Components</h5>
                <ul className="space-y-1 text-sm text-on-surface-variant">
                  {DEMO_DATA.foundry.components.slice(0, 3).map((comp, i) => (
                    <li key={i}>• {comp.split(' - ')[0]}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      
      case 'planner':
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {DEMO_DATA.planner.workOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 bg-surface-tonal p-3 rounded-lg">
                <span className={`w-2 h-2 rounded-full ${order.priority === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <span className="flex-1 text-sm">{order.task}</span>
                <span className="text-xs text-on-surface-variant">{order.estimate}</span>
              </div>
            ))}
          </div>
        );
      
      case 'builder':
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {DEMO_DATA.builder.files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface-tonal p-3 rounded-lg font-mono text-sm">
                <span className="text-emerald-500">✓</span>
                <span className="flex-1 text-on-surface-variant">{file.path}</span>
                <span className="text-xs text-on-surface-variant/60">{file.lines} lines</span>
              </div>
            ))}
          </div>
        );
      
      case 'inspector':
        return (
          <div className="space-y-3">
            {DEMO_DATA.inspector.checks.map((check, i) => (
              <div key={i} className="flex items-start gap-3 bg-surface-tonal p-4 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-medium">{check.name}</h5>
                  <p className="text-sm text-on-surface-variant">{check.details}</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded text-xs font-medium">
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        );
      
      case 'deployer':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Rocket className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-emerald-600 mb-2">Successfully Deployed!</h4>
              <a 
                href={DEMO_DATA.deployer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-mono"
              >
                {DEMO_DATA.deployer.url}
              </a>
            </div>
            <div className="flex justify-center gap-6 text-sm text-on-surface-variant">
              <span>Status: <span className="text-emerald-500 font-medium">{DEMO_DATA.deployer.status}</span></span>
              <span>Deploy time: {DEMO_DATA.deployer.deployTime}</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Live Demo
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Watch Your Startup Build Itself
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-8"
          >
            See how dante.id transforms a simple idea into a production-ready app 
            through our AI-powered pipeline.
          </motion.p>

          {/* Project Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surface rounded-2xl p-8 shadow-lg max-w-xl mx-auto"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-2xl">
              🐾
            </div>
            <h2 className="text-2xl font-bold mb-2">{DEMO_DATA.project.name}</h2>
            <p className="text-primary font-medium mb-4">{DEMO_DATA.project.tagline}</p>
            <p className="text-on-surface-variant text-sm">{DEMO_DATA.project.idea}</p>
          </motion.div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Controls */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={handlePlay}
              disabled={isPlaying || currentStage === PIPELINE_STAGES.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Play className="w-5 h-5" />
              {currentStage === 0 ? 'Start Demo' : 'Continue'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-surface-variant text-on-surface rounded-xl font-medium hover:bg-surface-variant/80 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>

          {/* Pipeline Stages */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
            {PIPELINE_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = index === currentStage;
              const isComplete = index < currentStage;
              
              return (
                <motion.button
                  key={stage.id}
                  onClick={() => {
                    setCurrentStage(index);
                    setShowDetails(true);
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : isComplete
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-outline-variant bg-surface'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                    isActive
                      ? `bg-gradient-to-br ${stage.color} text-white`
                      : isComplete
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-variant'
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {stage.name}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">{stage.duration}</p>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Active Stage Detail */}
          <AnimatePresence mode="wait">
            {showDetails && (
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface rounded-2xl shadow-lg overflow-hidden"
              >
                <div className={`p-6 bg-gradient-to-r ${PIPELINE_STAGES[currentStage].color}`}>
                  <div className="flex items-center gap-4">
                    {(() => {
                      const Icon = PIPELINE_STAGES[currentStage].icon;
                      return <Icon className="w-8 h-8 text-white" />;
                    })()}
                    <div className="text-white">
                      <h3 className="text-xl font-bold">{PIPELINE_STAGES[currentStage].name}</h3>
                      <p>{PIPELINE_STAGES[currentStage].description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {renderStageContent()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          <div className="mt-12">
            <div className="flex justify-between text-sm text-on-surface-variant mb-2">
              <span>Pipeline Progress</span>
              <span>{Math.round(((currentStage + 1) / PIPELINE_STAGES.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStage + 1) / PIPELINE_STAGES.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 px-4 bg-surface-variant/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Build Your Startup?</h2>
          <p className="text-on-surface-variant mb-8">
            Join the waitlist and be among the first to experience the future of software development.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Early Access
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
