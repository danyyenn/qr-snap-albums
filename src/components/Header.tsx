import { Link } from "react-router-dom";
import { QrCode } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <QrCode className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Event Photo Dump</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
