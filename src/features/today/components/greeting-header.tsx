function partOfDay(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function GreetingHeader({ firstName, now = new Date() }: { firstName: string; now?: Date }) {
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="min-w-0 space-y-2">
      <p className="text-sm text-muted-foreground">{dateLabel}</p>
      <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
        Good {partOfDay(now.getHours())}, {firstName}
      </h1>
    </header>
  );
}
