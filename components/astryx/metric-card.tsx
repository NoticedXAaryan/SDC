import React from "react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Badge } from "@astryxdesign/core/Badge";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  progressValue?: number;
  progressMax?: number;
  progressLabel?: string;
  progressVariant?: "accent" | "success" | "warning" | "error" | "neutral";
  variant?: "default" | "transparent" | "muted" | "blue" | "cyan" | "gray" | "green" | "orange" | "pink" | "purple" | "red" | "teal" | "yellow";
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  progressValue,
  progressMax,
  progressLabel,
  progressVariant,
  variant = "default",
}: MetricCardProps) {
  return (
    <Card variant={variant} padding={4}>
      <VStack gap={4}>
        <HStack align="center" justify="between">
          <Text type="supporting" weight="medium">
            {title}
          </Text>
          {icon && (
            <div className="text-muted-foreground h-4 w-4">
              {icon}
            </div>
          )}
        </HStack>

        <VStack gap={1}>
          <HStack align="center" gap={2}>
            <Heading level={3} className="text-2xl font-bold tracking-tight">{String(value)}</Heading>
          </HStack>

          {trend && trendValue && (
            <HStack align="center" gap={2}>
              <Badge
                variant={
                  trend === "up" ? "success" : trend === "down" ? "error" : "neutral"
                }
                label={trendValue}
              />
            </HStack>
          )}

          {progressValue !== undefined && (
            <div className="mt-2">
              <ProgressBar
                value={progressValue}
                max={progressMax || 100}
                label={progressLabel || title}
                variant={progressVariant}
                hasValueLabel
              />
            </div>
          )}
        </VStack>
      </VStack>
    </Card>
  );
}
