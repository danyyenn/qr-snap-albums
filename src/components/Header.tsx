import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const QRHeartIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
    {/* QR-style corner markers */}
    <rect x="5" y="5" width="20" height="20" rx="2" fill="currentColor" opacity="0.8"/>
    <rect x="75" y="5" width="20" height="20" rx="2" fill="currentColor" opacity="0.8"/>
    <rect x="5" y="75" width="20" height="20" rx="2" fill="currentColor" opacity="0.8"/>
    
    {/* QR-style dots pattern */}
    <circle cx="15" cy="15" r="4" fill="currentColor" opacity="0.3"/>
    <circle cx="85" cy="15" r="4" fill="currentColor" opacity="0.3"/>
    <circle cx="15" cy="85" r="4" fill="currentColor" opacity="0.3"/>
    
    {/* Additional QR pattern elements */}
    <rect x="75" y="75" width="8" height="8" rx="1" fill="currentColor" opacity="0.5"/>
    <rect x="87" y="75" width="8" height="8" rx="1" fill="currentColor" opacity="0.5"/>
    <rect x="75" y="87" width="8" height="8" rx="1" fill="currentColor" opacity="0.5"/>
    
    {/* Heart shape in center */}
    <path 
      d="M50 70 C30 55, 25 40, 35 30 C40 25, 45 25, 50 30 C55 25, 60 25, 65 30 C75 40, 70 55, 50 70 Z" 
      fill="currentColor"
    />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground p-2">
            <QRHeartIcon />
          </div>
          <span className="text-xl font-bold">FlashNShare</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
