import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, Users, Sparkles, Shield } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About FlashNShare - Event Photo Sharing Made Simple</title>
        <meta name="description" content="Learn about FlashNShare, the QR-powered photo sharing platform that helps event hosts collect and manage photos from their celebrations." />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                About FlashNShare
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Making event photo sharing effortless, one QR code at a time.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Our Story</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                FlashNShare was born from a simple frustration: collecting photos from events shouldn't be complicated. 
                Whether it's a wedding, birthday party, corporate event, or family reunion, everyone takes photos—but 
                getting them all in one place? That's always been the challenge.
              </p>
              <p>
                We created FlashNShare to solve this problem. No more chasing down guests for photos, no more scattered 
                images across different platforms, no more complicated apps that nobody wants to download.
              </p>
              <p>
                With a simple QR code, your guests can instantly upload their photos to your event gallery. It's that easy.
              </p>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Built for Hosts</h3>
                <p className="text-muted-foreground">
                  We understand the challenges of planning events. FlashNShare is designed to make photo collection 
                  the easiest part of your celebration, so you can focus on what matters: enjoying the moment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Guest-Friendly</h3>
                <p className="text-muted-foreground">
                  No app downloads, no account creation, no friction. Guests simply scan a QR code and upload. 
                  It works on any smartphone, and it takes seconds.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Private & Secure</h3>
                <p className="text-muted-foreground">
                  Your memories are precious. We use enterprise-grade security to protect your photos, 
                  and only people with your event code can access them.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Simple & Beautiful</h3>
                <p className="text-muted-foreground">
                  We believe great tools should be easy to use and pleasant to look at. FlashNShare is designed 
                  with care to provide a delightful experience for both hosts and guests.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6 bg-muted/30 rounded-2xl p-8">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create Your Event</h3>
                  <p className="text-muted-foreground">
                    Sign up for free (or redeem your Etsy invitation code), create an event, and get your unique QR code.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Share the QR Code</h3>
                  <p className="text-muted-foreground">
                    Print it on invitations, display it at your venue, or share it digitally. Wherever works best for you.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Guests Upload Photos</h3>
                  <p className="text-muted-foreground">
                    Everyone scans the code and uploads their best shots. No app required, works on any phone.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Manage & Download</h3>
                  <p className="text-muted-foreground">
                    View all photos in one organized gallery. Download individually or all at once. Your memories, perfectly collected.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Why FlashNShare?</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We're passionate about helping people preserve their precious moments. Whether it's a milestone birthday, 
                a dream wedding, or a corporate celebration, every event deserves to have its photos collected and cherished.
              </p>
              <p>
                FlashNShare bridges the gap between Etsy invitation shops and modern photo sharing technology. 
                When you purchase invitations from our partner shops on Etsy, you get free access to our platform—making 
                your event planning even more seamless.
              </p>
            </div>
          </section>

          <section className="bg-gradient-primary text-primary-foreground rounded-2xl p-8 text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join thousands of hosts who trust FlashNShare for their events. 
              Create your first event free with any Etsy invitation purchase.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button variant="secondary" size="lg">
                  Create Free Account
                </Button>
              </Link>
              <a 
                href="https://www.etsy.com/shop/YourShopNameHere" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="glass" size="lg">
                  Shop Invitations
                </Button>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
