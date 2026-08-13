import React from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";

interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
}: PageHeaderProps) {
  return (
    <HStack align="start" justify="between" className="mb-8">
      <VStack gap={1}>
        <Heading level={1}>
          {title}
        </Heading>
        {description && (
          <Text type="supporting">
            {description}
          </Text>
        )}
      </VStack>
      <HStack align="center" gap={3}>
        {secondaryAction}
        {primaryAction}
      </HStack>
    </HStack>
  );
}
