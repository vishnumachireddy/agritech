import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Shield, TrendingUp, Users, ArrowRight, Sprout, Sun, Cpu, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BgImage from '@/assets/BGIMG.png';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5 }}
        className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
);

const Landing = () => {
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const navHeight = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - navHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-agri-teal flex items-center justify-center shadow-lg shadow-primary/20">
                            <Leaf className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold font-['Space_Grotesk'] tracking-tight">AgroSmart<span className="text-primary">AI</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 font-medium">
                        <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                        <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="text-muted-foreground hover:text-foreground transition-colors">Impact</a>
                        <a href="#getting-started" onClick={(e) => scrollToSection(e, 'getting-started')} className="text-muted-foreground hover:text-foreground transition-colors">Get Started</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/auth/login">
                            <Button variant="ghost" className="hidden sm:inline-flex rounded-full">Sign In</Button>
                        </Link>
                        <Link to="/auth/register">
                            <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-0 pt-32 pb-20 md:pt-48 md:pb-32 px-6 min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Image & Overlays */}
                <div className="absolute inset-0 -z-20">
                    <img
                        src={BgImage}
                        alt="Smart Farm Background"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Subtle Gradient Overlay covering the image */}
                <div className="absolute inset-0 bg-background/20 dark:bg-background/40 bg-gradient-to-b from-background/10 via-background/40 to-background -z-10"></div>

                {/* Glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <div className="container mx-auto text-center max-w-5xl relative z-10 pt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8"
                    >
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium">The Future of Agriculture is Here</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight font-['Space_Grotesk'] text-balance drop-shadow-sm"
                    >
                        Transforming Agriculture with <br className="hidden md:block" />
                        <span className="agri-gradient-text">Data-Driven Intelligence</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl md:text-2xl text-foreground/80 mb-12 max-w-3xl mx-auto text-balance font-medium drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                    >
                        A complete ecosystem combining real-time crop analysis, market insights, and predictive AI to maximize your yield and profit.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/auth/register">
                            <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all group">
                                Start Farming Smarter
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link to="/auth/login">
                            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg hover:bg-secondary">
                                View Demo
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Showcase */}
            <section id="features" className="py-24 bg-card/50 relative border-t border-border/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-['Space_Grotesk']">Powerful Tools at Your Fingertips</h2>
                        <p className="text-muted-foreground text-lg">Everything you need to manage your farm efficiently, predict supply and demand, and make data-driven decisions.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Sprout}
                            title="Crop Analysis & Guidance"
                            description="Upload images of your crops to instantly detect diseases, pests, and get AI-powered treatment recommendations."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Market Insights"
                            description="Real-time commodity pricing, demand forecasting, and yield predictions to sell at the best possible time."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={Sun}
                            title="Hyper-Local Weather"
                            description="Get micro-climate predictions and optimal time windows for sowing, irrigation, and harvesting."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon={Cpu}
                            title="Predictive AI Models"
                            description="Advanced machine learning engines that process historical and real-time farm data to optimize growth."
                            delay={0.4}
                        />
                        <FeatureCard
                            icon={Users}
                            title="Direct Marketplace"
                            description="Connect directly with consumers and bulk buyers. Eliminate middlemen and maximize your profits."
                            delay={0.5}
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Secure Traceability"
                            description="Blockchain-inspired product tracking ensuring quality, trust, and transparency from farm to fork."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="how-it-works" className="py-24 relative overflow-hidden bg-primary text-primary-foreground">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-y border-primary-foreground/20 py-12">
                        {[
                            { number: '50K+', label: 'Active Farmers' },
                            { number: '98%', label: 'Prediction Accuracy' },
                            { number: '$12M+', label: 'Added Value' },
                            { number: '24/7', label: 'AI Support' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="text-4xl md:text-5xl font-black mb-2 font-['Space_Grotesk']">{stat.number}</div>
                                <div className="text-primary-foreground/80 font-medium text-lg">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="getting-started" className="py-32 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full max-w-5xl h-full bg-primary/5 blur-[100px] rounded-full" />
                </div>
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto bg-card rounded-[3rem] p-12 md:p-20 shadow-2xl border border-border relative overflow-hidden card-shadow-hover"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 agri-gradient" />

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Space_Grotesk']">Ready to Transform Your Farm?</h2>
                        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            Join thousands of forward-thinking farmers who are already using AgroSmart AI to increase their yield and secure their future.
                        </p>
                        <Link to="/auth/register">
                            <Button size="lg" className="rounded-full px-12 h-16 text-xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground">
                                Create Free Account
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-card border-t border-border py-12">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-primary" />
                        <span className="text-xl font-bold font-['Space_Grotesk'] tracking-tight">AgroSmart<span className="text-primary">AI</span></span>
                    </div>
                    <p className="text-muted-foreground text-sm">© {(new Date()).getFullYear()} AgroSmart AI Platform. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Privacy</a>
                        <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Terms</a>
                        <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
