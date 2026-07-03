import type { UserInfo } from "@/services/api";
import { BarChart3, LogOut} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface HeaderProps {
    user: UserInfo | null
}

export default function Header({user}:HeaderProps) {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        // <View className="">
            <header className="border-b w-full mb-5 px-2 bg-card">
                <div className="mx-auto flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                    <h1 className="text-lg font-heading font-bold">B2 Management</h1>
                    <p className="text-xs text-muted-foreground">Backblaze B2 Cloud Storage</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
              </AvatarFallback>
            </Avatar>
                    </div>
                    <div className="text-right">
                        <p className="font-medium text-foreground">{user?.name} {user?.surname}</p>
                        <p className="text-xs capitalize">{user?.role}</p>
                    </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                    </Button>
                </div>
                </div>
            </header>
        // </View>
    )
}