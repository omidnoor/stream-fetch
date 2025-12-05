import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  href: string;
  gradient: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  href,
  gradient,
}: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-xl">
      {/* Background Gradient on Hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-5`}
      ></div>

      {/* Content */}
      <div className="relative space-y-6">
        {/* Icon */}
        <div className={`inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Feature List */}
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          variant="ghost"
          className="group/button gap-2 px-0 text-primary hover:bg-transparent"
          asChild
        >
          <Link href={href}>
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
