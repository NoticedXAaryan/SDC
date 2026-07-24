"use client"

import * as React from "react"
import { Card, Button, Heading, Text, HStack, VStack } from "@astryxdesign/core"
import { Award, FileSignature, Settings } from "lucide-react"

export function EventCertificatesTab({ event }: { event: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card padding={6}>
        <VStack gap={6}>
          <VStack gap={1}>
            <HStack align="center" gap={2}>
              <Award className="w-5 h-5" /> 
              <Heading level={3} className="text-lg">Issue Certificates</Heading>
            </HStack>
            <Text type="supporting">Generate and issue certificates to checked-in attendees</Text>
          </VStack>
          <VStack gap={4}>
            <HStack align="center" justify="between" className="bg-muted p-4 rounded-lg">
              <VStack gap={0}>
                <Text weight="medium" className="text-sm">Eligible Attendees</Text>
                <Text type="supporting" className="text-xs">Based on verified check-ins</Text>
              </VStack>
              <span className="text-2xl font-bold">0</span>
            </HStack>
            
            <Button isDisabled label="Issue Certificates" icon={<FileSignature className="w-4 h-4" />} className="w-full" />
            <Text type="supporting" className="text-xs text-center">
              No attendees are currently eligible for certificates.
            </Text>
          </VStack>
        </VStack>
      </Card>
      
      <Card padding={6}>
        <VStack gap={6}>
          <VStack gap={1}>
            <HStack align="center" gap={2}>
              <Settings className="w-5 h-5" /> 
              <Heading level={3} className="text-lg">Certificate Settings</Heading>
            </HStack>
            <Text type="supporting">Configure which template to use</Text>
          </VStack>
          <div className="p-8 border rounded-lg border-dashed flex flex-col items-center justify-center text-center text-muted-foreground h-full">
            <Award className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No template selected</p>
            <p className="text-xs mt-1">Configure a template in the main certificates settings</p>
            <Button variant="secondary" size="sm" className="mt-4" label="Browse Templates" />
          </div>
        </VStack>
      </Card>
    </div>
  )
}
