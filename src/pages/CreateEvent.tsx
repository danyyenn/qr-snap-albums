import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, FileText, Image } from "lucide-react";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    event_date: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_host, events_allowed, events_created")
      .eq("id", session.user.id)
      .single();

    if (!profile?.is_host) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You need to be a host to create events.",
      });
      navigate("/dashboard");
      return;
    }

    // Check if user has remaining event credits
    const eventsCreated = profile.events_created || 0;
    const eventsAllowed = profile.events_allowed || 0;
    
    if (eventsCreated >= eventsAllowed) {
      toast({
        variant: "destructive",
        title: "Event Limit Reached",
        description: `You've used all ${eventsAllowed} event${eventsAllowed > 1 ? 's' : ''}. Purchase another invitation on Etsy.`,
      });
      navigate("/dashboard");
    }
  };

  const generateUploadCode = () => {
    // Generate 4-digit numeric PIN
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const uploadCode = generateUploadCode();

      const { data, error } = await supabase
        .from("events")
        .insert({
          ...formData,
          host_id: session.user.id,
          upload_code: uploadCode,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });

      navigate(`/events/${data.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Create New Event - Flash N Share</title>
        <meta name="description" content="Set up a new event with QR code photo sharing. Get a unique upload code for guests to share photos instantly." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      
      <main className="container mx-auto px-4 py-24 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">
            Set up your event and get a unique QR code for guests to upload photos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Fill in the details about your event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Event Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Wedding Reception, Birthday Party, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Event Date *
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Venue name or address"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  <Image className="w-4 h-4 inline mr-2" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell guests about your event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateEvent;
