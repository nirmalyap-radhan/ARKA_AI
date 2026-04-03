import { User, Settings, Bell, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProfilePage = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 pb-20 md:pb-8">
      <h1 className="font-display text-3xl font-bold mb-6">Profile</h1>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">Traveler</p>
              <p className="text-sm font-body text-muted-foreground">traveler@email.com</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { icon: Settings, label: "Settings" },
              { icon: Bell, label: "Notifications" },
              { icon: LogOut, label: "Sign Out" },
            ].map((item) => (
              <Button key={item.label} variant="ghost" className="w-full justify-start gap-3 font-body">
                <item.icon className="h-4 w-4" /> {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
