import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service - Flash N Share</title>
        <meta name="description" content="Flash N Share terms of service. Read our terms and conditions for using our event photo-sharing platform." />
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
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
          
          <section className="mt-8">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Flash N Share, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mt-8">
            <h2>2. Service Description</h2>
            <p>
              Flash N Share is a photo-sharing platform that allows event hosts to create QR-coded photo galleries 
              where guests can upload and share photos from events. The service includes:
            </p>
            <ul>
              <li>Event creation and management</li>
              <li>QR code generation for easy photo uploads</li>
              <li>Photo storage and gallery management</li>
              <li>Photo download capabilities</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>3. Account Registration</h2>
            <p>To use Flash N Share, you must:</p>
            <ul>
              <li>Be at least 13 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activity under your account</li>
            </ul>
            <p>
              You may receive a free event credit with an Etsy invitation purchase. 
              Redemption codes are single-use and cannot be transferred.
            </p>
          </section>

          <section className="mt-8">
            <h2>4. Service Limits and Storage</h2>
            <h3>Free Tier</h3>
            <ul>
              <li>One free event per Etsy invitation purchase</li>
              <li>Up to 1,000 photos per event</li>
              <li>3 months of storage included</li>
            </ul>
            
            <h3>Storage Extensions</h3>
            <p>
              After the initial 3-month period, you may purchase storage extensions. 
              Events without extended storage will have photos permanently deleted after expiration.
            </p>
          </section>

          <section className="mt-8">
            <h2>5. Content Ownership and Licenses</h2>
            <h3>Your Content</h3>
            <p>
              You retain all ownership rights to photos you upload. By uploading content, you grant Flash N Share a limited, 
              non-exclusive license to store, display, and transmit your content solely for the purpose of providing our service.
            </p>
            
            <h3>Guest Uploads</h3>
            <p>
              As an event host, you acknowledge that guests uploading photos to your event retain ownership of their photos. 
              By creating an event, you represent that you have permission to collect and manage these photos.
            </p>
          </section>

          <section className="mt-8">
            <h2>6. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Upload illegal, offensive, or copyrighted content without permission</li>
              <li>Use the service to harass, abuse, or harm others</li>
              <li>Attempt to access other users' accounts or data</li>
              <li>Interfere with or disrupt the service</li>
              <li>Use automated systems to access the service</li>
              <li>Resell or redistribute the service</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>7. Content Moderation</h2>
            <p>
              We reserve the right to review and remove content that violates these terms or applicable laws. 
              We may suspend or terminate accounts that repeatedly violate our policies.
            </p>
          </section>

          <section className="mt-8">
            <h2>8. Payment and Refunds</h2>
            <p>
              Storage extensions and additional credits may be purchased through our service. 
              All sales are final. Refunds are provided only at our sole discretion for service failures or billing errors.
            </p>
          </section>

          <section className="mt-8">
            <h2>9. Data and Privacy</h2>
            <p>
              Your use of Flash N Share is subject to our Privacy Policy. We take data security seriously and implement 
              industry-standard measures to protect your information.
            </p>
          </section>

          <section className="mt-8">
            <h2>10. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted service. 
              We may perform maintenance, updates, or modifications that temporarily affect availability.
            </p>
          </section>

          <section className="mt-8">
            <h2>11. Termination</h2>
            <p>You may terminate your account at any time by:</p>
            <ul>
              <li>Downloading your photos before deletion</li>
              <li>Contacting our support team</li>
            </ul>
            <p>
              We may terminate or suspend your account for violation of these terms. 
              Upon termination, your access will cease and your data may be deleted according to our retention policies.
            </p>
          </section>

          <section className="mt-8">
            <h2>12. Limitation of Liability</h2>
            <p>
              Flash N Share is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul>
              <li>Loss of photos due to technical failures or user error</li>
              <li>Unauthorized access by third parties</li>
              <li>Service interruptions or data loss</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
            <p>
              You are responsible for maintaining backups of important photos.
            </p>
          </section>

          <section className="mt-8">
            <h2>13. Indemnification</h2>
            <p>
              You agree to indemnify and hold Flash N Share harmless from claims arising from your use of the service, 
              your content, or your violation of these terms.
            </p>
          </section>

          <section className="mt-8">
            <h2>14. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. We will notify users of significant changes. 
              Continued use after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="mt-8">
            <h2>15. Governing Law</h2>
            <p>
              These terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section className="mt-8">
            <h2>16. Contact Information</h2>
            <p>
              For questions about these terms, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> support@flashnshare.app
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default TermsOfService;
