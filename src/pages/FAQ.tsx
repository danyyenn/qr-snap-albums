import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft } from "lucide-react";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>FAQ - Frequently Asked Questions | FlashNShare</title>
        <meta name="description" content="Get answers to common questions about FlashNShare, QR code photo sharing, event management, and more." />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about FlashNShare
            </p>
          </section>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What is FlashNShare?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                FlashNShare is a QR-powered photo-sharing platform designed for events. It allows event hosts to create 
                a unique QR code that guests can scan to instantly upload photos from their phones. All photos are collected 
                in one organized gallery that you can manage and download.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How does the Etsy integration work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                When you purchase invitations from our partner Etsy shops, you receive a redemption code that gives you 
                free access to FlashNShare. Simply create an account, enter your code, and you'll receive one free event 
                credit with up to 1,000 photos and 3 months of storage.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Do guests need to download an app?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No! That's the beauty of FlashNShare. Guests simply scan the QR code with their phone's camera, 
                which opens a web page where they can instantly upload photos. No app download required, works on any smartphone.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How many photos can be uploaded to an event?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Each event can hold up to 1,000 photos. This is more than enough for most celebrations. If you need more 
                capacity, please contact our support team.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How long are photos stored?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your free event includes 3 months of storage. Before expiration, you'll receive reminders to download your 
                photos or purchase a storage extension. After the storage period ends, photos are permanently deleted to 
                protect your privacy and free up space.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can I extend storage beyond 3 months?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Storage extensions will be available for purchase before your storage period expires. This allows you 
                to keep your event gallery accessible for as long as you need.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Are photos private and secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Photos are only accessible to people with your event's unique upload code. We use industry-standard 
                encryption to protect your data, and we never share or sell your photos to third parties. Your memories are 
                yours alone.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How do I download photos from my event?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                From your event dashboard, you can download photos individually or all at once as a ZIP file. Simply click 
                the download button, and all photos will be packaged for you. Downloads are fast and easy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can I delete or manage photos after they're uploaded?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! As the event host, you have full control. You can delete individual photos, approve photos before they 
                appear in the gallery, and manage all aspects of your event from your dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What if someone uploads an inappropriate photo?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can enable photo approval on your event, which means all uploads must be reviewed by you before appearing 
                in the gallery. You can also delete any photo at any time. We take content moderation seriously and reserve 
                the right to remove inappropriate content.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How do I print the QR code?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                After creating your event, you can download your QR code in high resolution. You can print it on your 
                invitations, create table signs, add it to programs, or display it digitally. The QR code works from any 
                size—from business card to poster.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can I use FlashNShare without an Etsy purchase?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, FlashNShare is designed to complement Etsy invitation purchases. If you're interested in using 
                our service independently, please contact us to discuss options.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What types of events is FlashNShare good for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                FlashNShare works great for any event where you want to collect photos: weddings, birthdays, anniversaries, 
                graduations, baby showers, corporate events, reunions, parties, conferences, and more. If there are people 
                taking photos, FlashNShare can help you collect them.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What happens if I don't download photos before they expire?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We send multiple reminders before your storage period expires. However, if you don't download or extend 
                your storage, photos will be permanently deleted after the expiration date. We recommend downloading your 
                photos early to ensure you don't lose any memories.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-15" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can I create multiple events?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Each redemption code gives you one free event, but you can create additional events by purchasing more 
                invitation packages from our Etsy partner shops or by contacting us for additional event credits.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-16" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Is there customer support if I need help?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We're here to help. You can reach us at support@flashnshare.com for any questions, technical issues, 
                or assistance with your events.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <section className="bg-muted/30 rounded-2xl p-8 text-center space-y-4 mt-12">
            <h2 className="text-2xl font-bold">Still Have Questions?</h2>
            <p className="text-muted-foreground">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link to="/auth">
                <Button size="lg">
                  Get Started
                </Button>
              </Link>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:support@flashnshare.com">
                  Contact Support
                </a>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
