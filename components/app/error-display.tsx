import { ReactNode } from "react";
import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/VStack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Button } from "@astryxdesign/core/Button";

interface ErrorDisplayProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function ErrorDisplay({ icon, title, description, actionLabel, onAction, actionHref }: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8">
      <Card padding={8} className="max-w-md w-full text-center">
        <VStack gap={6} align="center">
          {icon && (
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-2">
              {icon}
            </div>
          )}
          
          <VStack gap={2} align="center">
            <Heading level={3} aria-live="assertive">{title}</Heading>
            <Text type="supporting" className="max-w-xs mx-auto">
              {description}
            </Text>
          </VStack>

          {actionLabel && (
            <Button 
              onClick={onAction} 
              href={actionHref}
              variant="primary" 
              label={actionLabel}
            />
          )}
        </VStack>
      </Card>
    </div>
  );
}
