import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy - FlashNShare</title>
        <meta name="description" content="FlashNShare privacy policy. Learn how we protect and handle your event photos and personal information." />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
          
          <section className="mt-8">
            <h2>1. Introduction</h2>
            <p>
              Welcome to FlashNShare. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our photo-sharing service.
            </p>
          </section>

          <section className="mt-8">
            <h2>2. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Display name (optional)</li>
              <li>Account credentials</li>
            </ul>
            
            <h3>Event and Photo Data</h3>
            <p>When you use our service, we collect:</p>
            <ul>
              <li>Event details (name, date, location, description)</li>
              <li>Photos uploaded to events</li>
              <li>Photo metadata (upload date, file size)</li>
            </ul>
            
            <h3>Usage Information</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Device information and IP address</li>
              <li>Browser type and version</li>
              <li>Pages visited and features used</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and maintain our photo-sharing service</li>
              <li>Create and manage your events</li>
              <li>Store and organize uploaded photos</li>
              <li>Send important service notifications</li>
              <li>Improve our service and user experience</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>4. Data Storage and Security</h2>
            <p>
              Your photos and data are stored securely using industry-standard encryption. 
              We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, or destruction.
            </p>
            <p>
              Event photos are stored for the duration of your subscription plus any extended storage period you purchase. 
              After expiration, photos are permanently deleted from our servers.
            </p>
          </section>

          <section className="mt-8">
            <h2>5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data only in these circumstances:</p>
            <ul>
              <li><strong>Event Guests:</strong> Photos uploaded to an event are visible to all guests with the event's upload code</li>
              <li><strong>Service Providers:</strong> We use trusted third-party services for hosting and infrastructure</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Download your photos before deletion</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>7. Cookies and Tracking</h2>
            <p>
              We use essential cookies to maintain your session and provide core functionality. 
              We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section className="mt-8">
            <h2>8. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect personal information from children. 
              If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mt-8">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of significant changes via email or through our service. 
              Continued use of FlashNShare after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mt-8">
            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this privacy policy or your data, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> privacy@flashnshare.com
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
