import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Jarvinho</CardTitle>
          <CardDescription>Tu asistente personal. Pronto, el chat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled>
            Empezar a chatear
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
