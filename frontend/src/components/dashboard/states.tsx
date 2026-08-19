import * as React from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function LoadingState({ title = "Carregando..." }: { title?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-8">
        <Loader2 size={20} className="animate-spin text-brand-300" />
        <span className="text-sm text-muted-foreground">{title}</span>
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Algo deu errado",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle size={20} />
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="secondary" size="sm">
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-muted-foreground">
          <Inbox size={20} />
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        )}
        {action}
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <Card key={idx}>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
