function partOfDay(hour: number) {
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export function GreetingHeader({ firstName, now = new Date() }: { firstName: string; now?: Date }) {
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Good {partOfDay(now.getHours())}, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground">{dateLabel}</p>
    </header>
  );
}
