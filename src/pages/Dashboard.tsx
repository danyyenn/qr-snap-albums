import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, Calendar, Image, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
  cover_image_url: string;
  _count?: {
    photos: number;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreateEvent, setCanCreateEvent] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    setProfile(profileData);

    // Check if user can create more events
    if (profileData?.is_host) {
      setCanCreateEvent(
        (profileData.events_created || 0) < (profileData.events_allowed || 0)
      );
    }

    const { data: eventsData, error } = await supabase
      .from("events")
      .select(`
        id,
        name,
        event_date,
        location,
        cover_image_url,
        photos(count)
      `)
      .eq("host_id", session.user.id)
      .order("event_date", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load events",
      });
    } else {
      setEvents(eventsData as any);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleClaimCode = async () => {
    if (!claimCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a claim code",
      });
      return;
    }

    setClaiming(true);
    try {
      const { error } = await supabase.rpc("claim_host_code", {
        p_code: claimCode,
        p_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Claim code verified! You're now a host.",
      });

      setClaimDialogOpen(false);
      setClaimCode("");
      checkUser(); // Refresh user data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid or already used claim code",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Top Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3 flex justify-end items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {profile?.full_name || user?.email}
          </span>
          {profile?.is_host && (
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground">
              {profile?.is_host 
                ? `Manage your event photo galleries (${profile.events_created || 0}/${profile.events_allowed || 0} events used)` 
                : "View your events"}
            </p>
          </div>
          {profile?.is_host && canCreateEvent && (
            <Link to="/events/new">
              <Button variant="hero" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </Link>
          )}
        </div>

        {profile?.is_host && !canCreateEvent && (
          <Card className="mb-8 border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle>Event Limit Reached</CardTitle>
              <CardDescription>
                You've used all {profile.events_allowed} event{profile.events_allowed > 1 ? 's' : ''} from your Etsy purchase.
                Purchase another invitation on Etsy to create more events.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <a href="https://etsy.com/your-shop-url" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  Shop Invitations on Etsy
                </Button>
              </a>
            </CardFooter>
          </Card>
        )}

        {!profile?.is_host && (
          <Card className="mb-8 border-primary/20 bg-gradient-primary/5">
            <CardHeader>
              <CardTitle>Become a Host</CardTitle>
              <CardDescription>
                To create events, you need a claim code from an Etsy purchase
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Enter Claim Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enter Your Claim Code</DialogTitle>
                    <DialogDescription>
                      Enter the claim code from your Etsy purchase to become a host and create events.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="claim-code">Claim Code</Label>
                      <Input
                        id="claim-code"
                        placeholder="Enter your claim code"
                        value={claimCode}
                        onChange={(e) => setClaimCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleClaimCode}
                      disabled={claiming}
                    >
                      {claiming ? "Verifying..." : "Verify Code"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        )}

        {events.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-2xl font-bold">No Events Yet</h3>
              <p className="text-muted-foreground">
                {profile?.is_host 
                  ? "Create your first event to start collecting photos!"
                  : "You haven't been added to any events yet."}
              </p>
              {profile?.is_host && canCreateEvent && (
                <Link to="/events/new">
                  <Button variant="hero" className="mt-4">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              )}
              {profile?.is_host && !canCreateEvent && (
                <p className="text-muted-foreground mt-4">
                  Purchase another invitation on Etsy to create more events.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="aspect-video bg-gradient-primary relative">
                    {event.cover_image_url ? (
                      <img 
                        src={event.cover_image_url} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-16 h-16 text-primary-foreground/50" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{event.name}</CardTitle>
                    <CardDescription>
                      {new Date(event.event_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Image className="w-4 h-4" />
                      <span>{event._count?.photos || 0} photos</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
