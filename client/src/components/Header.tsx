import { SocialIcon, UIIcon } from "./SocialIcons";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <SocialIcon platform="multipost" className="text-primary" size={24} />
          <h1 className="text-xl font-semibold text-neutral-900">Multipost</h1>
        </div>
        <div>
          <Button variant="outline" size="sm">
            <UIIcon.Settings className="mr-1 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
}
