import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface ClaimCode {
  id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claimCodes, setClaimCodes] = useState<ClaimCode[]>([]);
  const [newCodeCount, setNewCodeCount] = useState(10);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_host")
      .eq("id", session.user.id)
      .single();

    if (!profile?.is_host) {
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    loadClaimCodes();
  };

  const loadClaimCodes = async () => {
    const { data, error } = await supabase
      .from("claim_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load claim codes",
      });
    } else {
      setClaimCodes(data || []);
    }
    setLoading(false);
  };

  const generateCodes = async () => {
    setLoading(true);
    const codes = [];
    const prefix = "ETSY" + new Date().getFullYear();
    
    for (let i = 0; i < newCodeCount; i++) {
      const random = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push({
        code: `${prefix}-${random}`,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    const { error } = await supabase
      .from("claim_codes")
      .insert(codes);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate codes",
      });
    } else {
      toast({
        title: "Success!",
        description: `Generated ${newCodeCount} new claim codes`,
      });
      loadClaimCodes();
    }
    setLoading(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied!",
      description: "Claim code copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const activeCodesCount = claimCodes.filter(c => !c.is_used).length;
  const usedCodesCount = claimCodes.filter(c => c.is_used).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Top Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{claimCodes.length}</CardTitle>
              <CardDescription>Total Codes</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">{activeCodesCount}</CardTitle>
              <CardDescription>Active Codes</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-muted-foreground">{usedCodesCount}</CardTitle>
              <CardDescription>Used Codes</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Generate Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Claim Codes</CardTitle>
            <CardDescription>
              Create new claim codes for Etsy customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs space-y-2">
                <Label htmlFor="code-count">Number of Codes</Label>
                <Input
                  id="code-count"
                  type="number"
                  min="1"
                  max="100"
                  value={newCodeCount}
                  onChange={(e) => setNewCodeCount(parseInt(e.target.value) || 10)}
                />
              </div>
              <Button onClick={generateCodes} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Codes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Codes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Claim Codes</CardTitle>
            <CardDescription>
              Manage and track claim codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claimCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>
                      {code.is_used ? (
                        <Badge variant="secondary">Used</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(code.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {code.used_at ? new Date(code.used_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                        disabled={code.is_used}
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
