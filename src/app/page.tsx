import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Package, Users, ShoppingCart, LineChart, Image } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Link href="/inventory">
            <Card className="bg-blue-100 hover:bg-blue-200 transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inventory System
                </CardTitle>
                <Package className="h-6 w-6 text-blue-800" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground">
                  Manage your product inventory.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/image-database">
            <Card className="bg-green-100 hover:bg-green-200 transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Image Database
                </CardTitle>
                <Image className="h-6 w-6 text-green-800" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Browse</div>
                <p className="text-xs text-muted-foreground">
                  Browse and manage your branded images.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Card className="bg-yellow-100 hover:bg-yellow-200 transition-colors duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Module 3</CardTitle>
              <ShoppingCart className="h-6 w-6 text-yellow-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Coming Soon</div>
              <p className="text-xs text-muted-foreground">
                This module is under construction.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-purple-100 hover:bg-purple-200 transition-colors duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Module 4</CardTitle>
              <LineChart className="h-6 w-6 text-purple-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Coming Soon</div>
              <p className="text-xs text-muted-foreground">
                This module is under construction.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Data Visualizations</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[400px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">Chart will be here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
