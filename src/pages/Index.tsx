import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { QrCode, Upload, Image, Shield, Zap, Gift } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>FlashNShare - QR-Powered Party Photo Albums | Event Photo Sharing</title>
        <meta name="description" content="Free photo-sharing app for events. Create QR codes for your party, guests upload photos instantly. Manage galleries, downloads, and memories with ease." />
        <meta name="keywords" content="event photos, party photos, QR code photo sharing, photo album, wedding photos, birthday photos, photo sharing app" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      <Header />
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        
        <div className="container relative z-10 px-4 py-20 mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                FlashNShare
              </span>
              <br />
              <span className="text-foreground">Memories Made Simple</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto">
              Create a QR code for your event. Guests scan, upload photos instantly. 
              You manage, download, and cherish every moment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="glass" size="xl">
                  Redeem Etsy Purchase
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col items-center gap-3 pt-4">
              <p className="text-sm text-muted-foreground">
                Free with your Etsy invitation purchase • No credit card required
              </p>
              <a 
                href="https://www.etsy.com/shop/YourShopNameHere" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="lg">
                  Shop Invitations on Etsy
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<QrCode className="w-12 h-12" />}
              title="Create Your Event"
              description="Set up your event and get a unique QR code. Print it, share it, display it."
            />
            <FeatureCard
              icon={<Upload className="w-12 h-12" />}
              title="Guests Upload"
              description="No app needed. Guests scan the QR code and upload photos instantly from their phones."
            />
            <FeatureCard
              icon={<Image className="w-12 h-12" />}
              title="Manage & Download"
              description="View all photos in one place. Approve, download, or create slideshows."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Why Choose Photo Dump?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <BenefitCard
              icon={<Shield />}
              title="Private & Secure"
              description="Your photos are protected. Only you and invited guests can access them."
            />
            <BenefitCard
              icon={<Zap />}
              title="Lightning Fast"
              description="Mobile-optimized uploads. No waiting, no app downloads, just scan and share."
            />
            <BenefitCard
              icon={<Gift />}
              title="Free with Etsy Purchase"
              description="Get your first event free with any Etsy invitation purchase. No hidden costs."
            />
            <BenefitCard
              icon={<QrCode />}
              title="QR Code Magic"
              description="Print your QR code on invitations, signs, or anywhere. One scan, instant access."
            />
            <BenefitCard
              icon={<Upload />}
              title="No Limits"
              description="Up to 1,000 photos per event. Enough for even the biggest celebrations."
            />
            <BenefitCard
              icon={<Image />}
              title="Flexible Storage"
              description="3 months free storage. Extend anytime with affordable upgrades."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Capture Your Event?
          </h2>
          <p className="text-xl opacity-90">
            Join hundreds of hosts who trust Photo Dump for their special moments.
          </p>
          <Link to="/auth">
            <Button variant="secondary" size="xl" className="mt-4">
              Create Your Event Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center space-y-3">
          <p className="text-muted-foreground">&copy; 2025 FlashNShare. Made with ♥ for party hosts.</p>
          <a 
            href="https://www.etsy.com/shop/YourShopNameHere" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-primary hover:underline"
          >
            Shop Invitations on Etsy
          </a>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card rounded-2xl p-8 text-center space-y-4 border shadow-sm hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary text-primary-foreground">
      {icon}
    </div>
    <h3 className="text-2xl font-bold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const BenefitCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card rounded-xl p-6 space-y-3 border hover:border-primary/50 transition-all duration-300">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default Index;
